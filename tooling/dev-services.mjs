import { execFileSync, spawnSync, spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { setTimeout } from "node:timers/promises";

// npm scripts and Playwright run from the repository root, including on CI.
const root = process.cwd();
const owner = "webapp-development";
const windows = process.platform === "win32";
const command = windows ? "wsl.exe" : "docker";
const prefix = windows ? ["-d", "Debian", "--exec", "docker"] : [];

function docker(args) {
  return execFileSync(command, [...prefix, ...args], { encoding: "utf8", timeout: 240_000, windowsHide: true, maxBuffer: 2 * 1024 * 1024 });
}
function hostPath(path) {
  return windows ? execFileSync("wsl.exe", ["-d", "Debian", "--exec", "wslpath", "-a", path.replaceAll("\\", "/")], { encoding: "utf8", windowsHide: true }).trim() : path;
}

export function getDevelopmentSettings() {
  const path = resolve(root, ".env.mysql.local");
  if (!existsSync(path)) {
    const secret = () => randomBytes(32).toString("hex");
    writeFileSync(path, `MYSQL_ROOT_PASSWORD=${secret()}\nMYSQL_PASSWORD=${secret()}\nMYSQL_TEST_PASSWORD=${secret()}\nAUTH_SECRET=${secret()}\n`, { flag: "wx", mode: 0o600 });
  }
  const values = Object.fromEntries(readFileSync(path, "utf8").split(/\r?\n/).filter(Boolean).map(line => { const at = line.indexOf("="); return [line.slice(0, at), line.slice(at + 1)]; }));
  for (const key of ["MYSQL_ROOT_PASSWORD", "MYSQL_PASSWORD", "MYSQL_TEST_PASSWORD", "AUTH_SECRET"]) {
    if (!/^[a-f0-9]{64}$/.test(values[key] ?? "")) throw new Error(`Invalid local service setting: ${key}. Preserve existing volume credentials.`);
  }
  const databaseUrl = `mysql://webapp_dev:${values.MYSQL_PASSWORD}@127.0.0.1:13306/webapp_dev`;
  const testDatabaseUrl = `mysql://webapp_test:${values.MYSQL_TEST_PASSWORD}@127.0.0.1:13306/webapp_test`;
  const settings = { databaseUrl, testDatabaseUrl, authSecret: values.AUTH_SECRET, smtpUrl: "smtp://127.0.0.1:12525", mailpitUrl: "http://127.0.0.1:18025" };
  const local = resolve(root, ".env.local");
  if (!existsSync(local)) writeFileSync(local, `DATABASE_URL=${databaseUrl}\nTEST_DATABASE_URL=${testDatabaseUrl}\nAUTH_SECRET=${values.AUTH_SECRET}\nAUTH_URL=http://localhost:3000\nSMTP_URL=${settings.smtpUrl}\nSMTP_FROM=Webapp <no-reply@example.test>\nLOG_LEVEL=info\n`, { flag: "wx", mode: 0o600 });
  return settings;
}

async function ensureContainer(name, args) {
  const found = spawnSync(command, [...prefix, "container", "inspect", name, "--format", "{{json .Config.Labels}}"], { encoding: "utf8", windowsHide: true });
  if (found.status === 0) {
    const labels = JSON.parse(found.stdout);
    if (labels?.["com.webapp.owner"] !== owner) throw new Error(`Container ${name} exists and is not managed by this project.`);
    docker(["start", name]);
  } else {
    docker(["run", "--detach", "--name", name, "--label", `com.webapp.owner=${owner}`, ...args]);
  }
}

function mysqlStartupFailure() {
  const result = spawnSync(command, [...prefix, "logs", "--tail", "60", "webapp-mysql"], { encoding: "utf8", windowsHide: true, timeout: 10_000 });
  const values = readFileSync(resolve(root, ".env.mysql.local"), "utf8").split(/\r?\n/).filter(Boolean).map(line => line.slice(line.indexOf("=") + 1));
  // Initialization errors may echo SQL containing credentials; redact before reporting.
  const details = values.reduce((text, value) => value ? text.replaceAll(value, "[REDACTED]") : text, `${result.stdout ?? ""}\n${result.stderr ?? ""}`);
  return new Error(`MySQL did not become healthy. Existing data and credentials were preserved.\n${details}`);
}

export async function ensureDevelopmentServices() {
  const settings = getDevelopmentSettings();
  if (windows) {
    const directory = resolve(root, ".data");
    mkdirSync(directory, { recursive: true });
    const marker = resolve(directory, "wsl-docker.pid");
    let running = false;
    if (existsSync(marker)) {
      const pid = Number(readFileSync(marker, "utf8"));
      if (Number.isInteger(pid) && pid > 0) {
        try { process.kill(pid, 0); running = true; } catch { running = false; }
      }
    }
    // WSL systemd services alone do not keep the distro alive after the CLI exits.
    if (!running) {
      const child = spawn("wsl.exe", ["-d", "Debian", "--exec", "sleep", "infinity"], { detached: true, stdio: "ignore", windowsHide: true });
      child.unref();
      writeFileSync(marker, String(child.pid), { mode: 0o600 });
    }
  }
  docker(["info", "--format", "{{.ServerVersion}}"]);
  await ensureContainer("webapp-mysql", [
    "--publish", "127.0.0.1:13306:3306", "--env-file", hostPath(resolve(root, ".env.mysql.local")),
    "--env", "MYSQL_DATABASE=webapp_dev", "--env", "MYSQL_USER=webapp_dev", "--env", "TZ=UTC",
    "--mount", "type=volume,source=webapp-mysql-data,target=/var/lib/mysql",
    "--mount", `type=bind,source=${hostPath(resolve(root, "docker/mysql/init-test-db.sh"))},target=/docker-entrypoint-initdb.d/20-test-db.sh,readonly`,
    "--health-cmd", 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysqladmin ping -h127.0.0.1 -uroot --silent',
    "--health-interval", "2s", "--health-timeout", "3s", "--health-retries", "60",
    "mysql:8.4.13", "--default-time-zone=+00:00",
  ]);
  const deadline = Date.now() + 120_000;
  while (true) {
    const state = JSON.parse(docker(["inspect", "webapp-mysql", "--format", "{{json .State}}"]));
    if (state.Health?.Status === "healthy") break;
    if (["exited", "dead"].includes(state.Status) || Date.now() > deadline) throw mysqlStartupFailure();
    await setTimeout(1000);
  }
  await ensureContainer("webapp-mailpit", ["--publish", "127.0.0.1:12525:1025", "--publish", "127.0.0.1:18025:8025", "axllent/mailpit:v1.33.0"]);
  return settings;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(root, "tooling/dev-services.mjs")) {
  console.log("Starting local MySQL and SMTP capture services…");
  ensureDevelopmentServices().then(() => {
    console.log("Local MySQL and SMTP capture services are ready. Credentials are in ignored local environment files.");
  }).catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

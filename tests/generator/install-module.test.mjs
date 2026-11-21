import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), "webapp-installer-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  function write(path, content) {
    const target = join(root, path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, content);
  }
  write("project/prisma/schema.prisma", "datasource db {\n  provider = \"mysql\"\n}\n");
  write("project/src/app/page.tsx", "custom home\n");
  mkdirSync(join(root, "project/scripts"));
  copyFileSync(new URL("../../scripts/install-module.mjs", import.meta.url), join(root, "project/scripts/install-module.mjs"));
  function module(name, requires = []) {
    const modulePath = `catalog/${name}`;
    write(`${modulePath}/module.json`, JSON.stringify({ name, version: "1.0.0", requires, edits: [] }));
    write(`${modulePath}/files/src/modules/${name}/server.ts`, "export {};\n");
    write(`${modulePath}/schema.prisma`, `model ${name} {\n  id Int @id\n}\n`);
  }
  function run(...args) {
    return spawnSync(process.execPath, [join(root, "project/scripts/install-module.mjs"), ...args], {
      encoding: "utf8",
      env: { ...process.env, WEBAPP_MODULES_DIR: join(root, "catalog") },
    });
  }
  return { module, run, write, project: join(root, "project") };
}

test("installs only the selected module and keeps the project's home", (t) => {
  const { module, run, project } = fixture(t);
  module("users");
  module("dashboards", ["users"]);

  assert.match(run("list").stdout, /dashboards .*requires users/);
  assert.match(run("add", "dashboards").stderr, /Install required modules first: users/);
  assert.equal(existsSync(join(project, "modules.lock.json")), false);

  const added = run("add", "users");
  assert.equal(added.status, 0, added.stderr);
  assert.match(run("add", "users").stdout, /already installed/);
  assert.equal(existsSync(join(project, "src/modules/dashboards")), false);
  assert.equal(readFileSync(join(project, "src/app/page.tsx"), "utf8"), "custom home\n");
  assert.equal(readFileSync(join(project, "prisma/schema.prisma"), "utf8").match(/model users/g)?.length, 1);
  assert.equal(run("add", "dashboards").status, 0);
});

test("stops before copying files when an existing project file conflicts", (t) => {
  const { module, run, project, write } = fixture(t);
  module("users");
  write("project/src/modules/users/server.ts", "existing local code\n");

  const result = run("add", "users");
  assert.equal(result.status, 1);
  assert.match(result.stderr, /File already exists/);
  assert.equal(readFileSync(join(project, "src/modules/users/server.ts"), "utf8"), "existing local code\n");
  assert.doesNotMatch(readFileSync(join(project, "prisma/schema.prisma"), "utf8"), /model users/);
  assert.equal(existsSync(join(project, "modules.lock.json")), false);
});

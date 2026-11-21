import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, rmdirSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, resolve, sep } from "node:path";

const root = resolve(import.meta.dirname, "..");
const statePath = join(root, "modules.lock.json");
const lockPath = join(root, ".module-install.lock");

function read(path) {
  return readFileSync(path, "utf8").replaceAll("\r\n", "\n");
}

function safePath(base, relative) {
  if (typeof relative !== "string" || isAbsolute(relative) ||
      relative.split(/[\\/]/).some((part) => !part || part === "." || part === ".." || part === ".git")) {
    throw new Error(`Invalid module path: ${relative}`);
  }
  let target = base;
  for (const part of relative.split(/[\\/]/)) {
    target = join(target, part);
    if (existsSync(target) && lstatSync(target).isSymbolicLink()) {
      throw new Error(`Symbolic links are unsupported: ${target}`);
    }
  }
  return target;
}

function files(directory, prefix = "") {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    const relative = prefix + entry.name;
    if (entry.isDirectory()) return files(path, relative + sep);
    if (entry.isFile()) return [relative];
    throw new Error(`Unsupported module asset: ${path}`);
  });
}

function loadModule(catalog, name) {
  if (!/^[a-z][a-z0-9-]*$/.test(name)) throw new Error(`Invalid module name: ${name}`);
  const source = safePath(catalog, name);
  const manifest = JSON.parse(read(safePath(source, "module.json")));
  if (manifest.name !== name || typeof manifest.version !== "string" ||
      !Array.isArray(manifest.requires) || !Array.isArray(manifest.edits)) {
    throw new Error(`Invalid manifest for ${name}`);
  }
  return { source, manifest };
}

// Το κλείδωμα καλύπτει τους ελέγχους και την εγγραφή για να μην αλλάζουν δύο εγκαταστάσεις το ίδιο έργο.
function install(catalog, name) {
  mkdirSync(lockPath);
  try {
    const { source, manifest } = loadModule(catalog, name);
    const installed = existsSync(statePath) ? JSON.parse(read(statePath)) : {};
    if (Object.hasOwn(installed, name)) {
      if (installed[name] !== manifest.version) throw new Error(`Already installed at version ${installed[name]}`);
      console.log(`${name} ${manifest.version} is already installed.`);
      return;
    }
    const missing = manifest.requires.filter((dependency) => !Object.hasOwn(installed, dependency));
    if (missing.length) throw new Error(`Install required modules first: ${missing.join(", ")}`);

    // Συγκέντρωσε και έλεγξε όλες τις αλλαγές πριν γράψεις στο έργο.
    const payload = safePath(source, "files");
    const changes = new Map();
    function stage(path, content, original) {
      if (changes.has(path)) throw new Error(`Duplicate module destination: ${path}`);
      changes.set(path, { content, original });
    }

    for (const relative of files(payload)) {
      if (!/^(src|tests|prisma[\\/]migrations)[\\/]/.test(relative)) {
        throw new Error(`Unsupported module destination: ${relative}`);
      }
      const target = safePath(root, relative);
      if (existsSync(target)) throw new Error(`File already exists: ${relative}`);
      stage(target, readFileSync(safePath(payload, relative)));
    }
    for (const { path, before, after } of manifest.edits) {
      if (!path.startsWith("src/app/")) throw new Error(`Unsupported replacement: ${path}`);
      const target = safePath(root, path);
      const original = readFileSync(target);
      if (read(target) !== read(safePath(source, before))) {
        throw new Error(`Local changes in ${path}. Installation stopped before writing files.`);
      }
      stage(target, read(safePath(source, after)), original);
    }

    // Τα επιλεγμένα modules προσθέτουν τα μοντέλα τους στο κοινό σχήμα Prisma.
    const schemaPath = safePath(root, "prisma/schema.prisma");
    const schemaOriginal = readFileSync(schemaPath);
    let schema = read(schemaPath);
    if (manifest.schemaEdit) {
      const { before, after } = manifest.schemaEdit;
      if (!before || schema.split(before).length !== 2) throw new Error("Prisma schema differs from the expected layout.");
      schema = schema.replace(before, () => after);
    }
    const models = read(safePath(source, "schema.prisma")).trim();
    stage(schemaPath, `${schema.trimEnd()}\n\n${models}\n`, schemaOriginal);
    stage(statePath, JSON.stringify({ ...installed, [name]: manifest.version }, null, 2) + "\n",
      existsSync(statePath) ? readFileSync(statePath) : undefined);

    // Κράτησε το αρχικό περιεχόμενο για να επαναφέρεις αρχεία αν αποτύχει μια εγγραφή.
    const written = [];
    const createdDirectories = [];
    try {
      for (const [path, { content, original }] of changes) {
        const missingDirectories = [];
        for (let directory = dirname(path); !existsSync(directory); directory = dirname(directory)) {
          missingDirectories.push(directory);
        }
        for (const directory of missingDirectories.reverse()) {
          mkdirSync(directory);
          createdDirectories.push(directory);
        }
        written.push([path, original]);
        writeFileSync(path, content, { flag: original === undefined ? "wx" : "w" });
      }
    } catch (error) {
      for (const [path, original] of written.reverse()) {
        if (original === undefined) {
          if (existsSync(path)) unlinkSync(path);
        } else writeFileSync(path, original);
      }
      for (const directory of createdDirectories.sort((a, b) => b.length - a.length)) rmdirSync(directory);
      throw error;
    }
    console.log(`Installed ${name} ${manifest.version}. Apply migrations to the selected database with npm run db:migrate.`);
  } finally {
    rmdirSync(lockPath);
  }
}

try {
  const [command, ...args] = process.argv.slice(2);
  const catalog = resolve(process.env.WEBAPP_MODULES_DIR ?? join(root, "..", "webapp-modules"));
  if (command === "list" && args.length === 0) {
    for (const entry of readdirSync(catalog, { withFileTypes: true })) {
      if (!entry.isDirectory() || !existsSync(join(catalog, entry.name, "module.json"))) continue;
      const { manifest } = loadModule(catalog, entry.name);
      console.log(`${manifest.name} ${manifest.version}${manifest.requires.length ? ` (requires ${manifest.requires.join(", ")})` : ""}`);
    }
  } else if (command === "add" && args.length === 1) {
    install(catalog, args[0]);
  } else {
    throw new Error("Use npm run module:list or npm run module:add -- <name>.");
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}

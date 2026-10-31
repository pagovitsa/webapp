// Δημιουργεί νέο module από το templates/module/ (και προαιρετικά σελίδα από το templates/page/).
//
//   npm run module:new -- <όνομα> [--page]
//
// Κάνει μόνο τη μηχανική προετοιμασία. Η επιχειρησιακή λογική γράφεται μετά, με βάση το README.

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const NAME_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
const RESERVED = new Set(["app", "api", "modules", "server", "shared", "templates", "internal"]);

export class ModuleGeneratorError extends Error {}

function pascalCase(name) {
  return name
    .split("-")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join("");
}

function title(name) {
  const words = name.split("-").join(" ");
  return words[0].toUpperCase() + words.slice(1);
}

function render(content, name) {
  return content
    .replaceAll("__module__", name)
    .replaceAll("__Component__", pascalCase(name))
    .replaceAll("__Title__", title(name));
}

function copyTree(fromDir, toDir, name, created, root) {
  mkdirSync(toDir, { recursive: true });
  for (const entry of readdirSync(fromDir, { withFileTypes: true })) {
    const from = path.join(fromDir, entry.name);
    const to = path.join(toDir, entry.name);
    if (entry.isDirectory()) {
      copyTree(from, to, name, created, root);
    } else {
      writeFileSync(to, render(readFileSync(from, "utf8"), name));
      created.push(path.relative(root, to).split(path.sep).join("/"));
    }
  }
}

export function validateName(name) {
  if (!name) {
    throw new ModuleGeneratorError("Δώσε όνομα module, π.χ. npm run module:new -- customers");
  }
  if (!NAME_PATTERN.test(name)) {
    throw new ModuleGeneratorError(
      `Μη έγκυρο όνομα "${name}". Χρησιμοποίησε kebab-case με πεζά λατινικά, π.χ. customers ή support-tickets.`,
    );
  }
  if (RESERVED.has(name)) {
    throw new ModuleGeneratorError(`Το "${name}" είναι δεσμευμένο όνομα.`);
  }
}

/**
 * @param {{ name: string, page?: boolean, root?: string, templatesDir?: string }} options
 * @returns {string[]} τα αρχεία που δημιουργήθηκαν, σχετικά με το root
 */
export function createModule({ name, page = false, root = projectRoot, templatesDir = path.join(projectRoot, "templates") }) {
  validateName(name);

  const moduleDir = path.join(root, "src/modules", name);
  const pageDir = path.join(root, "src/app", name);
  if (existsSync(moduleDir)) {
    throw new ModuleGeneratorError(`Υπάρχει ήδη το src/modules/${name}/.`);
  }
  if (page && existsSync(pageDir)) {
    throw new ModuleGeneratorError(`Υπάρχει ήδη το src/app/${name}/.`);
  }

  const created = [];
  copyTree(path.join(templatesDir, "module"), moduleDir, name, created, root);
  if (page) {
    copyTree(path.join(templatesDir, "page"), pageDir, name, created, root);
  }
  return created;
}

function main(argv) {
  const args = argv.filter((a) => !a.startsWith("--"));
  const page = argv.includes("--page");
  const unknown = argv.filter((a) => a.startsWith("--") && a !== "--page");
  if (unknown.length > 0) {
    throw new ModuleGeneratorError(`Άγνωστη επιλογή: ${unknown.join(", ")}. Διαθέσιμη: --page`);
  }
  if (args.length > 1) {
    throw new ModuleGeneratorError("Ένα module τη φορά.");
  }

  const name = args[0];
  const created = createModule({ name, page });

  console.log(`Δημιουργήθηκε το module "${name}":`);
  for (const file of created) console.log(`  + ${file}`);
  console.log(`
Επόμενα βήματα:
  1. Συμπλήρωσε το src/modules/${name}/README.md (σκοπός, κανόνες, δημόσιο API) πριν από τον κώδικα.
  2. Γράψε domain → ports → use cases → infrastructure → server.ts → presentation.${
    page ? `\n  3. Πρόσθεσε <NavLink href="/${name}"> στο src/app/layout.tsx.` : ""
  }
  ${page ? 4 : 3}. Σβήσε τους φακέλους που έμειναν μόνο με .gitkeep.
  ${page ? 5 : 4}. npm run check`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    if (error instanceof ModuleGeneratorError) {
      console.error(error.message);
      process.exit(1);
    }
    throw error;
  }
}

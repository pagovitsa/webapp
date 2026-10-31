import { afterEach, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createModule, ModuleGeneratorError } from "../../scripts/new-module.mjs";

let root;

beforeEach(() => {
  root = mkdtempSync(path.join(tmpdir(), "module-gen-"));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

test("δημιουργεί όλο τον σκελετό του module από το template", () => {
  const created = createModule({ name: "support-tickets", root });

  for (const file of [
    "src/modules/support-tickets/README.md",
    "src/modules/support-tickets/server.ts",
    "src/modules/support-tickets/contracts.ts",
    "src/modules/support-tickets/presentation/actions.ts",
    "src/modules/support-tickets/presentation/components/internal/.gitkeep",
    "src/modules/support-tickets/domain/.gitkeep",
    "src/modules/support-tickets/application/ports/.gitkeep",
  ]) {
    assert.ok(created.includes(file), `λείπει από τη λίστα: ${file}`);
    assert.ok(existsSync(path.join(root, file)), `δεν γράφτηκε: ${file}`);
  }
  assert.ok(!created.some((f) => f.startsWith("src/app/")), "δεν ζητήθηκε σελίδα");
});

test("αντικαθιστά τα placeholders", () => {
  createModule({ name: "support-tickets", root, page: true });

  const readme = readFileSync(path.join(root, "src/modules/support-tickets/README.md"), "utf8");
  assert.match(readme, /^# support-tickets/);
  assert.doesNotMatch(readme, /__module__/);

  const page = readFileSync(path.join(root, "src/app/support-tickets/page.tsx"), "utf8");
  assert.match(page, /function SupportTicketsPage/);
  assert.match(page, /title: "Support tickets"/);
  assert.doesNotMatch(page, /__(module|Component|Title)__/);

  const server = readFileSync(path.join(root, "src/modules/support-tickets/server.ts"), "utf8");
  assert.match(server, /^import "server-only";/);
});

test("σταματά αν το module υπάρχει ήδη", () => {
  createModule({ name: "customers", root });
  assert.throws(() => createModule({ name: "customers", root }), ModuleGeneratorError);
});

test("σταματά αν υπάρχει ήδη η σελίδα", () => {
  createModule({ name: "customers", root, page: true });
  rmSync(path.join(root, "src/modules/customers"), { recursive: true });
  assert.throws(() => createModule({ name: "customers", root, page: true }), /src\/app\/customers/);
  assert.ok(!existsSync(path.join(root, "src/modules/customers")), "δεν πρέπει να γραφτεί μισό module");
});

for (const name of ["", "Customers", "customers_list", "-customers", "customers-", "πελάτες", "shared", "server"]) {
  test(`απορρίπτει το όνομα "${name}"`, () => {
    assert.throws(() => createModule({ name, root }), ModuleGeneratorError);
  });
}

// Ελέγχει ότι οι κανόνες ορίων κάνουν αυτό που λένε: κάθε απαγορευμένο import αποτυγχάνει,
// κάθε επιτρεπτό περνά. Γράφει προσωρινά modules στο src/ και τα σβήνει στο τέλος.

import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ESLint } from "eslint";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const fixtureDirs = [
  "src/modules/zz-fx-a",
  "src/modules/zz-fx-b",
  "src/modules/zz-fx-c",
  "src/modules/zz-fx-d",
  "src/modules/zz-fx-e",
  "src/modules/zz-fx-f",
  "src/app/zz-fx",
  "src/shared/zz-fx",
];

// Στόχοι των imports: ένα module με όλα τα επίπεδα.
const targets = {
  "src/modules/zz-fx-a/domain/entity.ts": "export type A = { id: string };",
  "src/modules/zz-fx-a/application/ports/repo.ts": "export interface Repo { id: string }",
  "src/modules/zz-fx-a/infrastructure/repo-impl.ts": "export const impl = 1;",
  "src/modules/zz-fx-a/presentation/actions.ts": "export const act = 1;",
  "src/modules/zz-fx-a/presentation/schemas/s.ts": "export const schema = 1;",
  "src/modules/zz-fx-a/presentation/hooks/h.ts": "export const hook = 1;",
  "src/modules/zz-fx-a/presentation/components/internal/helper.ts": "export const helper = 1;",
  "src/modules/zz-fx-a/presentation/components/public.ts": "export const publicComponent = 1;",
  "src/modules/zz-fx-a/contracts.ts": "export type Dto = { id: string };",
  "src/modules/zz-fx-a/server.ts": "export const api = 1;",
  "src/modules/zz-fx-b/server.ts": "export const apiB = 1;",
  "src/modules/zz-fx-b/domain/x.ts": "export const x = 1;",
  "src/modules/zz-fx-b/presentation/components/public.ts": "export const publicB = 1;",
  "src/modules/zz-fx-e/domain/x.ts": "export const ex = 1;",
  "src/modules/zz-fx-e/application/x.ts": "export const eap = 1;",
  "src/modules/zz-fx-e/infrastructure/x.ts": "export const ei = 1;",
  "src/modules/zz-fx-f/server.ts": "export const apiF = 1;",
  "src/modules/zz-fx-f/contracts.ts": "export type DtoF = { id: string };",
  "src/modules/zz-fx-f/presentation/schemas/s.ts": "export const schemaF = 1;",
};

// dc: αναμενόμενος κανόνας dependency-cruiser (null = κανένας).
// eslint: αν αναμένεται σφάλμα no-restricted-imports.
const cases = [
  // --- απαγορευμένα
  { file: "src/app/zz-fx/to-domain.ts", src: 'export * from "@/modules/zz-fx-a/domain/entity";', dc: "app-only-public-module-api", eslint: true },
  { file: "src/app/zz-fx/to-actions-relative.ts", src: 'export * from "../../modules/zz-fx-a/presentation/actions";', dc: "app-only-public-module-api", eslint: true },
  { file: "src/app/zz-fx/to-internal-component.ts", src: 'export * from "@/modules/zz-fx-a/presentation/components/internal/helper";', dc: "app-only-public-module-api", eslint: true },
  { file: "src/app/zz-fx/dynamic-import.ts", src: 'export const load = () => import("@/modules/zz-fx-a/domain/entity");', dc: "app-only-public-module-api", eslint: false },
  { file: "src/shared/zz-fx/to-module.ts", src: 'export type { Dto } from "@/modules/zz-fx-a/contracts";', dc: "shared-is-independent", eslint: true },
  { file: "src/modules/zz-fx-b/cross-relative.ts", src: 'export * from "../zz-fx-a/domain/entity";', dc: "no-other-module-internals", eslint: false },
  { file: "src/modules/zz-fx-b/cross-alias.ts", src: 'export * from "@/modules/zz-fx-a/presentation/schemas/s";', dc: "no-other-module-internals", eslint: true },
  { file: "src/modules/zz-fx-a/domain/to-server.ts", src: 'export * from "../server";', dc: "domain-is-pure", eslint: true },
  { file: "src/modules/zz-fx-a/domain/to-next.ts", src: 'export { NextResponse } from "next/server";', dc: "domain-is-pure", eslint: true },
  { file: "src/modules/zz-fx-a/domain/to-node-fs.ts", src: 'export { readFile } from "node:fs/promises";', dc: "domain-is-pure", eslint: true },
  { file: "src/modules/zz-fx-a/domain/to-bare-fs.ts", src: 'export { readFileSync } from "fs";', dc: "domain-is-pure", eslint: true },
  { file: "src/modules/zz-fx-a/domain/to-node-crypto.ts", src: 'export { randomUUID } from "node:crypto";', dc: "domain-is-pure", eslint: true },
  { file: "src/modules/zz-fx-a/infrastructure/to-schema.ts", src: 'export * from "../presentation/schemas/s";', dc: "infrastructure-no-presentation", eslint: true },
  { file: "src/modules/zz-fx-a/infrastructure/to-component.ts", src: 'export * from "../presentation/components/public";', dc: "infrastructure-no-presentation", eslint: true },
  { file: "src/modules/zz-fx-a/infrastructure/dynamic-presentation.ts", src: 'export const load = () => import("../presentation/schemas/s");', dc: "infrastructure-no-presentation", eslint: false },
  { file: "src/modules/zz-fx-a/application/to-server.ts", src: 'export * from "../server";', dc: "application-no-implementations", eslint: true },
  { file: "src/modules/zz-fx-a/application/to-other-server.ts", src: 'export * from "@/modules/zz-fx-b/server";', dc: "application-no-implementations", eslint: true },
  { file: "src/modules/zz-fx-a/application/to-infrastructure.ts", src: 'export * from "../infrastructure/repo-impl";', dc: "application-no-implementations", eslint: true },
  { file: "src/modules/zz-fx-b/server.ts", src: 'export const apiB = 1;\nexport * from "./presentation/actions";', dc: "server-ts-no-presentation", eslint: true },
  { file: "src/modules/zz-fx-a/presentation/components/to-server.ts", src: 'export * from "../../server";', dc: "client-not-to-server-only", eslint: true },
  { file: "src/modules/zz-fx-e/presentation/actions.ts", src: 'export * from "../infrastructure/x";', dc: "presentation-only-via-server", eslint: true },
  { file: "src/modules/zz-fx-e/presentation/actions-to-application.ts", src: 'export * from "../application/x";', dc: "presentation-only-via-server", eslint: true },
  { file: "src/modules/zz-fx-e/presentation/components/to-domain.ts", src: 'export * from "../../domain/x";', dc: "presentation-only-via-server", eslint: true },
  { file: "src/modules/zz-fx-e/presentation/schemas/to-domain.ts", src: 'export * from "../../domain/x";', dc: "presentation-only-via-server", eslint: true },
  // Ένας κύκλος αναφέρεται από ένα μόνο αρχείο του· ελέγχεται σε όλη την ομάδα.
  { file: "src/modules/zz-fx-c/server.ts", src: 'export * from "@/modules/zz-fx-d/server";', dc: "no-circular", eslint: false, cycle: "cd" },
  { file: "src/modules/zz-fx-d/server.ts", src: 'export const d = 1;\nexport * from "@/modules/zz-fx-c/server";', dc: "no-circular", eslint: false, cycle: "cd" },
  // --- επιτρεπτά
  { file: "src/app/zz-fx/ok.ts", src: 'export * from "@/modules/zz-fx-a/server";\nexport type { Dto } from "@/modules/zz-fx-a/contracts";\nexport * from "@/modules/zz-fx-a/presentation/components/public";', dc: null, eslint: false },
  { file: "src/modules/zz-fx-a/presentation/components/ok.ts", src: 'export * from "../actions";\nexport * from "./internal/helper";\nexport * from "../schemas/s";', dc: null, eslint: false },
  { file: "src/modules/zz-fx-a/infrastructure/ok.ts", src: 'export * from "@/modules/zz-fx-b/server";\nexport type { Repo } from "../application/ports/repo";\nexport type { A } from "../domain/entity";', dc: null, eslint: false },
  { file: "src/modules/zz-fx-a/infrastructure/other-public-component.ts", src: 'export * from "@/modules/zz-fx-b/presentation/components/public";', dc: null, eslint: false },
  { file: "src/modules/zz-fx-a/domain/ok.ts", src: 'export type { A } from "./entity";', dc: null, eslint: false },
  { file: "src/modules/zz-fx-a/domain/builtins.test.ts", src: 'export { randomUUID } from "node:crypto";', dc: null, eslint: false },
  { file: "src/modules/zz-fx-a/application/ok.ts", src: 'export type { Repo } from "./ports/repo";\nexport type { A } from "../domain/entity";', dc: null, eslint: false },
  { file: "src/modules/zz-fx-f/presentation/actions.ts", src: 'export * from "../server";\nexport type { DtoF } from "../contracts";\nexport * from "./schemas/s";', dc: null, eslint: false },
  { file: "src/modules/zz-fx-b/ok.ts", src: 'export type { Dto } from "@/modules/zz-fx-a/contracts";\nexport * from "@/modules/zz-fx-a/presentation/components/public";', dc: null, eslint: false },
];

function cleanup() {
  for (const dir of fixtureDirs) rmSync(path.join(root, dir), { recursive: true, force: true });
}

function write(file, content) {
  const full = path.join(root, file);
  mkdirSync(path.dirname(full), { recursive: true });
  writeFileSync(full, content + "\n");
}

let dcViolations;
let eslintErrors;

before(async () => {
  cleanup();
  for (const [file, src] of Object.entries(targets)) write(file, src);
  // Περιπτώσεις που αντικαθιστούν στόχο (π.χ. zz-fx-b/server.ts) γράφονται μετά.
  write("src/modules/zz-fx-b/presentation/actions.ts", "export const actB = 1;");
  for (const c of cases) write(c.file, c.src);

  const bin = path.join(root, "node_modules/dependency-cruiser/bin/dependency-cruiser.mjs");
  let out;
  try {
    out = execFileSync(
      process.execPath,
      [bin, ...cases.map((c) => c.file), "--config", ".dependency-cruiser.cjs", "--output-type", "json"],
      { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
    );
  } catch (error) {
    // Το depcruise τερματίζει με μη μηδενικό κωδικό όταν βρίσκει παραβιάσεις.
    out = error.stdout;
  }
  dcViolations = JSON.parse(out).summary.violations;

  const eslint = new ESLint({ cwd: root });
  const results = await eslint.lintFiles(cases.map((c) => c.file));
  eslintErrors = new Set(
    results
      .filter((r) => r.messages.some((m) => m.ruleId === "no-restricted-imports"))
      .map((r) => path.relative(root, r.filePath).split(path.sep).join("/")),
  );
});

after(cleanup);

for (const c of cases) {
  const label = c.dc ? `απαγορεύεται: ${c.file}` : `επιτρέπεται: ${c.file}`;

  test(`dependency-cruiser — ${label}`, () => {
    const files = c.cycle ? cases.filter((o) => o.cycle === c.cycle).map((o) => o.file) : [c.file];
    const rules = dcViolations.filter((v) => files.includes(v.from)).map((v) => v.rule.name);
    if (c.dc) {
      assert.ok(rules.includes(c.dc), `αναμενόταν "${c.dc}", βρέθηκαν: [${rules.join(", ")}]`);
    } else {
      assert.deepEqual(rules, [], `δεν αναμενόταν παραβίαση, βρέθηκαν: [${rules.join(", ")}]`);
    }
  });

  test(`eslint — ${label}`, () => {
    assert.equal(eslintErrors.has(c.file), c.eslint, c.eslint ? "αναμενόταν σφάλμα ESLint" : "δεν αναμενόταν σφάλμα ESLint");
  });
}

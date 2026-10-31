import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";

const require = createRequire(import.meta.url);
const consumers = [
  "eslint", "@eslint/config-array", "@eslint/eslintrc",
  "eslint-plugin-import", "eslint-plugin-react", "eslint-plugin-jsx-a11y",
  "@typescript-eslint/typescript-estree",
];

for (const consumer of consumers) {
  test(`${consumer} resolves a patched glob engine`, () => {
    const fromConsumer = createRequire(require.resolve(consumer));
    const matcherPath = fromConsumer.resolve("minimatch");
    const metadata = fromConsumer("minimatch/package.json");
    const engine = metadata.name === "@webapp/minimatch-compat"
      ? createRequire(matcherPath)("minimatch-modern/package.json")
      : metadata;
    assert.equal(engine.name, "minimatch");
    const [major, minor, patch] = engine.version.split(".").map(Number);
    assert.ok(major > 11 || (major === 11 && (minor > 0 || patch >= 1)), engine.version);
  });
}

test("legacy plugins retain callable, class and test-matcher APIs", () => {
  const fromPlugin = createRequire(require.resolve("eslint-plugin-import"));
  const match = fromPlugin("minimatch");
  assert.equal(match("src/card.tsx", "**/*.{ts,tsx}"), true);
  assert.equal(match("src/card.css", "**/*.{ts,tsx}"), false);
  assert.equal(new match.Minimatch("**/*.ts", { dot: true }).match(".hidden/a.ts"), true);
  const pattern = match.makeRe("some-package/**");
  assert.equal(pattern.test("some-package/private"), true);
  assert.equal(pattern.test("other-package/private"), false);
});

test("import rule still rejects forbidden package internals", async () => {
  const { ESLint } = await import("eslint");
  const { default: plugin } = await import("eslint-plugin-import");
  const eslint = new ESLint({
    overrideConfigFile: true,
    overrideConfig: [{
      plugins: { import: plugin },
      rules: { "import/no-internal-modules": ["error", { forbid: ["some-package/**"] }] },
    }],
  });
  const [result] = await eslint.lintText('import value from "some-package/private";');
  assert.deepEqual(result.messages.map(({ ruleId }) => ruleId), ["import/no-internal-modules"]);
});

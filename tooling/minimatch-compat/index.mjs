import * as modern from "minimatch-modern";

// Legacy ESLint plugins call the module itself; modern minimatch exports named APIs.
function match(path, pattern, options) {
  return modern.minimatch(path, pattern, options);
}

Object.assign(match, modern, {
  // import/no-internal-modules only calls .test(); keep matching on the safe engine
  // rather than rebuilding the regular expressions removed by minimatch 11.
  makeRe(pattern, options) {
    const matcher = new modern.Minimatch(pattern, options);
    return { test: (path) => matcher.match(path) };
  },
});

// Node 26 exposes this callable value to require(), including its named properties.
export { match as default, match as "module.exports" };

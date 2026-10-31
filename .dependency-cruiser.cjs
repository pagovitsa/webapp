// Αρχιτεκτονικά όρια με βάση το αρχείο στο οποίο καταλήγει κάθε import
// (aliases του tsconfig, relative paths, δυναμικά import(), imports μόνο τύπων).
// Συμπληρώνει το ESLint: το ESLint δίνει άμεση ένδειξη στον editor, αυτό καλύπτει ό,τι εκείνο δεν βλέπει.

// Εσωτερικά ενός module για τον έξω κόσμο.
const MODULE_INTERNALS =
  "^src/modules/[^/]+/(domain|application|infrastructure|presentation/(actions|hooks|schemas|components/internal))(/|\\.|$)";
const ANY_MODULE_SERVER = "^src/modules/[^/]+/server\\.ts$";
const FRAMEWORK = "^node_modules/(next|react|react-dom)/";

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "no-circular",
      severity: "error",
      comment: "Κυκλικές εξαρτήσεις (και μεταξύ modules).",
      from: {},
      to: { circular: true },
    },
    {
      name: "not-to-unresolvable",
      severity: "error",
      comment: "Import που δεν αντιστοιχεί σε αρχείο ή πακέτο.",
      from: {},
      to: { couldNotResolve: true },
    },
    {
      name: "app-only-public-module-api",
      severity: "error",
      comment: "Οι σελίδες χρησιμοποιούν μόνο server.ts, contracts.ts και δημόσια components.",
      from: { path: "^src/app/" },
      to: { path: MODULE_INTERNALS },
    },
    {
      name: "shared-is-independent",
      severity: "error",
      comment: "Το shared δεν εξαρτάται από modules ή server.",
      from: { path: "^src/shared/" },
      to: { path: "^src/(modules|server)/" },
    },
    {
      name: "no-other-module-internals",
      severity: "error",
      comment: "Ένα module χρησιμοποιεί μόνο τα δημόσια σημεία άλλου module.",
      from: { path: "^src/modules/([^/]+)/" },
      to: { path: MODULE_INTERNALS, pathNot: "^src/modules/$1/" },
    },
    {
      name: "domain-is-pure",
      severity: "error",
      comment: "Το domain εξαρτάται μόνο από το domain του ίδιου module.",
      // Τα tests του domain εισάγουν τον test runner (vitest).
      from: { path: "^src/modules/([^/]+)/domain/", pathNot: "\\.test\\.ts$" },
      to: {
        pathNot: ["^src/modules/$1/domain/"],
        dependencyTypesNot: ["core"],
      },
    },
    {
      name: "application-no-implementations",
      severity: "error",
      comment: "Το application εξαρτάται από domain και ports, όχι από υλοποιήσεις ή server.ts.",
      from: { path: "^src/modules/([^/]+)/application/" },
      to: {
        path: [
          "^src/modules/$1/(infrastructure|presentation)/",
          ANY_MODULE_SERVER,
          "^src/server/database/",
          "^src/(app|shared/ui)/",
          FRAMEWORK,
        ],
      },
    },
    {
      name: "server-ts-no-presentation",
      severity: "error",
      comment: "Τα actions καλούν το server.ts· το server.ts δεν εισάγει actions ή UI.",
      from: { path: "^src/modules/([^/]+)/server\\.ts$" },
      to: { path: ["^src/modules/$1/presentation/", "^src/shared/ui/", "^src/app/"] },
    },
    {
      name: "client-not-to-server-only",
      severity: "error",
      comment: "Τα components δεν εισάγουν server.ts ή src/server· καλούν actions.",
      from: { path: "^src/modules/[^/]+/presentation/(components|hooks)/" },
      to: { path: [ANY_MODULE_SERVER, "^src/server/"] },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    // Το node_modules δεν αποκλείεται (μόνο δεν ακολουθείται), ώστε να ελέγχονται imports προς next/react.
    exclude: { path: "^\\.next/" },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: "tsconfig.json" },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default", "types"],
      mainFields: ["module", "main", "types", "typings"],
    },
    moduleSystems: ["es6", "cjs"],
    reporterOptions: { text: { highlightFocused: true } },
  },
};

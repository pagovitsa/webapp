import { builtinModules } from "node:module";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Σημείωση: το no-restricted-imports ελέγχει στατικά imports/exports, όχι δυναμικά import().

const framework = ["next", "next/**", "react", "react-dom"];

// Εσωτερικά οποιουδήποτε module, μέσω alias ή relative path.
// Δημόσια σημεία: server.ts, contracts.ts, presentation/components/* (εκτός components/internal/).
const internalPaths = [
  "domain",
  "application",
  "infrastructure",
  "presentation/actions",
  "presentation/hooks",
  "presentation/schemas",
  "presentation/components/internal",
];
const moduleInternals = internalPaths.flatMap((path) => [
  `@/modules/*/${path}`,
  `@/modules/*/${path}/**`,
  `**/modules/*/${path}`,
  `**/modules/*/${path}/**`,
]);

// Το server.ts (composition root) του ίδιου ή άλλου module. Domain και application
// δεν εξαρτώνται από αυτό: η κατεύθυνση είναι server.ts → application → domain.
const compositionRoot = ["../server", "../../server", "../../../server", "@/modules/*/server", "**/modules/*/server"];

// Πυρήνας του ίδιου module, με relative path από το presentation/.
const ownModuleCore = ["domain", "application", "infrastructure"].flatMap((dir) => [
  `../${dir}`,
  `../../${dir}`,
  `../../../${dir}`,
  `**/${dir}/**`,
]);

// Μέσα σε ένα module τα δικά του αρχεία εισάγονται με relative path.
// Το alias @/modules/... προς εσωτερικά δείχνει import από άλλο module.
const otherModuleInternals = moduleInternals.filter((p) => p.startsWith("@/"));

function restrict(...groups) {
  return ["error", { patterns: groups }];
}

const domainRestrictions = [
  {
    group: [
      ...framework,
      "@/server/**",
      "@/shared/ui/**",
      "**/application/**",
      "**/infrastructure/**",
      "**/presentation/**",
    ],
    message: "Το domain περιέχει μόνο καθαρό TypeScript.",
  },
  { group: compositionRoot, message: "Το domain δεν εισάγει server.ts· το server.ts εξαρτάται από το domain." },
  { group: otherModuleInternals, message: "Το domain δεν εισάγει άλλο module." },
];

const eslintConfig = [
  ...nextVitals,
  ...nextTs,
  {
    ignores: [".next/**", ".generated/**", "node_modules/**", "next-env.d.ts"],
  },
  {
    // Οι σελίδες βλέπουν μόνο τα δημόσια σημεία των modules.
    files: ["src/app/**"],
    rules: {
      "no-restricted-imports": restrict({
        group: moduleInternals,
        message: "Χρησιμοποίησε το server.ts, το contracts.ts ή τα δημόσια components του module.",
      }),
    },
  },
  {
    // Το shared μένει ανεξάρτητο από modules και server, ώστε να μεταφέρεται σε άλλο project.
    files: ["src/shared/**"],
    rules: {
      "no-restricted-imports": restrict({
        group: ["@/modules", "@/modules/**", "**/modules/**", "@/server", "@/server/**", "**/server/**"],
        message: "Το shared δεν εξαρτάται από modules ή server.",
      }),
    },
  },
  {
    // Ένα module δεν εισάγει τα εσωτερικά άλλου module.
    files: ["src/modules/**"],
    rules: {
      "no-restricted-imports": restrict({
        group: otherModuleInternals,
        message: "Χρησιμοποίησε τα δημόσια σημεία του άλλου module (server.ts, contracts.ts).",
      }),
    },
  },
  // Τα επόμενα αντικαθιστούν (δεν συγχωνεύουν) τον κανόνα του προηγούμενου block,
  // γι' αυτό επαναλαμβάνουν το otherModuleInternals.
  {
    files: ["src/modules/*/infrastructure/**", "templates/module/infrastructure/**"],
    rules: {
      "no-restricted-imports": restrict(
        {
          regex: "^(?:\\.\\./)+presentation(?:/|$)",
          message: "Το infrastructure δεν εισάγει το presentation του ίδιου module.",
        },
        { group: otherModuleInternals, message: "Χρησιμοποίησε τα δημόσια σημεία του άλλου module (server.ts, contracts.ts)." },
      ),
    },
  },
  {
    // Κατεύθυνση: presentation → server.ts. Το server.ts δεν εισάγει actions ή UI.
    files: ["src/modules/*/server.ts", "templates/module/server.ts"],
    rules: {
      "no-restricted-imports": restrict(
        {
          group: ["./presentation", "./presentation/**", "**/presentation/**", "@/shared/ui/**"],
          message: "Το server.ts δεν εισάγει actions ή UI· τα actions καλούν το server.ts.",
        },
        { group: otherModuleInternals, message: "Χρησιμοποίησε τα δημόσια σημεία του άλλου module (server.ts, contracts.ts)." },
      ),
    },
  },
  {
    // Το presentation φτάνει στη λογική μόνο μέσω server.ts (actions) και contracts.ts.
    files: ["src/modules/*/presentation/**", "templates/module/presentation/**"],
    rules: {
      "no-restricted-imports": restrict(
        { group: ownModuleCore, message: "Το presentation καλεί το ../server και χρησιμοποιεί τύπους του ../contracts." },
        { group: otherModuleInternals, message: "Χρησιμοποίησε τα δημόσια σημεία του άλλου module (server.ts, contracts.ts)." },
      ),
    },
  },
  {
    // Components και hooks: καλούν actions, όχι server.ts ή src/server.
    files: ["src/modules/*/presentation/components/**", "src/modules/*/presentation/hooks/**"],
    rules: {
      "no-restricted-imports": restrict(
        { group: ownModuleCore, message: "Το presentation καλεί το ../server και χρησιμοποιεί τύπους του ../contracts." },
        {
          group: [...compositionRoot, "@/server", "@/server/**"],
          message: "Τα components καλούν actions· το server.ts και το src/server είναι μόνο για server κώδικα.",
        },
        { group: otherModuleInternals, message: "Χρησιμοποίησε τα δημόσια σημεία του άλλου module (server.ts, contracts.ts)." },
      ),
    },
  },
  {
    // Το domain μένει ανεξάρτητο από framework, UI, ORM και υποδομή.
    files: ["src/modules/*/domain/**", "templates/module/domain/**"],
    rules: {
      "no-restricted-imports": restrict(...domainRestrictions),
    },
  },
  {
    // Τα tests μπορούν να χρησιμοποιούν εργαλεία Node χωρίς να χαλαρώνουν τα υπόλοιπα όρια.
    files: ["src/modules/*/domain/**", "templates/module/domain/**"],
    ignores: ["**/*.test.ts"],
    rules: {
      "no-restricted-imports": restrict(
        ...domainRestrictions,
        {
          group: ["node:*", ...builtinModules],
          message: "Το domain δεν εισάγει ενσωματωμένα modules του Node· τα I/O και η τυχαιότητα παρέχονται ως εξαρτήσεις.",
        },
      ),
    },
  },
  {
    // Το application εξαρτάται από domain και ports, όχι από υλοποιήσεις.
    files: ["src/modules/*/application/**", "templates/module/application/**"],
    rules: {
      "no-restricted-imports": restrict(
        {
          group: [...framework, "@/server/database/**", "**/infrastructure/**", "**/presentation/**"],
          message: "Οι υλοποιήσεις συνδέονται στο server.ts του module.",
        },
        {
          group: compositionRoot,
          message: "Το application δεν εισάγει server.ts· για άλλο module όρισε ένα port.",
        },
        { group: otherModuleInternals, message: "Χρησιμοποίησε ένα port, όχι τα εσωτερικά άλλου module." },
      ),
    },
  },
];

export default eslintConfig;

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

// Μέσα σε ένα module τα δικά του αρχεία εισάγονται με relative path.
// Το alias @/modules/... προς εσωτερικά δείχνει import από άλλο module.
const otherModuleInternals = moduleInternals.filter((p) => p.startsWith("@/"));

function restrict(...groups) {
  return ["error", { patterns: groups }];
}

const eslintConfig = [
  ...nextVitals,
  ...nextTs,
  {
    ignores: [".next/**", "node_modules/**", "next-env.d.ts"],
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
    // Το domain μένει ανεξάρτητο από framework, UI, ORM και υποδομή.
    files: ["src/modules/*/domain/**", "templates/module/domain/**"],
    rules: {
      "no-restricted-imports": restrict(
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

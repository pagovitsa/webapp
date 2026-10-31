# Νέο project από τη βάση webapp

Η βάση περιλαμβάνει ήδη λειτουργική ενότητα `users`, Prisma/MySQL, συνεδρίες στον server, email verification/recovery και κοινό SMTP connector. Το `users` διατηρείται ως πραγματική λειτουργία και σημείο αναφοράς. Οι κανόνες εργασίας βρίσκονται στο [AGENTS.md](../AGENTS.md).

## 1. Ελεγμένη αφετηρία

Επιβεβαίωσε στο GitHub ότι το commit του `main` που θα χρησιμοποιήσεις έχει περάσει CI και κατέγραψε το SHA του.

```sh
git clone --branch main https://github.com/pagovitsa/webapp.git <νέο-project>
cd <νέο-project>
git log -1 --oneline
git status --short
npm ci
npm run check
```

Η αφετηρία είναι έτοιμη όταν το repository είναι καθαρό και το `check` περνά. Αν απαιτείται συγκεκριμένη παλαιότερη έκδοση, επίλεξε υπάρχον, επαληθευμένο commit. Tags εκδόσεων δημιουργούνται μόνο σύμφωνα με τη ρητή εντολή και τη διαδικασία του AGENTS· η εκκίνηση νέου project δεν δημιουργεί tag.

Ρύθμισε το `origin` στο repository του νέου project πριν ανεβάσεις τις δικές του αλλαγές. Κάθε αλλαγή ακολουθεί branch και pull request, χωρίς απευθείας commit/push στο `main`.

## 2. Ταυτότητα και αποφάσεις project

| Απόφαση | Αρχεία |
|---|---|
| Όνομα εφαρμογής | `package.json`, metadata/header στο `src/app/layout.tsx`, branding στο `AuthScreen`, `appName` στο `src/server/auth/options.ts`. |
| Αρχική σελίδα και README | `src/app/page.tsx`, `README.md`. |
| Γλώσσα, locale, νόμισμα | Κείμενα UI, `html lang`, `src/shared/lib/format.ts`, AGENTS §5. |
| Χρώματα | Design tokens στο `src/app/globals.css`. |
| Εμφάνιση χρηστών | `src/modules/users/presentation/auth-appearance.ts`: `smart-save`, `nucleus` ή `midnight`. |
| Environment και υπηρεσίες | `.env.example`, `src/server/env.ts`, ρυθμίσεις βάσης/auth/SMTP. |

Κατέγραψε τις αλλαγμένες αποφάσεις στο AGENTS §5 και τις επιχειρησιακές υποθέσεις στο README του αντίστοιχου module. Οι αρχιτεκτονικοί κανόνες και τα εργαλεία ορίων διατηρούνται.

## 3. Τοπική βάση και email

Προϋποθέσεις: Node 26, npm 11 και ενεργό Docker Engine. Στα Windows ο υπάρχων helper περιμένει Docker μέσα στο WSL Debian· στο Linux χρησιμοποιεί native Docker.

```sh
npm run services:up
npm run auth:migrate
npm run dev
```

Ο helper δημιουργεί μόνο τα env αρχεία που λείπουν, με τυχαία τοπικά credentials. Τα `.env.local` και `.env.mysql.local` παραμένουν ignored. Το `.env.example` είναι αναφορά για τις απαιτούμενες μεταβλητές· η αντιγραφή placeholders πάνω στα generated credentials δεν αποτελεί μέρος της κανονικής εκκίνησης.

Οι υπηρεσίες χρησιμοποιούν σταθερά ονόματα (`webapp-mysql`, `webapp-mailpit`, volume `webapp-mysql-data`) και loopback ports (13306 MySQL, 12525 SMTP, 18025 Mailpit UI). Πριν εκκινήσεις δεύτερο ανεξάρτητο project στον ίδιο Docker host, όρισε χωριστά ονόματα, volume και ports στον helper και διατήρησε συνεπείς τις test ρυθμίσεις. Η αλλαγή ονόματος φακέλου ή package δεν απομονώνει τις υπηρεσίες.

Χώρισε τα περιβάλλοντα: η εφαρμογή χρησιμοποιεί `webapp_dev`, το Playwright `webapp_test`, με διαφορετικούς non-root χρήστες. Τα τοπικά credentials πρέπει να παραμένουν μαζί με το αντίστοιχο volume. Μην αφαιρείς env αρχεία ή υπάρχοντα δεδομένα ως τρόπο επαναρύθμισης.

Άνοιξε την εφαρμογή στο `http://localhost:3000` και το δοκιμαστικό γραμματοκιβώτιο στο `http://127.0.0.1:18025`. Τα emails επιβεβαίωσης και ανάκτησης παραμένουν στο Mailpit· δεν παραδίδονται σε εξωτερικούς παραλήπτες.

## 4. Έλεγχος της υπάρχουσας ενότητας χρηστών

```sh
npx playwright install chromium
npm run check
npm run test:e2e
```

Το Playwright εκκινεί τις υπηρεσίες, εφαρμόζει migrations στην test βάση και ελέγχει production build. Τα όρια, ο generator και η ενότητα χρηστών πρέπει να παραμένουν πράσινα μετά την προσαρμογή του project.

Στον development browser δοκίμασε:

1. Εγγραφή με username/password και προαιρετικό όνομα/επώνυμο.
2. Σφάλμα μορφής και παραβίαση κανόνα, με προσβάσιμο μήνυμα.
3. Επιβεβαίωση από το Mailpit, σύνδεση και προστατευμένο προφίλ.
4. Αποσύνδεση και ανάκτηση κωδικού με email του Mailpit.
5. Τις τέσσερις φόρμες στην επιλεγμένη εμφάνιση και τις υπόλοιπες [προεπισκοπήσεις](../src/modules/users/README.md#εμφανίσεις-ταυτοποίησης).

Η επαναχρησιμοποίηση του `users` δεν εισάγει αυτόματα δικαιώματα για τις επόμενες ενότητες. Κάθε προστατευμένη ανάγνωση και μεταβολή χρειάζεται δικό της έλεγχο πρόσβασης στον server.

## 5. Πρώτη νέα επιχειρησιακή ενότητα

Δημιούργησε branch από το ενημερωμένο `main` και χρησιμοποίησε τον generator:

```sh
npm run module:new -- customers --page
```

Συμπλήρωσε πρώτα το README του νέου module και ακολούθησε το [new-module.md](new-module.md). Η δημιουργία περιλαμβάνει domain, ports, use cases, infrastructure, δημόσια contracts/server API, presentation και τις κατάλληλες δοκιμές.

Όταν χρειάζεσαι δεδομένα χρηστών, χρησιμοποίησε δημόσιο σημείο του `users` μέσω adapter στο infrastructure ή πέρασε την ταυτότητα στο use case. Το application παραμένει ανεξάρτητο από Next.js και από τα εσωτερικά άλλων modules. Μόνιμα δεδομένα χρειάζονται Prisma schema/migrations και σαφείς εγγυήσεις αποθήκευσης.

Το pull request περιγράφει τη συμπεριφορά, τις υποθέσεις και τα πραγματικά αποτελέσματα `check`, e2e και browser. Merge γίνεται μετά από πράσινο CI και σύμφωνα με την εξουσιοδότηση του AGENTS.

## 6. Προετοιμασία παραγωγής

Η τοπική εγκατάσταση Docker δεν είναι έτοιμη διαμόρφωση παραγωγής. Πριν από deployment:

- Όρισε πραγματική MySQL, δικαιώματα ανά περιβάλλον και ελεγμένο backup/restore.
- Χρησιμοποίησε ξεχωριστά secrets και HTTPS· τα Secure cookies ενεργοποιούνται με HTTPS origin.
- Ρύθμισε πραγματικό SMTP και κατάλληλο αποστολέα για εξωτερική παράδοση.
- Ρύθμισε τον reverse proxy να αντικαθιστά τα forwarded IP headers που χρησιμοποιεί το rate limiting.
- Επαλήθευσε τις ροές σε production τοπολογία και στους browsers που θα υποστηρίζονται.

Το υλοποιημένο logout απαιτεί ανάκληση στη βάση πριν καθαρίσει το cookie και επιστρέφει 503 αν αποτύχει. Οι JSON αποκρίσεις δεν εκθέτουν session tokens ή password hashes. Οι αλλαγές αυτών των εγγυήσεων αξιολογούνται ως αλλαγές ασφάλειας και όχι ως απλή προσαρμογή εμφάνισης.

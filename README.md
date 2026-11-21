# Webapp Starter

Κορμός Next.js και TypeScript με Prisma και MySQL. Κάθε νέο project έχει το δικό του schema και τη δική του βάση. Τα έτοιμα modules βρίσκονται σε χωριστό κατάλογο και εγκαθίστανται ανά έργο.

## Ξεκίνα εδώ

1. Διάβασε τον [χάρτη των φακέλων](docs/folder-map.md) για να βρεις πού μπαίνει κάθε κομμάτι και γιατί.
2. Ακολούθησε την [εκκίνηση του κορμού](#εκκίνηση-του-κορμού) για να ανοίξεις την εφαρμογή τοπικά.
3. Όταν χρειαστείς μια λειτουργία, δες πώς [προσθέτεις έτοιμο module](#προσθήκη-έτοιμου-module) ή [δημιουργείς δικό σου](#δημιουργία-δικού-σου-module).

## Χάρτης του έργου

[Ξενάγηση για αρχάριους σε ολόκληρη τη δομή](docs/folder-map.md).

[Σελίδες και API](src/app/README.md) · [Λειτουργίες](src/modules/README.md) · [Υποδομή server](src/server/README.md) · [Κοινό UI και βοηθήματα](src/shared/README.md) · [Βάση και migrations](prisma/README.md) · [Εργαλεία modules](scripts/README.md) · [Δοκιμές](tests/README.md) · [Τοπικές υπηρεσίες](tooling/README.md)

## Εκκίνηση του κορμού

Χρειάζεσαι Node σύμφωνα με το `.nvmrc`, npm και ενεργό Docker. Ο υπάρχων helper σε Windows χρησιμοποιεί Docker στο WSL Debian. Σε Linux χρησιμοποιεί τον τοπικό Docker.

```sh
npm ci
npm run services:up
npm run dev
```

Η αρχική σελίδα ανοίγει στο `http://localhost:3000`. Ο helper ξεκινά τοπική MySQL και Mailpit, δημιουργεί αρχεία ρυθμίσεων με τυχαία μυστικά αν λείπουν και χρησιμοποιεί χωριστές βάσεις ανάπτυξης και δοκιμών. Δες το `.env.example` για τις μεταβλητές. Ο κορμός ξεκινά με schema χωρίς επιχειρησιακούς πίνακες.

## Προσθήκη έτοιμου module

Ο κατάλογος είναι διαθέσιμος στο branch [modules/catalog](https://github.com/pagovitsa/webapp/tree/modules/catalog). Από τον γονικό φάκελο του έργου, κατέβασέ τον δίπλα στο `webapp`:

```sh
git clone --branch modules/catalog --single-branch https://github.com/pagovitsa/webapp.git webapp-modules
```

Αν ο κατάλογος βρίσκεται αλλού, όρισε την απόλυτη διαδρομή του μέσω `WEBAPP_MODULES_DIR`. Από τη ρίζα του έργου:

```sh
npm run module:list
npm run module:add -- users
npm run db:migrate
npm run check
```

Το Users προσθέτει εγγραφή, σύνδεση, ανάκτηση κωδικού και προφίλ στο `/users`. Στην τοπική ανάπτυξη τα email επιβεβαίωσης εμφανίζονται στο Mailpit. Η αρχική σελίδα ανήκει σε κάθε έργο, που μπορεί να τη συνδέσει με το Users όπως θέλει.

Το Dashboards εξαρτάται από το Users και εγκαθίσταται χωριστά με `npm run module:add -- dashboards`. Ο installer ελέγχει εκδόσεις, αρχεία που ήδη υπάρχουν και αλλαγές στις σελίδες που χρειάζεται να επεκτείνει. Καταγράφει τις εγκαταστάσεις στο `modules.lock.json`. Κάνε commit αυτό το αρχείο μαζί με τον κώδικα, το schema και τις migrations.

Ο installer προορίζεται για πρώτη εγκατάσταση σε έργα που ξεκινούν από αυτόν τον κορμό. Οι αναβαθμίσεις modules χρειάζονται ξεχωριστές αλλαγές κώδικα και migrations. Για υπάρχον έργο με ήδη ενσωματωμένο Users ή Dashboards, διατήρησε το υφιστάμενο schema και το ιστορικό των migrations.

## Δημιουργία δικού σου module

Το `npm run module:new -- reports --page` δημιουργεί τον σκελετό και τη σελίδα `/reports`. Στον οδηγό θα δεις πού γράφεις τη φόρμα και τους κανόνες της και πώς φτάνει η αποθήκευση στη MySQL. [Οδηγός νέου module](docs/new-module.md) · [Όρια αρχιτεκτονικής](docs/architecture.md)

## Έλεγχοι

Το `npm run check` εκτελεί typecheck, lint, έλεγχο ορίων, tests και build. Για browser tests, εγκατέστησε τον Chromium του Playwright με `npx playwright install chromium` και τρέξε `npm run test:e2e`. Τα tests χρησιμοποιούν τη δοκιμαστική MySQL.

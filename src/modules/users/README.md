# users

## Σκοπός και ευθύνη

Ανοιχτή εγγραφή, επιβεβαίωση email, σύνδεση με username/password, συνεδρίες στον server, αποσύνδεση και ανάκτηση κωδικού. Το προφίλ επεκτείνεται μέσω κώδικα και migrations, χωρίς δυναμικά πεδία από UI διαχείρισης. Η αποστολή email είναι κοινή τεχνική υποδομή και δεν περιέχει επιχειρησιακούς κανόνες χρηστών.

## Δεδομένα που διαχειρίζεται

Χρήστης με μοναδικό username/email, προαιρετικό όνομα και επώνυμο, επιβεβαίωση email, λογαριασμός με password hash, συνεδρίες και tokens επιβεβαίωσης/ανάκτησης. Το Better Auth διαχειρίζεται κωδικούς, cookies και τον κύκλο ζωής των tokens. Τα DTOs δεν εκθέτουν κωδικούς ή tokens συνεδρίας.

## Κανόνες domain

- Username 3–30 χαρακτήρες, πεζά λατινικά, αριθμοί, τελεία ή κάτω παύλα. Η σύγκριση δεν διακρίνει πεζά/κεφαλαία.
- Email υποχρεωτικό, μοναδικό, με επιβεβαίωση πριν από τη σύνδεση.
- Όνομα/επώνυμο προαιρετικά, έως 100 χαρακτήρες το καθένα, χωρίς χαρακτήρες ελέγχου.
- Κωδικός 12–128 χαρακτήρες. Διατηρούνται ακριβώς οι χαρακτήρες του, χωρίς trim.
- Η πρόσβαση στο προφίλ ελέγχεται στον server. Η αποσύνδεση ακυρώνει τη συνεδρία και η ανάκτηση κωδικού ακυρώνει τις προηγούμενες συνεδρίες.

## Use cases

| Use case | Είδος | Περιγραφή |
|---|---|---|
| register-user | δημιουργία | Εγγραφή και email επιβεβαίωσης. |
| sign-in | μεταβολή | Σύνδεση με username/password. |
| sign-out | μεταβολή | Ανάκληση τρέχουσας συνεδρίας. |
| get-current-user | ανάγνωση | Μόνο το προφίλ του συνδεδεμένου χρήστη. |
| request-password-reset | μεταβολή | Ίδια απόκριση για γνωστό και άγνωστο email. |
| reset-password | μεταβολή | Νέος κωδικός με έγκυρο token μίας χρήσης. |

## Δημόσιο API

| Σημείο | Δημόσιο |
|---|---|
| server.ts | registerUser, signIn, signOut, getCurrentUser, requestPasswordReset, resetPassword, handleAuthRequest, UserError |
| contracts.ts | UserProfile, RegisterUserInput, SignInInput, PasswordResetInput, AuthMode, AuthField, AuthValues, AuthState, AuthAppearance |
| presentation/components/ | AuthForm, AuthScreen, UserAccount |

## Εξαρτήσεις

### Εμφανίσεις ταυτοποίησης

Οι `nucleus`, `smart-save` και `midnight` είναι τρεις ονομαστικές εμφανίσεις της ίδιας φόρμας για σύνδεση, εγγραφή, αίτηση ανάκτησης και ορισμό νέου κωδικού. Η ενεργή εμφάνιση επιλέγεται μόνο στον κώδικα, από το `presentation/auth-appearance.ts`. Η προεπιλογή είναι `smart-save`, κατόπιν επιλογής του χρήστη. Κάθε σελίδα συνθέτει το δημόσιο `AuthScreen`, που δέχεται επίσης ρητά `appearance` όταν χρειάζεται προεπισκόπηση. Δεν προστίθεται επιλογέας εμφάνισης στις πραγματικές φόρμες.

Τα styles και τα διακοσμητικά γραφικά είναι τοπικά CSS Modules, με χρώματα από τα υπάρχοντα design tokens. Δεν φορτώνονται assets από τρίτους κατά την επίσκεψη. Διατηρούνται τα ελληνικά κείμενα, τα labels/μηνύματα, τα Server Actions και όλοι οι κανόνες ταυτοποίησης. Τα σχέδια προσαρμόζονται στις υπάρχουσες λειτουργίες· δεν προστίθενται μη λειτουργικά κουμπιά social login ή αλλαγή πολιτικής συνεδριών.

Προεπισκοπήσεις: `/users/previews/nucleus`, `/users/previews/smart-save`, `/users/previews/midnight`. Κάθε σελίδα δείχνει τα τέσσερα αντίστοιχα forms για οπτικό έλεγχο, με μη ενεργές υποβολές ώστε να μη δημιουργούνται λογαριασμοί ή συνεδρίες κατά την προεπισκόπηση. Η ενεργή εμφάνιση της κανονικής σύνδεσης δεν επηρεάζεται από URL, cookie ή προτίμηση browser.

Αναφορές: [Nucleus UI](https://dribbble.com/shots/25536172-Login-Register-Page-Nucleus-UI), [Smart Save](https://dribbble.com/shots/20624802-Login-Page-Smart-Save), [Dark Mode](https://dribbble.com/shots/24552589-Login-Sign-up-Dark-Mode-UI-UX-Design). Οι προσαρμογές διατηρούν τη λογική της διάταξης, με δικά μας CSS γραφικά και ονομασία εφαρμογής.

Κανένα άλλο module. Οι adapters χρησιμοποιούν Better Auth, Prisma/MySQL και τον κοινό SMTP connector του `src/server/email`. Οι κωδικοί αποθηκεύονται ως μονόδρομα hashes από τη βιβλιοθήκη. Το cookie περιέχει μόνο τυχαίο αναγνωριστικό συνεδρίας: HttpOnly, SameSite=Lax, Secure μέσω HTTPS. Η συνεδρία λήγει σε επτά ημέρες, ανανεώνεται μετά από μία ημέρα ενεργής χρήσης και η cookie cache απενεργοποιείται για άμεση ανάκληση. Η σύγκριση session/reset tokens στη MySQL είναι case-sensitive μέσω migration.

### HTTP API

Το [OpenAPI contract](./openapi.json) περιγράφει τα JSON αιτήματα και τις αποκρίσεις. Οι μεταβολές από API και Server Actions περνούν από την ίδια HTTP αλυσίδα Better Auth, με έλεγχο origin και rate limiting στη βάση. Δεν εκτίθενται οι υπόλοιπες διαδρομές της βιβλιοθήκης. Επιτυχία JSON: `{ "success": true }`. Σφάλμα JSON: `{ "error": { "code": "…", "message": "…" } }`. Οι συνδέσεις email ακολουθούν redirects της βιβλιοθήκης.

| Μέθοδος | Διαδρομή | Συμπεριφορά |
|---|---|---|
| POST | `/api/auth/sign-up/email` | Εγγραφή, 201, email επιβεβαίωσης. |
| POST | `/api/auth/sign-in/username` | Σύνδεση, 200 και HttpOnly cookie. |
| POST | `/api/auth/sign-out` | Ανάκληση και διαγραφή cookie. |
| POST | `/api/auth/request-password-reset` | Ουδέτερη απόκριση, αποστολή οδηγιών αν υπάρχει λογαριασμός. |
| POST | `/api/auth/reset-password` | Νέος κωδικός και token μίας χρήσης, ανάκληση συνεδριών. |
| POST | `/api/auth/send-verification-email` | Επανάληψη αποστολής επιβεβαίωσης. |
| GET | `/api/auth/verify-email` | Callback συνδέσμου email. |
| GET | `/api/auth/reset-password/{token}` | Callback προς τη φόρμα ανάκτησης. |
| GET | `/api/users/me` | Προφίλ με cookie ή 401· χωρίς password/token. |

First-party clients χρησιμοποιούν cookies του ίδιου origin, JSON και `credentials: "same-origin"`. Δεν απαιτούνται δεύτερο backend ή JWT. Μη έμπιστα origins απορρίπτονται. Τα POST bodies περιορίζονται σε 16 KiB. Η σύνδεση περιορίζεται σε 10 προσπάθειες/λεπτό/IP και η ανάκτηση σε 5· υπέρβαση επιστρέφει 429 και `Retry-After`. Το production reverse proxy πρέπει να αντικαθιστά τα forwarded IP headers ώστε να μην τα επιλέγει ο client.

### Τοπική εκτέλεση και δοκιμές

Απαιτούνται Node 26, npm 11 και ενεργό Docker Engine. Στα Windows χρησιμοποιείται το υπάρχον Docker του WSL Debian· στο Linux το native Docker.

```sh
npm ci
npm run services:up
npm run auth:migrate
npm run dev
```

Η εφαρμογή ανοίγει στο `http://localhost:3000/users`, τα δοκιμαστικά email στο `http://127.0.0.1:18025`. Ο helper δημιουργεί μόνο αν λείπουν τα ignored `.env.mysql.local` και `.env.local`, με τυχαία τοπικά credentials. Δεν τα αντικαθιστά. Μην τα διαγράφεις ενώ διατηρείς το volume, γιατί τα credentials της ήδη αρχικοποιημένης βάσης δεν αλλάζουν αυτόματα.

MySQL `8.4.13`: loopback port 13306 και μόνιμο volume `webapp-mysql-data`. Χωριστές βάσεις/χρήστες `webapp_dev` και `webapp_test`, χωρίς δικαιώματα root στην εφαρμογή. Mailpit `1.33.0`: SMTP loopback port 12525, χωρίς external relay. Τα Windows κρατούν το WSL ενεργό με κρυφή διεργασία μέχρι να σταματήσει, χωρίς αλλαγή γενικών ρυθμίσεων του συστήματος.

```sh
npm run check
npm run test:e2e
```

Το Playwright εκκινεί υπηρεσίες, εφαρμόζει migrations και production build, χρησιμοποιώντας αποκλειστικά `webapp_test` στο port 3100. Οι δοκιμές ελέγχουν browser/JSON API, πραγματικά captured emails, password hash στη MySQL, λήξη/ανάκληση συνεδριών, tokens μίας χρήσης, origin και rate limiting. Τα δεδομένα δοκιμών είναι συνθετικά με μοναδικές τιμές. Τα domain/schema/use-case tests χρησιμοποιούν Vitest και fake port.

### Τεκμηρίωση επιλογών

- [Auth.js: μετάβαση σε Better Auth](https://authjs.dev/getting-started/migrate-to-better-auth): η επιλογή καλύπτει username/password και συνεδρίες στη βάση, χωρίς custom auth πρωτόκολλο.
- [Better Auth Prisma adapter](https://better-auth.com/docs/adapters/prisma) και [Prisma MySQL](https://www.prisma.io/docs/orm/overview/databases/mysql): κοινός typed client και migrations. Ο επίσημος Prisma driver adapter για MySQL βασίζεται στον MariaDB driver· η εφαρμογή χρησιμοποιεί Prisma.
- [Better Auth rate limiting](https://better-auth.com/docs/concepts/rate-limit): οι απευθείας server API κλήσεις παρακάμπτουν το limiter, γι’ αυτό οι μεταβολές περνούν από τον HTTP handler ακόμη και μέσα στα Server Actions.
- [Next.js Route Handlers](https://nextjs.org/docs/app/api-reference/file-conventions/route): το HTTP API συνυπάρχει με τις σελίδες, χωρίς ξεχωριστό backend.
- [Mailpit Docker](https://mailpit.axllent.org/docs/install/docker/) και [WSL systemd](https://learn.microsoft.com/en-us/windows/wsl/systemd): τοπική σύλληψη email και διατήρηση ενεργού Docker στο WSL.

## Παραδείγματα συμπεριφοράς

| Είσοδος / κατάσταση | Αποτέλεσμα |
|---|---|
| Νέα εγγραφή | Email επιβεβαίωσης, χωρίς αυτόματη σύνδεση. |
| Σύνδεση με σωστό κωδικό πριν από επιβεβαίωση | Νέο email επιβεβαίωσης, χωρίς συνεδρία. |
| Σωστά credentials, επιβεβαιωμένο email | Νέα συνεδρία και πρόσβαση στο προφίλ. |
| Χωρίς συνεδρία | Ανακατεύθυνση στη σύνδεση. |
| Logout και επαναχρησιμοποίηση παλιού cookie | Καμία πρόσβαση. |
| Reset με άγνωστο email | Ίδιο ουδέτερο μήνυμα. |
| Ήδη χρησιμοποιημένο reset token | Απόρριψη. |

## Επανάληψη έναντι παραβίασης κανόνα

Η αποσύνδεση χωρίς συνεδρία είναι ασφαλής επανάληψη. Διπλή εγγραφή και άκυρα credentials/tokens επιστρέφουν ελεγχόμενο μήνυμα. Τεχνικά σφάλματα αποθήκευσης/SMTP δεν καταπίνονται και δεν καταγράφουν κωδικούς, cookies ή συνδέσμους με tokens. Ένα αυστηρό before-hook απαιτεί επιτυχή διαγραφή της συνεδρίας πριν το built-in logout διαγράψει το cookie: αποτυχία ανάκλησης επιστρέφει 503 και διατηρεί το cookie για επανάληψη. Οι έλεγχοι origin/CSRF παραμένουν ενεργοί και προηγούνται της ανάκλησης. Το hook καλύπτεται από απομονωμένες δοκιμές με πραγματικό HTTP handler της βιβλιοθήκης και προσομοιωμένη αποτυχία αποθήκευσης.

## Ανοιχτά θέματα

- Η επιτυχής σύνδεση της φόρμας οδηγεί στο /, όπου η εφαρμογή επιλέγει dashboard βάσει ενεργοποίησης/δικαιωμάτων ή προσωρινά το προφίλ. Το users δεν εισάγει το dashboards ούτε γνωρίζει ρόλους του. Η σελίδα σύνδεσης παρακάμπτεται όταν υπάρχει ήδη ενεργή συνεδρία. Το /login είναι alias του /users/login.

- Μόνιμη αποθήκευση: MySQL μέσω Prisma. Τα Docker services είναι για ανάπτυξη/δοκιμές. Η παραγωγή χρειάζεται δική της βάση, backup, HTTPS και ξεχωριστά μυστικά· ο τοπικός helper δεν εκκινείται από τον production server.
- Για πραγματική παράδοση email απαιτούνται SMTP και επιβεβαιωμένος αποστολέας. Οι δοκιμές χρησιμοποιούν αποκλειστικά τοπικό SMTP capture, χωρίς αποστολή σε εξωτερικούς παραλήπτες.
- Πρώτη έκδοση προφίλ: προαιρετικό όνομα/επώνυμο. Η προσθήκη νέων πεδίων ενημερώνει τύπους, validation, auth schema/migration, DTOs, φόρμες και δοκιμές.

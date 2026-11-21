# Σύνδεση MySQL

Το `index.ts` δημιουργεί και επαναχρησιμοποιεί έναν Prisma client ανά διεργασία. Χρησιμοποίησε την κοινή συνάρτηση σύνδεσης από server κώδικα, για παράδειγμα μέσα στο `infrastructure/persistence/` του module σου.

Το `DATABASE_URL` ορίζει ποια βάση χρησιμοποιεί το έργο. Οι πίνακες περιγράφονται στο [Prisma schema](../../../prisma/README.md). Για μια τοπική βάση ξεκίνα τις υπηρεσίες με `npm run services:up` και εφάρμοσε τις εκκρεμείς migrations με `npm run db:migrate`.

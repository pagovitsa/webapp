# Schema και migrations

Το `schema.prisma` περιγράφει τα μοντέλα του συγκεκριμένου project. Ο σκέτος κορμός έχει ρύθμιση σύνδεσης MySQL. Ο installer προσθέτει τα μοντέλα και τους φακέλους migrations των επιλεγμένων modules.

- `npm run db:migrate` εφαρμόζει τις εκκρεμείς migrations στη βάση του `DATABASE_URL`.
- `npm run typecheck` και `npm run dev` παράγουν τον Prisma client από το schema.
- Όταν αλλάζεις μοντέλο ενός εγκατεστημένου module, πρόσθεσε νέα migration μαζί με την αλλαγή. Τα SQL αρχεία migrations που έχουν ήδη εφαρμοστεί αποτελούν ιστορικό της βάσης.

[Πού ρυθμίζεται η σύνδεση](../src/server/database/README.md)

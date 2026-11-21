# Αρχικοποίηση της τοπικής MySQL

Το `init-test-db.sh` εκτελείται στην πρώτη εκκίνηση ενός άδειου MySQL volume και δημιουργεί χωριστή δοκιμαστική βάση. Ο helper φορτώνει τα μυστικά από αρχείο τοπικών ρυθμίσεων που αγνοεί το Git. Χρησιμοποίησε `npm run services:up` από τη ρίζα του project.

Οι πίνακες των modules δημιουργούνται από τις [Prisma migrations](../../prisma/README.md) με `npm run db:migrate`.

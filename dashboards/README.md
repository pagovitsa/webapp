# Dashboards

Προσθέτει τις σελίδες dashboard και τους ελέγχους πρόσβασης για ενεργούς χρήστες. Απαιτεί το Users.

1. Από τη ρίζα του έργου τρέξε `npm run module:add -- users`, αν λείπει.
2. Τρέξε `npm run module:add -- dashboards` και `npm run db:migrate`.
3. Χρησιμοποίησε το `/dashboard` με λογαριασμό που έχει την κατάλληλη πρόσβαση.

Ο installer επεκτείνει το Prisma μοντέλο User και τη σελίδα λογαριασμού του Users. Τα αρχεία `before-1.txt` και `after-1.txt` περιγράφουν αυτή την αλλαγή στη σελίδα. Αν η σελίδα έχει προσαρμοστεί στο έργο, ο installer σταματά για να μπορέσεις να ενσωματώσεις τη διαφορά. [Κανόνες πρόσβασης και κώδικας](files/src/modules/dashboards/README.md)

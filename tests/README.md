# Ποιον έλεγχο να τρέξεις

Το `npm run check` ελέγχει τύπους, lint, όρια εξαρτήσεων, tests και παραγωγικό build. Οι δοκιμές installer βρίσκονται στο `generator/`. Οι δοκιμές επιχειρησιακής λογικής βρίσκονται δίπλα στον κώδικα του αντίστοιχου module.

Το `npm run test:e2e` ανοίγει το build σε Chromium και χρησιμοποιεί τη δοκιμαστική MySQL. Για την πρώτη εκτέλεση χρειάζεσαι ενεργό Docker και εγκατάσταση Chromium με `npx playwright install chromium`. Οι δοκιμές browser για Users και Dashboards προστίθενται μαζί με τα αντίστοιχα modules.

import { expect, test, type Page } from "@playwright/test";

// Τα δεδομένα ζουν στη μνήμη του server και μοιράζονται μεταξύ tests: μοναδικά ονόματα ανά test.
function uniqueCustomer(label: string) {
  return `${label} ${Date.now().toString(36)}`;
}

async function submitOrder(page: Page, customer: string, amount: string) {
  await page.getByLabel("Πελάτης").fill(customer);
  await page.getByLabel("Ποσό (€)").fill(amount);
  await page.getByRole("button", { name: "Δημιουργία παραγγελίας" }).click();
}

test("η αρχική σελίδα οδηγεί στις παραγγελίες", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("navigation").getByRole("link", { name: "Παραγγελίες" }).click();
  await expect(page).toHaveURL(/\/orders$/);
  await expect(page.getByRole("heading", { level: 1, name: "Παραγγελίες" })).toBeVisible();
});

test("σφάλμα μορφής από το schema", async ({ page }) => {
  await page.goto("/orders");
  await submitOrder(page, uniqueCustomer("Schema"), "abc");
  await expect(page.getByText("Το ποσό πρέπει να είναι αριθμός")).toBeVisible();
});

test("σφάλμα κανόνα από το domain, με διατήρηση των τιμών", async ({ page }) => {
  const customer = uniqueCustomer("Domain");
  await page.goto("/orders");
  await submitOrder(page, customer, "0");
  // Μέσα στο <main>: το Next.js έχει δικό του role="alert" (route announcer).
  await expect(page.getByRole("main").getByRole("alert")).toHaveText("Το ποσό πρέπει να είναι μεγαλύτερο από μηδέν.");
  await expect(page.getByLabel("Πελάτης")).toHaveValue(customer);
});

test("δημιουργία, εμφάνιση στη λίστα και επιβεβαίωση", async ({ page }) => {
  const customer = uniqueCustomer("Ροή");
  await page.goto("/orders");
  await submitOrder(page, customer, "49,90");

  await expect(page.getByRole("main").getByRole("status")).toContainText("Δημιουργήθηκε η παραγγελία ORD-");
  await expect(page.getByLabel("Πελάτης")).toHaveValue("");

  const row = page.getByRole("listitem").filter({ hasText: customer });
  await expect(row).toContainText("49,90");
  await expect(row).toContainText("Πρόχειρη");

  await row.getByRole("button", { name: "Επιβεβαίωση" }).click();
  await expect(row).toContainText("Επιβεβαιωμένη");
  await expect(row.getByRole("button", { name: "Επιβεβαίωση" })).toHaveCount(0);

  await row.getByRole("button", { name: "Ακύρωση" }).click();
  await expect(row).toContainText("Ακυρωμένη");
  await expect(row.getByRole("button")).toHaveCount(0);
});

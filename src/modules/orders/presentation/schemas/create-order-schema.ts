import type { CreateOrderInput } from "../../contracts";

// Ελέγχει μόνο τη μορφή. Οι επιχειρησιακοί κανόνες (π.χ. ποσό > 0, ανώτατο όριο) είναι στο domain.

export type CreateOrderField = "customerName" | "amount";
export type CreateOrderFieldErrors = Partial<Record<CreateOrderField, string>>;

export type CreateOrderParseResult =
  | { ok: true; data: CreateOrderInput }
  | { ok: false; errors: CreateOrderFieldErrors };

export function parseCreateOrder(formData: FormData): CreateOrderParseResult {
  const customerName = String(formData.get("customerName") ?? "").trim();
  const rawAmount = String(formData.get("amount") ?? "").trim().replace(",", ".");
  const errors: CreateOrderFieldErrors = {};

  if (!customerName) {
    errors.customerName = "Συμπλήρωσε το όνομα πελάτη.";
  }

  if (!rawAmount) {
    errors.amount = "Συμπλήρωσε το ποσό.";
  } else if (!/^-?\d+(\.\d+)?$/.test(rawAmount)) {
    errors.amount = "Το ποσό πρέπει να είναι αριθμός, π.χ. 49,90.";
  } else if (/\.\d{3,}$/.test(rawAmount)) {
    errors.amount = "Έως δύο δεκαδικά ψηφία.";
  }

  if (errors.customerName || errors.amount) {
    return { ok: false, errors };
  }

  return { ok: true, data: { customerName, amountCents: Math.round(Number(rawAmount) * 100) } };
}

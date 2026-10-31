// Προεπιλογές του project. Άλλαξέ τες εδώ ή πέρασε options ανά κλήση.
export const DEFAULT_LOCALE = "el-GR";
export const DEFAULT_CURRENCY = "EUR";

type CurrencyOptions = { locale?: string; currency?: string };
type DateOptions = { locale?: string; timeZone?: string };

export function formatCurrency(cents: number, { locale = DEFAULT_LOCALE, currency = DEFAULT_CURRENCY }: CurrencyOptions = {}) {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(cents / 100);
}

export function formatDateTime(value: string | Date, { locale = DEFAULT_LOCALE, timeZone }: DateOptions = {}) {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone }).format(new Date(value));
}

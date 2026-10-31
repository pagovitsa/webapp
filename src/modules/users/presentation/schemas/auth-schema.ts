import type { AuthField, AuthMode } from "../../contracts";

export function parseAuthForm(mode: AuthMode, formData: FormData) {
  const text = (field: string) => { const value = formData.get(field); return typeof value === "string" ? value : ""; };
  const data = { username: text("username").trim(), email: text("email").trim(), password: text("password"), firstName: text("firstName"), lastName: text("lastName"), token: text("token") };
  const errors: Partial<Record<AuthField, string>> = {};
  if ((mode === "register" || mode === "login") && !data.username) errors.username = "Συμπλήρωσε το όνομα χρήστη.";
  if ((mode === "register" || mode === "forgot-password") && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = "Συμπλήρωσε έγκυρο email.";
  if (mode !== "forgot-password" && !data.password) errors.password = "Συμπλήρωσε τον κωδικό.";
  if ((mode === "register" || mode === "reset-password") && data.password !== text("confirmPassword")) errors.confirmPassword = "Οι κωδικοί δεν συμφωνούν.";
  if (mode === "reset-password" && !data.token) errors.token = "Ο σύνδεσμος ανάκτησης δεν είναι έγκυρος.";
  return Object.keys(errors).length ? { ok: false as const, errors } : { ok: true as const, data };
}

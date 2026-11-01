import type { AuthEntry, AuthEntryQuery, AuthMode } from "../../contracts";

export function parseAuthEntry(query: AuthEntryQuery): AuthEntry {
  const form = typeof query.form === "string" ? query.form : "";
  const mode: AuthMode = form === "register" || form === "forgot-password" || form === "reset-password" ? form : "login";
  const token = typeof query.token === "string" && query.token.length <= 512 ? query.token : "";
  return { mode, token, verified: query.verified === "1", reset: query.reset === "1",
    invalidLink: Boolean(query.error) || (mode === "reset-password" && !token) };
}

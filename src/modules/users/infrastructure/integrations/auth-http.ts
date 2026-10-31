import { z } from "zod";
import { getAuth } from "@/server/auth";
import { authOrigin } from "@/server/auth/options";
import { logger } from "@/server/logger";
import { registrationData, validatePassword, UserError } from "../../domain/user";

const jsonError = (status: number, code: string, message: string) => Response.json({ error: { code, message } }, { status, headers: { "Cache-Control": "no-store" } });

export function authFailure(status: number, code?: string): UserError {
  if (status === 429) return new UserError("Πολλές προσπάθειες. Δοκίμασε ξανά σε λίγο.");
  if (code === "EMAIL_NOT_VERIFIED") return new UserError("Επιβεβαίωσε πρώτα το email σου. Σου στείλαμε νέο σύνδεσμο επιβεβαίωσης.");
  if (code === "INVALID_USERNAME_OR_PASSWORD" || code === "INVALID_EMAIL_OR_PASSWORD") return new UserError("Το όνομα χρήστη ή ο κωδικός δεν είναι σωστός.");
  if (code?.includes("ALREADY") || code?.includes("TAKEN")) return new UserError("Δεν μπορεί να δημιουργηθεί λογαριασμός με αυτά τα στοιχεία. Δοκίμασε σύνδεση ή ανάκτηση κωδικού.");
  if (code === "INVALID_TOKEN" || code === "TOKEN_EXPIRED") return new UserError("Ο σύνδεσμος δεν είναι έγκυρος ή έχει λήξει. Ζήτησε νέο σύνδεσμο.");
  return new UserError("Η ενέργεια δεν μπορεί να ολοκληρωθεί με αυτά τα στοιχεία.");
}

async function readBody(request: Request): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) return {};
  const decoder = new TextDecoder();
  let size = 0;
  let text = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 16_384) { await reader.cancel(); throw new UserError("Το αίτημα είναι πολύ μεγάλο."); }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    return text ? JSON.parse(text) : {};
  } catch (error) {
    if (error instanceof SyntaxError) throw new UserError("Μη έγκυρη μορφή JSON.");
    throw error;
  } finally { reader.releaseLock(); }
}

function normalizeBody(path: string, input: unknown): Record<string, unknown> {
  const password = z.string().min(1).max(128);
  const email = z.email().max(254).transform(value => value.trim().toLowerCase());
  if (path === "sign-up/email") {
    const parsed = z.object({ username: z.string(), email, password, firstName: z.string().optional().default(""), lastName: z.string().optional().default("") }).parse(input);
    const data = registrationData(parsed);
    return { ...data, name: [data.firstName, data.lastName].filter(Boolean).join(" ") || data.username, callbackURL: `${authOrigin()}/users/login?verified=1` };
  }
  if (path === "sign-in/username") {
    const data = z.object({ username: z.string().trim().min(1).max(30), password }).parse(input);
    return { ...data, username: data.username.toLowerCase(), callbackURL: `${authOrigin()}/users/login?verified=1` };
  }
  if (path === "request-password-reset" || path === "send-verification-email") {
    const data = z.object({ email }).parse(input);
    return path === "request-password-reset" ? { ...data, redirectTo: `${authOrigin()}/users/reset-password` } : { ...data, callbackURL: `${authOrigin()}/users/login?verified=1` };
  }
  if (path === "reset-password") {
    const data = z.object({ token: z.string().min(1).max(512), newPassword: password }).parse(input);
    return { ...data, newPassword: validatePassword(data.newPassword) };
  }
  return {};
}

const mutations = new Set(["sign-up/email", "sign-in/username", "sign-out", "request-password-reset", "reset-password", "send-verification-email"]);

export async function handleAuthHttp(request: Request): Promise<Response> {
  const path = new URL(request.url).pathname.replace(/^\/api\/auth\//, "");
  if (request.method === "GET") {
    if (!/^(verify-email|reset-password\/[^/]+)$/.test(path)) return jsonError(404, "NOT_FOUND", "Η διαδρομή δεν υπάρχει.");
    return getAuth().handler(request);
  }
  if (request.method !== "POST" || !mutations.has(path)) return jsonError(404, "NOT_FOUND", "Η διαδρομή δεν υπάρχει.");
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return jsonError(415, "UNSUPPORTED_MEDIA_TYPE", "Απαιτείται αίτημα JSON.");
  try {
    const body = normalizeBody(path, await readBody(request));
    const headers = new Headers(request.headers);
    headers.delete("content-length");
    // All callers, including Server Actions, use the HTTP pipeline and its rate limiter.
    const response = await getAuth().handler(new Request(request.url, { method: "POST", headers, body: JSON.stringify(body) }));
    const outputHeaders = new Headers(response.headers);
    outputHeaders.delete("content-length");
    outputHeaders.set("Cache-Control", "no-store");
    const retryAfter = response.headers.get("x-retry-after");
    if (response.status === 429 && retryAfter) outputHeaders.set("Retry-After", retryAfter);
    if (response.ok) {
      // Session credentials stay in HttpOnly cookies, never in browser-readable JSON.
      return Response.json({ success: true }, { status: path === "sign-up/email" ? 201 : 200, headers: outputHeaders });
    }
    const payload: unknown = await response.json();
    const parsed = z.object({ code: z.string().optional() }).safeParse(payload);
    const code = parsed.success ? parsed.data.code : undefined;
    if (response.status >= 500) logger.error("Authentication service failed", { endpoint: path });
    return Response.json({ error: { code: code ?? (response.status === 429 ? "RATE_LIMITED" : "AUTH_FAILED"), message: response.status >= 500 ? "Η υπηρεσία δεν είναι διαθέσιμη προσωρινά." : authFailure(response.status, code).message } }, { status: response.status, headers: outputHeaders });
  } catch (error) {
    if (error instanceof UserError) return jsonError(400, "INVALID_INPUT", error.message);
    if (error instanceof z.ZodError) return jsonError(400, "INVALID_INPUT", "Συμπλήρωσε έγκυρα στοιχεία.");
    logger.error("Authentication request failed", { endpoint: path, kind: error instanceof Error ? error.name : "UnknownError" });
    return jsonError(503, "SERVICE_UNAVAILABLE", "Η υπηρεσία δεν είναι διαθέσιμη προσωρινά.");
  }
}

import { APIError, createAuthMiddleware } from "better-auth/api";

export const requireSessionRevocation = createAuthMiddleware(async (context) => {
  if (context.path !== "/sign-out") return;
  const token = await context.getSignedCookie(context.context.authCookies.sessionToken.name, context.context.secret);
  if (!token) return;
  try {
    // The built-in endpoint catches deletion errors; require revocation before it clears cookies.
    await context.context.internalAdapter.deleteSession(token);
  } catch {
    throw new APIError("SERVICE_UNAVAILABLE", { code: "SESSION_REVOCATION_FAILED", message: "Η αποσύνδεση δεν ολοκληρώθηκε. Δοκίμασε ξανά." });
  }
});

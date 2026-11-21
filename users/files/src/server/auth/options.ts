import "server-only";
import type { BetterAuthOptions } from "better-auth";
import { username } from "better-auth/plugins";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import type { PrismaClient } from "../../../.generated/prisma/client";
import { z } from "zod";
import { env } from "../env";
import { sendEmail } from "../email";
import { requireSessionRevocation } from "./require-session-revocation";

export function authOrigin(): string {
  const url = new URL(env.AUTH_URL);
  if (url.username || url.password || url.pathname !== "/" || url.search || url.hash) throw new Error("Το AUTH_URL πρέπει να είναι το origin της εφαρμογής.");
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (url.protocol !== "https:" && !(local && url.protocol === "http:")) throw new Error("Η σύνδεση απαιτεί HTTPS.");
  return url.origin;
}

export function createAuthOptions(database: PrismaClient) {
  const baseURL = authOrigin();
  if (env.AUTH_SECRET.length < 32) throw new Error("Το AUTH_SECRET χρειάζεται τουλάχιστον 32 τυχαίους χαρακτήρες.");
  const profileField = z.string().trim().max(100).regex(/^[^\u0000-\u001f\u007f]*$/);
  return {
    appName: "webapp", database: prismaAdapter(database, { provider: "mysql", transaction: true }), baseURL, secret: env.AUTH_SECRET,
    trustedOrigins: [baseURL],
    hooks: { before: requireSessionRevocation },
    emailAndPassword: {
      enabled: true, minPasswordLength: 12, maxPasswordLength: 128,
      autoSignIn: false, requireEmailVerification: true, revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }: { user: { email: string }; url: string }) => {
        await sendEmail({ to: user.email, subject: "Ανάκτηση κωδικού", text: `Για να ορίσεις νέο κωδικό, άνοιξε τον σύνδεσμο:\n${url}\n\nΑν δεν το ζήτησες εσύ, αγνόησε αυτό το email.` });
      },
    },
    emailVerification: {
      sendOnSignUp: true, sendOnSignIn: true, autoSignInAfterVerification: false, expiresIn: 3600,
      sendVerificationEmail: async ({ user, url }: { user: { email: string }; url: string }) => {
        await sendEmail({ to: user.email, subject: "Επιβεβαίωση λογαριασμού", text: `Επιβεβαίωσε το email σου ανοίγοντας τον σύνδεσμο:\n${url}` });
      },
    },
    user: { additionalFields: {
      firstName: { type: "string" as const, required: false, defaultValue: "", validator: { input: profileField } },
      lastName: { type: "string" as const, required: false, defaultValue: "", validator: { input: profileField } },
    } },
    session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24, cookieCache: { enabled: false } },
    advanced: { disableOriginCheck: false, disableCSRFCheck: false, useSecureCookies: baseURL.startsWith("https:"), defaultCookieAttributes: { httpOnly: true, sameSite: "lax" as const } },
    rateLimit: { enabled: true, storage: "database" as const, window: 60, max: 100,
      customRules: { "/sign-in/username": { window: 60, max: 10 }, "/request-password-reset": { window: 60, max: 5 } } },
    plugins: [username({ minUsernameLength: 3, maxUsernameLength: 30 })],
  } satisfies BetterAuthOptions;
}

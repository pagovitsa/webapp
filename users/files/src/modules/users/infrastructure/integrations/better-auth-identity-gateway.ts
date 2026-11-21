import { cookies } from "next/headers";
import { parseSetCookieHeader, toCookieOptions } from "better-auth/cookies";
import { z } from "zod";
import { getAuth } from "@/server/auth";
import { authOrigin } from "@/server/auth/options";
import type { IdentityGateway } from "../../application/ports/identity-gateway";
import type { Registration, UserIdentity } from "../../domain/user";
import { authFailure, handleAuthHttp } from "./auth-http";

export class BetterAuthIdentityGateway implements IdentityGateway {
  constructor(private readonly requestHeaders: () => Promise<Headers>) {}
  private async mutate(path: string, body: Record<string, unknown>): Promise<void> {
    const headers = new Headers(await this.requestHeaders());
    headers.set("content-type", "application/json");
    headers.delete("content-length");
    const response = await handleAuthHttp(new Request(`${authOrigin()}/api/auth/${path}`, { method: "POST", headers, body: JSON.stringify(body) }));
    const setCookies = response.headers.get("set-cookie");
    if (setCookies) {
      const jar = await cookies();
      for (const [name, attributes] of parseSetCookieHeader(setCookies)) jar.set(name, attributes.value, toCookieOptions(attributes));
    }
    if (response.ok) return;
    if (response.status >= 500) throw new Error("Η υπηρεσία σύνδεσης δεν είναι διαθέσιμη προσωρινά.");
    const payload: unknown = await response.json();
    const error = z.object({ error: z.object({ code: z.string() }) }).parse(payload);
    throw authFailure(response.status, error.error.code);
  }
  async register(input: Registration): Promise<void> { await this.mutate("sign-up/email", input); }
  async signIn(input: { username: string; password: string }): Promise<void> { await this.mutate("sign-in/username", input); }
  async signOut(): Promise<void> { await this.mutate("sign-out", {}); }
  async currentUser(): Promise<UserIdentity | null> {
    const session = await getAuth().api.getSession({ headers: await this.requestHeaders(), query: { disableCookieCache: true } });
    if (!session) return null;
    const { user } = session;
    return { id: user.id, username: user.username ?? "", email: user.email, firstName: user.firstName ?? "", lastName: user.lastName ?? "", emailVerified: user.emailVerified, createdAt: user.createdAt };
  }
  async requestPasswordReset(email: string): Promise<void> { await this.mutate("request-password-reset", { email }); }
  async resetPassword(input: { token: string; password: string }): Promise<void> { await this.mutate("reset-password", { token: input.token, newPassword: input.password }); }
}

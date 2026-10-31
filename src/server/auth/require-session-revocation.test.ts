import { describe, expect, it } from "vitest";
import { betterAuth } from "better-auth";
import { makeSignature } from "better-auth/crypto";
import { requireSessionRevocation } from "./require-session-revocation";

async function setup(failing = false) {
  const secret = "isolated-test-secret-for-revocation-123456789012345";
  const token = "synthetic-session-token";
  const sessions = new Set([token]);
  let attempts = 0;
  const auth = betterAuth({
    secret,
    baseURL: "http://localhost:3000",
    trustedOrigins: ["http://localhost:3000"],
    logger: { disabled: true },
    advanced: { disableOriginCheck: false, disableCSRFCheck: false },
    rateLimit: { enabled: false },
    hooks: { before: requireSessionRevocation },
  });
  const context = await auth.$context;
  context.internalAdapter.findSession = async () => null;
  context.internalAdapter.deleteSession = async value => {
    attempts++;
    if (failing) throw new Error("synthetic private database detail");
    sessions.delete(value);
  };
  const cookie = `${context.authCookies.sessionToken.name}=${encodeURIComponent(`${token}.${await makeSignature(token, secret)}`)}`;
  const signOut = (origin = "http://localhost:3000", withCookie = true) => auth.handler(new Request("http://localhost:3000/api/auth/sign-out", {
    method: "POST",
    headers: { "content-type": "application/json", Origin: origin, ...(withCookie ? { Cookie: cookie } : {}) },
    body: "{}",
  }));
  return { sessions, token, signOut, attempts: () => attempts };
}

describe("logout revocation prerequisite", () => {
  it("fails without clearing cookies when storage cannot revoke the session", async () => {
    const state = await setup(true);
    const response = await state.signOut();
    expect(response.status).toBe(503);
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(await response.text()).not.toContain("synthetic private database detail");
    expect(state.sessions.has(state.token)).toBe(true);
    expect(state.attempts()).toBe(1);
  });

  it("revokes before successful logout and allows repeated logout", async () => {
    const state = await setup();
    expect((await state.signOut()).status).toBe(200);
    expect(state.sessions.has(state.token)).toBe(false);
    expect((await state.signOut()).status).toBe(200);
  });

  it("rejects untrusted origin before touching session storage", async () => {
    const state = await setup();
    expect((await state.signOut("https://untrusted.example")).status).toBe(403);
    expect(state.attempts()).toBe(0);
    expect(state.sessions.has(state.token)).toBe(true);
  });

  it("does not access storage when no signed session cookie is present", async () => {
    const state = await setup(true);
    expect((await state.signOut("http://localhost:3000", false)).status).toBe(200);
    expect(state.attempts()).toBe(0);
  });
});

import { describe, expect, it } from "vitest";
import type { IdentityGateway } from "../ports/identity-gateway";
import { makeRegisterUser } from "./register-user";
import { makeSignIn } from "./sign-in";
import { makeSignOut } from "./sign-out";
import { makeRequestPasswordReset } from "./request-password-reset";
import { makeResetPassword } from "./reset-password";
import { makeGetCurrentUser } from "./get-current-user";

function setup() {
  const calls: string[] = [];
  const gateway: IdentityGateway = {
    async register(input) { calls.push(`register:${input.username}`); },
    async signIn(input) { calls.push(`login:${input.username}`); },
    async signOut() { calls.push("logout"); },
    async currentUser() { return null; },
    async requestPasswordReset() { calls.push("request-reset"); },
    async resetPassword() { calls.push("reset"); },
  };
  return { calls, gateway };
}

describe("users use cases", () => {
  it("returns no identity for an anonymous request", async () => {
    const { gateway } = setup();
    expect(await makeGetCurrentUser({ gateway })()).toBeNull();
  });
  it("resets a password through the gateway after validation", async () => {
    const { calls, gateway } = setup();
    await makeResetPassword({ gateway })({ token: "valid-token", password: "a long password 123" });
    expect(calls).toEqual(["reset"]);
  });
  it("registers normalized data", async () => {
    const { calls, gateway } = setup();
    await makeRegisterUser({ gateway })({ username: " Maria ", email: "maria@example.com", password: "a long password 123", firstName: "", lastName: "" });
    expect(calls).toEqual(["register:maria"]);
  });
  it("does not register an invalid profile", async () => {
    const { calls, gateway } = setup();
    await expect(makeRegisterUser({ gateway })({ username: "ab", email: "maria@example.com", password: "a long password 123", firstName: "", lastName: "" })).rejects.toThrow();
    expect(calls).toEqual([]);
  });
  it("normalizes login identity without applying new-password policy", async () => {
    const { calls, gateway } = setup();
    await makeSignIn({ gateway })({ username: " Maria ", password: "old password" });
    expect(calls).toEqual(["login:maria"]);
  });
  it("signs out and requests reset through the port", async () => {
    const { calls, gateway } = setup();
    await makeSignOut({ gateway })();
    await makeRequestPasswordReset({ gateway })("maria@example.com");
    expect(calls).toEqual(["logout", "request-reset"]);
  });
  it("rejects invalid reset data before calling the gateway", async () => {
    const { calls, gateway } = setup();
    await expect(makeResetPassword({ gateway })({ token: "", password: "a long password 123" })).rejects.toThrow();
    await expect(makeResetPassword({ gateway })({ token: "token", password: "short" })).rejects.toThrow();
    expect(calls).toEqual([]);
  });
  it("propagates infrastructure failures", async () => {
    const { gateway } = setup();
    gateway.signOut = async () => { throw new Error("storage unavailable"); };
    await expect(makeSignOut({ gateway })()).rejects.toThrow("storage unavailable");
  });
});

import { describe, expect, it } from "vitest";
import { parseAuthForm } from "./auth-schema";

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}
describe("auth form schema", () => {
  it("requires email format for registration", () => {
    expect(parseAuthForm("register", form({ username: "maria", email: "bad", password: "123456789012", confirmPassword: "123456789012" })).ok).toBe(false);
  });
  it("does not trim passwords", () => {
    const result = parseAuthForm("login", form({ username: "maria", password: "  secret  " }));
    expect(result.ok && result.data.password).toBe("  secret  ");
  });
  it("rejects mismatching password confirmation", () => {
    expect(parseAuthForm("reset-password", form({ token: "token", password: "123456789012", confirmPassword: "different" })).ok).toBe(false);
  });
  it("accepts optional name fields", () => {
    expect(parseAuthForm("register", form({ username: "maria", email: "maria@example.com", password: "123456789012", confirmPassword: "123456789012" })).ok).toBe(true);
  });
  it("requires login credentials and a reset token", () => {
    expect(parseAuthForm("login", form({})).ok).toBe(false);
    expect(parseAuthForm("reset-password", form({ password: "123456789012", confirmPassword: "123456789012" })).ok).toBe(false);
  });
  it("rejects file uploads in text fields", () => {
    const data = form({ password: "secret" });
    data.set("username", new Blob(["maria"]), "name.txt");
    expect(parseAuthForm("login", data).ok).toBe(false);
  });
});

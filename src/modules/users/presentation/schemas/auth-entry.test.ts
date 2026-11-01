import { describe, expect, it } from "vitest";
import { parseAuthEntry } from "./auth-entry";

describe("auth entry query", () => {
  it("defaults unknown or repeated modes to login", () => {
    expect(parseAuthEntry({}).mode).toBe("login");
    expect(parseAuthEntry({ form: "https://outside.example" }).mode).toBe("login");
    expect(parseAuthEntry({ form: ["register", "login"] }).mode).toBe("login");
  });
  it("accepts each supported form in the same users route", () => {
    for (const form of ["register", "forgot-password", "reset-password"]) expect(parseAuthEntry({ form }).mode).toBe(form);
  });
  it("rejects missing, repeated and oversized reset tokens", () => {
    for (const token of [undefined, ["one", "two"], "x".repeat(513)]) expect(parseAuthEntry({ form: "reset-password", token }).invalidLink).toBe(true);
    expect(parseAuthEntry({ form: "reset-password", token: "opaque-token" }).invalidLink).toBe(false);
    expect(parseAuthEntry({ form: "reset-password", token: "opaque-token", error: "expired" }).invalidLink).toBe(true);
  });
  it("parses only exact status flags without echoing query contents", () => {
    expect(parseAuthEntry({ verified: "1", reset: "1" })).toMatchObject({ verified: true, reset: true });
    expect(parseAuthEntry({ verified: ["1"], reset: "true" })).toMatchObject({ verified: false, reset: false });
  });
});

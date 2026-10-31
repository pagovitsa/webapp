import { describe, expect, it } from "vitest";
import { registrationData, validatePassword, UserError } from "./user";

const valid = { username: "Maria_1", email: "maria@example.com", password: "long passphrase 123", firstName: " Μαρία ", lastName: " Π. " };

describe("user registration", () => {
  it("normalizes identity and optional profile fields without changing the password", () => {
    expect(registrationData(valid)).toEqual({ ...valid, username: "maria_1", firstName: "Μαρία", lastName: "Π." });
  });
  it.each(["ab", "a".repeat(31), "bad user", "user@example.com"])("rejects invalid username %s", (username) => {
    expect(() => registrationData({ ...valid, username })).toThrow(UserError);
  });
  it.each(["a".repeat(101), "name\u0000"])("rejects invalid profile field", (firstName) => {
    expect(() => registrationData({ ...valid, firstName })).toThrow(UserError);
  });
  it("allows an empty profile", () => {
    expect(registrationData({ ...valid, firstName: "", lastName: "" }).firstName).toBe("");
  });
  it.each(["short", "a".repeat(129)])("rejects invalid password length", (password) => {
    expect(() => validatePassword(password)).toThrow(UserError);
  });
  it("preserves spaces in a valid password", () => {
    expect(validatePassword("  pass phrase 123  ")).toBe("  pass phrase 123  ");
  });
});

import { describe, expect, it } from "vitest";
import { permissionsFor, visibleNavigation } from "./access";
import { navigation } from "./navigation";

describe("dashboard access", () => {
  it("uses database permissions rather than assuming permissions from a role", () => {
    expect(permissionsFor({ role: "admin", enabled: true, permissions: [] }, true)).toEqual([]);
    expect(permissionsFor({ role: "admin", enabled: true, permissions: ["dashboard.read", "unknown"] }, true)).toEqual(["dashboard.read"]);
    expect(permissionsFor({ role: "user", enabled: true, permissions: ["dashboard.read", "administration.read"] }, true)).toEqual(["dashboard.read", "administration.read"]);
  });
  it("requires both activations even for admin and rejects unknown roles", () => {
    expect(permissionsFor({ role: "admin", enabled: false, permissions: ["dashboard.read"] }, true)).toEqual([]);
    expect(permissionsFor({ role: "admin", enabled: true, permissions: ["dashboard.read", "administration.read"] }, false)).toEqual([]);
    expect(permissionsFor(null, true)).toEqual([]);
    expect(permissionsFor({ role: "owner", enabled: true, permissions: ["dashboard.read"] }, true)).toEqual([]);
  });
  it("grants user only ordinary navigation and admin both categories without mutation", () => {
    const original = JSON.stringify(navigation);
    expect(visibleNavigation(navigation, ["dashboard.read"]).map(category => category.id)).toEqual(["category-a"]);
    expect(visibleNavigation(navigation, permissionsFor({ role: "admin", enabled: true, permissions: ["dashboard.read", "administration.read"] }, true)).map(category => category.id)).toEqual(["category-a", "category-b"]);
    expect(JSON.stringify(navigation)).toBe(original);
  });
  it("hides empty parents and checks child permissions independently", () => {
    const tree = [{ id: "mixed", title: "Mixed", icon: "folder" as const, permission: "dashboard.read" as const,
      children: [{ id: "one", title: "One", path: "mixed/one", permission: "administration.read" as const }] }];
    expect(visibleNavigation(tree, ["dashboard.read"])).toEqual([]);
    expect(visibleNavigation(tree, ["administration.read"])).toEqual([]);
  });
});

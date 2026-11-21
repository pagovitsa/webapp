import { describe, expect, it } from "vitest";
import { makeGetDashboard } from "./get-dashboard";
import type { DashboardAccessRepository, DashboardIdentityGateway } from "../ports/dashboard-access";

function fixture() {
  let identity: { id: string; username: string } | null = { id: "signed-in", username: "tester" };
  let access: { role: string; enabled: boolean; permissions: string[] } | null = { role: "user", enabled: true, permissions: ["dashboard.read"] };
  let readId = "";
  const repository: DashboardAccessRepository = { async findForUser(id) { readId = id; return access; } };
  const gateway: DashboardIdentityGateway = { async currentUser() { return identity; } };
  return { get: makeGetDashboard({ repository, gateway, enabled: true }),
    setIdentity(value: typeof identity) { identity = value; }, setAccess(value: typeof access) { access = value; },
    readId: () => readId };
}
describe("get dashboard", () => {
  it("reads only the current session identity", async () => {
    const f = fixture();
    expect((await f.get()).status).toBe("ready");
    expect(f.readId()).toBe("signed-in");
  });
  it("rejects anonymous users before storage", async () => {
    const f = fixture(); f.setIdentity(null);
    expect(await f.get()).toEqual({ status: "anonymous" });
    expect(f.readId()).toBe("");
  });
  it("rechecks activation on every read", async () => {
    const f = fixture();
    expect((await f.get()).status).toBe("ready");
    f.setAccess({ role: "admin", enabled: false, permissions: ["dashboard.read", "administration.read"] });
    expect(await f.get()).toEqual({ status: "forbidden" });
    f.setAccess(null);
    expect(await f.get()).toEqual({ status: "forbidden" });
  });
  it("rejects hidden and unknown direct paths without exposing navigation", async () => {
    const f = fixture();
    expect(await f.get("category-b/item-b1")).toEqual({ status: "not-found" });
    expect(await f.get("unknown")).toEqual({ status: "not-found" });
    f.setAccess({ role: "admin", enabled: true, permissions: ["dashboard.read", "administration.read"] });
    const result = await f.get("category-b/item-b1");
    expect(result.status === "ready" && result.dashboard.selected.title).toBe("Υποκατηγορία Β1");
  });
  it("propagates storage failures", async () => {
    const get = makeGetDashboard({ enabled: true,
      gateway: { async currentUser() { return { id: "x", username: "x" }; } },
      repository: { async findForUser() { throw new Error("offline"); } } });
    await expect(get()).rejects.toThrow("offline");
  });
});

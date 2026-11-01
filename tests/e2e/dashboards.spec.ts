import { randomUUID } from "node:crypto";
import { test, expect, type Page } from "@playwright/test";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../../.generated/prisma/client";
import { getDevelopmentSettings } from "../../tooling/dev-services.mjs";

const settings = getDevelopmentSettings();
const url = new URL(settings.testDatabaseUrl);
if (url.pathname !== "/webapp_test") throw new Error("Dashboard tests require the dedicated test database.");
const db = new PrismaClient({ adapter: new PrismaMariaDb({ host: url.hostname, port: Number(url.port), user: decodeURIComponent(url.username), password: decodeURIComponent(url.password), database: "webapp_test", timezone: "+00:00", connectionLimit: 2 }) });
const password = "A long dashboard test passphrase 123!";
const created: string[] = [];
test.afterEach(async () => {
  for (const id of created.splice(0)) await db.user.delete({ where: { id } });
});
test.afterAll(async () => { await db.$disconnect(); });

async function account(page: Page, baseURL: string | undefined, grant?: { role: "user" | "admin"; enabled: boolean }) {
  if (!baseURL) throw new Error("A test origin is required.");
  const unique = randomUUID().replaceAll("-", "").slice(0, 20);
  const username = `d_${unique}`;
  // A distinct documentation-range IP isolates auth limits from the users spec running in another worker.
  const forwardedIp = `2001:db8:${unique.slice(0, 4)}:${unique.slice(4, 8)}::1`;
  await page.context().setExtraHTTPHeaders({ "X-Forwarded-For": forwardedIp });
  const headers = { Origin: baseURL, "X-Forwarded-For": forwardedIp };
  const response = await page.request.post("/api/auth/sign-up/email", {
    headers,
    data: { username, email: `${unique}@example.test`, password, role: "admin", dashboardEnabled: true },
  });
  expect(response.status()).toBe(201);
  const user = await db.user.update({ where: { username }, data: { emailVerified: true } });
  created.push(user.id);
  expect(await db.dashboardAccess.findUnique({ where: { userId: user.id } })).toBeNull();
  if (grant) await db.dashboardAccess.create({ data: { userId: user.id, ...grant } });
  const login = await page.request.post("/api/auth/sign-in/username", {
    headers, data: { username, password },
  });
  expect(login.status()).toBe(200);
  // Better Auth normalizes IPv6 to /64 for both sessions and rate-limit keys.
  const session = await db.session.findFirstOrThrow({ where: { userId: user.id }, select: { ipAddress: true } });
  expect(session.ipAddress).toBe(`2001:0db8:${unique.slice(0, 4)}:${unique.slice(4, 8)}:0000:0000:0000:0000`);
  return user;
}

test("anonymous users cannot open the dashboard or its API", async ({ page }) => {
  expect((await page.request.get("/api/dashboards")).status()).toBe(401);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/users$/);
});

test("signup cannot grant access and account activation defaults to false", async ({ page, baseURL }) => {
  const user = await account(page, baseURL);
  expect((await page.request.get("/api/dashboards?role=admin&enabled=true")).status()).toBe(403);
  const grant = await db.dashboardAccess.create({ data: { userId: user.id } });
  expect(grant.role).toBe("user");
  expect(grant.enabled).toBe(false);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/users$/);
  await expect(page.getByRole("navigation", { name: "Πλοήγηση dashboard" })).toHaveCount(0);
  await db.dashboardAccess.update({ where: { userId: user.id }, data: { enabled: true } });
  await page.goto("/dashboard");
  await expect(page.getByRole("navigation", { name: "Πλοήγηση dashboard" })).toContainText("Κατηγορία Α");
});

test("user sees only permitted children and direct admin paths remain unavailable", async ({ page, baseURL }) => {
  await account(page, baseURL, { role: "user", enabled: true });
  await page.goto("/dashboard");
  const nav = page.getByRole("navigation", { name: "Πλοήγηση dashboard" });
  await expect(nav).not.toContainText("Κατηγορία Β");
  await nav.getByRole("link", { name: "Υποκατηγορία Α1" }).click();
  await expect(page.getByRole("main").getByRole("heading", { level: 1 })).toHaveText("Υποκατηγορία Α1");
  await expect(nav.getByRole("link", { name: "Υποκατηγορία Α1" })).toHaveAttribute("aria-current", "page");
  const denied = await page.request.get("/api/dashboards?section=category-b/item-b1");
  expect(denied.status()).toBe(404);
  expect((await page.goto("/dashboard/category-b/item-b1"))?.status()).toBe(404);
  expect((await page.request.get("/api/dashboards?section=unknown")).status()).toBe(404);
  const allowed = await page.request.get("/api/dashboards?userId=someone-else&role=admin");
  expect(allowed.status()).toBe(200);
  expect(allowed.headers()["cache-control"]).toBe("no-store");
  const serialized = await allowed.text();
  for (const hidden of ["category-b", "administration.read", '"token"', '"password"', '"userId"']) expect(serialized).not.toContain(hidden);
  expect((await page.request.post("/api/dashboards", { data: { role: "admin" } })).status()).toBe(405);
});

test("admin access is rechecked after downgrade, disable and grant deletion", async ({ page, baseURL }) => {
  const user = await account(page, baseURL, { role: "admin", enabled: true });
  await page.goto("/dashboard/category-b/item-b1");
  await expect(page.getByRole("main").getByRole("heading", { level: 1 })).toHaveText("Υποκατηγορία Β1");
  await db.dashboardAccess.update({ where: { userId: user.id }, data: { role: "user" } });
  expect((await page.request.get("/api/dashboards?section=category-b/item-b1")).status()).toBe(404);
  await page.reload();
  await expect(page.getByRole("navigation", { name: "Πλοήγηση dashboard" })).toHaveCount(0);
  await db.dashboardAccess.update({ where: { userId: user.id }, data: { role: "admin", enabled: false } });
  expect((await page.request.get("/api/dashboards")).status()).toBe(403);
  await db.dashboardAccess.delete({ where: { userId: user.id } });
  expect((await page.request.get("/api/dashboards")).status()).toBe(403);
});

test("database category permissions take effect without a new login", async ({ page, baseURL }) => {
  await account(page, baseURL, { role: "admin", enabled: true });
  const original = await db.dashboardRolePermission.findMany({ where: { role: "admin" } });
  try {
    await page.goto("/dashboard/category-b/item-b1");
    await expect(page.getByRole("main").getByRole("heading", { level: 1 })).toHaveText("Υποκατηγορία Β1");
    await db.dashboardRolePermission.delete({ where: { role_permission: { role: "admin", permission: "administration.read" } } });
    const response = await page.request.get("/api/dashboards");
    expect(response.status()).toBe(200);
    expect(await response.text()).not.toContain("category-b");
    expect((await page.request.get("/api/dashboards?section=category-b/item-b1")).status()).toBe(404);
    await page.goto("/dashboard");
    await expect(page.getByRole("navigation", { name: "Πλοήγηση dashboard" })).not.toContainText("Κατηγορία Β");
    await db.dashboardRolePermission.deleteMany({ where: { role: "admin" } });
    expect((await page.request.get("/api/dashboards")).status()).toBe(403);
  } finally {
    await db.dashboardRolePermission.deleteMany({ where: { role: "admin" } });
    await db.dashboardRolePermission.createMany({ data: original });
  }
});

test("entry, login and direct dashboard URLs follow the same persistent session", async ({ page, baseURL }) => {
  const user = await account(page, baseURL, { role: "user", enabled: true });
  await page.goto("/");
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/login");
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/users?form=reset-password&error=expired");
  await page.getByRole("button", { name: "Ζήτησε νέο σύνδεσμο ανάκτησης" }).click();
  await expect(page).toHaveURL(/\/users$/);
  await expect(page.getByRole("main").getByRole("heading", { level: 1 })).toHaveText("Ανάκτηση κωδικού");
  await page.getByRole("button", { name: "Σύνδεση", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/dashboard/category-a/item-a1");
  await expect(page).toHaveURL(/\/dashboard\/category-a\/item-a1$/);
  await expect(page.getByRole("main").getByRole("heading", { level: 1 })).toHaveText("Υποκατηγορία Α1");
  const before = (await page.context().cookies()).find(cookie => cookie.name.endsWith(".session_token"));
  expect(before).toBeDefined();
  await page.reload();
  expect((await page.context().cookies()).find(cookie => cookie.name.endsWith(".session_token"))?.value).toBe(before?.value);
  await page.request.post("/api/auth/sign-out", { headers: { Origin: baseURL ?? "" }, data: {} });
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/users$/);
  await page.getByLabel("Όνομα χρήστη", { exact: true }).fill(user.username ?? "");
  await page.getByLabel("Κωδικός", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Σύνδεση", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await db.dashboardAccess.update({ where: { userId: user.id }, data: { enabled: false } });
  for (const route of ["/", "/login", "/dashboard"]) {
    await page.goto(route);
    await expect(page).toHaveURL(/\/users$/);
  }
});

test("the sidebar account button logs out and revokes the session", async ({ page, baseURL, playwright }) => {
  const user = await account(page, baseURL, { role: "admin", enabled: true });
  await page.goto("/dashboards");
  await expect(page).toHaveURL(/\/dashboard$/);
  const cookie = (await page.context().cookies()).find(value => value.name.endsWith(".session_token"));
  if (!cookie) throw new Error("Expected an authenticated session.");
  const replay = await playwright.request.newContext({ baseURL, extraHTTPHeaders: { Cookie: `${cookie.name}=${cookie.value}` } });
  try {
    expect((await replay.get("/api/dashboards")).status()).toBe(200);
    await page.getByRole("complementary").getByRole("button", { name: `Αποσύνδεση: ${user.username}`, exact: true }).click();
    await expect(page).toHaveURL(/\/users$/);
    await expect(page.getByRole("main").getByRole("heading", { level: 1 })).toHaveText("Σύνδεση");
    expect((await replay.get("/api/dashboards")).status()).toBe(401);
    expect((await replay.get("/api/users/me")).status()).toBe(401);
  } finally { await replay.dispose(); }
});

test("sidebar fits mobile and keeps the login palette regardless of system theme", async ({ page, baseURL }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/users");
  const loginForeground = await page.getByRole("heading", { level: 1 }).evaluate(element => getComputedStyle(element).color);
  await account(page, baseURL, { role: "admin", enabled: true });
  await page.goto("/dashboard");
  const palette = () => page.getByRole("main").evaluate(element => ({
    text: getComputedStyle(element).color,
    canvas: getComputedStyle(element.parentElement ?? element).backgroundColor,
    sidebar: getComputedStyle(document.querySelector("aside") ?? element).backgroundColor,
  }));
  const expectedPalette = await palette();
  expect(expectedPalette.text).toBe(loginForeground);
  const nav = page.getByRole("navigation", { name: "Πλοήγηση dashboard" });
  const summary = nav.locator("summary").filter({ hasText: "Κατηγορία Α" });
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(nav.getByRole("link", { name: "Υποκατηγορία Α1" })).not.toBeVisible();
  await page.keyboard.press("Enter");
  await expect(nav.getByRole("link", { name: "Υποκατηγορία Α1" })).toBeVisible();
  await expect(page.locator(".site-header")).toHaveCount(0);
  for (const colorScheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme });
    expect(await palette()).toEqual(expectedPalette);
    for (const width of [320, 375, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const main = await page.getByRole("main").boundingBox();
      expect(main?.y).toBe(0);
      expect(main?.height).toBe(900);
      expect(main?.x).toBe(width > 700 ? 232 : 0);
      expect(main?.width).toBe(width > 700 ? width - 232 : width);
      if (width <= 700) await page.getByRole("button", { name: "Μενού", exact: true }).click();
      await expect(nav.getByRole("link", { name: "Υποκατηγορία Β1" })).toBeVisible();
      if (width <= 700) {
        await page.keyboard.press("Escape");
        await expect(page.getByRole("dialog")).toHaveCount(0);
        await expect(page.getByRole("button", { name: "Μενού", exact: true })).toBeFocused();
      }
    }
  }
  await page.emulateMedia({ colorScheme: "light" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("heading", { level: 1 }).click();
  await page.screenshot({ path: ".data/dashboard-admin.png", fullPage: true });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.getByRole("button", { name: "Μενού", exact: true }).click();
  await page.screenshot({ path: ".data/dashboard-mobile.png", fullPage: true });
  await page.getByRole("dialog").getByRole("link", { name: "Υποκατηγορία Α2" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("main").getByRole("heading", { level: 1 })).toHaveText("Υποκατηγορία Α2");
  await page.getByRole("button", { name: "Μενού", exact: true }).click();
  const footer = await page.getByRole("dialog").getByRole("button", { name: /Αποσύνδεση/ }).boundingBox();
  expect(footer && footer.y + footer.height).toBeCloseTo(792, 0);
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.locator("dialog")).not.toHaveAttribute("open");
  await nav.getByRole("link", { name: "Υποκατηγορία Β1" }).click();
  await expect(page.getByRole("main").getByRole("heading", { level: 1 })).toHaveText("Υποκατηγορία Β1");
});

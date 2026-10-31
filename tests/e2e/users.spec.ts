import { randomUUID } from "node:crypto";
import { test, expect, type APIRequestContext, type Page } from "@playwright/test";
import { z } from "zod";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../../.generated/prisma/client";
import { getDevelopmentSettings } from "../../tooling/dev-services.mjs";

const settings = getDevelopmentSettings();
const url = new URL(settings.testDatabaseUrl);
if (url.pathname !== "/webapp_test") throw new Error("Users tests require the dedicated test database.");
const db = new PrismaClient({ adapter: new PrismaMariaDb({ host: url.hostname, port: Number(url.port), user: decodeURIComponent(url.username), password: decodeURIComponent(url.password), database: "webapp_test", timezone: "+00:00", connectionLimit: 2 }) });
const password = "A long test passphrase 123!";
const newPassword = "A different passphrase 456!";
const identity = () => { const id = randomUUID().replaceAll("-", "").slice(0, 20); return { username: `u_${id}`, email: `${id}@example.test`, password, firstName: "Μαρία", lastName: "Δοκιμή" }; };
test.afterAll(async () => { await db.$disconnect(); });
// All requests originate from loopback; isolate limiter state in this dedicated test schema.
test.beforeEach(async () => { await db.rateLimit.deleteMany(); });

async function mailLink(request: APIRequestContext, email: string, subject: string): Promise<string> {
  let id = "";
  await expect.poll(async () => {
    const response = await request.get(`${settings.mailpitUrl}/api/v1/search`, { params: { query: `to:${email}` } });
    const payload: unknown = await response.json();
    const data = z.object({ messages: z.array(z.object({ ID: z.string(), Subject: z.string() })) }).parse(payload);
    id = data.messages.find(message => message.Subject.includes(subject))?.ID ?? "";
    return Boolean(id);
  }, { timeout: 10_000 }).toBe(true);
  const response = await request.get(`${settings.mailpitUrl}/api/v1/message/${id}`);
  const payload: unknown = await response.json();
  const { Text } = z.object({ Text: z.string() }).parse(payload);
  const link = Text.match(/https?:\/\/[^\s]+/)?.[0];
  if (!link) throw new Error("No action link in captured email.");
  return link;
}

async function register(page: Page, user: ReturnType<typeof identity>) {
  await page.goto("/users/register");
  await page.getByLabel("Όνομα χρήστη", { exact: true }).fill(user.username);
  await page.getByLabel("Email", { exact: true }).fill(user.email);
  await page.getByLabel("Όνομα", { exact: true }).fill(user.firstName);
  await page.getByLabel("Επώνυμο", { exact: true }).fill(user.lastName);
  await page.getByLabel("Κωδικός", { exact: true }).fill(user.password);
  await page.getByLabel("Επιβεβαίωση κωδικού", { exact: true }).fill(user.password);
  await page.getByRole("button", { name: "Δημιουργία λογαριασμού", exact: true }).click();
  await expect(page.getByRole("main").getByRole("status")).toContainText("Η εγγραφή ολοκληρώθηκε");
}
async function login(page: Page, username: string, pass = password) {
  await page.goto("/users/login");
  await page.getByLabel("Όνομα χρήστη", { exact: true }).fill(username);
  await page.getByLabel("Κωδικός", { exact: true }).fill(pass);
  await page.getByRole("button", { name: "Σύνδεση", exact: true }).click();
}
async function verifiedUser(page: Page, request: APIRequestContext) {
  const user = identity();
  await register(page, user);
  await page.goto(await mailLink(request, user.email, "Επιβεβαίωση"));
  await expect(page).toHaveURL(/\/users\/login\?verified=1$/);
  return user;
}

test("anonymous users cannot read a profile", async ({ page }) => {
  await page.goto("/users");
  await expect(page).toHaveURL(/\/users\/login$/);
  expect((await page.request.get("/api/users/me")).status()).toBe(401);
});

test("home leads to the users flows and the old demo route is absent", async ({ page, request }) => {
  await page.goto("/");
  const main = page.getByRole("main");
  await expect(main.getByRole("heading", { level: 1 })).toHaveText("Ο λογαριασμός σου. Ο χώρος σου.");
  await page.setViewportSize({ width: 320, height: 812 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.getByRole("link", { name: "Παραγγελίες", exact: true })).toHaveCount(0);
  await main.getByRole("link", { name: "Σύνδεση", exact: true }).click();
  await expect(page).toHaveURL(/\/users\/login$/);
  await page.goto("/");
  await page.getByRole("main").getByRole("link", { name: "Δημιουργία λογαριασμού", exact: true }).click();
  await expect(page).toHaveURL(/\/users\/register$/);
  expect((await request.get("/orders")).status()).toBe(404);
});

test("registration schema and domain failures are accessible", async ({ page }) => {
  await page.goto("/users/register");
  await page.getByRole("button", { name: "Δημιουργία λογαριασμού" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toHaveCount(3);
  const user = identity();
  await page.getByLabel("Όνομα χρήστη", { exact: true }).fill("ab");
  await page.getByLabel("Email", { exact: true }).fill(user.email);
  await page.getByLabel("Κωδικός", { exact: true }).fill(password);
  await page.getByLabel("Επιβεβαίωση κωδικού", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Δημιουργία λογαριασμού" }).click();
  await expect(page.getByRole("main").getByRole("alert").filter({ hasText: "3–30" })).toBeVisible();
});

test("verification, persisted profile and logout revoke the session", async ({ page, request, playwright, baseURL }) => {
  const user = identity();
  await register(page, user);
  await login(page, user.username);
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Επιβεβαίωσε πρώτα");
  await expect.poll(async () => {
    const response = await request.get(`${settings.mailpitUrl}/api/v1/search`, { params: { query: `to:${user.email}` } });
    const data: unknown = await response.json();
    return z.object({ messages: z.array(z.object({ ID: z.string() })) }).parse(data).messages.length;
  }).toBe(2);
  await page.goto(await mailLink(request, user.email, "Επιβεβαίωση"));
  await login(page, user.username.toUpperCase());
  await expect(page).toHaveURL(/\/users$/);
  await expect(page.getByRole("main")).toContainText(user.firstName);
  const record = await db.user.findUniqueOrThrow({ where: { username: user.username } });
  const account = await db.account.findFirstOrThrow({ where: { userId: record.id } });
  expect(account.password).not.toBe(password);
  expect(account.password?.length).toBeGreaterThan(50);
  const profile = await page.request.get("/api/users/me");
  expect(profile.status()).toBe(200);
  const data: unknown = await profile.json();
  const serialized = JSON.stringify(data);
  expect(serialized).not.toContain('"token"');
  expect(serialized).not.toContain('"password"');
  const cookie = (await page.context().cookies()).find(item => item.name.endsWith(".session_token"));
  if (!cookie) throw new Error("No session cookie after login.");
  expect(cookie.httpOnly).toBe(true);
  expect(cookie.sameSite).toBe("Lax");
  const replay = await playwright.request.newContext({ baseURL, extraHTTPHeaders: { Cookie: `${cookie.name}=${cookie.value}` } });
  try {
    expect((await replay.get("/api/users/me")).status()).toBe(200);
    await page.getByRole("button", { name: "Αποσύνδεση" }).click();
    await expect(page).toHaveURL(/\/users\/login$/);
    expect((await replay.get("/api/users/me")).status()).toBe(401);
  } finally { await replay.dispose(); }
});

test("password reset is single-use and revokes existing sessions", async ({ page, request, browser, baseURL }) => {
  const user = await verifiedUser(page, request);
  await login(page, user.username);
  await expect(page).toHaveURL(/\/users$/);
  const previousContext = await browser.newContext({ baseURL, storageState: await page.context().storageState() });
  try {
    await page.goto("/users/forgot-password");
    await page.getByLabel("Email", { exact: true }).fill(user.email);
    await page.getByRole("button", { name: "Αποστολή οδηγιών" }).click();
    await expect(page.getByRole("main").getByRole("status")).toContainText("Αν υπάρχει λογαριασμός");
    await page.goto(await mailLink(request, user.email, "Ανάκτηση"));
    const token = new URL(page.url()).searchParams.get("token");
    if (!token) throw new Error("No reset token in callback.");
    await page.getByLabel("Νέος κωδικός", { exact: true }).fill(newPassword);
    await page.getByLabel("Επιβεβαίωση κωδικού", { exact: true }).fill(newPassword);
    await page.getByRole("button", { name: "Αλλαγή κωδικού" }).click();
    await expect(page).toHaveURL(/\/users\/login\?reset=1$/);
    expect((await previousContext.request.get("/api/users/me")).status()).toBe(401);
    const reuse = await request.post("/api/auth/reset-password", { headers: { Origin: baseURL ?? "" }, data: { token, newPassword: password } });
    expect(reuse.status()).toBeGreaterThanOrEqual(400);
    await login(page, user.username, newPassword);
    await expect(page).toHaveURL(/\/users$/);
  } finally { await previousContext.close(); }
});

test("expired sessions and reset tokens are rejected", async ({ page, request, baseURL }) => {
  const user = await verifiedUser(page, request);
  await login(page, user.username);
  await expect(page).toHaveURL(/\/users$/);
  const record = await db.user.findUniqueOrThrow({ where: { username: user.username } });
  await db.session.updateMany({ where: { userId: record.id }, data: { expiresAt: new Date(0) } });
  expect((await page.request.get("/api/users/me")).status()).toBe(401);
  const requested = await request.post("/api/auth/request-password-reset", { headers: { Origin: baseURL ?? "" }, data: { email: user.email } });
  expect(requested.ok()).toBe(true);
  const link = await mailLink(request, user.email, "Ανάκτηση");
  const callback = await request.get(link, { maxRedirects: 0 });
  const location = callback.headers().location;
  if (!location) throw new Error("No reset callback redirect.");
  const token = new URL(location, baseURL).searchParams.get("token");
  if (!token) throw new Error("No reset token.");
  await db.verification.updateMany({ where: { identifier: `reset-password:${token}` }, data: { expiresAt: new Date(0) } });
  const reset = await request.post("/api/auth/reset-password", { headers: { Origin: baseURL ?? "" }, data: { token, newPassword } });
  expect(reset.status()).toBeGreaterThanOrEqual(400);
});

test("JSON API supports login, safe identity and logout", async ({ request, baseURL }) => {
  const user = identity();
  const headers = { Origin: baseURL ?? "" };
  const signup = await request.post("/api/auth/sign-up/email", { headers, data: user });
  expect(signup.status()).toBe(201);
  const verification = await request.get(await mailLink(request, user.email, "Επιβεβαίωση"));
  expect(verification.ok()).toBe(true);
  const signin = await request.post("/api/auth/sign-in/username", { headers, data: { username: user.username, password } });
  expect(signin.ok()).toBe(true);
  expect(await signin.json()).toEqual({ success: true });
  const me = await request.get("/api/users/me");
  expect(me.status()).toBe(200);
  expect(await me.json()).toMatchObject({ user: { username: user.username, email: user.email } });
  expect((await request.get("/api/auth/get-session")).status()).toBe(404);
  expect((await request.post("/api/auth/sign-out", { headers, data: {} })).ok()).toBe(true);
  expect((await request.get("/api/users/me")).status()).toBe(401);
});

test("API validates input, rejects cross-origin mutations and hides reset account existence", async ({ request, baseURL }) => {
  const user = identity();
  const headers = { Origin: baseURL ?? "" };
  expect((await request.post("/api/auth/sign-up/email", { headers, data: { ...user, username: "ab" } })).status()).toBe(400);
  expect((await request.post("/api/auth/sign-up/email", { headers: { Origin: "https://untrusted.example" }, data: user })).status()).toBe(403);
  const unknown = await request.post("/api/auth/request-password-reset", { headers, data: { email: user.email } });
  expect(await unknown.json()).toEqual({ success: true });
  const invalid = await request.post("/api/auth/reset-password", { headers, data: { token: "invalid-token", newPassword } });
  expect(invalid.status()).toBeGreaterThanOrEqual(400);
  expect((await request.post("/api/auth/sign-in/username", { headers: { Origin: baseURL ?? "", "content-type": "application/json" }, data: "not-json" })).status()).toBe(400);
  expect((await request.post("/api/auth/sign-in/username", { headers, form: { username: user.username, password } })).status()).toBe(415);
  expect((await request.post("/api/auth/sign-in/username", { headers, data: { username: "x".repeat(20_000), password } })).status()).toBe(400);
});

test("API login attempts are rate limited", async ({ request, baseURL }) => {
  await db.rateLimit.deleteMany();
  try {
    for (let attempt = 0; attempt < 10; attempt++) {
      const response = await request.post("/api/auth/sign-in/username", { headers: { Origin: baseURL ?? "" }, data: { username: "nonexistent_test_user", password } });
      expect(response.status()).toBe(401);
    }
    const limited = await request.post("/api/auth/sign-in/username", { headers: { Origin: baseURL ?? "" }, data: { username: "nonexistent_test_user", password } });
    expect(limited.status()).toBe(429);
    expect(Number(limited.headers()["retry-after"])).toBeGreaterThan(0);
  } finally { await db.rateLimit.deleteMany(); }
});

for (const appearance of ["nucleus", "smart-save", "midnight"]) {
  test(`${appearance} previews include all four forms and fit a mobile screen`, async ({ page }) => {
    await page.goto(`/users/previews/${appearance}`);
    await expect(page.getByRole("heading", { name: `Προεπισκόπηση: ${appearance}`, exact: true })).toBeVisible();
    for (const name of ["Σύνδεση", "Δημιουργία λογαριασμού", "Ανάκτηση κωδικού", "Νέος κωδικός"]) {
      const screen = page.getByRole("region", { name: `Φόρμα: ${name}`, exact: true });
      await expect(screen.getByRole("button")).toBeDisabled();
      await expect(screen.getByLabel(name === "Ανάκτηση κωδικού" ? "Email" : name === "Νέος κωδικός" ? "Νέος κωδικός" : "Όνομα χρήστη", { exact: true })).toBeVisible();
    }
    for (const colorScheme of ["light", "dark"] as const) {
      await page.emulateMedia({ colorScheme });
      await page.setViewportSize({ width: 375, height: 812 });
      for (const name of ["Σύνδεση", "Δημιουργία λογαριασμού", "Ανάκτηση κωδικού", "Νέος κωδικός"]) {
        const screen = page.getByRole("region", { name: `Φόρμα: ${name}`, exact: true });
        const bounds = await screen.boundingBox();
        expect(bounds && bounds.x >= 0 && bounds.x + bounds.width <= 375).toBe(true);
        const inputBounds = await screen.getByRole("textbox").first().boundingBox();
        expect(inputBounds && inputBounds.x >= 0 && inputBounds.x + inputBounds.width <= 375).toBe(true);
        const contrasts = await screen.evaluate(element => {
          const surface = element.querySelector("form")?.parentElement?.parentElement;
          if (!surface) throw new Error("No form surface.");
          const canvas = document.createElement("canvas");
          canvas.width = canvas.height = 1;
          const context = canvas.getContext("2d");
          if (!context) throw new Error("No color context.");
          const luminance = (color: string) => {
            context.clearRect(0, 0, 1, 1);
            context.fillStyle = color;
            context.fillRect(0, 0, 1, 1);
            const rgb = [...context.getImageData(0, 0, 1, 1).data].slice(0, 3).map(value => {
              const channel = value / 255;
              return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
            });
            return (rgb[0] ?? 0) * 0.2126 + (rgb[1] ?? 0) * 0.7152 + (rgb[2] ?? 0) * 0.0722;
          };
          const surfaceBackground = getComputedStyle(element).backgroundColor;
          return ["ui-field__hint", "ui-field__error", "form-message form-message--error"].map(className => {
            const probe = document.createElement("p");
            probe.className = className;
            probe.textContent = "Έλεγχος αναγνωσιμότητας";
            surface.append(probe);
            const computed = getComputedStyle(probe);
            const foreground = luminance(computed.color);
            const background = luminance(computed.backgroundColor === "rgba(0, 0, 0, 0)" ? surfaceBackground : computed.backgroundColor);
            probe.remove();
            return (Math.max(background, foreground) + 0.05) / (Math.min(background, foreground) + 0.05);
          });
        });
        for (const contrast of contrasts) expect(contrast).toBeGreaterThanOrEqual(4.5);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  });
}

test("appearance selection stays in code and unknown previews return 404", async ({ page, request }) => {
  expect((await request.get("/users/previews/not-a-design")).status()).toBe(404);
  await page.goto("/users/login");
  const screen = page.getByRole("region", { name: "Φόρμα: Σύνδεση", exact: true });
  await expect(screen.getByRole("navigation", { name: "Επιλογή λογαριασμού" })).toBeVisible();
  const background = await screen.evaluate(element => getComputedStyle(element).backgroundColor);
  await page.goto("/users/login?appearance=midnight");
  await expect(screen).toHaveCSS("background-color", background);
  await expect(page.getByRole("navigation", { name: "Προεπισκοπήσεις εμφάνισης" })).toHaveCount(0);
});

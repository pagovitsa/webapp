import { existsSync } from "node:fs";
import { expect, test } from "@playwright/test";

test("the core home works independently of optional modules", async ({ page, request }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Webapp" })).toBeVisible();
  if (!existsSync("src/app/users")) {
    expect((await request.get("/users")).status()).toBe(404);
    expect((await request.get("/api/users/me")).status()).toBe(404);
  }
  if (!existsSync("src/app/dashboard")) {
    expect((await request.get("/dashboard")).status()).toBe(404);
  }
});

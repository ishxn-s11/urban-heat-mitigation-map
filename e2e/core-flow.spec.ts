import { test, expect } from "@playwright/test";

test("core flow: landing → explore → workspace heat map", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(/A MODEL/)).toBeVisible();

  await page.getByRole("link", { name: /EXPLORE EARTH/ }).first().click();
  await expect(page.getByText(/SEARCH THE/)).toBeVisible();

  // Open the seeded demo AOI
  await page.getByText("OPEN DEMO AOI →").click();
  await expect(page.getByText(/HEAT MAP/)).toBeVisible({ timeout: 20_000 });

  // Layer control present
  await expect(page.getByRole("tab", { name: "LST" })).toBeVisible();
});

test("404 route renders custom page", async ({ page }) => {
  await page.goto("/definitely-not-a-route");
  await expect(page.getByText(/SIGNAL/)).toBeVisible();
  await expect(page.getByText(/LOST/)).toBeVisible();
});

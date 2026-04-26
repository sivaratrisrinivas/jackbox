import { expect, test } from "@playwright/test";

test("founder can generate a seeded preview and see export availability", async ({
  page,
}) => {
  await page.goto("/");

  await page.getByLabel("Company URL").fill("https://acme.example.com");
  await page
    .getByLabel("Buyer pain point")
    .fill(
      "Support teams cannot answer product questions from the latest docs fast enough.",
    );
  await page.getByRole("button", { name: "Generate routed preview" }).click();

  await expect(page.getByText("Validated", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Citation-backed answers from the prospect's own docs"),
  ).toBeVisible();
  await expect(page.getByText("Docs intelligence").first()).toBeVisible();
  await expect(page.getByText("Fixture preview")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Download ZIP" }),
  ).toBeVisible();
});

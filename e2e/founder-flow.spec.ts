import { expect, test } from "@playwright/test";

test("founder can generate a seeded preview and export the demo room", async ({
  page,
}) => {
  await page.goto("/");

  await page.getByLabel("URL").fill("https://acme.example.com");
  await page
    .getByLabel("Pain")
    .fill(
      "Support teams cannot answer product questions from the latest docs fast enough.",
    );
  await page.getByRole("button", { name: "Generate demo room" }).click();

  await expect(page.getByLabel("Company URL")).toBeHidden({ timeout: 45_000 });
  await expect(
    page.getByRole("heading", { name: /Acme Cloud demo room is ready/i }),
  ).toBeVisible({ timeout: 45_000 });
  await expect(
    page.getByText("Citation-backed answers from the prospect's own docs"),
  ).toBeVisible();
  await expect(page.getByText(/Docs Intelligence/i).first()).toBeVisible();
  await expect(page.getByText("Saved sources")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Download demo package" }),
  ).toBeVisible();
});

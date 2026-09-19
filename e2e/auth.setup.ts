import { expect, test as setup } from "@playwright/test";
import { campo } from "./helpers";

setup("iniciar sesión como admin", async ({ page }) => {
  await page.goto("/login");
  await campo(page, "USUARIO").fill(process.env.ADMIN_USER || "admin");
  await campo(page, "CONTRASEÑA").fill(process.env.ADMIN_PASSWORD || "");
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByText("SALDO A COBRAR")).toBeVisible();
  await page.context().storageState({ path: "e2e/.auth/admin.json" });
});

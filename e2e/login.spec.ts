import { expect, test } from "@playwright/test";
import { campo } from "./helpers";

test.describe("Login", () => {
  test("sin sesión redirige al login", async ({ page }) => {
    await page.goto("/ventas");
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText("Iniciar sesión")).toBeVisible();
  });

  test("la API rechaza pedidos sin sesión", async ({ request }) => {
    const r = await request.get("/api/dashboard");
    expect(r.status()).toBe(401);
  });

  test("campos vacíos muestran aviso", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Ingresar" }).click();
    await expect(page.getByText("Ingresá usuario y contraseña.")).toBeVisible();
  });

  test("credenciales incorrectas muestran error", async ({ page }) => {
    await page.goto("/login");
    await campo(page, "USUARIO").fill("admin");
    await campo(page, "CONTRASEÑA").fill("clave-incorrecta");
    await page.getByRole("button", { name: "Ingresar" }).click();
    await expect(
      page.getByText("Usuario o contraseña incorrectos."),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("ingresar y salir", async ({ page }) => {
    await page.goto("/login");
    await campo(page, "USUARIO").fill(process.env.ADMIN_USER || "admin");
    await campo(page, "CONTRASEÑA").fill(process.env.ADMIN_PASSWORD || "");
    await page.getByRole("button", { name: "Ingresar" }).click();
    await expect(page).toHaveURL("/");
    await expect(page.getByText("SALDO A COBRAR")).toBeVisible();

    await page.getByRole("button", { name: "Salir" }).click();
    await expect(page).toHaveURL(/\/login$/);
    await page.goto("/");
    await expect(page).toHaveURL(/\/login$/);
  });
});

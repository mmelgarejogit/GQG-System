import { expect, test } from "@playwright/test";
import { campo, confirmar, fila, unico } from "./helpers";

test.describe("Clientes", () => {
  test("alta, búsqueda, edición, baja y reactivación", async ({ page }) => {
    const nombre = unico("E2E Cliente");
    await page.goto("/clientes");

    await page.getByRole("button", { name: "Nuevo cliente" }).click();
    await page.getByRole("button", { name: "Crear cliente" }).click();
    await expect(page.getByText("El nombre es obligatorio.")).toBeVisible();

    await campo(page, "NOMBRES").fill(nombre);
    await campo(page, "APELLIDOS").fill("Prueba");
    await campo(page, "CI / RUC").fill("9988776");
    await campo(page, "TELÉFONO").fill("0981 000 111");
    await campo(page, "DIRECCIÓN").fill("Asunción");
    await campo(page, "EMAIL").fill("e2e@example.com");
    await page.getByRole("button", { name: "Crear cliente" }).click();

    const row = fila(page, nombre);
    await expect(row).toHaveCount(1);
    await expect(row).toContainText("9988776");
    await expect(row).toContainText("Activo");

    await page.getByPlaceholder("Buscar cliente o CI/RUC").fill("9988776");
    await expect(page.getByRole("row")).toHaveCount(2);
    await page
      .getByPlaceholder("Buscar cliente o CI/RUC")
      .fill("zzz-no-existe");
    await expect(page.getByText("Ningún cliente coincide")).toBeVisible();
    await page.getByPlaceholder("Buscar cliente o CI/RUC").fill("");

    await row.getByRole("button", { name: "Editar" }).click();
    await expect(page.getByText("EDITAR CLIENTE")).toBeVisible();
    await campo(page, "TELÉFONO").fill("0971 222 333");
    await page.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(row).toContainText("0971 222 333");

    await row.getByRole("button", { name: "Desactivar" }).click();
    await confirmar(page, "Desactivar");
    await expect(row).toContainText("Inactivo");

    await row.getByRole("button", { name: "Reactivar" }).click();
    await confirmar(page, "Reactivar");
    await expect(row).toContainText("Activo");
  });
});

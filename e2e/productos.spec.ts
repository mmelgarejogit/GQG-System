import { expect, test } from "@playwright/test";
import { campo, confirmar, fila, unico } from "./helpers";

test.describe("Productos", () => {
  test("alta, código duplicado, edición, baja y filtro", async ({ page }) => {
    const nombre = unico("E2E Producto");
    const codigo = `E2E${Date.now()}`;
    await page.goto("/productos");

    await page.getByRole("button", { name: "Nuevo producto" }).click();
    await campo(page, "NOMBRE").fill(nombre);
    await campo(page, "CÓDIGO DE BARRA").fill(codigo);
    await campo(page, "PRECIO (Gs)").fill("12500");
    await expect(campo(page, "PRECIO (Gs)")).toHaveValue("12.500");
    await campo(page, "IVA").selectOption("5");
    await page.getByRole("button", { name: "Crear producto" }).click();

    const row = fila(page, codigo);
    await expect(row).toContainText(nombre);
    await expect(row).toContainText("5%");
    await expect(row).toContainText("12.500");

    await page.getByRole("button", { name: "Nuevo producto" }).click();
    await campo(page, "NOMBRE").fill("Duplicado");
    await campo(page, "CÓDIGO DE BARRA").fill(codigo);
    await page.getByRole("button", { name: "Crear producto" }).click();
    await expect(page.getByText("Ese codigo de barra ya existe")).toBeVisible();
    await page.getByRole("button", { name: "Descartar" }).click();

    await row.getByRole("button", { name: "Editar" }).click();
    await expect(campo(page, "CÓDIGO DE BARRA (NO EDITABLE)")).toBeDisabled();
    await campo(page, "PRECIO (Gs)").fill("13000");
    await page.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(row).toContainText("13.000");

    await row.getByRole("button", { name: "Dar de baja" }).click();
    await confirmar(page, "Dar de baja");
    await expect(row).toHaveCount(0);

    await page.getByRole("combobox").first().selectOption("inactivos");
    await expect(row).toContainText("Baja");
    await row.getByRole("button", { name: "Reactivar" }).click();
    await confirmar(page, "Reactivar");
    await expect(row).toHaveCount(0);

    await page.getByRole("combobox").first().selectOption("activos");
    await expect(row).toContainText("Activo");
  });
});

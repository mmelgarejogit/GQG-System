import { expect, test } from "@playwright/test";
import { campo } from "./helpers";

test.describe("Empresa y timbrado", () => {
  test("valida el timbrado, avisa vencimiento y bloquea la venta", async ({
    page,
  }) => {
    await page.goto("/empresa");
    const timbrado = campo(page, "TIMBRADO");
    const vence = campo(page, "VENCIMIENTO TIMBRADO");
    await expect(timbrado).not.toHaveValue("");
    const originalTimbrado = await timbrado.inputValue();
    const originalVence = await vence.inputValue();

    await timbrado.fill("123");
    await page.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(
      page.getByText("El timbrado debe tener 8 dígitos."),
    ).toBeVisible();

    await timbrado.fill("16002547");
    await vence.fill("2020-01-31");
    await expect(page.getByText("Timbrado vencido")).toBeVisible();
    await page.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(page.getByText("Datos guardados.")).toBeVisible();

    await page.goto("/ventas/nueva");
    await expect(page.getByText("Timbrado vencido")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Guardar factura" }),
    ).toBeDisabled();

    await page.goto("/empresa");
    await timbrado.fill(originalTimbrado);
    await vence.fill(originalVence);
    await expect(page.getByText("Timbrado vencido")).toBeHidden();
    await page.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(page.getByText("Datos guardados.")).toBeVisible();

    await page.goto("/ventas/nueva");
    await expect(
      page
        .locator("div")
        .filter({ hasText: /^001-001\|/ })
        .first(),
    ).toContainText(originalTimbrado);
    await expect(page.getByText("Timbrado vencido")).toBeHidden();
  });

  test("descartar vuelve a los datos guardados", async ({ page }) => {
    await page.goto("/empresa");
    const razon = campo(page, "RAZÓN SOCIAL");
    await expect(razon).not.toHaveValue("");
    const original = await razon.inputValue();
    await razon.fill("Texto sin guardar");
    await page.getByRole("button", { name: "Descartar" }).click();
    await expect(razon).toHaveValue(original);
  });
});

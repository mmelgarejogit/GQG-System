import { expect, test, type Page } from "@playwright/test";
import { campo, confirmar, fila, unico } from "./helpers";

function diaCuota(page: Page, n: number) {
  return page
    .locator(
      `xpath=//span[normalize-space()="Cuota ${n}"]/following-sibling::input[1]`,
    )
    .first();
}

test.describe("Plazos", () => {
  test("alta irregular con validación, edición y eliminación", async ({
    page,
  }) => {
    const nombre = unico("E2E Plazo");
    await page.goto("/plazos");

    await campo(page, "NOMBRE").fill(nombre);
    await page.getByRole("button", { name: "Irregular", exact: true }).click();
    await campo(page, "CANTIDAD DE CUOTAS").fill("2");
    await diaCuota(page, 1).fill("40");
    await diaCuota(page, 2).fill("20");
    await expect(
      page.getByText("Los días deben ser crecientes y mayores a cero."),
    ).toBeVisible();

    await diaCuota(page, 2).fill("70");
    await page.getByRole("button", { name: "Guardar plazo" }).click();
    await expect(page.getByText("Plazo creado.")).toBeVisible();

    const row = fila(page, nombre);
    await expect(row).toContainText("40 / 70");
    await expect(row).toContainText("Irregular");

    await row.getByRole("button", { name: "Editar" }).click();
    await expect(page.getByText("EDITAR PLAZO")).toBeVisible();
    await page.getByRole("button", { name: "Regular", exact: true }).click();
    await campo(page, "CANTIDAD DE CUOTAS").fill("3");
    await page.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(page.getByText("Plazo actualizado.")).toBeVisible();
    await expect(row).toContainText("30 / 60 / 90");
    await expect(row).toContainText("Regular");

    await row.getByRole("button", { name: "Eliminar" }).click();
    await confirmar(page, "Eliminar");
    await expect(page.getByText("Plazo eliminado.")).toBeVisible();
    await expect(row).toHaveCount(0);
  });

  test("un plazo usado solo permite renombrar y se da de baja", async ({
    page,
  }) => {
    const nombre = unico("E2E Usado");
    const p = await page.request.post("/api/plazos", {
      data: { plazo: nombre, tipoid: 1, cuotas: 2, irregular: false },
    });
    const plazoid = (await p.json()).id;
    const codbarra = `E2E${Date.now()}`;
    await page.request.post("/api/productos", {
      data: { producto: nombre, codbarra, iva: 10, servicio: 0, precio: 5000 },
    });
    const v = await page.request.post("/api/ventas", {
      data: {
        clienteid: 1,
        fechafactura: new Date().toISOString().slice(0, 10),
        tipodocid: 2,
        plazoid,
        depositoid: 1,
        lineas: [{ codbarra, cantidad: 1, precio: 5000 }],
      },
    });
    expect(v.status()).toBe(201);

    await page.goto("/plazos");
    const row = fila(page, nombre);
    await row.getByRole("button", { name: "Editar" }).click();
    await expect(page.getByText(/Usado en 1 venta/)).toBeVisible();
    await expect(campo(page, "CANTIDAD DE CUOTAS")).toBeDisabled();
    await expect(
      page.getByRole("button", { name: "Irregular" }),
    ).toBeDisabled();

    await campo(page, "NOMBRE").fill(`${nombre} renombrado`);
    await page.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(page.getByText("Plazo actualizado.")).toBeVisible();
    const renombrado = fila(page, `${nombre} renombrado`);
    await expect(renombrado).toHaveCount(1);

    await renombrado.getByRole("button", { name: "Dar de baja" }).click();
    await confirmar(page, "Dar de baja");
    await expect(renombrado).toContainText("Baja");

    await page.goto("/ventas/nueva");
    await expect(campo(page, "PLAZO").locator("option").first()).toBeAttached();
    await expect(campo(page, "PLAZO")).not.toContainText(nombre);

    await page.goto("/plazos");
    await renombrado.getByRole("button", { name: "Reactivar" }).click();
    await confirmar(page, "Reactivar");
    await expect(renombrado).toContainText("Activo");
  });

  test("no deja dar de baja el único plazo de contado", async ({ page }) => {
    await page.goto("/plazos");
    const contado = page
      .getByRole("row")
      .filter({ hasText: "Contado" })
      .filter({ hasText: "Activo" });
    await expect(contado).toHaveCount(1);
    const boton = contado.getByRole("button", { name: /Dar de baja|Eliminar/ });
    const accion = (await boton.getAttribute("aria-label")) ?? "Dar de baja";
    await boton.click();
    await confirmar(page, accion);
    await expect(
      page.getByText("Es el único plazo de contado activo"),
    ).toBeVisible();
  });
});

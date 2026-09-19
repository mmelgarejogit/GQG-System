import { expect, test } from "@playwright/test";
import { campo, confirmar, fila, unico } from "./helpers";

test.describe("Depósitos", () => {
  test("alta, edición y eliminación de un depósito sin ventas", async ({
    page,
  }) => {
    const nombre = unico("E2E Depósito");
    await page.goto("/depositos");

    await page.getByRole("button", { name: "Guardar depósito" }).click();
    await expect(page.getByText("El nombre es obligatorio.")).toBeVisible();

    await campo(page, "NOMBRE").fill(nombre);
    await campo(page, "DIRECCIÓN").fill("Ruta 2 km 20");
    await campo(page, "TELÉFONO").fill("021 555 000");
    await page.getByRole("button", { name: "Guardar depósito" }).click();
    await expect(page.getByText("Depósito creado.")).toBeVisible();

    const row = fila(page, nombre);
    await expect(row).toContainText("Ruta 2 km 20");
    await expect(row).toContainText("Activo");

    await row.getByRole("button", { name: "Editar" }).click();
    await expect(page.getByText("EDITAR DEPÓSITO")).toBeVisible();
    await campo(page, "DIRECCIÓN").fill("Ruta 2 km 21");
    await page.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(page.getByText("Depósito actualizado.")).toBeVisible();
    await expect(row).toContainText("Ruta 2 km 21");

    await row.getByRole("button", { name: "Eliminar" }).click();
    await expect(page.getByRole("dialog")).toContainText(
      "se eliminará definitivamente",
    );
    await confirmar(page, "Eliminar");
    await expect(page.getByText("Depósito eliminado.")).toBeVisible();
    await expect(row).toHaveCount(0);
  });

  test("un depósito con ventas se da de baja y se reactiva", async ({
    page,
  }) => {
    const nombre = unico("E2E Depósito");
    const r = await page.request.post("/api/depositos", {
      data: { deposito: nombre },
    });
    expect(r.status()).toBe(201);
    const id = (await r.json()).id;
    const codbarra = `E2E${Date.now()}`;
    await page.request.post("/api/productos", {
      data: { producto: nombre, codbarra, iva: 10, servicio: 0, precio: 1000 },
    });
    const venta = await page.request.post("/api/ventas", {
      data: {
        clienteid: 1,
        fechafactura: new Date().toISOString().slice(0, 10),
        tipodocid: 1,
        plazoid: 1,
        depositoid: id,
        lineas: [{ codbarra, cantidad: 1, precio: 1000 }],
      },
    });
    expect(venta.status()).toBe(201);

    await page.goto("/depositos");
    const row = fila(page, nombre);
    await row.getByRole("button", { name: "Dar de baja" }).click();
    await expect(page.getByRole("dialog")).toContainText("no se borra");
    await confirmar(page, "Dar de baja");
    await expect(row).toContainText("Baja");

    await page.goto("/ventas/nueva");
    await expect(
      campo(page, "DEPÓSITO").locator("option").first(),
    ).toBeAttached();
    await expect(campo(page, "DEPÓSITO")).not.toContainText(nombre);

    await page.goto("/depositos");
    await row.getByRole("button", { name: "Reactivar" }).click();
    await confirmar(page, "Reactivar");
    await expect(row).toContainText("Activo");
  });
});

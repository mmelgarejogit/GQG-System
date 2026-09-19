import { expect, type Locator, type Page } from "@playwright/test";

export function campo(raiz: Page | Locator, etiqueta: string): Locator {
  return raiz
    .locator(
      `xpath=.//label[normalize-space()="${etiqueta}"]/following-sibling::*[1]`,
    )
    .first();
}

export function unico(prefijo: string): string {
  return `${prefijo} ${Date.now().toString(36).toUpperCase()}`;
}

export function fila(page: Page, texto: string | RegExp): Locator {
  return page.getByRole("row").filter({ hasText: texto });
}

export async function titulo(page: Page, texto: string) {
  await expect(
    page.locator("header").getByText(texto, { exact: true }),
  ).toBeVisible();
}

export async function confirmar(page: Page, boton: string) {
  const dialogo = page.getByRole("dialog");
  await expect(dialogo).toBeVisible();
  await dialogo.getByRole("button", { name: boton, exact: true }).click();
  await expect(dialogo).toBeHidden();
}

export async function crearProducto(
  page: Page,
  nombre: string,
  precio: number,
) {
  const codbarra = `E2E${Date.now()}`;
  const r = await page.request.post("/api/productos", {
    data: { producto: nombre, codbarra, iva: 10, servicio: 0, precio },
  });
  expect(r.status()).toBe(201);
  return codbarra;
}

export async function crearPlazoRegular(
  page: Page,
  nombre: string,
  cuotas: number,
) {
  const r = await page.request.post("/api/plazos", {
    data: { plazo: nombre, tipoid: 1, cuotas, irregular: false, detalles: [] },
  });
  expect(r.status()).toBe(201);
  return (await r.json()).id as number;
}

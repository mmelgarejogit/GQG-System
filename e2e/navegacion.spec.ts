import { expect, test } from "@playwright/test";
import { titulo } from "./helpers";

const SECCIONES: [string, string, string][] = [
  ["Nueva venta", "/ventas/nueva", "EMISIÓN DE FACTURA"],
  ["Ventas", "/ventas", "FACTURAS EMITIDAS"],
  ["Plazos", "/plazos", "CONDICIONES DE CRÉDITO"],
  ["Clientes", "/clientes", "PADRÓN"],
  ["Productos", "/productos", "CATÁLOGO"],
  ["Depósitos", "/depositos", "SUCURSALES"],
  ["Empresa", "/empresa", "DATOS DEL EMISOR"],
  ["Inicio", "/", "RESUMEN OPERATIVO"],
];

test.describe("Navegación e inicio", () => {
  test("el menú lateral abre cada sección", async ({ page }) => {
    await page.goto("/");
    const menu = page.locator("aside");
    for (const [nombre, ruta, subtitulo] of SECCIONES) {
      await menu.getByRole("link", { name: nombre, exact: true }).click();
      await expect(page).toHaveURL(ruta);
      await titulo(page, subtitulo);
    }
  });

  test("el inicio muestra indicadores y listas", async ({ page }) => {
    await page.goto("/");
    for (const kpi of ["SALDO A COBRAR", "VENCE EN 7 DÍAS", "VENCIDAS"])
      await expect(page.getByText(kpi, { exact: true })).toBeVisible();
    await expect(page.getByText(/^FACTURADO EN /)).toBeVisible();
    await expect(page.getByText("Ventas recientes")).toBeVisible();
    await page.getByRole("button", { name: "Ver todas" }).click();
    await expect(page).toHaveURL("/ventas");
  });

  test("el menú colapsado se recuerda al recargar", async ({ page }) => {
    await page.goto("/");
    const etiqueta = page
      .locator("aside")
      .getByText("Clientes", { exact: true });
    await expect(etiqueta).toBeVisible();
    await page.getByTitle("Colapsar menú").click();
    await expect(etiqueta).toBeHidden();
    await page.reload();
    await expect(etiqueta).toBeHidden();
    await page.getByTitle("Expandir menú").click();
    await expect(etiqueta).toBeVisible();
  });
});

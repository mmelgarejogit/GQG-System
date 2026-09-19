import { expect, test, type Page } from "@playwright/test";
import {
  campo,
  confirmar,
  crearPlazoRegular,
  crearProducto,
  fila,
  titulo,
  unico,
} from "./helpers";

function buscadorProducto(page: Page) {
  return page.getByRole("combobox", { name: "Buscar producto" });
}

async function agregarItem(page: Page, codigo: string) {
  const input = buscadorProducto(page);
  await input.fill(codigo);
  await input.press("Enter");
}

async function numeroFactura(page: Page) {
  const nro = page.locator("div.font-mono.text-xl").first();
  await expect(nro).toHaveText(/^\d{3}-\d{3}-\d{7}$/);
  return (await nro.textContent())!.trim();
}

test.describe("Ventas", () => {
  test("validaciones de la nueva venta", async ({ page }) => {
    await page.goto("/ventas/nueva");
    await expect(page.getByText("Todavía no hay ítems")).toBeVisible();

    await page.getByRole("button", { name: "Guardar factura" }).click();
    await expect(page.getByText("Falta seleccionar el cliente.")).toBeVisible();
    await expect(
      page.getByText("Seleccioná un cliente de la lista."),
    ).toBeVisible();

    await agregarItem(page, "codigo-que-no-existe");
    await expect(
      page.getByText(/No hay un producto activo que coincida/),
    ).toBeVisible();
  });

  test("el buscador lista productos y permite elegirlos sin saber el código", async ({
    page,
  }) => {
    const sufijo = Date.now().toString(36).toUpperCase();
    const cafe = `E2E Café molido ${sufijo}`;
    const azucar = `E2E Azúcar ${sufijo}`;
    const codCafe = await crearProducto(page, cafe, 32000);
    const codAzucar = await crearProducto(page, azucar, 8500);

    await page.goto("/ventas/nueva");
    const input = buscadorProducto(page);
    await input.click();
    const lista = page.getByRole("listbox", { name: "Productos" });
    await expect(lista).toBeVisible();
    await expect(lista.getByRole("option").first()).toBeVisible();

    await input.fill(`cafe molido ${sufijo.toLowerCase()}`);
    await expect(lista.getByRole("option")).toHaveCount(1);
    const opcion = lista.getByRole("option", { name: new RegExp(cafe) });
    await expect(opcion).toContainText(codCafe);
    await expect(opcion).toContainText("32.000");
    await opcion.click();

    await expect(lista).toBeHidden();
    await expect(input).toHaveValue("");
    await expect(input).toBeFocused();
    await expect(fila(page, codCafe)).toContainText(cafe);

    await input.fill(sufijo);
    await expect(lista.getByRole("option")).toHaveCount(2);
    await expect(
      lista.getByRole("option", { name: new RegExp(cafe) }),
    ).toContainText("×1 en venta");
    const primera = lista.getByRole("option").nth(0);
    await expect(primera).toHaveAttribute("aria-selected", "true");
    await input.press("ArrowDown");
    const segunda = lista.getByRole("option").nth(1);
    await expect(segunda).toHaveAttribute("aria-selected", "true");
    const elegido = (await segunda.textContent())!.includes(azucar)
      ? codAzucar
      : codCafe;
    await input.press("Enter");
    await expect(fila(page, elegido)).toHaveCount(1);

    await input.fill(`inexistente ${sufijo}`);
    await expect(lista).toBeHidden();
    await expect(
      page.getByText(`Ningún producto coincide con «inexistente ${sufijo}».`),
    ).toBeVisible();
    await input.press("Escape");
    await expect(page.getByText(/Ningún producto coincide/)).toBeHidden();

    await input.fill("");
    await page.getByRole("button", { name: "Agregar ítem" }).click();
    await expect(lista).toBeVisible();
  });

  test("venta a crédito con cliente nuevo, cobro de cuota y factura", async ({
    page,
  }) => {
    const producto = unico("E2E Artículo");
    const codbarra = await crearProducto(page, producto, 150000);
    const plazo = unico("E2E 3 cuotas");
    await crearPlazoRegular(page, plazo, 3);
    const cliente = unico("E2E Comprador");

    await page.goto("/ventas/nueva");
    await titulo(page, "EMISIÓN DE FACTURA");

    const buscador = page.getByPlaceholder("Buscar por nombre o CI/RUC");
    await buscador.fill(cliente);
    await page.getByRole("button", { name: "Crear cliente nuevo" }).click();
    await expect(campo(page, "NOMBRES")).toHaveValue(cliente);
    await campo(page, "APELLIDOS").fill("Crédito");
    await campo(page, "CI / RUC").fill("5544332");
    await page.getByRole("button", { name: "Guardar y usar" }).click();
    await expect(buscador).toHaveValue(`${cliente} Crédito`);

    await agregarItem(page, codbarra);
    await agregarItem(page, codbarra);
    const linea = fila(page, codbarra);
    await expect(linea.locator("input").first()).toHaveValue("2");
    await expect(linea).toContainText("300.000");

    await page.getByRole("button", { name: "Crédito", exact: true }).click();
    await campo(page, "PLAZO").selectOption({ label: plazo });
    await expect(
      page.getByText("3 cuotas · regular · días 30/60/90"),
    ).toBeVisible();

    const vista = page
      .locator("div")
      .filter({ hasText: /^VISTA PREVIA DE CUOTAS/ })
      .first();
    await expect(vista.getByRole("row")).toHaveCount(3);
    await expect(vista.getByRole("row").nth(0)).toContainText("100.000");
    await expect(vista).toContainText("Suma de cuotas300.000");
    await expect(page.getByText("TOTAL FACTURA").locator("..")).toContainText(
      "300.000",
    );

    await page.getByRole("button", { name: "Guardar factura" }).click();
    await expect(page).toHaveURL(/\/ventas\/\d+$/);
    await titulo(page, "CUENTAS A COBRAR");
    await expect(
      page.getByText(`${cliente} Crédito · CI/RUC 5544332`),
    ).toBeVisible();
    await expect(page.getByText("3 CUOTAS", { exact: true })).toBeVisible();
    const nro = await numeroFactura(page);

    const cuotas = page.getByRole("row").filter({ hasText: /^0\d\/03/ });
    await expect(cuotas).toHaveCount(3);
    await expect(cuotas.nth(0)).toContainText("Pendiente");
    await cuotas
      .nth(0)
      .getByRole("button", { name: "Registrar cobro" })
      .click();
    await confirmar(page, "Registrar cobro");
    await expect(cuotas.nth(0)).toContainText("Cobrada");
    await expect(cuotas.nth(0).getByRole("button")).toHaveCount(0);

    await expect(page.getByRole("button", { name: "Anular" })).toBeDisabled();

    await page.getByRole("button", { name: "Ver factura" }).click();
    await titulo(page, "IMPRESIÓN A4");
    const a4 = page.locator("[data-a4]");
    await expect(a4).toContainText(nro);
    await expect(a4).toContainText(`${cliente} Crédito`);
    await expect(a4).toContainText("CRÉDITO");
    await expect(a4).toContainText("Guaraníes trescientos mil.");
    await expect(a4).toContainText("TOTAL IVA: 27.273");
    await expect(a4).not.toContainText("ANULADA");

    await page.goto("/ventas");
    await page.getByPlaceholder("Buscar por factura o cliente").fill(cliente);
    const enLista = fila(page, nro);
    await expect(enLista).toContainText("Crédito");
    await expect(enLista).toContainText(plazo);
    await enLista.click();
    await expect(page).toHaveURL(/\/ventas\/\d+$/);
  });

  test("venta al contado y anulación con motivo", async ({ page }) => {
    const producto = unico("E2E Contado");
    const codbarra = await crearProducto(page, producto, 55000);

    await page.goto("/ventas/nueva");
    const buscador = page.getByPlaceholder("Buscar por nombre o CI/RUC");
    await buscador.click();
    await page
      .locator("div.absolute button")
      .filter({ hasNotText: "Crear cliente nuevo" })
      .first()
      .click();
    await page.getByRole("button", { name: "Contado", exact: true }).click();
    await expect(
      page.getByText("Al contado se genera una única cuota"),
    ).toBeVisible();
    await buscadorProducto(page).fill(producto);
    await expect(
      page.getByRole("option", { name: new RegExp(producto) }),
    ).toBeVisible();
    await buscadorProducto(page).press("Enter");
    await expect(fila(page, codbarra)).toContainText("55.000");
    await page.getByRole("button", { name: "Guardar factura" }).click();

    await expect(page).toHaveURL(/\/ventas\/\d+$/);
    const nro = await numeroFactura(page);
    await expect(page.getByText("1 CUOTA", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Anular" }).click();
    const dialogo = page.getByRole("dialog");
    await expect(dialogo).toContainText(`Anular la factura ${nro}`);
    const anularBtn = dialogo.getByRole("button", { name: "Anular factura" });
    await expect(anularBtn).toBeDisabled();
    await dialogo.locator("textarea").fill("abc");
    await expect(anularBtn).toBeDisabled();
    await dialogo.locator("textarea").fill("Error de carga en la prueba E2E");
    await anularBtn.click();
    await expect(dialogo).toBeHidden();

    await expect(page.getByText("Factura anulada")).toBeVisible();
    await expect(
      page.getByText("Motivo: Error de carga en la prueba E2E"),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Anular" })).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Registrar cobro" }),
    ).toHaveCount(0);

    await page.getByRole("button", { name: "Ver factura" }).click();
    await expect(page.locator("[data-a4]")).toContainText("ANULADA");
    await expect(page.locator("[data-a4]")).toContainText(
      "MOTIVO: Error de carga en la prueba E2E",
    );

    await page.goto("/ventas");
    await page.getByRole("combobox").first().selectOption("anuladas");
    await expect(fila(page, nro)).toContainText("Anulada");
    await page.getByRole("combobox").first().selectOption("1");
    await expect(fila(page, nro)).toHaveCount(0);
    await page.getByRole("combobox").first().selectOption("anuladas");

    const hoy = new Date();
    const iso = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const fechas = page.getByRole("button", { name: "Todas las fechas" });
    await fechas.click();
    const panel = page.getByRole("dialog", { name: "Filtrar por fecha" });
    await panel.getByRole("button", { name: "Mes anterior" }).click();
    await expect(panel).toBeHidden();
    await expect(fila(page, nro)).toHaveCount(0);

    await page.getByRole("button", { name: "Mes anterior" }).click();
    await panel.getByRole("button", { name: "Hoy" }).click();
    await expect(fila(page, nro)).toContainText("Anulada");

    await page.getByRole("button", { name: "Hoy", exact: true }).click();
    const desde = panel.getByLabel("DESDE");
    const hasta = panel.getByLabel("HASTA");
    const manana = new Date(
      hoy.getFullYear(),
      hoy.getMonth(),
      hoy.getDate() + 1,
    );
    await desde.fill(iso(manana));
    await expect(hasta).toHaveValue(iso(manana));
    await expect(fila(page, nro)).toHaveCount(0);
    const antes = new Date(hoy.getFullYear() - 2, 0, 1);
    await desde.fill(iso(antes));
    await expect(fila(page, nro)).toContainText("Anulada");
    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
    await expect(
      page.getByRole("button", { name: /^\d{2}\/\d{2}\/\d{4} – / }),
    ).toBeVisible();

    await page.goto("/");
    await expect(fila(page, nro)).toContainText("Anulada");
  });

  test("búsqueda sin resultados permite limpiar", async ({ page }) => {
    await page.goto("/ventas");
    const buscador = page.getByPlaceholder("Buscar por factura o cliente");
    await buscador.fill("zzz-sin-resultados");
    await expect(
      page.getByText("Sin resultados para «zzz-sin-resultados»"),
    ).toBeVisible();
    await page.getByRole("button", { name: "Limpiar búsqueda" }).click();
    await expect(buscador).toHaveValue("");
    await expect(page.getByText(/\d+ de \d+ facturas/)).toBeVisible();
  });
});

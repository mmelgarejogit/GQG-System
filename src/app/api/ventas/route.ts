import { NextRequest, NextResponse } from "next/server";
import { q, db } from "@/lib/db";
import { fechaValida, idValido } from "@/lib/params";

export async function GET() {
  const filas = await q(
    `SELECT v.id, v.fechafactura, v.serie, v.nrofactura, v.totalfactura,
            CONCAT(c.nombres, ' ', c.apellidos) AS cliente,
            td.abreviatura AS tipo, td.tipoid, p.plazo,
            (SELECT COUNT(*) FROM CUENTAS_COBRAR cc
              WHERE cc.tabla = 'VENTAS' AND cc.tablaid = v.id) AS ncuotas
     FROM VENTAS v
     JOIN CLIENTES c        ON c.id = v.clienteid
     JOIN TIPOS_DOCUMENTO td ON td.id = v.tipodocid
     JOIN PLAZOS p          ON p.id = v.plazoid
     ORDER BY v.id DESC`,
  );
  return NextResponse.json(filas);
}

type Linea = { codbarra: string; precio: number; cantidad: number };
type ProductoDb = { codbarra: string; iva: number; activo: number };

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  const clienteid = Number(b.clienteid);
  const fechafactura = String(b.fechafactura || "").slice(0, 10);
  const tipodocid = Number(b.tipodocid);
  const plazoid = Number(b.plazoid);
  const depositoid = idValido(String(b.depositoid ?? 1));
  const recibidas: Linea[] = Array.isArray(b.lineas) ? b.lineas : [];

  if (!clienteid)
    return NextResponse.json({ error: "Cliente requerido" }, { status: 422 });
  if (!fechaValida(fechafactura))
    return NextResponse.json({ error: "Fecha invalida" }, { status: 422 });
  if (!tipodocid || !plazoid)
    return NextResponse.json(
      { error: "Tipo de documento y plazo requeridos" },
      { status: 422 },
    );

  const porCod = new Map<string, Linea>();
  for (const l of recibidas) {
    const codbarra = String(l?.codbarra || "");
    const cantidad = Number(l?.cantidad);
    const precio = Number(l?.precio);
    if (!codbarra) continue;
    if (!Number.isFinite(cantidad) || cantidad <= 0)
      return NextResponse.json({ error: "Cantidad invalida" }, { status: 422 });
    if (!Number.isFinite(precio) || precio <= 0)
      return NextResponse.json(
        { error: "El precio debe ser mayor a cero" },
        { status: 422 },
      );
    const prev = porCod.get(codbarra);
    if (prev && prev.precio !== precio)
      return NextResponse.json(
        { error: "Un mismo producto no puede tener dos precios en la venta" },
        { status: 422 },
      );
    if (prev) prev.cantidad += cantidad;
    else porCod.set(codbarra, { codbarra, precio, cantidad });
  }
  const lineas = [...porCod.values()];
  if (lineas.length === 0)
    return NextResponse.json(
      { error: "Agrega al menos un producto" },
      { status: 422 },
    );

  const [cliente] = await q<{ activo: number }>(
    "SELECT activo FROM CLIENTES WHERE id = ?",
    [clienteid],
  );
  if (!cliente || cliente.activo !== 1)
    return NextResponse.json(
      { error: "El cliente no existe o esta inactivo" },
      { status: 422 },
    );

  const [deposito] = depositoid
    ? await q<{ id: number }>("SELECT id FROM DEPOSITOS WHERE id = ?", [
        depositoid,
      ])
    : [];
  if (!deposito)
    return NextResponse.json({ error: "Deposito invalido" }, { status: 422 });

  const productos = await q<ProductoDb>(
    `SELECT pd.codbarra, p.iva, p.activo
     FROM PRODUCTO_DETALLE pd JOIN PRODUCTOS p ON p.id = pd.productoid
     WHERE pd.codbarra IN (?)`,
    [lineas.map((l) => l.codbarra)],
  );
  const prodPorCod = new Map(productos.map((p) => [p.codbarra, p]));
  for (const l of lineas) {
    const p = prodPorCod.get(l.codbarra);
    if (!p || p.activo !== 1)
      return NextResponse.json(
        { error: `El producto ${l.codbarra} no existe o esta inactivo` },
        { status: 422 },
      );
  }

  let total = 0;
  let totalexento = 0;
  let totalimpuesto = 0;
  const detalles = lineas.map((l) => {
    const iva = Number(prodPorCod.get(l.codbarra)!.iva);
    const t = l.precio * l.cantidad;
    const impuesto = iva > 0 ? t - t / (1 + iva / 100) : 0;
    total += t;
    if (iva === 0) totalexento += t;
    totalimpuesto += impuesto;
    return {
      ...l,
      iva,
      total: t,
      impuesto5: iva === 5 ? impuesto : 0,
      impuesto10: iva === 10 ? impuesto : 0,
    };
  });
  const totalbase = total - totalimpuesto;

  const conn = await db().getConnection();
  try {
    await conn.beginTransaction();
    const [[{ maxid, maxnro }]] = (await conn.query(
      "SELECT IFNULL(MAX(id),0) AS maxid, IFNULL(MAX(nrofactura),0) AS maxnro FROM VENTAS FOR UPDATE",
    )) as [{ maxid: number; maxnro: number }[], unknown];
    const id = Number(maxid) + 1;
    const nro = Number(maxnro) + 1;

    await conn.query(
      `INSERT INTO VENTAS
        (id, fechaproceso, fechafactura, clienteid, serie, nrofactura,
         timbrado, timbrado_vence, totalexento, totalimpuesto, totalbase,
         totalfactura, depositoid, monedaid, tipodocid, plazoid)
       VALUES (?, NOW(), ?, ?, '001-001', ?, '12557031', '2027-12-31',
               ?, ?, ?, ?, ?, 1, ?, ?)`,
      [
        id,
        fechafactura,
        clienteid,
        nro,
        totalexento,
        totalimpuesto,
        totalbase,
        total,
        depositoid,
        tipodocid,
        plazoid,
      ],
    );

    for (const d of detalles) {
      await conn.query(
        `INSERT INTO VENTA_DETALLES
          (ventaid, codbarra, precio, cantidad, iva, impuesto5, impuesto10, total)
         VALUES (?,?,?,?,?,?,?,?)`,
        [
          id,
          d.codbarra,
          d.precio,
          d.cantidad,
          d.iva,
          d.impuesto5,
          d.impuesto10,
          d.total,
        ],
      );
    }

    await conn.commit();
    return NextResponse.json({ id }, { status: 201 });
  } catch (e) {
    await conn.rollback();
    const sqlState = (e as { sqlState?: string }).sqlState;
    const msg =
      sqlState === "45000" && e instanceof Error
        ? e.message.replace(/^.*?: /, "")
        : "No se pudo crear la venta: verifica el tipo de documento y el plazo";
    if (sqlState !== "45000") console.error(e);
    return NextResponse.json({ error: msg }, { status: 422 });
  } finally {
    conn.release();
  }
}

import { NextRequest, NextResponse } from "next/server";
import type { PoolConnection } from "mysql2/promise";
import { enTransaccion } from "@/lib/transaccion";
import { auditar } from "@/lib/auditoria";
import { validarDeposito } from "@/lib/depositos";
import { idValido } from "@/lib/params";

type DepositoRow = { id: number; deposito: string; activo: number };
type Contexto = { params: Promise<{ id: string }> };

const noEncontrado = () =>
  NextResponse.json({ error: "Depósito no encontrado" }, { status: 404 });

async function cargar(conn: PoolConnection, id: number) {
  const [filas] = (await conn.query(
    "SELECT id, deposito, activo FROM DEPOSITOS WHERE id = ? FOR UPDATE",
    [id],
  )) as [DepositoRow[], unknown];
  if (!filas[0]) return null;
  const [[{ usos }]] = (await conn.query(
    "SELECT COUNT(*) AS usos FROM VENTAS WHERE depositoid = ?",
    [id],
  )) as [{ usos: number }[], unknown];
  return { deposito: filas[0], usos: Number(usos) };
}

export async function PUT(req: NextRequest, { params }: Contexto) {
  const did = idValido((await params).id);
  if (!did) return noEncontrado();
  const v = validarDeposito(await req.json().catch(() => ({})));
  if ("error" in v) return NextResponse.json(v, { status: 422 });

  return enTransaccion(async (conn) => {
    const actual = await cargar(conn, did);
    if (!actual) return noEncontrado();
    await conn.query(
      "UPDATE DEPOSITOS SET deposito = ?, direccion = ?, telefono = ? WHERE id = ?",
      [v.deposito, v.direccion, v.telefono, did],
    );
    await auditar(
      "EDITAR",
      "DEPOSITOS",
      did,
      `«${actual.deposito.deposito}» → «${v.deposito}», ${v.direccion || "sin dirección"}, ${v.telefono || "sin teléfono"}`,
      conn,
    );
    return NextResponse.json({ id: did });
  }, "No se pudo modificar el depósito");
}

export async function DELETE(_req: NextRequest, { params }: Contexto) {
  const did = idValido((await params).id);
  if (!did) return noEncontrado();

  return enTransaccion(async (conn) => {
    const actual = await cargar(conn, did);
    if (!actual) return noEncontrado();
    const { deposito: d, usos } = actual;

    if (d.activo) {
      const [[{ otros }]] = (await conn.query(
        "SELECT COUNT(*) AS otros FROM DEPOSITOS WHERE activo = 1 AND id <> ?",
        [did],
      )) as [{ otros: number }[], unknown];
      if (!Number(otros))
        return NextResponse.json(
          {
            error:
              "Es el único depósito activo: sin él no se pueden registrar ventas",
          },
          { status: 409 },
        );
    }

    if (usos > 0) {
      if (!d.activo)
        return NextResponse.json(
          { error: "El depósito ya estaba dado de baja" },
          { status: 409 },
        );
      await conn.query("UPDATE DEPOSITOS SET activo = 0 WHERE id = ?", [did]);
      await auditar(
        "BAJA",
        "DEPOSITOS",
        did,
        `«${d.deposito}» dado de baja (usado en ${usos} venta(s))`,
        conn,
      );
      return NextResponse.json({ id: did, accion: "baja" });
    }

    await conn.query("DELETE FROM DEPOSITOS WHERE id = ?", [did]);
    await auditar(
      "ELIMINAR",
      "DEPOSITOS",
      did,
      `«${d.deposito}» eliminado`,
      conn,
    );
    return NextResponse.json({ id: did, accion: "eliminado" });
  }, "No se pudo eliminar el depósito");
}

export async function PATCH(_req: NextRequest, { params }: Contexto) {
  const did = idValido((await params).id);
  if (!did) return noEncontrado();

  return enTransaccion(async (conn) => {
    const actual = await cargar(conn, did);
    if (!actual) return noEncontrado();
    if (actual.deposito.activo)
      return NextResponse.json(
        { error: "El depósito ya estaba activo" },
        { status: 409 },
      );
    await conn.query("UPDATE DEPOSITOS SET activo = 1 WHERE id = ?", [did]);
    await auditar(
      "REACTIVAR",
      "DEPOSITOS",
      did,
      `«${actual.deposito.deposito}» reactivado`,
      conn,
    );
    return NextResponse.json({ id: did });
  }, "No se pudo reactivar el depósito");
}

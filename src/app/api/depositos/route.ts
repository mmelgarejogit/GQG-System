import { NextRequest, NextResponse } from "next/server";
import { q, db } from "@/lib/db";
import { validarDeposito } from "@/lib/depositos";

export async function GET(req: NextRequest) {
  const todos = req.nextUrl.searchParams.get("inactivos") === "1";
  const filas = await q(
    `SELECT d.id, d.deposito, d.direccion, d.telefono, d.activo,
            (SELECT COUNT(*) FROM VENTAS v WHERE v.depositoid = d.id) AS usos
     FROM DEPOSITOS d
     ${todos ? "" : "WHERE d.activo = 1"}
     ORDER BY d.activo DESC, d.deposito`,
  );
  return NextResponse.json(filas);
}

export async function POST(req: NextRequest) {
  const v = validarDeposito(await req.json().catch(() => ({})));
  if ("error" in v) return NextResponse.json(v, { status: 422 });

  const conn = await db().getConnection();
  try {
    await conn.beginTransaction();
    const [[{ maxid }]] = (await conn.query(
      "SELECT IFNULL(MAX(id),0) AS maxid FROM DEPOSITOS FOR UPDATE",
    )) as [{ maxid: number }[], unknown];
    const id = Number(maxid) + 1;
    await conn.query(
      "INSERT INTO DEPOSITOS (id, deposito, direccion, telefono) VALUES (?,?,?,?)",
      [id, v.deposito, v.direccion, v.telefono],
    );
    await conn.commit();
    return NextResponse.json({ id }, { status: 201 });
  } catch (e) {
    await conn.rollback();
    console.error(e);
    return NextResponse.json(
      { error: "No se pudo crear el depósito" },
      { status: 500 },
    );
  } finally {
    conn.release();
  }
}

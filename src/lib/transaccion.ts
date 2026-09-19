import { NextResponse } from "next/server";
import type { PoolConnection } from "mysql2/promise";
import { db } from "@/lib/db";

export async function enTransaccion(
  fn: (conn: PoolConnection) => Promise<NextResponse>,
  mensajeError: string,
): Promise<NextResponse> {
  const conn = await db().getConnection();
  try {
    await conn.beginTransaction();
    const res = await fn(conn);
    if (res.ok) await conn.commit();
    else await conn.rollback();
    return res;
  } catch (e) {
    await conn.rollback();
    console.error(e);
    return NextResponse.json({ error: mensajeError }, { status: 500 });
  } finally {
    conn.release();
  }
}

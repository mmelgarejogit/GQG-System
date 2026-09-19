import type { PoolConnection } from "mysql2/promise";
import { leerSesion } from "@/lib/auth";
import { db } from "@/lib/db";

export async function usuarioActual(): Promise<string> {
  return (await leerSesion())?.usuario ?? "desconocido";
}

export async function auditar(
  accion: string,
  tabla: string,
  tablaid: number,
  detalle: string,
  conn?: PoolConnection,
): Promise<void> {
  const usuario = await usuarioActual();
  await (conn ?? db()).query(
    `INSERT INTO AUDITORIA (fecha, usuario, accion, tabla, tablaid, detalle)
     VALUES (NOW(), ?, ?, ?, ?, ?)`,
    [usuario, accion, tabla, tablaid, detalle.slice(0, 500)],
  );
}

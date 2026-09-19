import fs from "node:fs";
import { conectar, ESTADO, type Estado } from "./db";

export default async function globalTeardown() {
  if (!fs.existsSync(ESTADO)) return;
  const e: Estado = JSON.parse(fs.readFileSync(ESTADO, "utf8"));
  const conn = await conectar();
  try {
    await conn.beginTransaction();
    const borrar = [
      [
        "DELETE FROM CUENTAS_COBRAR WHERE tabla = 'VENTAS' AND tablaid > ?",
        e.ventas,
      ],
      ["DELETE FROM VENTA_DETALLES WHERE ventaid > ?", e.ventas],
      ["DELETE FROM VENTAS WHERE id > ?", e.ventas],
      ["DELETE FROM PRODUCTO_DETALLE WHERE productoid > ?", e.productos],
      ["DELETE FROM PRODUCTOS WHERE id > ?", e.productos],
      ["DELETE FROM PLAZO_DETALLES WHERE plazoid > ?", e.plazos],
      ["DELETE FROM PLAZOS WHERE id > ?", e.plazos],
      ["DELETE FROM DEPOSITOS WHERE id > ?", e.depositos],
      ["DELETE FROM CLIENTES WHERE id > ?", e.clientes],
      ["DELETE FROM AUDITORIA WHERE id > ?", e.auditoria],
    ] as const;
    for (const [sql, id] of borrar) await conn.query(sql, [id]);
    const { id, ...campos } = e.empresa;
    await conn.query("UPDATE EMPRESAS SET ? WHERE id = ?", [campos, id]);
    await conn.query("ALTER TABLE AUDITORIA AUTO_INCREMENT = 1");
    await conn.commit();
    fs.rmSync(ESTADO);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    await conn.end();
  }
}

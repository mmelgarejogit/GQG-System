import fs from "node:fs";
import { conectar, ESTADO, type Estado } from "./db";

export default async function globalSetup() {
  fs.mkdirSync("e2e/.auth", { recursive: true });
  if (fs.existsSync(ESTADO)) return;
  const conn = await conectar();
  try {
    const max = async (tabla: string) => {
      const [filas] = await conn.query(
        `SELECT IFNULL(MAX(id),0) AS m FROM ${tabla}`,
      );
      return Number((filas as { m: number }[])[0].m);
    };
    const [empresas] = await conn.query(
      "SELECT * FROM EMPRESAS ORDER BY id LIMIT 1",
    );
    const estado: Estado = {
      ventas: await max("VENTAS"),
      clientes: await max("CLIENTES"),
      productos: await max("PRODUCTOS"),
      plazos: await max("PLAZOS"),
      depositos: await max("DEPOSITOS"),
      auditoria: await max("AUDITORIA"),
      empresa: (empresas as Record<string, unknown>[])[0],
    };
    fs.writeFileSync(ESTADO, JSON.stringify(estado, null, 2));
  } finally {
    await conn.end();
  }
}

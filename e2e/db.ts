import mysql from "mysql2/promise";

export function conectar() {
  return mysql.createConnection({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "gqg",
    password: process.env.DB_PASSWORD || "gqg",
    database: process.env.DB_NAME || "gqg",
    dateStrings: true,
  });
}

export const ESTADO = "e2e/.estado.json";

export type Estado = {
  ventas: number;
  clientes: number;
  productos: number;
  plazos: number;
  depositos: number;
  auditoria: number;
  empresa: Record<string, unknown>;
};

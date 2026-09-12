import { NextResponse } from "next/server";
import { q } from "@/lib/db";

type Kpi = { monto: number; cantidad: number };

export async function GET() {
  const [facturado] = await q<Kpi>(
    `SELECT IFNULL(SUM(totalfactura),0) AS monto, COUNT(*) AS cantidad
     FROM VENTAS
     WHERE fechafactura >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
       AND fechafactura < DATE_FORMAT(CURDATE() + INTERVAL 1 MONTH, '%Y-%m-01')`,
  );
  const [abiertas] = await q<Kpi>(
    `SELECT IFNULL(SUM(importe - cobrado),0) AS monto, COUNT(*) AS cantidad
     FROM CUENTAS_COBRAR WHERE tabla = 'VENTAS' AND cobrado < importe`,
  );
  const [porVencer] = await q<Kpi>(
    `SELECT IFNULL(SUM(importe - cobrado),0) AS monto, COUNT(*) AS cantidad
     FROM CUENTAS_COBRAR
     WHERE tabla = 'VENTAS' AND cobrado < importe
       AND DATE(vence) BETWEEN CURDATE() AND CURDATE() + INTERVAL 7 DAY`,
  );
  const [vencidas] = await q<Kpi>(
    `SELECT IFNULL(SUM(importe - cobrado),0) AS monto, COUNT(*) AS cantidad
     FROM CUENTAS_COBRAR
     WHERE tabla = 'VENTAS' AND cobrado < importe AND DATE(vence) < CURDATE()`,
  );

  const recientes = await q(
    `SELECT v.id, v.serie, v.nrofactura, v.totalfactura, td.tipoid,
            CONCAT(c.nombres, ' ', c.apellidos) AS cliente
     FROM VENTAS v
     JOIN CLIENTES c ON c.id = v.clienteid
     JOIN TIPOS_DOCUMENTO td ON td.id = v.tipodocid
     ORDER BY v.id DESC LIMIT 5`,
  );

  const agenda = await q(
    `SELECT cc.tablaid AS ventaid, cc.cuota, cc.importe, cc.cobrado, cc.vence,
            v.serie, v.nrofactura, CONCAT(c.nombres, ' ', c.apellidos) AS cliente,
            (SELECT COUNT(*) FROM CUENTAS_COBRAR x
              WHERE x.tabla = 'VENTAS' AND x.tablaid = cc.tablaid) AS total_cuotas
     FROM CUENTAS_COBRAR cc
     JOIN VENTAS v ON v.id = cc.tablaid
     JOIN CLIENTES c ON c.id = v.clienteid
     WHERE cc.tabla = 'VENTAS' AND cc.cobrado < cc.importe
     ORDER BY cc.vence, cc.id LIMIT 6`,
  );

  return NextResponse.json({
    facturado,
    abiertas,
    porVencer,
    vencidas,
    recientes,
    agenda,
  });
}

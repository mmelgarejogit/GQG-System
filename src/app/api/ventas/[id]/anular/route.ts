import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auditar, usuarioActual } from "@/lib/auditoria";
import { idValido } from "@/lib/params";

type VentaRow = {
  anulada: number;
  serie: string;
  nrofactura: number;
  totalfactura: number;
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const vid = idValido(id);
  if (!vid)
    return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 });

  const b = await req.json().catch(() => ({}));
  const motivo = String(b.motivo || "").trim();
  if (motivo.length < 5)
    return NextResponse.json(
      { error: "Indicá el motivo de la anulación (mínimo 5 caracteres)" },
      { status: 422 },
    );
  if (motivo.length > 200)
    return NextResponse.json(
      { error: "El motivo no puede superar los 200 caracteres" },
      { status: 422 },
    );

  const usuario = await usuarioActual();
  const conn = await db().getConnection();
  try {
    await conn.beginTransaction();
    const [ventas] = (await conn.query(
      "SELECT anulada, serie, nrofactura, totalfactura FROM VENTAS WHERE id = ? FOR UPDATE",
      [vid],
    )) as [VentaRow[], unknown];
    const v = ventas[0];
    if (!v) {
      await conn.rollback();
      return NextResponse.json(
        { error: "Venta no encontrada" },
        { status: 404 },
      );
    }
    if (v.anulada) {
      await conn.rollback();
      return NextResponse.json(
        { error: "La factura ya estaba anulada" },
        { status: 409 },
      );
    }

    const [[{ cobrado }]] = (await conn.query(
      `SELECT IFNULL(SUM(cobrado),0) AS cobrado FROM CUENTAS_COBRAR
       WHERE tabla = 'VENTAS' AND tablaid = ? FOR UPDATE`,
      [vid],
    )) as [{ cobrado: number }[], unknown];
    if (Number(cobrado) > 0) {
      await conn.rollback();
      return NextResponse.json(
        {
          error:
            "La factura tiene cobros registrados; no se puede anular sin revertirlos primero",
        },
        { status: 409 },
      );
    }

    await conn.query(
      `UPDATE VENTAS
         SET anulada = 1, anulada_fecha = NOW(), anulada_usuario = ?, anulada_motivo = ?
       WHERE id = ?`,
      [usuario, motivo, vid],
    );
    const [res] = (await conn.query(
      "UPDATE CUENTAS_COBRAR SET anulada = 1 WHERE tabla = 'VENTAS' AND tablaid = ?",
      [vid],
    )) as [{ affectedRows: number }, unknown];

    await auditar(
      "ANULAR",
      "VENTAS",
      vid,
      `Factura ${v.serie}-${String(v.nrofactura).padStart(7, "0")} por ${Math.round(Number(v.totalfactura))} Gs; ${res.affectedRows} cuota(s) anulada(s). Motivo: ${motivo}`,
      conn,
    );
    await conn.commit();
    return NextResponse.json({ id: vid, cuotas: res.affectedRows });
  } catch (e) {
    await conn.rollback();
    console.error(e);
    return NextResponse.json(
      { error: "No se pudo anular la factura" },
      { status: 500 },
    );
  } finally {
    conn.release();
  }
}

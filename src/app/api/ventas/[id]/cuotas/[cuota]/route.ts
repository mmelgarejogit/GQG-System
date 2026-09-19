import { NextRequest, NextResponse } from "next/server";
import { exec, q } from "@/lib/db";
import { idValido } from "@/lib/params";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; cuota: string }> },
) {
  const { id, cuota } = await params;
  const vid = idValido(id);
  const nro = idValido(cuota);
  if (!vid || !nro)
    return NextResponse.json({ error: "Cuota no encontrada" }, { status: 404 });

  const [cc] = await q<{ anulada: number }>(
    `SELECT anulada FROM CUENTAS_COBRAR
     WHERE tabla = 'VENTAS' AND tablaid = ? AND cuota = ?`,
    [vid, nro],
  );
  if (!cc)
    return NextResponse.json({ error: "Cuota no encontrada" }, { status: 404 });
  if (cc.anulada)
    return NextResponse.json(
      { error: "La factura está anulada; no se pueden registrar cobros" },
      { status: 409 },
    );

  const res = await exec(
    `UPDATE CUENTAS_COBRAR SET cobrado = importe
     WHERE tabla = 'VENTAS' AND tablaid = ? AND cuota = ?
       AND anulada = 0 AND cobrado < importe`,
    [vid, nro],
  );
  if (!res.affectedRows)
    return NextResponse.json(
      { error: "La cuota ya estaba cobrada" },
      { status: 409 },
    );
  return NextResponse.json({ ok: true });
}

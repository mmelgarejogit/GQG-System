import { NextRequest, NextResponse } from "next/server";
import { exec } from "@/lib/db";
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

  const res = await exec(
    `UPDATE CUENTAS_COBRAR SET cobrado = importe
     WHERE tabla = 'VENTAS' AND tablaid = ? AND cuota = ? AND cobrado < importe`,
    [vid, nro],
  );
  if (!res.affectedRows)
    return NextResponse.json(
      { error: "La cuota no existe o ya estaba cobrada" },
      { status: 409 },
    );
  return NextResponse.json({ ok: true });
}

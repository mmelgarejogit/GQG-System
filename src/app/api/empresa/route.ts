import { NextRequest, NextResponse } from "next/server";
import { q, exec } from "@/lib/db";
import { fechaValida } from "@/lib/params";

export async function GET() {
  const [e] = await q(
    `SELECT id, empresa, direccion, telefono, mail, ruc, timbrado,
            DATE_FORMAT(timbrado_vence, '%Y-%m-%d') AS timbrado_vence
     FROM EMPRESAS ORDER BY id LIMIT 1`,
  );
  return NextResponse.json(e ?? null);
}

export async function PUT(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  const empresa = String(b.empresa || "").trim();
  const ruc = String(b.ruc || "").trim();
  const timbrado = String(b.timbrado || "").trim();
  const timbradoVence = String(b.timbrado_vence || "").slice(0, 10);
  if (!empresa)
    return NextResponse.json(
      { error: "Nombre de la empresa requerido" },
      { status: 422 },
    );
  if (!ruc)
    return NextResponse.json({ error: "RUC requerido" }, { status: 422 });
  if (!/^\d{8}$/.test(timbrado))
    return NextResponse.json(
      { error: "El timbrado debe tener 8 dígitos" },
      { status: 422 },
    );
  if (!fechaValida(timbradoVence))
    return NextResponse.json(
      { error: "Fecha de vencimiento del timbrado inválida" },
      { status: 422 },
    );

  const [e] = await q<{ id: number }>(
    "SELECT id FROM EMPRESAS ORDER BY id LIMIT 1",
  );
  if (!e)
    return NextResponse.json(
      { error: "No hay empresa cargada" },
      { status: 404 },
    );

  await exec(
    `UPDATE EMPRESAS
       SET empresa = ?, direccion = ?, telefono = ?, mail = ?, ruc = ?,
           timbrado = ?, timbrado_vence = ?
     WHERE id = ?`,
    [
      empresa,
      String(b.direccion || ""),
      String(b.telefono || ""),
      String(b.mail || ""),
      ruc,
      timbrado,
      timbradoVence,
      e.id,
    ],
  );
  return NextResponse.json({ id: e.id });
}

import { NextRequest, NextResponse } from "next/server";
import { exec } from "@/lib/db";
import { idValido } from "@/lib/params";

// Editar cliente.
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const cid = idValido(id);
  if (!cid)
    return NextResponse.json(
      { error: "Cliente no encontrado" },
      { status: 404 },
    );
  const b = await req.json().catch(() => ({}));
  const nombres = String(b.nombres || "").trim();
  if (!nombres)
    return NextResponse.json({ error: "Nombre requerido" }, { status: 422 });

  const res = await exec(
    `UPDATE CLIENTES
       SET nombres=?, apellidos=?, documentonro=?, direccion=?, email=?, telefono=?
     WHERE id=? AND activo=1`,
    [
      nombres,
      String(b.apellidos || ""),
      String(b.documentonro || ""),
      String(b.direccion || ""),
      String(b.email || ""),
      String(b.telefono || ""),
      cid,
    ],
  );
  if (!res.affectedRows)
    return NextResponse.json(
      { error: "Cliente no encontrado" },
      { status: 404 },
    );
  return NextResponse.json({ id: cid });
}

// Reactivar cliente (vuelve a aparecer en los listados y selectores).
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const cid = idValido(id);
  if (!cid)
    return NextResponse.json(
      { error: "Cliente no encontrado" },
      { status: 404 },
    );
  const res = await exec("UPDATE CLIENTES SET activo=1 WHERE id=?", [cid]);
  if (!res.affectedRows)
    return NextResponse.json(
      { error: "Cliente no encontrado" },
      { status: 404 },
    );
  return NextResponse.json({ id: cid });
}

// Desactivar cliente (baja logica).
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const cid = idValido(id);
  if (!cid)
    return NextResponse.json(
      { error: "Cliente no encontrado" },
      { status: 404 },
    );
  const res = await exec("UPDATE CLIENTES SET activo=0 WHERE id=?", [cid]);
  if (!res.affectedRows)
    return NextResponse.json(
      { error: "Cliente no encontrado" },
      { status: 404 },
    );
  return NextResponse.json({ id: cid });
}

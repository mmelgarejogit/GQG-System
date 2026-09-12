import { NextRequest, NextResponse } from "next/server";
import { q, db } from "@/lib/db";

type Plazo = {
  id: number;
  plazo: string;
  tipoid: number;
  cuotas: number;
  irregular: number;
};
type Det = { plazoid: number; cuota: number; dias: number };

export async function GET() {
  const plazos = await q<Plazo>(
    "SELECT id, plazo, tipoid, cuotas, irregular FROM PLAZOS ORDER BY id",
  );
  const dets = await q<Det>(
    "SELECT plazoid, cuota, dias FROM PLAZO_DETALLES ORDER BY plazoid, cuota",
  );
  const map: Record<number, { cuota: number; dias: number }[]> = {};
  for (const d of dets)
    (map[d.plazoid] ??= []).push({ cuota: d.cuota, dias: d.dias });
  return NextResponse.json(
    plazos.map((p) => ({ ...p, detalles: map[p.id] ?? [] })),
  );
}

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  const plazo = String(b.plazo || "").trim();
  const tipoid = Number(b.tipoid);
  const credito = tipoid === 1;
  const cuotas = credito ? Number(b.cuotas) : 1;
  const irregular = credito && b.irregular ? 1 : 0;
  const detalles: { cuota: number; dias: number }[] = Array.isArray(b.detalles)
    ? b.detalles
    : [];

  if (!plazo)
    return NextResponse.json(
      { error: "Nombre del plazo requerido" },
      { status: 422 },
    );
  if (![0, 1].includes(tipoid))
    return NextResponse.json(
      { error: "tipoid debe ser 0 (contado) o 1 (credito)" },
      { status: 422 },
    );
  if (!Number.isInteger(cuotas) || cuotas < 1 || cuotas > 120)
    return NextResponse.json(
      { error: "Cantidad de cuotas invalida (1 a 120)" },
      { status: 422 },
    );
  if (irregular) {
    if (detalles.length !== cuotas)
      return NextResponse.json(
        { error: "Un plazo irregular necesita los dias de cada cuota" },
        { status: 422 },
      );
    let anterior = 0;
    for (const d of detalles) {
      const dias = Number(d.dias);
      if (!Number.isInteger(dias) || dias < 1)
        return NextResponse.json(
          { error: "Dias de cuota invalidos" },
          { status: 422 },
        );
      if (dias <= anterior)
        return NextResponse.json(
          { error: "Los dias de cada cuota deben ser crecientes" },
          { status: 422 },
        );
      anterior = dias;
    }
  }

  const conn = await db().getConnection();
  try {
    await conn.beginTransaction();
    const [[{ maxid }]] = (await conn.query(
      "SELECT IFNULL(MAX(id),0) AS maxid FROM PLAZOS FOR UPDATE",
    )) as [{ maxid: number }[], unknown];
    const id = Number(maxid) + 1;
    await conn.query(
      "INSERT INTO PLAZOS (id, plazo, tipoid, cuotas, irregular) VALUES (?,?,?,?,?)",
      [id, plazo, tipoid, cuotas, irregular],
    );
    if (irregular) {
      const [[{ maxd }]] = (await conn.query(
        "SELECT IFNULL(MAX(id),0) AS maxd FROM PLAZO_DETALLES FOR UPDATE",
      )) as [{ maxd: number }[], unknown];
      let did = Number(maxd);
      for (let i = 0; i < detalles.length; i++) {
        did++;
        await conn.query(
          "INSERT INTO PLAZO_DETALLES (id, plazoid, cuota, dias) VALUES (?,?,?,?)",
          [did, id, i + 1, Number(detalles[i].dias)],
        );
      }
    }
    await conn.commit();
    return NextResponse.json({ id }, { status: 201 });
  } catch (e) {
    await conn.rollback();
    console.error(e);
    return NextResponse.json(
      { error: "No se pudo crear el plazo" },
      { status: 500 },
    );
  } finally {
    conn.release();
  }
}

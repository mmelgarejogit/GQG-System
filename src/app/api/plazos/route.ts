import { NextRequest, NextResponse } from "next/server";
import { q, db } from "@/lib/db";
import { validarPlazo } from "@/lib/plazos";

type Plazo = {
  id: number;
  plazo: string;
  tipoid: number;
  cuotas: number;
  irregular: number;
  activo: number;
  usos: number;
};
type Det = { plazoid: number; cuota: number; dias: number };

export async function GET() {
  const plazos = await q<Plazo>(
    `SELECT p.id, p.plazo, p.tipoid, p.cuotas, p.irregular, p.activo,
            (SELECT COUNT(*) FROM VENTAS v WHERE v.plazoid = p.id) AS usos
     FROM PLAZOS p ORDER BY p.activo DESC, p.id`,
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
  const tipoid = Number(b.tipoid);
  if (![0, 1].includes(tipoid))
    return NextResponse.json(
      { error: "tipoid debe ser 0 (contado) o 1 (credito)" },
      { status: 422 },
    );
  const v = validarPlazo(b, tipoid);
  if ("error" in v) return NextResponse.json(v, { status: 422 });

  const conn = await db().getConnection();
  try {
    await conn.beginTransaction();
    const [[{ maxid }]] = (await conn.query(
      "SELECT IFNULL(MAX(id),0) AS maxid FROM PLAZOS FOR UPDATE",
    )) as [{ maxid: number }[], unknown];
    const id = Number(maxid) + 1;
    await conn.query(
      "INSERT INTO PLAZOS (id, plazo, tipoid, cuotas, irregular) VALUES (?,?,?,?,?)",
      [id, v.plazo, tipoid, v.cuotas, v.irregular],
    );
    if (v.irregular) {
      const [[{ maxd }]] = (await conn.query(
        "SELECT IFNULL(MAX(id),0) AS maxd FROM PLAZO_DETALLES FOR UPDATE",
      )) as [{ maxd: number }[], unknown];
      let did = Number(maxd);
      for (const d of v.detalles) {
        did++;
        await conn.query(
          "INSERT INTO PLAZO_DETALLES (id, plazoid, cuota, dias) VALUES (?,?,?,?)",
          [did, id, d.cuota, d.dias],
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

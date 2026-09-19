import { NextRequest, NextResponse } from "next/server";
import type { PoolConnection } from "mysql2/promise";
import { enTransaccion } from "@/lib/transaccion";
import { auditar } from "@/lib/auditoria";
import { idValido } from "@/lib/params";
import { validarPlazo, type DetallePlazo } from "@/lib/plazos";

type PlazoRow = {
  id: number;
  plazo: string;
  tipoid: number;
  cuotas: number;
  irregular: number;
  activo: number;
};

type Contexto = { params: Promise<{ id: string }> };

const noEncontrado = () =>
  NextResponse.json({ error: "Plazo no encontrado" }, { status: 404 });

async function cargar(conn: PoolConnection, id: number) {
  const [filas] = (await conn.query(
    "SELECT id, plazo, tipoid, cuotas, irregular, activo FROM PLAZOS WHERE id = ? FOR UPDATE",
    [id],
  )) as [PlazoRow[], unknown];
  if (!filas[0]) return null;
  const [[{ usos }]] = (await conn.query(
    "SELECT COUNT(*) AS usos FROM VENTAS WHERE plazoid = ?",
    [id],
  )) as [{ usos: number }[], unknown];
  const [detalles] = (await conn.query(
    "SELECT cuota, dias FROM PLAZO_DETALLES WHERE plazoid = ? ORDER BY cuota",
    [id],
  )) as [DetallePlazo[], unknown];
  return { plazo: filas[0], usos: Number(usos), detalles };
}

export async function PUT(req: NextRequest, { params }: Contexto) {
  const pid = idValido((await params).id);
  if (!pid) return noEncontrado();
  const b = await req.json().catch(() => ({}));

  return enTransaccion(async (conn) => {
    const actual = await cargar(conn, pid);
    if (!actual) return noEncontrado();
    const { plazo: p, usos, detalles } = actual;

    const v = validarPlazo(
      p.tipoid === 1 ? b : { ...b, cuotas: 1, irregular: 0 },
      p.tipoid,
    );
    if ("error" in v) return NextResponse.json(v, { status: 422 });

    const cambiaEstructura =
      v.cuotas !== p.cuotas ||
      v.irregular !== p.irregular ||
      (v.irregular === 1 &&
        v.detalles.some(
          (d, i) =>
            d.dias !== detalles[i]?.dias || d.cuota !== detalles[i]?.cuota,
        ));

    if (cambiaEstructura && usos > 0)
      return NextResponse.json(
        {
          error: `El plazo ya se usó en ${usos} ${usos === 1 ? "venta" : "ventas"}: solo se puede cambiar el nombre. Para otras condiciones, dalo de baja y creá uno nuevo.`,
        },
        { status: 409 },
      );

    await conn.query(
      "UPDATE PLAZOS SET plazo = ?, cuotas = ?, irregular = ? WHERE id = ?",
      [v.plazo, v.cuotas, v.irregular, pid],
    );
    if (cambiaEstructura) {
      await conn.query("DELETE FROM PLAZO_DETALLES WHERE plazoid = ?", [pid]);
      if (v.irregular) {
        const [[{ maxd }]] = (await conn.query(
          "SELECT IFNULL(MAX(id),0) AS maxd FROM PLAZO_DETALLES FOR UPDATE",
        )) as [{ maxd: number }[], unknown];
        let did = Number(maxd);
        for (const d of v.detalles) {
          did++;
          await conn.query(
            "INSERT INTO PLAZO_DETALLES (id, plazoid, cuota, dias) VALUES (?,?,?,?)",
            [did, pid, d.cuota, d.dias],
          );
        }
      }
    }

    await auditar(
      "EDITAR",
      "PLAZOS",
      pid,
      cambiaEstructura
        ? `«${p.plazo}» → «${v.plazo}»: ${v.cuotas} cuota(s), ${v.irregular ? `irregular ${v.detalles.map((d) => d.dias).join("/")}` : "regular"}`
        : `Nombre «${p.plazo}» → «${v.plazo}»`,
      conn,
    );
    return NextResponse.json({ id: pid });
  }, "No se pudo modificar el plazo");
}

export async function DELETE(_req: NextRequest, { params }: Contexto) {
  const pid = idValido((await params).id);
  if (!pid) return noEncontrado();

  return enTransaccion(async (conn) => {
    const actual = await cargar(conn, pid);
    if (!actual) return noEncontrado();
    const { plazo: p, usos } = actual;

    if (p.tipoid === 0 && p.activo) {
      const [[{ otros }]] = (await conn.query(
        "SELECT COUNT(*) AS otros FROM PLAZOS WHERE tipoid = 0 AND activo = 1 AND id <> ?",
        [pid],
      )) as [{ otros: number }[], unknown];
      if (!Number(otros))
        return NextResponse.json(
          {
            error:
              "Es el único plazo de contado activo: sin él no se pueden registrar ventas al contado",
          },
          { status: 409 },
        );
    }

    if (usos > 0) {
      if (!p.activo)
        return NextResponse.json(
          { error: "El plazo ya estaba dado de baja" },
          { status: 409 },
        );
      await conn.query("UPDATE PLAZOS SET activo = 0 WHERE id = ?", [pid]);
      await auditar(
        "BAJA",
        "PLAZOS",
        pid,
        `«${p.plazo}» dado de baja (usado en ${usos} venta(s))`,
        conn,
      );
      return NextResponse.json({ id: pid, accion: "baja" });
    }

    await conn.query("DELETE FROM PLAZO_DETALLES WHERE plazoid = ?", [pid]);
    await conn.query("DELETE FROM PLAZOS WHERE id = ?", [pid]);
    await auditar("ELIMINAR", "PLAZOS", pid, `«${p.plazo}» eliminado`, conn);
    return NextResponse.json({ id: pid, accion: "eliminado" });
  }, "No se pudo eliminar el plazo");
}

export async function PATCH(_req: NextRequest, { params }: Contexto) {
  const pid = idValido((await params).id);
  if (!pid) return noEncontrado();

  return enTransaccion(async (conn) => {
    const actual = await cargar(conn, pid);
    if (!actual) return noEncontrado();
    if (actual.plazo.activo)
      return NextResponse.json(
        { error: "El plazo ya estaba activo" },
        { status: 409 },
      );
    await conn.query("UPDATE PLAZOS SET activo = 1 WHERE id = ?", [pid]);
    await auditar(
      "REACTIVAR",
      "PLAZOS",
      pid,
      `«${actual.plazo.plazo}» reactivado`,
      conn,
    );
    return NextResponse.json({ id: pid });
  }, "No se pudo reactivar el plazo");
}

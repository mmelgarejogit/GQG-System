"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "@/components/Icon";
import { Button, cx, inputCls } from "@/components/ui";
import { fechaCorta } from "@/lib/format";

export type RangoFechas = { desde: string; hasta: string };

export const SIN_RANGO: RangoFechas = { desde: "", hasta: "" };

function iso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function atajos(): { nombre: string; rango: RangoFechas }[] {
  const h = new Date();
  const y = h.getFullYear();
  const m = h.getMonth();
  const d = h.getDate();
  return [
    { nombre: "Hoy", rango: { desde: iso(h), hasta: iso(h) } },
    {
      nombre: "Últimos 7 días",
      rango: { desde: iso(new Date(y, m, d - 6)), hasta: iso(h) },
    },
    {
      nombre: "Últimos 30 días",
      rango: { desde: iso(new Date(y, m, d - 29)), hasta: iso(h) },
    },
    {
      nombre: "Este mes",
      rango: {
        desde: iso(new Date(y, m, 1)),
        hasta: iso(new Date(y, m + 1, 0)),
      },
    },
    {
      nombre: "Mes anterior",
      rango: {
        desde: iso(new Date(y, m - 1, 1)),
        hasta: iso(new Date(y, m, 0)),
      },
    },
    {
      nombre: "Este año",
      rango: { desde: `${y}-01-01`, hasta: `${y}-12-31` },
    },
  ];
}

export function enRango(fecha: string, r: RangoFechas) {
  const f = fecha.slice(0, 10);
  return (!r.desde || f >= r.desde) && (!r.hasta || f <= r.hasta);
}

function etiqueta(r: RangoFechas) {
  if (!r.desde && !r.hasta) return "Todas las fechas";
  const atajo = atajos().find(
    (a) => a.rango.desde === r.desde && a.rango.hasta === r.hasta,
  );
  if (atajo) return atajo.nombre;
  if (r.desde && r.hasta)
    return r.desde === r.hasta
      ? fechaCorta(r.desde)
      : `${fechaCorta(r.desde)} – ${fechaCorta(r.hasta)}`;
  return r.desde
    ? `Desde ${fechaCorta(r.desde)}`
    : `Hasta ${fechaCorta(r.hasta)}`;
}

export default function FiltroFechas({
  value,
  onChange,
}: {
  value: RangoFechas;
  onChange: (r: RangoFechas) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);
  const activo = Boolean(value.desde || value.hasta);

  useEffect(() => {
    if (!abierto) return;
    function fuera(e: MouseEvent) {
      if (raiz.current && !raiz.current.contains(e.target as Node))
        setAbierto(false);
    }
    function escape(e: KeyboardEvent) {
      if (e.key === "Escape") setAbierto(false);
    }
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("keydown", escape);
    };
  }, [abierto]);

  function cambiar(campo: keyof RangoFechas, fecha: string) {
    const r = { ...value, [campo]: fecha };
    if (r.desde && r.hasta && r.desde > r.hasta) {
      if (campo === "desde") r.hasta = fecha;
      else r.desde = fecha;
    }
    onChange(r);
  }

  return (
    <div ref={raiz} className="relative">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={abierto}
        onClick={() => setAbierto((a) => !a)}
        className={cx(
          "flex h-9 items-center gap-2 rounded-md border bg-surface px-2.5 text-sm whitespace-nowrap",
          activo
            ? "border-primary text-primary-strong"
            : "border-line-strong text-ink",
        )}
      >
        <Icon name="plazos" size={15} stroke={1.8} color="currentColor" />
        {etiqueta(value)}
      </button>

      {abierto && (
        <div
          role="dialog"
          aria-label="Filtrar por fecha"
          className="absolute top-full left-0 z-20 mt-1 flex w-[min(360px,calc(100vw-7rem))] flex-col gap-3 rounded-md border border-line-strong bg-surface p-3 shadow-sm"
        >
          <div className="flex flex-wrap gap-1.5">
            {atajos().map((a) => {
              const elegido =
                a.rango.desde === value.desde && a.rango.hasta === value.hasta;
              return (
                <button
                  key={a.nombre}
                  type="button"
                  aria-pressed={elegido}
                  onClick={() => {
                    onChange(a.rango);
                    setAbierto(false);
                  }}
                  className={cx(
                    "h-7 rounded-md border px-2.5 text-[12px]",
                    elegido
                      ? "border-primary bg-accent-soft font-medium text-primary-strong"
                      : "border-line-strong hover:bg-hover",
                  )}
                >
                  {a.nombre}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1.5 text-[11px] font-semibold tracking-[0.05em] text-muted">
              DESDE
              <input
                type="date"
                value={value.desde}
                max={value.hasta || undefined}
                onChange={(e) => cambiar("desde", e.target.value)}
                className={cx(
                  inputCls,
                  "font-mono text-[13px] tracking-normal",
                )}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-[11px] font-semibold tracking-[0.05em] text-muted">
              HASTA
              <input
                type="date"
                value={value.hasta}
                min={value.desde || undefined}
                onChange={(e) => cambiar("hasta", e.target.value)}
                className={cx(
                  inputCls,
                  "font-mono text-[13px] tracking-normal",
                )}
              />
            </label>
          </div>

          <div className="flex justify-between gap-2 border-t border-line-soft pt-3">
            <Button
              size="sm"
              disabled={!activo}
              onClick={() => onChange(SIN_RANGO)}
            >
              Todas las fechas
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() => setAbierto(false)}
            >
              Listo
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

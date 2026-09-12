"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import {
  Button,
  Card,
  Chip,
  ErrorBox,
  Label,
  SectionLabel,
  cx,
  inputCls,
  monoInputCls,
  tdCls,
  thCls,
} from "@/components/ui";

type Plazo = {
  id: number;
  plazo: string;
  tipoid: number;
  cuotas: number;
  irregular: number;
  detalles: { cuota: number; dias: number }[];
};

const segCls = (on: boolean) =>
  cx(
    "h-9 cursor-pointer text-sm font-semibold",
    on ? "bg-primary text-white" : "bg-surface text-muted hover:bg-hover",
  );

const FORM_INICIAL = {
  nombre: "",
  irregular: true,
  cant: "3",
  dias: ["30", "45", "60"],
};

function diasTexto(p: Plazo): string {
  if (p.tipoid === 0) return "—";
  if (p.irregular) return p.detalles.map((d) => d.dias).join(" / ");
  return Array.from({ length: p.cuotas }, (_, i) => (i + 1) * 30).join(" / ");
}

export default function PlazosPage() {
  const [plazos, setPlazos] = useState<Plazo[] | null>(null);
  const [f, setF] = useState(FORM_INICIAL);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  function cargar() {
    fetch("/api/plazos")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setPlazos)
      .catch(() => setError("No se pudieron cargar los plazos."));
  }
  useEffect(cargar, []);

  const n = Math.max(0, Math.min(120, Number(f.cant) || 0));

  function setCant(valor: string) {
    const limpio = valor.replace(/\D/g, "");
    const cant = Math.min(120, Number(limpio) || 0);
    const dias = f.dias.slice(0, cant);
    while (dias.length < cant) dias.push(String((dias.length + 1) * 30));
    setF({ ...f, cant: limpio, dias });
    setOk(false);
  }

  const diaInvalido = (i: number) => {
    const v = Number(f.dias[i]);
    return !(v > 0) || (i > 0 && !(v > Number(f.dias[i - 1])));
  };
  const diasOk = f.dias.every((_, i) => !diaInvalido(i));

  async function guardar() {
    if (!f.nombre.trim()) return setError("El nombre es obligatorio.");
    if (n < 1) return setError("La cantidad de cuotas debe ser al menos 1.");
    if (f.irregular && !diasOk)
      return setError("Los días deben ser crecientes y mayores a cero.");
    setBusy(true);
    setError(null);
    const r = await fetch("/api/plazos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plazo: f.nombre,
        tipoid: 1,
        cuotas: n,
        irregular: f.irregular,
        detalles: f.irregular
          ? f.dias.map((d, i) => ({ cuota: i + 1, dias: Number(d) }))
          : [],
      }),
    });
    setBusy(false);
    if (r.ok) {
      setF(FORM_INICIAL);
      setOk(true);
      cargar();
    } else {
      const d = await r.json().catch(() => ({}));
      setError(d.error || "No se pudo crear el plazo.");
    }
  }

  return (
    <div className="flex flex-wrap items-start gap-6">
      <Card className="min-w-0 flex-[1_1_480px] overflow-hidden">
        <div className="border-b border-line p-4">
          <div className="text-base font-semibold">Plazos de pago</div>
          <div className="mt-0.5 text-[13px] text-muted">
            Definen cuántas cuotas se generan y cada cuántos días vencen.
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-head">
                <th className={cx(thCls, "pl-4")}>NOMBRE</th>
                <th className={thCls}>MODALIDAD</th>
                <th className={cx(thCls, "text-right")}>CUOTAS</th>
                <th className={thCls}>DÍAS</th>
                <th className={cx(thCls, "pr-4")}>TIPO</th>
              </tr>
            </thead>
            <tbody>
              {(plazos ?? []).map((p) => (
                <tr key={p.id} className="border-b border-line hover:bg-hover">
                  <td className={cx(tdCls, "pl-4 font-medium")}>{p.plazo}</td>
                  <td className={tdCls}>
                    <Chip tono={p.tipoid === 1 ? "credito" : "neutro"}>
                      {p.tipoid === 1 ? "Crédito" : "Contado"}
                    </Chip>
                  </td>
                  <td className={cx(tdCls, "text-right font-mono")}>
                    {p.cuotas}
                  </td>
                  <td className={cx(tdCls, "font-mono text-muted")}>
                    {diasTexto(p)}
                  </td>
                  <td className={cx(tdCls, "pr-4 text-muted")}>
                    {p.tipoid === 0
                      ? "Contado"
                      : p.irregular
                        ? "Irregular"
                        : "Regular"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="min-w-0 flex-[1_1_320px] p-4 lg:max-w-[520px]">
        <SectionLabel className="mb-4">NUEVO PLAZO DE CRÉDITO</SectionLabel>
        <Label>NOMBRE</Label>
        <input
          value={f.nombre}
          onChange={(e) => {
            setF({ ...f, nombre: e.target.value });
            setOk(false);
          }}
          placeholder="CR-30/45/60 días"
          className={cx(inputCls, "mb-4")}
        />
        <Label>TIPO DE VENCIMIENTO</Label>
        <div className="mb-4 grid grid-cols-2 overflow-hidden rounded-md border border-line-strong">
          <button
            onClick={() => setF({ ...f, irregular: false })}
            className={segCls(!f.irregular)}
          >
            Regular
          </button>
          <button
            onClick={() => setF({ ...f, irregular: true })}
            className={segCls(f.irregular)}
          >
            Irregular
          </button>
        </div>
        <Label>CANTIDAD DE CUOTAS</Label>
        <input
          inputMode="numeric"
          value={f.cant}
          onChange={(e) => setCant(e.target.value)}
          className={monoInputCls}
        />

        {!f.irregular && n > 0 && (
          <div className="mt-2 text-xs text-subtle">
            Vencimientos cada 30 días desde la fecha de factura:{" "}
            {Array.from(
              { length: Math.min(n, 12) },
              (_, i) => (i + 1) * 30,
            ).join(" / ")}
            {n > 12 ? " …" : ""} días.
          </div>
        )}

        {f.irregular && n > 0 && (
          <div className="mt-4">
            <Label>DÍAS POR CUOTA</Label>
            <div className="flex max-h-72 flex-col gap-2 overflow-y-auto">
              {f.dias.map((v, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-16 font-mono text-xs text-subtle">
                    Cuota {i + 1}
                  </span>
                  <input
                    inputMode="numeric"
                    value={v}
                    onChange={(e) => {
                      const dias = f.dias.slice();
                      dias[i] = e.target.value.replace(/\D/g, "");
                      setF({ ...f, dias });
                    }}
                    className={cx(
                      "h-8 w-[88px] rounded-md border bg-surface px-2 text-right font-mono text-[13px]",
                      diaInvalido(i) ? "border-error" : "border-line-strong",
                    )}
                  />
                  <span className="text-xs text-subtle">días</span>
                </div>
              ))}
            </div>
            {!diasOk && (
              <div className="mt-2 flex items-start gap-2 rounded-md bg-error-soft px-2.5 py-2">
                <Icon
                  name="alerta"
                  size={16}
                  stroke={1.8}
                  color="#93000A"
                  className="mt-px flex-none"
                />
                <span className="text-xs text-error-strong">
                  Los días deben ser crecientes y mayores a cero.
                </span>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mt-4">
            <ErrorBox>{error}</ErrorBox>
          </div>
        )}
        {ok && <div className="mt-4 text-[13px] text-ok">Plazo creado.</div>}

        <div className="mt-4 flex gap-2">
          <Button
            variant="primary"
            className="flex-1"
            onClick={guardar}
            disabled={busy}
          >
            {busy ? "Guardando..." : "Guardar plazo"}
          </Button>
          <Button
            onClick={() => {
              setF(FORM_INICIAL);
              setError(null);
            }}
          >
            Limpiar
          </Button>
        </div>
      </Card>
    </div>
  );
}

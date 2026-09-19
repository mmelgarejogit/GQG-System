"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Button,
  Card,
  ErrorBox,
  Label,
  cx,
  inputCls,
  monoInputCls,
  selectCls,
} from "@/components/ui";
import { fechaCorta, hoyIso } from "@/lib/format";

type Empresa = {
  id: number;
  empresa: string;
  direccion: string;
  telefono: string;
  mail: string;
  ruc: string;
  timbrado: string;
  timbrado_vence: string;
};

const VACIA: Empresa = {
  id: 0,
  empresa: "",
  direccion: "",
  telefono: "",
  mail: "",
  ruc: "",
  timbrado: "",
  timbrado_vence: "",
};

export default function EmpresaPage() {
  const [f, setF] = useState<Empresa>(VACIA);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  const cargar = useCallback(() => {
    fetch("/api/empresa")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(
        (e) =>
          e &&
          setF({
            ...VACIA,
            ...e,
            timbrado: e.timbrado ?? "",
            timbrado_vence: e.timbrado_vence ?? "",
          }),
      )
      .catch(() => setError("No se pudieron cargar los datos de la empresa."));
  }, []);

  useEffect(cargar, [cargar]);

  function set(k: keyof Empresa, v: string) {
    setOk(false);
    setF((x) => ({ ...x, [k]: v }));
  }

  async function guardar() {
    if (!f.empresa.trim()) return setError("La razón social es obligatoria.");
    if (!f.ruc.trim()) return setError("El RUC es obligatorio.");
    if (!/^\d{8}$/.test(f.timbrado.trim()))
      return setError("El timbrado debe tener 8 dígitos.");
    if (!f.timbrado_vence)
      return setError("Indicá el vencimiento del timbrado.");
    setBusy(true);
    setError(null);
    const r = await fetch("/api/empresa", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(f),
    });
    setBusy(false);
    if (r.ok) setOk(true);
    else {
      const d = await r.json().catch(() => ({}));
      setError(d.error || "No se pudo guardar.");
    }
  }

  const hoy = hoyIso();
  const vencido = !!f.timbrado_vence && f.timbrado_vence < hoy;
  const limite = new Date();
  limite.setDate(limite.getDate() + 30);
  const porVencer =
    !!f.timbrado_vence &&
    f.timbrado_vence <=
      `${limite.getFullYear()}-${String(limite.getMonth() + 1).padStart(2, "0")}-${String(limite.getDate()).padStart(2, "0")}`;

  return (
    <Card className="max-w-[720px] p-6">
      <div className="mb-1 text-base font-semibold">Datos del emisor</div>
      <div className="mb-6 text-[13px] text-muted">
        Se imprimen en la cabecera de cada factura.
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label>RAZÓN SOCIAL</Label>
          <input
            className={inputCls}
            value={f.empresa}
            onChange={(e) => set("empresa", e.target.value)}
          />
        </div>
        <div>
          <Label>RUC</Label>
          <input
            className={monoInputCls}
            value={f.ruc}
            onChange={(e) => set("ruc", e.target.value)}
          />
        </div>
        <div>
          <Label>MONEDA LOCAL</Label>
          <select className={selectCls} disabled>
            <option>Guaraní (Gs)</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <Label>DIRECCIÓN</Label>
          <input
            className={inputCls}
            value={f.direccion}
            onChange={(e) => set("direccion", e.target.value)}
          />
        </div>
        <div>
          <Label>TELÉFONO</Label>
          <input
            className={monoInputCls}
            value={f.telefono}
            onChange={(e) => set("telefono", e.target.value)}
          />
        </div>
        <div>
          <Label>EMAIL</Label>
          <input
            className={inputCls}
            value={f.mail}
            onChange={(e) => set("mail", e.target.value)}
          />
        </div>
        <div>
          <Label>TIMBRADO</Label>
          <input
            className={monoInputCls}
            inputMode="numeric"
            maxLength={8}
            placeholder="12557031"
            value={f.timbrado}
            onChange={(e) => set("timbrado", e.target.value.replace(/\D/g, ""))}
          />
        </div>
        <div>
          <Label>VENCIMIENTO TIMBRADO</Label>
          <input
            type="date"
            className={cx(monoInputCls, vencido && "border-error text-error")}
            value={f.timbrado_vence}
            onChange={(e) => set("timbrado_vence", e.target.value)}
          />
        </div>
      </div>
      {vencido && (
        <div className="mt-4">
          <ErrorBox titulo="Timbrado vencido">
            No se pueden emitir facturas con fecha posterior al{" "}
            {fechaCorta(f.timbrado_vence)}. Cargá el timbrado vigente.
          </ErrorBox>
        </div>
      )}
      {!vencido && porVencer && (
        <div className="mt-4 rounded-md bg-warn-soft px-3.5 py-3 text-[13px] text-warn">
          El timbrado vence el {fechaCorta(f.timbrado_vence)}: faltan menos de
          30 días.
        </div>
      )}
      {error && (
        <div className="mt-4">
          <ErrorBox>{error}</ErrorBox>
        </div>
      )}
      {ok && <div className="mt-4 text-[13px] text-ok">Datos guardados.</div>}
      <div className="mt-6 flex gap-2">
        <Button variant="primary" onClick={guardar} disabled={busy}>
          {busy ? "Guardando..." : "Guardar cambios"}
        </Button>
        <Button
          onClick={() => {
            setError(null);
            setOk(false);
            cargar();
          }}
          disabled={busy}
        >
          Descartar
        </Button>
      </div>
    </Card>
  );
}

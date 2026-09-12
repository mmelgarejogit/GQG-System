"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Button,
  Card,
  ErrorBox,
  Label,
  inputCls,
  monoInputCls,
  selectCls,
} from "@/components/ui";

type Empresa = {
  id: number;
  empresa: string;
  direccion: string;
  telefono: string;
  mail: string;
  ruc: string;
};

const VACIA: Empresa = {
  id: 0,
  empresa: "",
  direccion: "",
  telefono: "",
  mail: "",
  ruc: "",
};

export default function EmpresaPage() {
  const [f, setF] = useState<Empresa>(VACIA);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  const cargar = useCallback(() => {
    fetch("/api/empresa")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((e) => e && setF({ ...VACIA, ...e }))
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
      </div>
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

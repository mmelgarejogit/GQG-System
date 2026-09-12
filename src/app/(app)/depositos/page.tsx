"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Card,
  EmptyState,
  ErrorBox,
  Label,
  SectionLabel,
  cx,
  inputCls,
  monoInputCls,
  tdCls,
  thCls,
} from "@/components/ui";

type Deposito = {
  id: number;
  deposito: string;
  direccion: string;
  telefono: string;
};

const VACIO = { deposito: "", direccion: "", telefono: "" };

export default function DepositosPage() {
  const [depositos, setDepositos] = useState<Deposito[] | null>(null);
  const [f, setF] = useState(VACIO);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  function cargar() {
    fetch("/api/depositos")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setDepositos)
      .catch(() => setError("No se pudieron cargar los depósitos."));
  }
  useEffect(cargar, []);

  async function crear() {
    if (!f.deposito.trim()) return setError("El nombre es obligatorio.");
    setBusy(true);
    setError(null);
    const r = await fetch("/api/depositos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(f),
    });
    setBusy(false);
    if (r.ok) {
      setF(VACIO);
      setOk(true);
      cargar();
    } else {
      const d = await r.json().catch(() => ({}));
      setError(d.error || "No se pudo crear el depósito.");
    }
  }

  function set(k: keyof typeof VACIO, v: string) {
    setF((x) => ({ ...x, [k]: v }));
    setOk(false);
  }

  return (
    <div className="flex flex-wrap items-start gap-6">
      <Card className="min-w-0 flex-[1_1_440px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-head">
                <th className={cx(thCls, "pl-4")}>DEPÓSITO</th>
                <th className={thCls}>DIRECCIÓN</th>
                <th className={cx(thCls, "pr-4")}>TELÉFONO</th>
              </tr>
            </thead>
            <tbody>
              {(depositos ?? []).map((d) => (
                <tr key={d.id} className="border-b border-line hover:bg-hover">
                  <td className={cx(tdCls, "pl-4 font-medium")}>
                    {d.deposito}
                  </td>
                  <td className={cx(tdCls, "text-muted")}>
                    {d.direccion || "—"}
                  </td>
                  <td className={cx(tdCls, "pr-4 font-mono text-muted")}>
                    {d.telefono || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {depositos !== null && depositos.length === 0 && (
          <EmptyState
            icon="depositos"
            titulo="Todavía no hay depósitos"
            texto="Cargá la primera sucursal."
          />
        )}
      </Card>

      <Card className="min-w-0 flex-[1_1_320px] p-4 lg:max-w-[520px]">
        <SectionLabel className="mb-4">NUEVO DEPÓSITO</SectionLabel>
        <Label>NOMBRE</Label>
        <input
          placeholder="Sucursal Encarnación"
          className={cx(inputCls, "mb-4")}
          value={f.deposito}
          onChange={(e) => set("deposito", e.target.value)}
        />
        <Label>DIRECCIÓN</Label>
        <input
          placeholder="Av. Irrazábal 550"
          className={cx(inputCls, "mb-4")}
          value={f.direccion}
          onChange={(e) => set("direccion", e.target.value)}
        />
        <Label>TELÉFONO</Label>
        <input
          placeholder="071 204 500"
          className={cx(monoInputCls, "mb-4")}
          value={f.telefono}
          onChange={(e) => set("telefono", e.target.value)}
        />
        {error && (
          <div className="mb-4">
            <ErrorBox>{error}</ErrorBox>
          </div>
        )}
        {ok && <div className="mb-4 text-[13px] text-ok">Depósito creado.</div>}
        <Button
          variant="primary"
          className="w-full"
          onClick={crear}
          disabled={busy}
        >
          {busy ? "Guardando..." : "Guardar depósito"}
        </Button>
      </Card>
    </div>
  );
}

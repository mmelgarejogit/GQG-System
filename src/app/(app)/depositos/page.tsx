"use client";

import { useEffect, useState } from "react";
import ConfirmDialog from "@/components/ConfirmDialog";
import {
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorBox,
  IconButton,
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
  activo: number;
  usos: number;
};

const VACIO = { deposito: "", direccion: "", telefono: "" };

export default function DepositosPage() {
  const [depositos, setDepositos] = useState<Deposito[] | null>(null);
  const [f, setF] = useState(VACIO);
  const [editId, setEditId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorLista, setErrorLista] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmar, setConfirmar] = useState<Deposito | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  function cargar() {
    fetch("/api/depositos?inactivos=1")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setDepositos)
      .catch(() => setErrorLista("No se pudieron cargar los depósitos."));
  }
  useEffect(cargar, []);

  function limpiar() {
    setF(VACIO);
    setEditId(null);
    setError(null);
  }

  function editar(d: Deposito) {
    setEditId(d.id);
    setOk(null);
    setError(null);
    setF({
      deposito: d.deposito,
      direccion: d.direccion || "",
      telefono: d.telefono || "",
    });
  }

  async function guardar() {
    if (!f.deposito.trim()) return setError("El nombre es obligatorio.");
    setBusy(true);
    setError(null);
    const r = await fetch(
      editId ? `/api/depositos/${editId}` : "/api/depositos",
      {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(f),
      },
    );
    setBusy(false);
    if (r.ok) {
      setOk(editId ? "Depósito actualizado." : "Depósito creado.");
      limpiar();
      cargar();
    } else {
      const d = await r.json().catch(() => ({}));
      setError(d.error || "No se pudo guardar el depósito.");
    }
  }

  async function cambiarEstado() {
    if (!confirmar) return;
    setConfirmBusy(true);
    const r = await fetch(`/api/depositos/${confirmar.id}`, {
      method: confirmar.activo ? "DELETE" : "PATCH",
    });
    const d = await r.json().catch(() => ({}));
    setConfirmBusy(false);
    setConfirmar(null);
    if (!r.ok) setErrorLista(d.error || "No se pudo actualizar el depósito.");
    else {
      setErrorLista(null);
      if (editId === confirmar.id) limpiar();
      setOk(
        !confirmar.activo
          ? "Depósito reactivado."
          : d.accion === "eliminado"
            ? "Depósito eliminado."
            : "Depósito dado de baja.",
      );
    }
    cargar();
  }

  function set(k: keyof typeof VACIO, v: string) {
    setF((x) => ({ ...x, [k]: v }));
    setOk(null);
  }

  const usado = Number(confirmar?.usos) > 0;

  return (
    <div className="flex flex-wrap items-start gap-6">
      <div className="flex min-w-0 flex-[1_1_440px] flex-col gap-4">
        {errorLista && <ErrorBox>{errorLista}</ErrorBox>}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-head">
                  <th className={cx(thCls, "pl-4")}>DEPÓSITO</th>
                  <th className={thCls}>DIRECCIÓN</th>
                  <th className={thCls}>TELÉFONO</th>
                  <th className={cx(thCls, "text-right")}>VENTAS</th>
                  <th className={thCls}>ESTADO</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {(depositos ?? []).map((d) => {
                  const activo = d.activo === 1;
                  return (
                    <tr
                      key={d.id}
                      className={cx(
                        "border-b border-line hover:bg-hover",
                        editId === d.id && "bg-accent-soft",
                        !activo && "text-subtle",
                      )}
                    >
                      <td className={cx(tdCls, "pl-4 font-medium")}>
                        {d.deposito}
                      </td>
                      <td className={cx(tdCls, "text-muted")}>
                        {d.direccion || "—"}
                      </td>
                      <td
                        className={cx(
                          tdCls,
                          "font-mono whitespace-nowrap text-muted",
                        )}
                      >
                        {d.telefono || "—"}
                      </td>
                      <td className={cx(tdCls, "text-right font-mono")}>
                        {d.usos}
                      </td>
                      <td className={tdCls}>
                        <Chip tono={activo ? "ok" : "neutro"}>
                          {activo ? "Activo" : "Baja"}
                        </Chip>
                      </td>
                      <td className="px-4 py-2 text-right whitespace-nowrap">
                        {activo ? (
                          <>
                            <IconButton
                              icon="editar"
                              title="Editar"
                              aria-label="Editar"
                              className="mr-1"
                              onClick={() => editar(d)}
                            />
                            <IconButton
                              icon={Number(d.usos) > 0 ? "bloquear" : "borrar"}
                              danger
                              title={
                                Number(d.usos) > 0 ? "Dar de baja" : "Eliminar"
                              }
                              aria-label={
                                Number(d.usos) > 0 ? "Dar de baja" : "Eliminar"
                              }
                              onClick={() => setConfirmar(d)}
                            />
                          </>
                        ) : (
                          <IconButton
                            icon="check"
                            title="Reactivar"
                            aria-label="Reactivar"
                            onClick={() => setConfirmar(d)}
                          />
                        )}
                      </td>
                    </tr>
                  );
                })}
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
      </div>

      <Card className="min-w-0 flex-[1_1_320px] p-4 lg:max-w-[520px]">
        <div className="mb-4 flex items-center">
          <SectionLabel>
            {editId ? "EDITAR DEPÓSITO" : "NUEVO DEPÓSITO"}
          </SectionLabel>
          <div className="flex-1" />
          {editId && (
            <button
              onClick={limpiar}
              className="cursor-pointer text-xs text-subtle underline"
            >
              Cancelar edición
            </button>
          )}
        </div>
        <Label>NOMBRE</Label>
        <input
          placeholder="Sucursal Encarnación"
          maxLength={200}
          className={cx(inputCls, "mb-4")}
          value={f.deposito}
          onChange={(e) => set("deposito", e.target.value)}
        />
        <Label>DIRECCIÓN</Label>
        <input
          placeholder="Av. Irrazábal 550"
          maxLength={150}
          className={cx(inputCls, "mb-4")}
          value={f.direccion}
          onChange={(e) => set("direccion", e.target.value)}
        />
        <Label>TELÉFONO</Label>
        <input
          placeholder="071 204 500"
          maxLength={15}
          className={cx(monoInputCls, "mb-4")}
          value={f.telefono}
          onChange={(e) => set("telefono", e.target.value)}
        />
        {error && (
          <div className="mb-4">
            <ErrorBox>{error}</ErrorBox>
          </div>
        )}
        {ok && <div className="mb-4 text-[13px] text-ok">{ok}</div>}
        <Button
          variant="primary"
          className="w-full"
          onClick={guardar}
          disabled={busy}
        >
          {busy
            ? "Guardando..."
            : editId
              ? "Guardar cambios"
              : "Guardar depósito"}
        </Button>
      </Card>

      <ConfirmDialog
        open={confirmar !== null}
        danger={confirmar?.activo === 1}
        title={
          !confirmar
            ? ""
            : !confirmar.activo
              ? "Reactivar depósito"
              : usado
                ? "Dar de baja el depósito"
                : "Eliminar depósito"
        }
        message={
          !confirmar
            ? undefined
            : !confirmar.activo
              ? `«${confirmar.deposito}» volverá a estar disponible al facturar.`
              : usado
                ? `«${confirmar.deposito}» tiene ${confirmar.usos} ${Number(confirmar.usos) === 1 ? "venta" : "ventas"}, así que no se borra: deja de estar disponible al facturar y las facturas existentes lo conservan.`
                : `«${confirmar.deposito}» no tiene ventas y se eliminará definitivamente.`
        }
        confirmLabel={
          !confirmar?.activo ? "Reactivar" : usado ? "Dar de baja" : "Eliminar"
        }
        busy={confirmBusy}
        onConfirm={cambiarEstado}
        onClose={() => setConfirmar(null)}
      />
    </div>
  );
}

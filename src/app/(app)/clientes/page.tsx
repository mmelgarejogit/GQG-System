"use client";

import { useEffect, useMemo, useState } from "react";
import ConfirmDialog from "@/components/ConfirmDialog";
import {
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorBox,
  IconButton,
  Label,
  SearchInput,
  SectionLabel,
  cx,
  inputCls,
  monoInputCls,
  tdCls,
  thCls,
} from "@/components/ui";

type Cliente = {
  id: number;
  nombres: string;
  apellidos: string;
  documentonro: string;
  direccion: string;
  email: string;
  telefono: string;
  activo: number;
};

const VACIO = {
  nombres: "",
  apellidos: "",
  documentonro: "",
  direccion: "",
  email: "",
  telefono: "",
};
type Form = typeof VACIO;

const CAMPOS: [keyof Form, string, boolean][] = [
  ["nombres", "NOMBRES", false],
  ["apellidos", "APELLIDOS", false],
  ["documentonro", "CI / RUC", true],
  ["telefono", "TELÉFONO", true],
  ["direccion", "DIRECCIÓN", false],
  ["email", "EMAIL", false],
];

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[] | null>(null);
  const [q, setQ] = useState("");
  const [abierto, setAbierto] = useState(false);
  const [f, setF] = useState<Form>(VACIO);
  const [editId, setEditId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmar, setConfirmar] = useState<Cliente | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  function cargar() {
    fetch("/api/clientes?inactivos=1")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setClientes)
      .catch(() => setError("No se pudieron cargar los clientes."));
  }
  useEffect(cargar, []);

  const filtrados = useMemo(() => {
    const qn = q.trim().toLowerCase();
    return (clientes ?? []).filter(
      (c) =>
        !qn ||
        `${c.nombres} ${c.apellidos}`.toLowerCase().includes(qn) ||
        (c.documentonro || "").toLowerCase().includes(qn),
    );
  }, [clientes, q]);

  function nuevo() {
    setEditId(null);
    setF(VACIO);
    setError(null);
    setAbierto(true);
  }

  function editar(c: Cliente) {
    setEditId(c.id);
    setError(null);
    setF({
      nombres: c.nombres || "",
      apellidos: c.apellidos || "",
      documentonro: c.documentonro || "",
      direccion: c.direccion || "",
      email: c.email || "",
      telefono: c.telefono || "",
    });
    setAbierto(true);
  }

  function cerrar() {
    setAbierto(false);
    setEditId(null);
    setF(VACIO);
    setError(null);
  }

  async function guardar() {
    if (!f.nombres.trim()) return setError("El nombre es obligatorio.");
    setBusy(true);
    setError(null);
    const r = await fetch(
      editId ? `/api/clientes/${editId}` : "/api/clientes",
      {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(f),
      },
    );
    setBusy(false);
    if (r.ok) {
      cerrar();
      cargar();
    } else {
      const d = await r.json().catch(() => ({}));
      setError(d.error || "No se pudo guardar el cliente.");
    }
  }

  async function cambiarEstado() {
    if (!confirmar) return;
    setConfirmBusy(true);
    const r = await fetch(`/api/clientes/${confirmar.id}`, {
      method: confirmar.activo ? "DELETE" : "PATCH",
    });
    setConfirmBusy(false);
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      setError(d.error || "No se pudo actualizar el cliente.");
    } else if (editId === confirmar.id) cerrar();
    setConfirmar(null);
    cargar();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          value={q}
          onChange={setQ}
          placeholder="Buscar cliente o CI/RUC"
        />
        <div className="flex-1" />
        <Button variant="primary" onClick={nuevo}>
          Nuevo cliente
        </Button>
      </div>

      {error && !abierto && <ErrorBox>{error}</ErrorBox>}

      {abierto && (
        <Card className="p-4">
          <div className="mb-4 flex items-center">
            <SectionLabel>
              {editId ? "EDITAR CLIENTE" : "NUEVO CLIENTE"}
            </SectionLabel>
            <div className="flex-1" />
            <button
              onClick={cerrar}
              className="cursor-pointer text-xs text-subtle underline"
            >
              Cancelar
            </button>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
            {CAMPOS.map(([k, label, mono]) => (
              <div key={k}>
                <Label>{label}</Label>
                <input
                  className={mono ? monoInputCls : inputCls}
                  value={f[k]}
                  onChange={(e) => setF({ ...f, [k]: e.target.value })}
                />
              </div>
            ))}
          </div>
          {error && (
            <div className="mt-4">
              <ErrorBox>{error}</ErrorBox>
            </div>
          )}
          <div className="mt-4 flex gap-2">
            <Button variant="primary" onClick={guardar} disabled={busy}>
              {busy
                ? "Guardando..."
                : editId
                  ? "Guardar cambios"
                  : "Crear cliente"}
            </Button>
            <Button onClick={cerrar}>Descartar</Button>
          </div>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-head">
                <th className={cx(thCls, "pl-4")}>NOMBRES Y APELLIDOS</th>
                <th className={thCls}>CI / RUC</th>
                <th className={thCls}>DIRECCIÓN</th>
                <th className={thCls}>TELÉFONO</th>
                <th className={thCls}>EMAIL</th>
                <th className={thCls}>ESTADO</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {filtrados.map((c) => {
                const activo = c.activo === 1;
                return (
                  <tr
                    key={c.id}
                    className={cx(
                      "border-b border-line hover:bg-hover",
                      editId === c.id && "bg-accent-soft",
                    )}
                  >
                    <td className={cx(tdCls, "pl-4 font-medium")}>
                      {c.nombres} {c.apellidos}
                    </td>
                    <td className={cx(tdCls, "font-mono text-muted")}>
                      {c.documentonro || "—"}
                    </td>
                    <td className={cx(tdCls, "text-muted")}>
                      {c.direccion || "—"}
                    </td>
                    <td
                      className={cx(
                        tdCls,
                        "font-mono whitespace-nowrap text-muted",
                      )}
                    >
                      {c.telefono || "—"}
                    </td>
                    <td className={cx(tdCls, "text-muted")}>
                      {c.email || "—"}
                    </td>
                    <td className={tdCls}>
                      <Chip tono={activo ? "ok" : "neutro"}>
                        {activo ? "Activo" : "Inactivo"}
                      </Chip>
                    </td>
                    <td className="px-4 py-2 text-right whitespace-nowrap">
                      {activo ? (
                        <>
                          <IconButton
                            icon="editar"
                            title="Editar"
                            aria-label="Editar"
                            onClick={() => editar(c)}
                            className="mr-1"
                          />
                          <IconButton
                            icon="bloquear"
                            danger
                            title="Desactivar"
                            aria-label="Desactivar"
                            onClick={() => setConfirmar(c)}
                          />
                        </>
                      ) : (
                        <IconButton
                          icon="check"
                          title="Reactivar"
                          aria-label="Reactivar"
                          onClick={() => setConfirmar(c)}
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {clientes !== null && filtrados.length === 0 && (
          <EmptyState
            icon="clientes"
            titulo={
              clientes.length
                ? "Ningún cliente coincide"
                : "Todavía no hay clientes"
            }
            texto={
              clientes.length
                ? "Probá con otro nombre o número de documento."
                : "Cargá el primero con «Nuevo cliente»."
            }
          />
        )}
      </Card>

      <ConfirmDialog
        open={confirmar !== null}
        title={confirmar?.activo ? "Desactivar cliente" : "Reactivar cliente"}
        message={
          confirmar
            ? confirmar.activo
              ? `«${confirmar.nombres} ${confirmar.apellidos}» dejará de aparecer en nuevas ventas. Las facturas emitidas conservan sus datos.`
              : `«${confirmar.nombres} ${confirmar.apellidos}» volverá a estar disponible en las ventas.`
            : undefined
        }
        confirmLabel={confirmar?.activo ? "Desactivar" : "Reactivar"}
        danger={confirmar?.activo === 1}
        busy={confirmBusy}
        onConfirm={cambiarEstado}
        onClose={() => setConfirmar(null)}
      />
    </div>
  );
}

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
  SectionLabel,
  cx,
  inputCls,
  monoInputCls,
  selectCls,
  tdCls,
  thCls,
} from "@/components/ui";
import { gs } from "@/lib/format";

type Producto = {
  codbarra: string;
  productoid: number;
  producto: string;
  iva: number;
  servicio: number;
  precio: number;
  activo: number;
};

const VACIO = {
  producto: "",
  codbarra: "",
  iva: "10",
  servicio: "0",
  precio: "",
};

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[] | null>(null);
  const [filtro, setFiltro] = useState("activos");
  const [abierto, setAbierto] = useState(false);
  const [f, setF] = useState(VACIO);
  const [editId, setEditId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmar, setConfirmar] = useState<Producto | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  function cargar() {
    fetch("/api/productos?inactivos=1")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setProductos)
      .catch(() => setError("No se pudieron cargar los productos."));
  }
  useEffect(cargar, []);

  const filtrados = useMemo(
    () =>
      (productos ?? []).filter(
        (p) =>
          filtro === "todos" ||
          (filtro === "activos" ? p.activo === 1 : p.activo !== 1),
      ),
    [productos, filtro],
  );

  function nuevo() {
    setEditId(null);
    setF(VACIO);
    setError(null);
    setAbierto(true);
  }

  function editar(p: Producto) {
    setEditId(p.productoid);
    setError(null);
    setF({
      producto: p.producto,
      codbarra: p.codbarra,
      iva: String(Number(p.iva)),
      servicio: String(p.servicio),
      precio: p.precio ? String(Math.round(p.precio)) : "",
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
    if (!f.producto.trim()) return setError("El nombre es obligatorio.");
    if (!editId && !f.codbarra.trim())
      return setError("El código de barra es obligatorio.");
    setBusy(true);
    setError(null);
    const r = await fetch(
      editId ? `/api/productos/${editId}` : "/api/productos",
      {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          producto: f.producto,
          codbarra: f.codbarra,
          iva: Number(f.iva),
          servicio: Number(f.servicio),
          precio: Number(f.precio) || 0,
        }),
      },
    );
    setBusy(false);
    if (r.ok) {
      cerrar();
      cargar();
    } else {
      const d = await r.json().catch(() => ({}));
      setError(d.error || "No se pudo guardar el producto.");
    }
  }

  async function cambiarEstado() {
    if (!confirmar) return;
    setConfirmBusy(true);
    const r = await fetch(`/api/productos/${confirmar.productoid}`, {
      method: confirmar.activo ? "DELETE" : "PATCH",
    });
    setConfirmBusy(false);
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      setError(d.error || "No se pudo actualizar el producto.");
    } else if (editId === confirmar.productoid) cerrar();
    setConfirmar(null);
    cargar();
  }

  const vacioTexto =
    filtro === "inactivos"
      ? [
          "No hay productos dados de baja",
          "La baja lógica conserva el histórico de facturación.",
        ]
      : filtro === "activos" && (productos?.length ?? 0) > 0
        ? ["No hay productos activos", "Reactivá uno o cargá uno nuevo."]
        : [
            "Todavía no hay productos",
            "Cargá el primero con «Nuevo producto».",
          ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className={cx(selectCls, "w-auto")}
        >
          <option value="activos">Solo activos</option>
          <option value="inactivos">Solo dados de baja</option>
          <option value="todos">Todos</option>
        </select>
        <div className="flex-1" />
        <Button variant="primary" onClick={nuevo}>
          Nuevo producto
        </Button>
      </div>

      {error && !abierto && <ErrorBox>{error}</ErrorBox>}

      {abierto && (
        <Card className="p-4">
          <div className="mb-4 flex items-center">
            <SectionLabel>
              {editId ? "EDITAR PRODUCTO" : "NUEVO PRODUCTO"}
            </SectionLabel>
            <div className="flex-1" />
            <button
              onClick={cerrar}
              className="cursor-pointer text-xs text-subtle underline"
            >
              Cancelar
            </button>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
            <div className="sm:col-span-2">
              <Label>NOMBRE</Label>
              <input
                className={inputCls}
                value={f.producto}
                onChange={(e) => setF({ ...f, producto: e.target.value })}
              />
            </div>
            <div>
              <Label>CÓDIGO DE BARRA{editId ? " (NO EDITABLE)" : ""}</Label>
              <input
                className={monoInputCls}
                value={f.codbarra}
                disabled={editId !== null}
                onChange={(e) => setF({ ...f, codbarra: e.target.value })}
              />
            </div>
            <div>
              <Label>PRECIO (Gs)</Label>
              <input
                inputMode="numeric"
                placeholder="0"
                className={cx(monoInputCls, "text-right")}
                value={f.precio ? Number(f.precio).toLocaleString("es-PY") : ""}
                onChange={(e) =>
                  setF({ ...f, precio: e.target.value.replace(/\D/g, "") })
                }
              />
            </div>
            <div>
              <Label>IVA</Label>
              <select
                className={selectCls}
                value={f.iva}
                onChange={(e) => setF({ ...f, iva: e.target.value })}
              >
                <option value="10">10%</option>
                <option value="5">5%</option>
                <option value="0">Exento</option>
              </select>
            </div>
            <div>
              <Label>TIPO</Label>
              <select
                className={selectCls}
                value={f.servicio}
                onChange={(e) => setF({ ...f, servicio: e.target.value })}
              >
                <option value="0">Mercadería</option>
                <option value="1">Servicio</option>
              </select>
            </div>
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
                  : "Crear producto"}
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
                <th className={cx(thCls, "pl-4")}>CÓDIGO</th>
                <th className={thCls}>NOMBRE</th>
                <th className={thCls}>TIPO</th>
                <th className={cx(thCls, "text-center")}>IVA</th>
                <th className={cx(thCls, "text-right")}>PRECIO Gs</th>
                <th className={thCls}>ESTADO</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {filtrados.map((p) => {
                const activo = p.activo === 1;
                return (
                  <tr
                    key={p.codbarra}
                    className={cx(
                      "border-b border-line hover:bg-hover",
                      editId === p.productoid && "bg-accent-soft",
                    )}
                  >
                    <td
                      className={cx(tdCls, "pl-4 font-mono text-xs text-muted")}
                    >
                      {p.codbarra}
                    </td>
                    <td className={cx(tdCls, "font-medium")}>{p.producto}</td>
                    <td className={cx(tdCls, "text-muted")}>
                      {p.servicio ? "Servicio" : "Mercadería"}
                    </td>
                    <td
                      className={cx(tdCls, "text-center font-mono text-muted")}
                    >
                      {Number(p.iva)}%
                    </td>
                    <td
                      className={cx(tdCls, "text-right font-mono font-medium")}
                    >
                      {gs(p.precio)}
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
                            onClick={() => editar(p)}
                            className="mr-1"
                          />
                          <IconButton
                            icon="borrar"
                            danger
                            title="Dar de baja"
                            aria-label="Dar de baja"
                            onClick={() => setConfirmar(p)}
                          />
                        </>
                      ) : (
                        <IconButton
                          icon="check"
                          title="Reactivar"
                          aria-label="Reactivar"
                          onClick={() => setConfirmar(p)}
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {productos !== null && filtrados.length === 0 && (
          <EmptyState
            icon="productos"
            titulo={vacioTexto[0]}
            texto={vacioTexto[1]}
          />
        )}
      </Card>

      <ConfirmDialog
        open={confirmar !== null}
        title={
          confirmar?.activo ? "Dar de baja el producto" : "Reactivar producto"
        }
        message={
          confirmar
            ? confirmar.activo
              ? `«${confirmar.producto}» dejará de aparecer en nuevas facturas. Se conserva el histórico.`
              : `«${confirmar.producto}» volverá a estar disponible en las ventas.`
            : undefined
        }
        confirmLabel={confirmar?.activo ? "Dar de baja" : "Reactivar"}
        danger={confirmar?.activo === 1}
        busy={confirmBusy}
        onConfirm={cambiarEstado}
        onClose={() => setConfirmar(null)}
      />
    </div>
  );
}

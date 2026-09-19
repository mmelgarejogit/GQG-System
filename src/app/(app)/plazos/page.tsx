"use client";

import { useEffect, useState } from "react";
import ConfirmDialog from "@/components/ConfirmDialog";
import Icon from "@/components/Icon";
import {
  Button,
  Card,
  Chip,
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

type Plazo = {
  id: number;
  plazo: string;
  tipoid: number;
  cuotas: number;
  irregular: number;
  activo: number;
  usos: number;
  detalles: { cuota: number; dias: number }[];
};

type Form = {
  id: number | null;
  tipoid: number;
  usos: number;
  nombre: string;
  irregular: boolean;
  cant: string;
  dias: string[];
};

const segCls = (on: boolean) =>
  cx(
    "h-9 cursor-pointer text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60",
    on ? "bg-primary text-white" : "bg-surface text-muted hover:bg-hover",
  );

const FORM_INICIAL: Form = {
  id: null,
  tipoid: 1,
  usos: 0,
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
  const [f, setF] = useState<Form>(FORM_INICIAL);
  const [error, setError] = useState<string | null>(null);
  const [errorLista, setErrorLista] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmar, setConfirmar] = useState<Plazo | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  function cargar() {
    fetch("/api/plazos")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setPlazos)
      .catch(() => setErrorLista("No se pudieron cargar los plazos."));
  }
  useEffect(cargar, []);

  const editando = f.id !== null;
  const bloqueado = editando && (f.usos > 0 || f.tipoid === 0);
  const n = Math.max(0, Math.min(120, Number(f.cant) || 0));

  function setCant(valor: string) {
    const limpio = valor.replace(/\D/g, "");
    const cant = Math.min(120, Number(limpio) || 0);
    const dias = f.dias.slice(0, cant);
    while (dias.length < cant) dias.push(String((dias.length + 1) * 30));
    setF({ ...f, cant: limpio, dias });
    setOk(null);
  }

  const diaInvalido = (i: number) => {
    const v = Number(f.dias[i]);
    return !(v > 0) || (i > 0 && !(v > Number(f.dias[i - 1])));
  };
  const diasOk = f.dias.every((_, i) => !diaInvalido(i));

  function limpiar() {
    setF(FORM_INICIAL);
    setError(null);
  }

  function editar(p: Plazo) {
    setOk(null);
    setError(null);
    setF({
      id: p.id,
      tipoid: p.tipoid,
      usos: Number(p.usos),
      nombre: p.plazo,
      irregular: p.irregular === 1,
      cant: String(p.cuotas),
      dias: p.irregular
        ? p.detalles.map((d) => String(d.dias))
        : Array.from({ length: p.cuotas }, (_, i) => String((i + 1) * 30)),
    });
  }

  async function guardar() {
    if (!f.nombre.trim()) return setError("El nombre es obligatorio.");
    if (n < 1) return setError("La cantidad de cuotas debe ser al menos 1.");
    if (f.irregular && !diasOk)
      return setError("Los días deben ser crecientes y mayores a cero.");
    setBusy(true);
    setError(null);
    const r = await fetch(editando ? `/api/plazos/${f.id}` : "/api/plazos", {
      method: editando ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plazo: f.nombre,
        tipoid: f.tipoid,
        cuotas: n,
        irregular: f.irregular,
        detalles: f.irregular
          ? f.dias.map((d, i) => ({ cuota: i + 1, dias: Number(d) }))
          : [],
      }),
    });
    setBusy(false);
    if (r.ok) {
      setOk(editando ? "Plazo actualizado." : "Plazo creado.");
      setF(FORM_INICIAL);
      cargar();
    } else {
      const d = await r.json().catch(() => ({}));
      setError(d.error || "No se pudo guardar el plazo.");
    }
  }

  async function cambiarEstado() {
    if (!confirmar) return;
    setConfirmBusy(true);
    const r = await fetch(`/api/plazos/${confirmar.id}`, {
      method: confirmar.activo ? "DELETE" : "PATCH",
    });
    const d = await r.json().catch(() => ({}));
    setConfirmBusy(false);
    setConfirmar(null);
    if (!r.ok) setErrorLista(d.error || "No se pudo actualizar el plazo.");
    else {
      setErrorLista(null);
      if (f.id === confirmar.id) limpiar();
      setOk(
        !confirmar.activo
          ? "Plazo reactivado."
          : d.accion === "eliminado"
            ? "Plazo eliminado."
            : "Plazo dado de baja.",
      );
    }
    cargar();
  }

  const usado = Number(confirmar?.usos) > 0;

  return (
    <div className="flex flex-wrap items-start gap-6">
      <div className="flex min-w-0 flex-[1_1_480px] flex-col gap-4">
        {errorLista && <ErrorBox>{errorLista}</ErrorBox>}
        <Card className="overflow-hidden">
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
                  <th className={thCls}>TIPO</th>
                  <th className={cx(thCls, "text-right")}>VENTAS</th>
                  <th className={thCls}>ESTADO</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {(plazos ?? []).map((p) => {
                  const activo = p.activo === 1;
                  return (
                    <tr
                      key={p.id}
                      className={cx(
                        "border-b border-line hover:bg-hover",
                        f.id === p.id && "bg-accent-soft",
                        !activo && "text-subtle",
                      )}
                    >
                      <td className={cx(tdCls, "pl-4 font-medium")}>
                        {p.plazo}
                      </td>
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
                      <td className={cx(tdCls, "text-muted")}>
                        {p.tipoid === 0
                          ? "Contado"
                          : p.irregular
                            ? "Irregular"
                            : "Regular"}
                      </td>
                      <td className={cx(tdCls, "text-right font-mono")}>
                        {p.usos}
                      </td>
                      <td className={tdCls}>
                        <Chip tono={activo ? "ok" : "neutro"}>
                          {activo ? "Activo" : "Baja"}
                        </Chip>
                      </td>
                      <td className="px-4 py-2 text-right whitespace-nowrap">
                        {activo ? (
                          <>
                            <Button
                              size="sm"
                              className="mr-1 h-7 text-xs"
                              onClick={() => editar(p)}
                            >
                              Editar
                            </Button>
                            <IconButton
                              icon={Number(p.usos) > 0 ? "bloquear" : "borrar"}
                              danger
                              title={
                                Number(p.usos) > 0 ? "Dar de baja" : "Eliminar"
                              }
                              aria-label={
                                Number(p.usos) > 0 ? "Dar de baja" : "Eliminar"
                              }
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
        </Card>
      </div>

      <Card className="min-w-0 flex-[1_1_320px] p-4 lg:max-w-[520px]">
        <div className="mb-4 flex items-center">
          <SectionLabel>
            {editando ? "EDITAR PLAZO" : "NUEVO PLAZO DE CRÉDITO"}
          </SectionLabel>
          <div className="flex-1" />
          {editando && (
            <button
              onClick={limpiar}
              className="cursor-pointer text-xs text-subtle underline"
            >
              Cancelar edición
            </button>
          )}
        </div>

        {bloqueado && (
          <div className="mb-4 rounded-md bg-accent-soft px-3 py-2 text-xs text-primary-strong">
            {f.tipoid === 0
              ? "El plazo de contado siempre genera una cuota: solo se puede cambiar el nombre."
              : `Usado en ${f.usos} ${f.usos === 1 ? "venta" : "ventas"}: solo se puede cambiar el nombre para no alterar cuotas ya emitidas.`}
          </div>
        )}

        <Label>NOMBRE</Label>
        <input
          value={f.nombre}
          onChange={(e) => {
            setF({ ...f, nombre: e.target.value });
            setOk(null);
          }}
          maxLength={100}
          placeholder="CR-30/45/60 días"
          className={cx(inputCls, "mb-4")}
        />

        {f.tipoid === 1 && (
          <>
            <Label>TIPO DE VENCIMIENTO</Label>
            <div className="mb-4 grid grid-cols-2 overflow-hidden rounded-md border border-line-strong">
              <button
                onClick={() => setF({ ...f, irregular: false })}
                className={segCls(!f.irregular)}
                disabled={bloqueado}
              >
                Regular
              </button>
              <button
                onClick={() => setF({ ...f, irregular: true })}
                className={segCls(f.irregular)}
                disabled={bloqueado}
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
              disabled={bloqueado}
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
                        disabled={bloqueado}
                        onChange={(e) => {
                          const dias = f.dias.slice();
                          dias[i] = e.target.value.replace(/\D/g, "");
                          setF({ ...f, dias });
                        }}
                        className={cx(
                          "h-8 w-[88px] rounded-md border bg-surface px-2 text-right font-mono text-[13px] disabled:bg-bg disabled:text-muted",
                          diaInvalido(i)
                            ? "border-error"
                            : "border-line-strong",
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
          </>
        )}

        {error && (
          <div className="mt-4">
            <ErrorBox>{error}</ErrorBox>
          </div>
        )}
        {ok && <div className="mt-4 text-[13px] text-ok">{ok}</div>}

        <div className="mt-4 flex gap-2">
          <Button
            variant="primary"
            className="flex-1"
            onClick={guardar}
            disabled={busy}
          >
            {busy
              ? "Guardando..."
              : editando
                ? "Guardar cambios"
                : "Guardar plazo"}
          </Button>
          <Button onClick={limpiar}>Limpiar</Button>
        </div>
      </Card>

      <ConfirmDialog
        open={confirmar !== null}
        danger={confirmar?.activo === 1}
        title={
          !confirmar
            ? ""
            : !confirmar.activo
              ? "Reactivar plazo"
              : usado
                ? "Dar de baja el plazo"
                : "Eliminar plazo"
        }
        message={
          !confirmar
            ? undefined
            : !confirmar.activo
              ? `«${confirmar.plazo}» volverá a estar disponible en nuevas ventas.`
              : usado
                ? `«${confirmar.plazo}» se usó en ${confirmar.usos} ${Number(confirmar.usos) === 1 ? "venta" : "ventas"}, así que no se borra: deja de aparecer en nuevas ventas y las facturas existentes conservan sus cuotas.`
                : `«${confirmar.plazo}» no se usó en ninguna venta y se eliminará definitivamente.`
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

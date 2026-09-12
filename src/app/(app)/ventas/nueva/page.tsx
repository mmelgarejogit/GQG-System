"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import {
  Button,
  Card,
  ErrorBox,
  Fila,
  Label,
  SectionLabel,
  cx,
  inputCls,
  monoInputCls,
  selectCls,
} from "@/components/ui";
import { cuotaLabel, gs, hoyIso, sumarDias } from "@/lib/format";

type Cliente = {
  id: number;
  nombres: string;
  apellidos: string;
  documentonro: string;
};
type Plazo = {
  id: number;
  plazo: string;
  tipoid: number;
  cuotas: number;
  irregular: number;
  detalles: { cuota: number; dias: number }[];
};
type Producto = {
  codbarra: string;
  producto: string;
  iva: number;
  precio: number;
};
type Deposito = { id: number; deposito: string; direccion: string };
type Linea = {
  codbarra: string;
  producto: string;
  iva: number;
  cantidad: string;
  precio: string;
};

const segCls = (on: boolean) =>
  cx(
    "h-9 cursor-pointer text-sm font-semibold",
    on ? "bg-primary text-white" : "bg-surface text-muted hover:bg-hover",
  );

function diasDe(p: Plazo): number[] {
  if (p.tipoid === 0) return [0];
  return Array.from({ length: p.cuotas }, (_, i) =>
    p.irregular
      ? (p.detalles.find((d) => d.cuota === i + 1)?.dias ?? (i + 1) * 30)
      : (i + 1) * 30,
  );
}

function nombreCliente(c: Cliente) {
  return `${c.nombres} ${c.apellidos}`.trim();
}

export default function NuevaVentaPage() {
  const router = useRouter();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [plazos, setPlazos] = useState<Plazo[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [depositos, setDepositos] = useState<Deposito[]>([]);

  const [clienteQ, setClienteQ] = useState("");
  const [clienteId, setClienteId] = useState<number | null>(null);
  const [clienteDrop, setClienteDrop] = useState(false);
  const [errCliente, setErrCliente] = useState(false);
  const [inline, setInline] = useState(false);
  const [nc, setNc] = useState({
    nombres: "",
    apellidos: "",
    documentonro: "",
  });
  const [ncError, setNcError] = useState<string | null>(null);
  const [ncBusy, setNcBusy] = useState(false);

  const [fecha, setFecha] = useState(hoyIso);
  const [depositoId, setDepositoId] = useState("");
  const [credito, setCredito] = useState(true);
  const [plazoId, setPlazoId] = useState("");
  const [codigo, setCodigo] = useState("");
  const [codigoError, setCodigoError] = useState<string | null>(null);
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const clienteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const json = (u: string) => fetch(u).then((r) => (r.ok ? r.json() : []));
    void json("/api/clientes").then(setClientes);
    void json("/api/plazos").then(setPlazos);
    void json("/api/productos").then(setProductos);
    void json("/api/depositos").then((d: Deposito[]) => {
      setDepositos(d);
      if (d.length) setDepositoId(String(d[0].id));
    });
  }, []);

  useEffect(() => {
    function fuera(e: MouseEvent) {
      if (clienteRef.current && !clienteRef.current.contains(e.target as Node))
        setClienteDrop(false);
    }
    document.addEventListener("mousedown", fuera);
    return () => document.removeEventListener("mousedown", fuera);
  }, []);

  const plazosModo = useMemo(
    () => plazos.filter((p) => p.tipoid === (credito ? 1 : 0)),
    [plazos, credito],
  );

  useEffect(() => {
    if (!plazosModo.some((p) => String(p.id) === plazoId))
      setPlazoId(plazosModo[0] ? String(plazosModo[0].id) : "");
  }, [plazosModo, plazoId]);

  const plazo = plazos.find((p) => String(p.id) === plazoId) ?? null;

  const sugerencias = useMemo(() => {
    const q = clienteQ.trim().toLowerCase();
    return clientes
      .filter(
        (c) =>
          !q ||
          nombreCliente(c).toLowerCase().includes(q) ||
          (c.documentonro || "").toLowerCase().includes(q),
      )
      .slice(0, 6);
  }, [clientes, clienteQ]);

  const totales = useMemo(() => {
    let exento = 0,
      grav5 = 0,
      grav10 = 0,
      iva5 = 0,
      iva10 = 0,
      total = 0;
    for (const l of lineas) {
      const t = Math.round((Number(l.cantidad) || 0) * (Number(l.precio) || 0));
      total += t;
      if (l.iva === 5) {
        const iv = Math.round(t / 21);
        iva5 += iv;
        grav5 += t - iv;
      } else if (l.iva === 10) {
        const iv = Math.round(t / 11);
        iva10 += iv;
        grav10 += t - iv;
      } else exento += t;
    }
    return { exento, grav5, grav10, iva: iva5 + iva10, total };
  }, [lineas]);

  const preview = useMemo(() => {
    if (!plazo || totales.total <= 0) return [];
    const dias = diasDe(plazo);
    const n = dias.length;
    const base = Math.trunc(totales.total / n);
    return dias.map((d, i) => ({
      label: cuotaLabel(i + 1, n),
      vence: sumarDias(fecha, d),
      importe: i === n - 1 ? totales.total - base * (n - 1) : base,
    }));
  }, [plazo, totales.total, fecha]);

  function elegirCliente(c: Cliente) {
    setClienteQ(nombreCliente(c));
    setClienteId(c.id);
    setClienteDrop(false);
    setErrCliente(false);
  }

  async function guardarClienteInline() {
    if (!nc.nombres.trim()) return setNcError("El nombre es obligatorio.");
    setNcBusy(true);
    setNcError(null);
    const r = await fetch("/api/clientes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nc),
    });
    const d = await r.json().catch(() => ({}));
    setNcBusy(false);
    if (!r.ok) return setNcError(d.error || "No se pudo crear el cliente.");
    const nuevo: Cliente = {
      id: d.id,
      nombres: nc.nombres.trim(),
      apellidos: nc.apellidos,
      documentonro: nc.documentonro,
    };
    setClientes((cs) => [...cs, nuevo]);
    elegirCliente(nuevo);
    setInline(false);
    setNc({ nombres: "", apellidos: "", documentonro: "" });
  }

  function agregar() {
    const q = codigo.trim().toLowerCase();
    if (!q)
      return setCodigoError(
        "Escribí un código de barra o el nombre del producto.",
      );
    const p =
      productos.find((x) => x.codbarra.toLowerCase() === q) ??
      productos.find((x) => x.producto.toLowerCase() === q) ??
      productos.find((x) => x.producto.toLowerCase().includes(q));
    if (!p)
      return setCodigoError(
        `No hay un producto activo que coincida con «${codigo.trim()}».`,
      );
    setCodigoError(null);
    setError(null);
    setLineas((ls) => {
      const i = ls.findIndex((l) => l.codbarra === p.codbarra);
      if (i >= 0)
        return ls.map((l, j) =>
          j === i
            ? { ...l, cantidad: String((Number(l.cantidad) || 0) + 1) }
            : l,
        );
      return [
        ...ls,
        {
          codbarra: p.codbarra,
          producto: p.producto,
          iva: Number(p.iva),
          cantidad: "1",
          precio: String(Math.round(p.precio)),
        },
      ];
    });
    setCodigo("");
  }

  function setLinea(i: number, campo: "cantidad" | "precio", valor: string) {
    const limpio = valor.replace(/\D/g, "");
    setLineas((ls) =>
      ls.map((l, j) => (j === i ? { ...l, [campo]: limpio } : l)),
    );
  }

  async function guardar() {
    if (!clienteId) {
      setErrCliente(true);
      return setError(
        "Falta seleccionar el cliente. Sin cliente no se pueden generar las cuentas a cobrar.",
      );
    }
    if (lineas.length === 0)
      return setError("La factura no tiene ítems cargados.");
    if (
      lineas.some((l) => !(Number(l.cantidad) > 0) || !(Number(l.precio) > 0))
    )
      return setError("Cada ítem necesita cantidad y precio mayores a cero.");
    if (!plazo)
      return setError(
        credito
          ? "No hay plazos de crédito cargados."
          : "No hay un plazo de contado cargado.",
      );

    setBusy(true);
    setError(null);
    const r = await fetch("/api/ventas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clienteid: clienteId,
        fechafactura: fecha,
        depositoid: Number(depositoId),
        tipodocid: credito ? 2 : 1,
        plazoid: plazo.id,
        lineas: lineas.map((l) => ({
          codbarra: l.codbarra,
          cantidad: Number(l.cantidad),
          precio: Number(l.precio),
        })),
      }),
    });
    const d = await r.json().catch(() => ({}));
    if (r.ok) return router.push(`/ventas/${d.id}`);
    setError(d.error || "No se pudo guardar la factura.");
    setBusy(false);
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <ErrorBox titulo="No se pudo guardar la factura">{error}</ErrorBox>
      )}

      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[1_1_440px] flex-col gap-6">
          <Card className="p-4">
            <SectionLabel className="mb-4">CABECERA</SectionLabel>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-4">
              <div ref={clienteRef} className="relative min-w-0">
                <Label>CLIENTE</Label>
                <input
                  value={clienteQ}
                  onChange={(e) => {
                    setClienteQ(e.target.value);
                    setClienteId(null);
                    setClienteDrop(true);
                  }}
                  onFocus={() => setClienteDrop(true)}
                  placeholder="Buscar por nombre o CI/RUC"
                  className={cx(inputCls, errCliente && "border-error")}
                />
                {clienteDrop && (
                  <div className="absolute top-full right-0 left-0 z-20 mt-1 max-h-[232px] overflow-y-auto rounded-md border border-line-strong bg-surface">
                    {sugerencias.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => elegirCliente(c)}
                        className="flex w-full cursor-pointer items-center gap-2 border-b border-line-soft px-2.5 py-2 text-left hover:bg-hover"
                      >
                        <span className="flex-1 text-[13px]">
                          {nombreCliente(c)}
                        </span>
                        <span className="font-mono text-xs text-subtle">
                          {c.documentonro}
                        </span>
                      </button>
                    ))}
                    {sugerencias.length === 0 && (
                      <div className="px-2.5 py-2 text-[13px] text-muted">
                        Ningún cliente coincide.
                      </div>
                    )}
                    <button
                      onClick={() => {
                        setInline(true);
                        setClienteDrop(false);
                        setNc((x) => ({ ...x, nombres: clienteQ.trim() }));
                      }}
                      className="flex w-full cursor-pointer items-center gap-2 bg-bg px-2.5 py-2 text-left hover:bg-hover"
                    >
                      <Icon name="mas" size={14} stroke={2} color="#2D3748" />
                      <span className="text-[13px] font-semibold text-primary">
                        Crear cliente nuevo
                      </span>
                    </button>
                  </div>
                )}
                {errCliente && (
                  <div className="mt-1 text-xs text-error">
                    Seleccioná un cliente de la lista.
                  </div>
                )}
              </div>
              <div>
                <Label>FECHA</Label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className={monoInputCls}
                />
              </div>
              <div>
                <Label>DEPÓSITO</Label>
                <select
                  value={depositoId}
                  onChange={(e) => setDepositoId(e.target.value)}
                  className={selectCls}
                >
                  {depositos.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.deposito}
                      {d.direccion ? ` — ${d.direccion}` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>MONEDA</Label>
                <select className={selectCls} disabled>
                  <option>Guaraní (Gs)</option>
                </select>
              </div>
              <div>
                <Label>SERIE / TIMBRADO</Label>
                <div className="flex min-h-9 flex-wrap items-center gap-2 overflow-hidden rounded-md border border-line bg-bg px-2.5 py-2 font-mono text-[13px] text-muted">
                  <span>001-001</span>
                  <span className="text-outline">|</span>
                  <span>12557031</span>
                </div>
              </div>
            </div>

            {inline && (
              <div className="mt-4 rounded-md border border-line-strong bg-bg p-4">
                <div className="mb-4 flex items-center">
                  <div className="text-[13px] font-semibold">Nuevo cliente</div>
                  <div className="flex-1" />
                  <button
                    onClick={() => setInline(false)}
                    className="cursor-pointer text-xs text-subtle underline"
                  >
                    Cancelar
                  </button>
                </div>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3">
                  <div>
                    <Label>NOMBRES</Label>
                    <input
                      className={inputCls}
                      value={nc.nombres}
                      onChange={(e) =>
                        setNc({ ...nc, nombres: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>APELLIDOS</Label>
                    <input
                      className={inputCls}
                      value={nc.apellidos}
                      onChange={(e) =>
                        setNc({ ...nc, apellidos: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>CI / RUC</Label>
                    <input
                      className={monoInputCls}
                      value={nc.documentonro}
                      onChange={(e) =>
                        setNc({ ...nc, documentonro: e.target.value })
                      }
                      placeholder="4512887"
                    />
                  </div>
                </div>
                {ncError && (
                  <div className="mt-2 text-xs text-error">{ncError}</div>
                )}
                <Button
                  variant="primary"
                  size="sm"
                  className="mt-4"
                  onClick={guardarClienteInline}
                  disabled={ncBusy}
                >
                  {ncBusy ? "Guardando..." : "Guardar y usar"}
                </Button>
              </div>
            )}
          </Card>

          <Card>
            <div className="flex flex-wrap items-center gap-3 border-b border-line p-4">
              <SectionLabel>DETALLE DE LA VENTA</SectionLabel>
              <div className="flex-1" />
              <div className="relative min-w-40 flex-[1_1_200px] sm:max-w-[300px]">
                <Icon
                  name="barras"
                  size={16}
                  stroke={1.8}
                  color="#9CA3AF"
                  className="absolute top-[9px] left-2.5"
                />
                <input
                  list="gqg-productos"
                  value={codigo}
                  onChange={(e) => {
                    setCodigo(e.target.value);
                    setCodigoError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      agregar();
                    }
                  }}
                  placeholder="Código de barra o producto + Enter"
                  className={cx(
                    monoInputCls,
                    "pl-8",
                    codigoError && "border-error",
                  )}
                />
                <datalist id="gqg-productos">
                  {productos.map((p) => (
                    <option key={p.codbarra} value={p.codbarra}>
                      {p.producto}
                    </option>
                  ))}
                </datalist>
              </div>
              <Button size="sm" onClick={agregar}>
                Agregar ítem
              </Button>
              {codigoError && (
                <div className="w-full text-right text-xs text-error">
                  {codigoError}
                </div>
              )}
            </div>

            {lineas.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] border-collapse">
                  <thead>
                    <tr className="bg-head text-[11px] font-semibold tracking-[0.05em] text-muted">
                      <th className="w-28 px-4 py-2 text-left">CÓDIGO</th>
                      <th className="px-2 py-2 text-left">PRODUCTO</th>
                      <th className="w-[72px] px-2 py-2 text-right">CANT.</th>
                      <th className="w-28 px-2 py-2 text-right">PRECIO</th>
                      <th className="w-14 px-2 py-2 text-center">IVA</th>
                      <th className="w-28 px-2 py-2 text-right">TOTAL</th>
                      <th className="w-10 px-4 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {lineas.map((l, i) => (
                      <tr
                        key={l.codbarra}
                        className="group border-b border-line hover:bg-hover"
                      >
                        <td className="px-4 py-1.5 font-mono text-xs text-muted">
                          {l.codbarra}
                        </td>
                        <td className="px-2 py-1.5 text-[13px]">
                          {l.producto}
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            inputMode="numeric"
                            value={l.cantidad}
                            onChange={(e) =>
                              setLinea(i, "cantidad", e.target.value)
                            }
                            className="h-[30px] w-full rounded-md border border-line bg-surface px-2 text-right font-mono text-[13px]"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            inputMode="numeric"
                            value={
                              l.precio
                                ? Number(l.precio).toLocaleString("es-PY")
                                : ""
                            }
                            onChange={(e) =>
                              setLinea(i, "precio", e.target.value)
                            }
                            className="h-[30px] w-full rounded-md border border-line bg-surface px-2 text-right font-mono text-[13px]"
                          />
                        </td>
                        <td className="px-2 py-1.5 text-center font-mono text-[13px] text-muted">
                          {l.iva}%
                        </td>
                        <td className="px-2 py-1.5 text-right font-mono text-[13px] font-medium">
                          {gs(
                            (Number(l.cantidad) || 0) * (Number(l.precio) || 0),
                          )}
                        </td>
                        <td className="px-4 py-1.5 text-right">
                          <button
                            onClick={() =>
                              setLineas((ls) => ls.filter((_, j) => j !== i))
                            }
                            title="Eliminar línea"
                            aria-label="Eliminar línea"
                            className="grid h-[26px] w-[26px] cursor-pointer place-items-center rounded-md opacity-25 group-hover:opacity-100 hover:bg-error-soft focus-visible:opacity-100"
                          >
                            <Icon
                              name="borrar"
                              size={15}
                              stroke={1.8}
                              color="#BA1A1A"
                            />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-12 text-center">
                <Icon
                  name="barras"
                  size={26}
                  stroke={1.5}
                  color="#9CA3AF"
                  className="mx-auto mb-3"
                />
                <div className="mb-1 text-sm font-semibold">
                  Todavía no hay ítems
                </div>
                <div className="text-[13px] text-muted">
                  Escaneá un código de barra o buscá el producto por nombre.
                </div>
              </div>
            )}
          </Card>
        </div>

        <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-4 lg:max-w-[520px]">
          <Card className="p-4">
            <SectionLabel className="mb-2">CONDICIÓN DE VENTA</SectionLabel>
            <div className="mb-4 grid grid-cols-2 overflow-hidden rounded-md border border-line-strong">
              <button
                onClick={() => setCredito(false)}
                className={segCls(!credito)}
              >
                Contado
              </button>
              <button
                onClick={() => setCredito(true)}
                className={segCls(credito)}
              >
                Crédito
              </button>
            </div>

            {credito ? (
              plazosModo.length === 0 ? (
                <div className="text-[13px] text-muted">
                  No hay plazos de crédito. Creá uno en Plazos.
                </div>
              ) : (
                <div>
                  <Label>PLAZO</Label>
                  <select
                    value={plazoId}
                    onChange={(e) => setPlazoId(e.target.value)}
                    className={selectCls}
                  >
                    {plazosModo.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.plazo}
                      </option>
                    ))}
                  </select>
                  {plazo && (
                    <div className="mt-1.5 text-xs text-subtle">
                      {plazo.cuotas} cuota{plazo.cuotas === 1 ? "" : "s"} ·{" "}
                      {plazo.irregular ? "irregular" : "regular"} · días{" "}
                      {diasDe(plazo).join("/")}
                    </div>
                  )}
                </div>
              )
            ) : (
              <div className="text-[13px] text-muted">
                Al contado se genera una única cuota que vence en la fecha de la
                factura.
              </div>
            )}

            <div className="mt-4 overflow-hidden rounded-md border border-line">
              <div className="flex items-center gap-1.5 bg-head px-2.5 py-2">
                <Icon name="reloj" size={14} stroke={1.8} color="#45474C" />
                <span className="text-[11px] font-semibold tracking-[0.05em] text-muted">
                  VISTA PREVIA DE CUOTAS
                </span>
              </div>
              {preview.length === 0 ? (
                <div className="px-2.5 py-3 text-xs text-subtle">
                  Agregá ítems para calcular las cuotas.
                </div>
              ) : (
                <table className="w-full border-collapse">
                  <tbody>
                    {preview.map((c) => (
                      <tr key={c.label} className="border-b border-line">
                        <td className="px-2.5 py-2 font-mono text-xs text-subtle">
                          {c.label}
                        </td>
                        <td className="px-1 py-2 font-mono text-xs text-muted">
                          {c.vence}
                        </td>
                        <td className="px-2.5 py-2 text-right font-mono text-[13px] font-medium">
                          {gs(c.importe)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div className="flex justify-between bg-bg px-2.5 py-2">
                <span className="text-xs text-muted">Suma de cuotas</span>
                <span className="font-mono text-[13px] font-semibold">
                  {gs(preview.reduce((s, c) => s + c.importe, 0))}
                </span>
              </div>
            </div>
            {credito && (
              <div className="mt-2 text-xs text-subtle">
                La última cuota absorbe el redondeo.
              </div>
            )}
          </Card>

          <Card className="p-4">
            <SectionLabel className="mb-3">TOTALES</SectionLabel>
            <Fila k="Exentas" v={gs(totales.exento)} />
            <Fila k="Gravadas 5%" v={gs(totales.grav5)} />
            <Fila k="Gravadas 10%" v={gs(totales.grav10)} />
            <div className="flex justify-between border-b border-line py-1.5">
              <span className="text-[13px] text-muted">IVA</span>
              <span className="font-mono text-[13px]">{gs(totales.iva)}</span>
            </div>
            <div className="flex items-baseline justify-between pt-3">
              <span className="text-[13px] font-semibold">TOTAL FACTURA</span>
              <span className="font-mono text-xl font-semibold tracking-[-0.01em]">
                {gs(totales.total)}
              </span>
            </div>
            <div className="mt-4 flex gap-2">
              <Button
                variant="primary"
                className="flex-1"
                onClick={guardar}
                disabled={busy}
              >
                {busy ? "Guardando..." : "Guardar factura"}
              </Button>
              <Button onClick={() => router.push("/ventas")} disabled={busy}>
                Cancelar
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

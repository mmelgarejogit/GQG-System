"use client";

import { use, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/components/ConfirmDialog";
import Icon from "@/components/Icon";
import {
  Button,
  Card,
  Chip,
  ErrorBox,
  Fila,
  Label,
  SectionLabel,
  cx,
  tdCls,
  thCls,
} from "@/components/ui";
import {
  cuotaLabel,
  estadoCuota,
  fechaCorta,
  gs,
  nroFactura,
  tonoEstado,
} from "@/lib/format";
import { liquidacionIva, type Cuota, type VentaDetalle } from "@/lib/venta";

function Dato({
  k,
  children,
  mono,
}: {
  k: string;
  children: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="mb-1 text-[11px] font-semibold tracking-[0.05em] text-subtle">
        {k}
      </div>
      <div className={cx("text-[13px]", mono && "font-mono")}>{children}</div>
    </div>
  );
}

export default function DetalleVentaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [d, setD] = useState<VentaDetalle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cobrar, setCobrar] = useState<Cuota | null>(null);
  const [cobrando, setCobrando] = useState(false);
  const [errorCobro, setErrorCobro] = useState<string | null>(null);
  const [anulando, setAnulando] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [busyAnular, setBusyAnular] = useState(false);
  const [errorAnular, setErrorAnular] = useState<string | null>(null);

  const cargar = useCallback(() => {
    fetch(`/api/ventas/${id}`)
      .then(async (r) => {
        if (r.ok) return setD(await r.json());
        setError(
          r.status === 404
            ? "La venta no existe."
            : "No se pudo cargar la venta.",
        );
      })
      .catch(() => setError("No se pudo cargar la venta."));
  }, [id]);

  useEffect(cargar, [cargar]);

  async function confirmarCobro() {
    if (!cobrar) return;
    setCobrando(true);
    const r = await fetch(`/api/ventas/${id}/cuotas/${cobrar.cuota}`, {
      method: "PATCH",
    });
    const body = await r.json().catch(() => ({}));
    setCobrando(false);
    setCobrar(null);
    if (!r.ok) setErrorCobro(body.error || "No se pudo registrar el cobro.");
    else {
      setErrorCobro(null);
      cargar();
    }
  }

  async function confirmarAnulacion() {
    setBusyAnular(true);
    setErrorAnular(null);
    const r = await fetch(`/api/ventas/${id}/anular`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ motivo }),
    });
    const body = await r.json().catch(() => ({}));
    setBusyAnular(false);
    if (!r.ok)
      return setErrorAnular(body.error || "No se pudo anular la factura.");
    setAnulando(false);
    setMotivo("");
    cargar();
  }

  if (error)
    return (
      <div className="flex flex-col gap-4">
        <div>
          <Button size="sm" onClick={() => router.push("/ventas")}>
            <Icon name="atras" size={14} stroke={2} color="#45474C" />
            Ventas
          </Button>
        </div>
        <ErrorBox>{error}</ErrorBox>
      </div>
    );

  if (!d)
    return (
      <div className="animate-gqgpulse flex flex-col gap-6">
        <div className="h-8 w-28 rounded-md border border-line bg-surface" />
        <div className="h-40 rounded-md border border-line bg-surface" />
        <div className="h-60 rounded-md border border-line bg-surface" />
      </div>
    );

  const credito = d.tipoid === 1;
  const iva = liquidacionIva(d.lineas);
  const cobrado = d.cuotas.reduce((s, c) => s + Number(c.cobrado), 0);
  const totalCuotas = d.cuotas.reduce((s, c) => s + Number(c.importe), 0);
  const nro = nroFactura(d.serie, d.nrofactura);
  const anulada = d.anulada === 1;
  const conCobros = cobrado > 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={() => router.push("/ventas")}>
          <Icon name="atras" size={14} stroke={2} color="#45474C" />
          Ventas
        </Button>
        <div className="flex-1" />
        <Button
          size="sm"
          onClick={() => router.push(`/ventas/${d.id}/factura`)}
        >
          <Icon name="imprimir" size={14} stroke={1.8} color="#45474C" />
          Ver factura
        </Button>
        {!anulada && (
          <Button
            size="sm"
            variant="danger-outline"
            onClick={() => {
              setErrorAnular(null);
              setAnulando(true);
            }}
            disabled={conCobros}
            title={
              conCobros
                ? "Tiene cobros registrados: no se puede anular"
                : undefined
            }
          >
            Anular
          </Button>
        )}
      </div>

      {anulada && (
        <ErrorBox titulo="Factura anulada">
          Anulada el {fechaCorta(d.anulada_fecha)} a las{" "}
          {String(d.anulada_fecha).slice(11, 16)} por {d.anulada_usuario}.
          Motivo: {d.anulada_motivo}. Sus cuotas ya no cuentan como saldo a
          cobrar.
        </ErrorBox>
      )}

      {errorCobro && <ErrorBox>{errorCobro}</ErrorBox>}

      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[1_1_440px] flex-col gap-6">
          <Card>
            <div className="flex items-center gap-3 border-b border-line p-4">
              <div className="min-w-0">
                <div className="font-mono text-xl font-semibold tracking-[-0.01em]">
                  {nro}
                </div>
                <div className="mt-0.5 text-[13px] text-muted">
                  {d.cliente}
                  {d.documentonro ? ` · CI/RUC ${d.documentonro}` : ""}
                </div>
              </div>
              <div className="flex-1" />
              <div className="flex gap-1">
                <Chip tono={credito ? "credito" : "neutro"}>
                  {credito ? "Crédito" : "Contado"}
                </Chip>
                {anulada && <Chip tono="error">Anulada</Chip>}
              </div>
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-4 p-4">
              <Dato k="FECHA" mono>
                {fechaCorta(d.fechafactura)}
              </Dato>
              <Dato k="PLAZO">{credito ? d.plazo : "Contado"}</Dato>
              <Dato k="DEPÓSITO">{d.deposito}</Dato>
              <Dato k="TOTAL" mono>
                <span className="font-semibold">{gs(d.totalfactura)} Gs</span>
              </Dato>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <SectionLabel className="border-b border-line p-4">
              LÍNEAS DE LA FACTURA
            </SectionLabel>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-head">
                    <th className={cx(thCls, "pl-4")}>CÓDIGO</th>
                    <th className={thCls}>PRODUCTO</th>
                    <th className={cx(thCls, "text-right")}>CANT.</th>
                    <th className={cx(thCls, "text-right")}>PRECIO</th>
                    <th className={cx(thCls, "text-center")}>IVA</th>
                    <th className={cx(thCls, "pr-4 text-right")}>TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {d.lineas.map((l) => (
                    <tr key={l.codbarra} className="border-b border-line">
                      <td
                        className={cx(
                          tdCls,
                          "pl-4 font-mono text-xs text-muted",
                        )}
                      >
                        {l.codbarra}
                      </td>
                      <td className={tdCls}>{l.producto}</td>
                      <td className={cx(tdCls, "text-right font-mono")}>
                        {gs(l.cantidad)}
                      </td>
                      <td className={cx(tdCls, "text-right font-mono")}>
                        {gs(l.precio)}
                      </td>
                      <td
                        className={cx(
                          tdCls,
                          "text-center font-mono text-muted",
                        )}
                      >
                        {Number(l.iva)}%
                      </td>
                      <td
                        className={cx(
                          tdCls,
                          "pr-4 text-right font-mono font-medium",
                        )}
                      >
                        {gs(l.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="flex items-center gap-3 border-b border-line p-4">
              <div>
                <div className="text-base font-semibold">
                  Cuotas (cuentas a cobrar)
                </div>
                <div className="mt-0.5 text-[13px] text-muted">
                  Generadas automáticamente al guardar la factura.
                </div>
              </div>
              <div className="flex-1" />
              <span className="rounded-xs bg-head px-2 py-0.5 font-mono text-[11px] font-semibold text-muted">
                {d.cuotas.length} {d.cuotas.length === 1 ? "CUOTA" : "CUOTAS"}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-head">
                    <th className={cx(thCls, "pl-4")}>CUOTA</th>
                    <th className={cx(thCls, "text-right")}>IMPORTE</th>
                    <th className={thCls}>VENCE</th>
                    <th className={cx(thCls, "text-right")}>COBRADO</th>
                    <th className={thCls}>ESTADO</th>
                    <th className="px-4 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {d.cuotas.map((c) => {
                    const estado = anulada ? null : estadoCuota(c);
                    return (
                      <tr
                        key={c.cuota}
                        className="border-b border-line hover:bg-hover"
                      >
                        <td className={cx(tdCls, "pl-4 font-mono font-medium")}>
                          {cuotaLabel(c.cuota, d.cuotas.length)}
                        </td>
                        <td className={cx(tdCls, "text-right font-mono")}>
                          {gs(c.importe)}
                        </td>
                        <td className={cx(tdCls, "font-mono text-muted")}>
                          {fechaCorta(c.vence)}
                        </td>
                        <td className={cx(tdCls, "text-right font-mono")}>
                          {Number(c.cobrado) ? gs(c.cobrado) : "—"}
                        </td>
                        <td className={tdCls}>
                          {estado ? (
                            <Chip tono={tonoEstado(estado)}>{estado}</Chip>
                          ) : (
                            <Chip tono="neutro">Anulada</Chip>
                          )}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {estado && estado !== "Cobrada" && (
                            <Button
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => setCobrar(c)}
                            >
                              Registrar cobro
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-8 bg-bg px-4 py-3">
              <div className="text-right">
                <div className="text-[11px] font-semibold tracking-[0.05em] text-subtle">
                  COBRADO
                </div>
                <div className="font-mono text-[13px] font-semibold">
                  {gs(cobrado)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] font-semibold tracking-[0.05em] text-subtle">
                  SALDO
                </div>
                <div
                  className={cx(
                    "font-mono text-[13px] font-semibold",
                    anulada
                      ? "text-subtle"
                      : totalCuotas - cobrado > 0
                        ? "text-error"
                        : "text-ok",
                  )}
                >
                  {gs(anulada ? 0 : totalCuotas - cobrado)}
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-4 lg:max-w-[520px]">
          <Card className="p-4">
            <SectionLabel className="mb-3">LIQUIDACIÓN DE IVA</SectionLabel>
            <Fila k="Exentas" v={gs(iva.exento)} />
            <Fila k="Gravadas 5%" v={gs(iva.grav5)} />
            <Fila k="Gravadas 10%" v={gs(iva.grav10)} />
            <Fila k="IVA 5%" v={gs(iva.iva5)} />
            <div className="flex justify-between border-b border-line py-1.5">
              <span className="text-[13px] text-muted">IVA 10%</span>
              <span className="font-mono text-[13px]">{gs(iva.iva10)}</span>
            </div>
            <div className="flex items-baseline justify-between pt-3">
              <span className="text-[13px] font-semibold">TOTAL</span>
              <span className="font-mono text-xl font-semibold">
                {gs(d.totalfactura)}
              </span>
            </div>
          </Card>
          <Card className="p-4">
            <SectionLabel className="mb-3">TIMBRADO</SectionLabel>
            <div className="font-mono text-[13px] leading-5 text-muted">
              <div>Nº {d.timbrado}</div>
              <div>Vence {fechaCorta(d.timbrado_vence)}</div>
              <div>Serie {d.serie}</div>
            </div>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={cobrar !== null}
        title={
          cobrar
            ? `Registrar cobro de la cuota ${cuotaLabel(cobrar.cuota, d.cuotas.length)}`
            : ""
        }
        message={
          cobrar
            ? `Se marca como cobrado el saldo de ${gs(Number(cobrar.importe) - Number(cobrar.cobrado))} Gs de la factura ${nro}.`
            : undefined
        }
        confirmLabel="Registrar cobro"
        busy={cobrando}
        onConfirm={confirmarCobro}
        onClose={() => setCobrar(null)}
      />

      <ConfirmDialog
        open={anulando}
        danger
        title={`Anular la factura ${nro}`}
        message={`Se anulan también ${d.cuotas.length === 1 ? "la cuota generada" : `las ${d.cuotas.length} cuotas generadas`}. El número de factura no se reutiliza y la acción queda registrada en la auditoría.`}
        confirmLabel="Anular factura"
        busy={busyAnular}
        confirmDisabled={motivo.trim().length < 5}
        onConfirm={confirmarAnulacion}
        onClose={() => {
          setAnulando(false);
          setMotivo("");
        }}
      >
        <Label>MOTIVO</Label>
        <textarea
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          maxLength={200}
          rows={3}
          placeholder="Ej.: error en el cliente o en los precios"
          className="w-full rounded-md border border-line-strong bg-surface px-2.5 py-2 text-sm"
        />
        <div className="mt-1 text-xs text-subtle">
          Mínimo 5 caracteres. {motivo.length}/200
        </div>
        {errorAnular && (
          <div className="mt-2">
            <ErrorBox>{errorAnular}</ErrorBox>
          </div>
        )}
      </ConfirmDialog>
    </div>
  );
}

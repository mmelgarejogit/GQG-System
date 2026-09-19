"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, ErrorBox } from "@/components/ui";
import {
  cuotaLabel,
  fechaCorta,
  gs,
  nroFactura,
  numeroALetras,
} from "@/lib/format";
import { liquidacionIva, type VentaDetalle } from "@/lib/venta";

type Empresa = {
  empresa: string;
  direccion: string;
  telefono: string;
  mail: string;
  ruc: string;
};

const th =
  "px-1 py-1.5 text-[10px] font-semibold tracking-[0.05em] border-b border-ink";
const td = "px-1 py-[5px] font-mono text-[11px] border-b border-[#EFEFEF]";

export default function FacturaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [d, setD] = useState<VentaDetalle | null>(null);
  const [emp, setEmp] = useState<Empresa | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/ventas/${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setD)
      .catch(() => setError(true));
    void fetch("/api/empresa")
      .then((r) => (r.ok ? r.json() : null))
      .then(setEmp);
  }, [id]);

  if (error) return <ErrorBox>No se pudo cargar la factura.</ErrorBox>;
  if (!d)
    return (
      <div className="animate-gqgpulse mx-auto h-[600px] w-full max-w-[794px] border border-line bg-surface" />
    );

  const credito = d.tipoid === 1;
  const iva = liquidacionIva(d.lineas);
  const letras = numeroALetras(d.totalfactura);

  return (
    <div className="flex flex-col items-center gap-4">
      <div data-noprint className="flex w-full max-w-[794px] gap-2">
        <Button size="sm" onClick={() => router.push(`/ventas/${id}`)}>
          ‹ Volver al detalle
        </Button>
        <div className="flex-1" />
        <Button size="sm" variant="primary" onClick={() => window.print()}>
          Imprimir
        </Button>
      </div>

      <div className="w-full overflow-x-auto">
        <div
          data-a4
          className="relative mx-auto w-[794px] border border-line bg-white p-10 text-xs text-ink"
        >
          {d.anulada === 1 && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 grid place-items-center overflow-hidden"
            >
              <div className="-rotate-[30deg] rounded-md border-4 border-error px-8 py-2 text-[88px] font-bold tracking-[0.1em] text-error opacity-20">
                ANULADA
              </div>
            </div>
          )}
          <div className="flex gap-6 border-b border-ink pb-4">
            <div className="flex-1">
              <div className="text-base font-bold tracking-[-0.01em] uppercase">
                {emp?.empresa ?? ""}
              </div>
              <div className="mt-1 text-[11px] leading-4 text-muted">
                {emp?.direccion}
                <br />
                {[emp?.telefono && `Tel. ${emp.telefono}`, emp?.mail]
                  .filter(Boolean)
                  .join(" — ")}
              </div>
            </div>
            <div className="w-[260px] border border-ink px-2.5 py-2 font-mono text-[11px] leading-[17px]">
              <div className="mb-1 font-sans text-[11px] font-semibold tracking-[0.05em]">
                RUC {emp?.ruc}
              </div>
              <div>TIMBRADO Nº {d.timbrado}</div>
              <div>VENCE: {fechaCorta(d.timbrado_vence)}</div>
              <div className="my-1.5 border-t border-outline" />
              <div className="font-sans text-[11px] font-semibold tracking-[0.05em]">
                FACTURA
              </div>
              <div className="text-sm font-semibold">
                {nroFactura(d.serie, d.nrofactura)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-[1fr_220px] gap-4 border-b border-outline py-4">
            <div className="grid grid-cols-[84px_1fr] gap-y-1 text-[11px]">
              <span className="text-muted">CLIENTE</span>
              <span className="font-semibold">{d.cliente}</span>
              <span className="text-muted">CI / RUC</span>
              <span className="font-mono">{d.documentonro || "—"}</span>
              <span className="text-muted">DIRECCIÓN</span>
              <span>{d.cliente_direccion || "—"}</span>
              <span className="text-muted">TELÉFONO</span>
              <span className="font-mono">{d.cliente_telefono || "—"}</span>
            </div>
            <div className="grid grid-cols-[72px_1fr] gap-y-1 text-[11px]">
              <span className="text-muted">FECHA</span>
              <span className="font-mono">{fechaCorta(d.fechafactura)}</span>
              <span className="text-muted">CONDICIÓN</span>
              <span className="font-semibold">
                {credito ? "CRÉDITO" : "CONTADO"}
              </span>
              {credito && (
                <>
                  <span className="text-muted">PLAZO</span>
                  <span>{d.plazo}</span>
                </>
              )}
              <span className="text-muted">MONEDA</span>
              <span>{d.moneda}</span>
            </div>
          </div>

          <table className="mt-4 w-full border-collapse">
            <thead>
              <tr>
                <th className={`${th} text-left`}>CANT.</th>
                <th className={`${th} text-left`}>DESCRIPCIÓN</th>
                <th className={`${th} text-right`}>P. UNIT.</th>
                <th className={`${th} text-right`}>EXENTAS</th>
                <th className={`${th} text-right`}>5%</th>
                <th className={`${th} text-right`}>10%</th>
              </tr>
            </thead>
            <tbody>
              {d.lineas.map((l) => {
                const tasa = Number(l.iva);
                return (
                  <tr key={l.codbarra}>
                    <td className={td}>{gs(l.cantidad)}</td>
                    <td className={`${td} font-sans`}>{l.producto}</td>
                    <td className={`${td} text-right`}>{gs(l.precio)}</td>
                    <td className={`${td} text-right`}>
                      {tasa === 0 ? gs(l.total) : "—"}
                    </td>
                    <td className={`${td} text-right`}>
                      {tasa === 5 ? gs(l.total) : "—"}
                    </td>
                    <td className={`${td} text-right`}>
                      {tasa === 10 ? gs(l.total) : "—"}
                    </td>
                  </tr>
                );
              })}
              <tr>
                <td
                  colSpan={3}
                  className="border-t border-ink px-1 py-1.5 text-right text-[10px] font-semibold tracking-[0.05em]"
                >
                  SUBTOTALES
                </td>
                <td className="border-t border-ink px-1 py-1.5 text-right font-mono text-[11px] font-semibold">
                  {gs(iva.exento)}
                </td>
                <td className="border-t border-ink px-1 py-1.5 text-right font-mono text-[11px] font-semibold">
                  {gs(iva.sub5)}
                </td>
                <td className="border-t border-ink px-1 py-1.5 text-right font-mono text-[11px] font-semibold">
                  {gs(iva.sub10)}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="mt-4 grid grid-cols-[1fr_280px] gap-6">
            <div>
              <div className="mb-1 text-[10px] font-semibold tracking-[0.05em] text-muted">
                TOTAL EN LETRAS
              </div>
              <div className="text-[11px] leading-4">Guaraníes {letras}.</div>
              <div className="mt-4 mb-1 text-[10px] font-semibold tracking-[0.05em] text-muted">
                LIQUIDACIÓN DEL IVA
              </div>
              <div className="flex flex-wrap gap-4 font-mono text-[11px]">
                <span>IVA 5%: {gs(iva.iva5)}</span>
                <span>IVA 10%: {gs(iva.iva10)}</span>
                <span className="font-semibold">
                  TOTAL IVA: {gs(iva.totalIva)}
                </span>
              </div>
            </div>
            <div className="self-start border border-ink">
              <div className="flex justify-between border-b border-[#EFEFEF] px-2 py-[5px] text-[11px]">
                <span>Subtotal</span>
                <span className="font-mono">{gs(d.totalfactura)}</span>
              </div>
              <div className="flex items-baseline justify-between bg-head p-2">
                <span className="text-[11px] font-semibold tracking-[0.05em]">
                  TOTAL A PAGAR Gs
                </span>
                <span className="font-mono text-[15px] font-bold">
                  {gs(d.totalfactura)}
                </span>
              </div>
            </div>
          </div>

          {credito && d.cuotas.length > 0 && (
            <div className="mt-6 border-t border-outline pt-3">
              <div className="mb-1.5 text-[10px] font-semibold tracking-[0.05em] text-muted">
                CUOTAS — VENTA A CRÉDITO
              </div>
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border-b border-outline p-1 text-left text-[10px] font-semibold tracking-[0.05em]">
                      CUOTA
                    </th>
                    <th className="border-b border-outline p-1 text-left text-[10px] font-semibold tracking-[0.05em]">
                      VENCIMIENTO
                    </th>
                    <th className="border-b border-outline p-1 text-right text-[10px] font-semibold tracking-[0.05em]">
                      IMPORTE Gs
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {d.cuotas.map((c) => (
                    <tr key={c.cuota}>
                      <td className="border-b border-[#EFEFEF] p-1 font-mono text-[11px]">
                        {cuotaLabel(c.cuota, d.cuotas.length)}
                      </td>
                      <td className="border-b border-[#EFEFEF] p-1 font-mono text-[11px]">
                        {fechaCorta(c.vence)}
                      </td>
                      <td className="border-b border-[#EFEFEF] p-1 text-right font-mono text-[11px]">
                        {gs(c.importe)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-12 flex gap-12">
            <div className="flex-1 border-t border-ink pt-1 text-center text-[10px] text-muted">
              FIRMA DEL EMISOR
            </div>
            <div className="flex-1 border-t border-ink pt-1 text-center text-[10px] text-muted">
              RECIBÍ CONFORME
            </div>
          </div>
          {d.anulada === 1 && (
            <div className="mt-4 text-center text-[10px] font-semibold text-error">
              FACTURA ANULADA EL {fechaCorta(d.anulada_fecha)} — MOTIVO:{" "}
              {d.anulada_motivo}
            </div>
          )}
          <div className="mt-4 text-center text-[9px] text-subtle">
            Documento no fiscal — comprobante interno de{" "}
            {emp?.empresa ?? "GQG System"}.
          </div>
        </div>
      </div>
    </div>
  );
}

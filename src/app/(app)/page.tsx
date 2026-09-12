"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorBox,
  thCls,
  tdCls,
  cx,
} from "@/components/ui";
import {
  cuotaLabel,
  estadoCuota,
  fechaCorta,
  gs,
  nroFactura,
  tonoEstado,
} from "@/lib/format";

type Kpi = { monto: number; cantidad: number };
type Reciente = {
  id: number;
  serie: string;
  nrofactura: number;
  totalfactura: number;
  tipoid: number;
  cliente: string;
};
type Agenda = {
  ventaid: number;
  cuota: number;
  importe: number;
  cobrado: number;
  vence: string;
  serie: string;
  nrofactura: number;
  cliente: string;
  total_cuotas: number;
};
type Dashboard = {
  facturado: Kpi;
  abiertas: Kpi;
  porVencer: Kpi;
  vencidas: Kpi;
  recientes: Reciente[];
  agenda: Agenda[];
};

const MESES = [
  "ENERO",
  "FEBRERO",
  "MARZO",
  "ABRIL",
  "MAYO",
  "JUNIO",
  "JULIO",
  "AGOSTO",
  "SETIEMBRE",
  "OCTUBRE",
  "NOVIEMBRE",
  "DICIEMBRE",
];

function plural(n: number, uno: string, varios: string) {
  return `${n} ${n === 1 ? uno : varios}`;
}

function KpiCard({
  titulo,
  monto,
  detalle,
  color,
}: {
  titulo: string;
  monto: number;
  detalle: string;
  color?: string;
}) {
  return (
    <Card className="p-4">
      <div className="mb-2 text-[11px] font-semibold tracking-[0.05em] text-subtle">
        {titulo}
      </div>
      <div
        className={cx(
          "font-mono text-2xl font-semibold tracking-[-0.01em]",
          color,
        )}
      >
        {gs(monto)}{" "}
        <span className="text-[13px] font-medium text-subtle">Gs</span>
      </div>
      <div className="mt-2 text-[13px] text-muted">{detalle}</div>
    </Card>
  );
}

export default function InicioPage() {
  const router = useRouter();
  const [d, setD] = useState<Dashboard | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setD)
      .catch(() => setError(true));
  }, []);

  if (error)
    return (
      <ErrorBox titulo="No se pudo cargar el resumen">
        Revisá la conexión con la base de datos.
      </ErrorBox>
    );

  if (!d)
    return (
      <div className="animate-gqgpulse flex flex-col gap-6">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 rounded-md border border-line bg-surface"
            />
          ))}
        </div>
        <div className="h-[300px] rounded-md border border-line bg-surface p-4">
          <div className="mb-6 h-3 w-44 rounded-xs bg-line" />
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="mb-4 h-2.5 rounded-xs bg-head" />
          ))}
        </div>
      </div>
    );

  const mes = MESES[new Date().getMonth()];

  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
        <KpiCard
          titulo={`FACTURADO EN ${mes}`}
          monto={d.facturado.monto}
          detalle={plural(
            d.facturado.cantidad,
            "factura emitida",
            "facturas emitidas",
          )}
        />
        <KpiCard
          titulo="SALDO A COBRAR"
          monto={d.abiertas.monto}
          detalle={plural(
            d.abiertas.cantidad,
            "cuota abierta",
            "cuotas abiertas",
          )}
        />
        <KpiCard
          titulo="VENCE EN 7 DÍAS"
          monto={d.porVencer.monto}
          detalle={plural(
            d.porVencer.cantidad,
            "cuota por vencer",
            "cuotas por vencer",
          )}
          color="text-warn"
        />
        <KpiCard
          titulo="VENCIDAS"
          monto={d.vencidas.monto}
          detalle={plural(
            d.vencidas.cantidad,
            "cuota vencida",
            "cuotas vencidas",
          )}
          color="text-error"
        />
      </div>

      <div className="flex flex-wrap items-start gap-6">
        <Card className="min-w-0 flex-[1_1_480px] overflow-hidden">
          <div className="flex items-center gap-3 border-b border-line p-4">
            <div className="text-base font-semibold">Ventas recientes</div>
            <div className="flex-1" />
            <Button size="sm" onClick={() => router.push("/ventas")}>
              Ver todas
            </Button>
          </div>
          {d.recientes.length === 0 ? (
            <EmptyState
              icon="ventas"
              titulo="Todavía no hay ventas"
              texto="Las facturas emitidas aparecen acá."
            >
              <Button
                variant="primary"
                onClick={() => router.push("/ventas/nueva")}
              >
                Nueva venta
              </Button>
            </EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-head">
                    <th className={cx(thCls, "pl-4")}>FACTURA</th>
                    <th className={thCls}>CLIENTE</th>
                    <th className={thCls}>MOD.</th>
                    <th className={cx(thCls, "pr-4 text-right")}>TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {d.recientes.map((v) => (
                    <tr
                      key={v.id}
                      onClick={() => router.push(`/ventas/${v.id}`)}
                      className="cursor-pointer border-b border-line hover:bg-hover"
                    >
                      <td
                        className={cx(
                          tdCls,
                          "pl-4 font-mono whitespace-nowrap",
                        )}
                      >
                        {nroFactura(v.serie, v.nrofactura)}
                      </td>
                      <td className={tdCls}>{v.cliente}</td>
                      <td className={tdCls}>
                        <Chip tono={v.tipoid === 1 ? "credito" : "neutro"}>
                          {v.tipoid === 1 ? "Crédito" : "Contado"}
                        </Chip>
                      </td>
                      <td
                        className={cx(
                          tdCls,
                          "pr-4 text-right font-mono font-medium",
                        )}
                      >
                        {gs(v.totalfactura)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card className="min-w-0 flex-[1_1_340px]">
          <div className="border-b border-line p-4">
            <div className="text-base font-semibold">Cuentas a cobrar</div>
            <div className="mt-0.5 text-[13px] text-muted">
              Próximos vencimientos
            </div>
          </div>
          {d.agenda.length === 0 ? (
            <EmptyState
              icon="check"
              titulo="Sin cuotas pendientes"
              texto="Todas las cuotas están cobradas."
            />
          ) : (
            d.agenda.map((c) => {
              const estado = estadoCuota(c);
              return (
                <Link
                  key={`${c.ventaid}-${c.cuota}`}
                  href={`/ventas/${c.ventaid}`}
                  className="flex items-center gap-3 border-b border-line px-4 py-2.5 text-ink no-underline hover:bg-hover"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium">
                      {c.cliente}
                    </div>
                    <div className="font-mono text-[11px] text-subtle">
                      {nroFactura(c.serie, c.nrofactura)} · cuota{" "}
                      {cuotaLabel(c.cuota, c.total_cuotas)}
                    </div>
                  </div>
                  <div className="flex-none text-right">
                    <div className="font-mono text-[13px] font-medium">
                      {gs(c.importe - c.cobrado)}
                    </div>
                    <div className="font-mono text-[11px] text-subtle">
                      {fechaCorta(c.vence)}
                    </div>
                  </div>
                  <Chip tono={tonoEstado(estado)}>{estado}</Chip>
                </Link>
              );
            })
          )}
        </Card>
      </div>
    </>
  );
}

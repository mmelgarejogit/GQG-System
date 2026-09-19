"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import FiltroFechas, {
  SIN_RANGO,
  enRango,
  type RangoFechas,
} from "@/components/FiltroFechas";
import Icon from "@/components/Icon";
import {
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorBox,
  SearchInput,
  cx,
  selectCls,
  tdCls,
  thCls,
} from "@/components/ui";
import { fechaCorta, gs, nroFactura } from "@/lib/format";

type Venta = {
  id: number;
  fechafactura: string;
  serie: string;
  nrofactura: number;
  totalfactura: number;
  anulada: number;
  cliente: string;
  tipoid: number;
  plazo: string;
};

const POR_PAGINA = 15;

export default function VentasPage() {
  const router = useRouter();
  const [ventas, setVentas] = useState<Venta[] | null>(null);
  const [error, setError] = useState(false);
  const [q, setQ] = useState("");
  const [modalidad, setModalidad] = useState("todas");
  const [fechas, setFechas] = useState<RangoFechas>(SIN_RANGO);
  const [pagina, setPagina] = useState(1);

  useEffect(() => {
    fetch("/api/ventas")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setVentas)
      .catch(() => setError(true));
  }, []);

  const filtradas = useMemo(() => {
    const qn = q.trim().toLowerCase();
    return (ventas ?? []).filter(
      (v) =>
        (modalidad === "todas" ||
          (modalidad === "anuladas"
            ? v.anulada === 1
            : String(v.tipoid) === modalidad)) &&
        enRango(v.fechafactura, fechas) &&
        (!qn ||
          nroFactura(v.serie, v.nrofactura).includes(qn) ||
          v.cliente.toLowerCase().includes(qn)),
    );
  }, [ventas, q, modalidad, fechas]);

  useEffect(() => setPagina(1), [q, modalidad, fechas]);

  const paginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA));
  const visibles = filtradas.slice(
    (pagina - 1) * POR_PAGINA,
    pagina * POR_PAGINA,
  );

  function limpiar() {
    setQ("");
    setModalidad("todas");
    setFechas(SIN_RANGO);
  }

  if (error)
    return (
      <ErrorBox titulo="No se pudieron cargar las ventas">
        Revisá la conexión con la base de datos.
      </ErrorBox>
    );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          value={q}
          onChange={setQ}
          placeholder="Buscar por factura o cliente"
        />
        <select
          className={cx(selectCls, "sm:w-auto!")}
          value={modalidad}
          onChange={(e) => setModalidad(e.target.value)}
        >
          <option value="todas">Todas las modalidades</option>
          <option value="1">Crédito</option>
          <option value="0">Contado</option>
          <option value="anuladas">Anuladas</option>
        </select>
        <FiltroFechas value={fechas} onChange={setFechas} />
        <div className="flex-1" />
        <Button variant="primary" onClick={() => router.push("/ventas/nueva")}>
          <Icon name="mas" size={16} stroke={2} color="#fff" />
          Nueva venta
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-head">
                <th className={cx(thCls, "pl-4")}>NRO. FACTURA</th>
                <th className={thCls}>FECHA</th>
                <th className={thCls}>CLIENTE</th>
                <th className={thCls}>MODALIDAD</th>
                <th className={thCls}>PLAZO</th>
                <th className={cx(thCls, "pr-4 text-right")}>TOTAL Gs</th>
              </tr>
            </thead>
            <tbody>
              {ventas === null
                ? [0, 1, 2, 3, 4].map((i) => (
                    <tr
                      key={i}
                      className="animate-gqgpulse border-b border-line"
                    >
                      <td colSpan={6} className="px-4 py-3">
                        <div className="h-2.5 rounded-xs bg-head" />
                      </td>
                    </tr>
                  ))
                : visibles.map((v) => (
                    <tr
                      key={v.id}
                      onClick={() => router.push(`/ventas/${v.id}`)}
                      className="cursor-pointer border-b border-line hover:bg-hover"
                    >
                      <td
                        className={cx(
                          tdCls,
                          "pl-4 font-mono font-medium whitespace-nowrap",
                        )}
                      >
                        {nroFactura(v.serie, v.nrofactura)}
                      </td>
                      <td className={cx(tdCls, "font-mono text-muted")}>
                        {fechaCorta(v.fechafactura)}
                      </td>
                      <td className={tdCls}>{v.cliente}</td>
                      <td className={tdCls}>
                        <div className="flex gap-1">
                          <Chip tono={v.tipoid === 1 ? "credito" : "neutro"}>
                            {v.tipoid === 1 ? "Crédito" : "Contado"}
                          </Chip>
                          {v.anulada === 1 && <Chip tono="error">Anulada</Chip>}
                        </div>
                      </td>
                      <td className={cx(tdCls, "text-muted")}>
                        {v.tipoid === 1 ? v.plazo : "—"}
                      </td>
                      <td
                        className={cx(
                          tdCls,
                          "pr-4 text-right font-mono font-medium",
                          v.anulada === 1 && "text-subtle line-through",
                        )}
                      >
                        {gs(v.totalfactura)}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {ventas !== null &&
          filtradas.length === 0 &&
          (ventas.length === 0 ? (
            <EmptyState
              icon="ventas"
              titulo="Todavía no hay ventas"
              texto="Emití la primera factura para verla acá."
            />
          ) : (
            <EmptyState
              icon="buscar"
              titulo={q ? `Sin resultados para «${q}»` : "Sin resultados"}
              texto="Revisá el número de factura o probá con otro cliente."
            >
              <Button size="sm" onClick={limpiar}>
                Limpiar búsqueda
              </Button>
            </EmptyState>
          ))}
      </Card>

      {ventas !== null && ventas.length > 0 && (
        <div className="flex items-center justify-between text-[13px] text-muted">
          <span>
            {filtradas.length} de {ventas.length} facturas
          </span>
          {paginas > 1 && (
            <div className="flex gap-1">
              <Button
                size="sm"
                disabled={pagina === 1}
                onClick={() => setPagina((p) => p - 1)}
                aria-label="Anterior"
              >
                ‹
              </Button>
              {Array.from({ length: paginas }, (_, i) => i + 1).map((n) => (
                <Button
                  key={n}
                  size="sm"
                  variant={n === pagina ? "primary" : "secondary"}
                  onClick={() => setPagina(n)}
                >
                  {n}
                </Button>
              ))}
              <Button
                size="sm"
                disabled={pagina === paginas}
                onClick={() => setPagina((p) => p + 1)}
                aria-label="Siguiente"
              >
                ›
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

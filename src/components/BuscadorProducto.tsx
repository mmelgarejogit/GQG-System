"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import Icon from "@/components/Icon";
import { Button, cx, inputCls } from "@/components/ui";
import { gs } from "@/lib/format";

export type ProductoVenta = {
  codbarra: string;
  producto: string;
  iva: number;
  precio: number;
};

const MAXIMO = 50;

function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export default function BuscadorProducto({
  productos,
  enVenta,
  onElegir,
}: {
  productos: ProductoVenta[];
  enVenta: Map<string, number>;
  onElegir: (p: ProductoVenta) => void;
}) {
  const [q, setQ] = useState("");
  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const raiz = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const lista = useRef<HTMLUListElement>(null);
  const id = useId();

  const ordenados = useMemo(
    () =>
      [...productos].sort((a, b) => a.producto.localeCompare(b.producto, "es")),
    [productos],
  );

  const coincidencias = useMemo(() => {
    const n = normalizar(q);
    if (!n) return ordenados;
    return ordenados.filter(
      (p) =>
        normalizar(p.producto).includes(n) ||
        p.codbarra.toLowerCase().includes(n),
    );
  }, [ordenados, q]);

  const visibles = coincidencias.slice(0, MAXIMO);

  useEffect(() => {
    function fuera(e: MouseEvent) {
      if (raiz.current && !raiz.current.contains(e.target as Node))
        setAbierto(false);
    }
    document.addEventListener("mousedown", fuera);
    return () => document.removeEventListener("mousedown", fuera);
  }, []);

  useEffect(() => {
    lista.current
      ?.querySelector<HTMLElement>(`[data-indice="${activo}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activo, abierto]);

  function abrir() {
    setAbierto(true);
    setActivo(0);
  }

  function elegir(p: ProductoVenta) {
    onElegir(p);
    setQ("");
    setError(null);
    setAbierto(false);
    setActivo(0);
    input.current?.focus();
  }

  function confirmar() {
    const texto = q.trim();
    if (!texto) {
      abrir();
      input.current?.focus();
      return;
    }
    const exacto = productos.find(
      (p) => p.codbarra.toLowerCase() === texto.toLowerCase(),
    );
    if (exacto) return elegir(exacto);
    if (abierto && visibles[activo]) return elegir(visibles[activo]);
    if (visibles.length === 1) return elegir(visibles[0]);
    if (visibles.length === 0) {
      setAbierto(false);
      return setError(`No hay un producto activo que coincida con «${texto}».`);
    }
    abrir();
  }

  function teclado(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!abierto) return abrir();
      setActivo((i) => Math.min(i + 1, visibles.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActivo((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      confirmar();
    } else if (e.key === "Escape") {
      setAbierto(false);
    }
  }

  const idLista = `${id}-lista`;
  const idOpcion = (i: number) => `${id}-op-${i}`;

  return (
    <div className="flex min-w-0 flex-[1_1_300px] flex-wrap items-center justify-end gap-2">
      <div ref={raiz} className="relative min-w-40 flex-1 sm:max-w-[360px]">
        <Icon
          name="buscar"
          size={16}
          stroke={1.8}
          color="#9CA3AF"
          className="absolute top-[10px] left-2.5"
        />
        <input
          ref={input}
          role="combobox"
          aria-label="Buscar producto"
          aria-expanded={abierto}
          aria-controls={idLista}
          aria-autocomplete="list"
          aria-activedescendant={
            abierto && visibles[activo] ? idOpcion(activo) : undefined
          }
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setError(null);
            abrir();
          }}
          onFocus={abrir}
          onClick={abrir}
          onKeyDown={teclado}
          placeholder="Buscar producto o escanear código"
          autoComplete="off"
          className={cx(inputCls, "pl-8", error && "border-error")}
        />
        {abierto && (
          <div className="absolute top-full right-0 left-0 z-20 mt-1 overflow-hidden rounded-md border border-line-strong bg-surface shadow-sm sm:min-w-[380px]">
            {visibles.length === 0 ? (
              <div className="px-3 py-3 text-[13px] text-muted">
                {productos.length === 0
                  ? "No hay productos activos. Cargalos en Productos."
                  : `Ningún producto coincide con «${q.trim()}».`}
              </div>
            ) : (
              <ul
                ref={lista}
                id={idLista}
                role="listbox"
                aria-label="Productos"
                className="max-h-72 overflow-y-auto"
              >
                {visibles.map((p, i) => {
                  const cantidad = enVenta.get(p.codbarra);
                  return (
                    <li
                      key={p.codbarra}
                      id={idOpcion(i)}
                      role="option"
                      aria-selected={i === activo}
                      data-indice={i}
                      onMouseDown={(e) => e.preventDefault()}
                      onMouseEnter={() => setActivo(i)}
                      onClick={() => elegir(p)}
                      className={cx(
                        "flex cursor-pointer items-center gap-3 border-b border-line-soft px-3 py-2",
                        i === activo && "bg-hover",
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-medium">
                          {p.producto}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-[11px] text-subtle">
                          <span className="break-all">{p.codbarra}</span>
                          <span>IVA {Number(p.iva)}%</span>
                          {cantidad ? (
                            <span className="rounded-xs bg-accent-soft px-1.5 font-semibold whitespace-nowrap text-primary-strong">
                              ×{cantidad} en venta
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <span className="font-mono text-[13px] font-medium whitespace-nowrap">
                        {gs(p.precio)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="flex justify-between gap-2 bg-bg px-3 py-1.5 text-[11px] text-subtle">
              <span>
                {coincidencias.length > MAXIMO
                  ? `Mostrando ${MAXIMO} de ${coincidencias.length}: seguí escribiendo`
                  : `${coincidencias.length} ${coincidencias.length === 1 ? "producto" : "productos"}`}
              </span>
              <span className="hidden sm:inline">
                ↑↓ elegir · Enter agregar
              </span>
            </div>
          </div>
        )}
      </div>
      <Button size="sm" onClick={confirmar}>
        Agregar ítem
      </Button>
      {error && (
        <div className="w-full text-right text-xs text-error">{error}</div>
      )}
    </div>
  );
}

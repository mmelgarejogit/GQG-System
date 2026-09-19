"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Icon from "@/components/Icon";
import { fechaCorta } from "@/lib/format";

const TITULOS: Record<string, [string, string]> = {
  "/": ["Inicio", "RESUMEN OPERATIVO"],
  "/ventas": ["Ventas", "FACTURAS EMITIDAS"],
  "/ventas/nueva": ["Nueva venta", "EMISIÓN DE FACTURA"],
  "/plazos": ["Plazos", "CONDICIONES DE CRÉDITO"],
  "/clientes": ["Clientes", "PADRÓN"],
  "/productos": ["Productos", "CATÁLOGO"],
  "/depositos": ["Depósitos", "SUCURSALES"],
  "/empresa": ["Empresa", "DATOS DEL EMISOR"],
};

function titulo(path: string): [string, string] {
  if (TITULOS[path]) return TITULOS[path];
  if (path.startsWith("/ventas/") && path.endsWith("/factura"))
    return ["Factura", "IMPRESIÓN A4"];
  if (path.startsWith("/ventas/"))
    return ["Detalle de venta", "CUENTAS A COBRAR"];
  return ["GQG System", ""];
}

export default function Header({ usuario }: { usuario: string }) {
  const path = usePathname();
  const [hoy, setHoy] = useState("");
  const [t, sub] = titulo(path);

  useEffect(() => setHoy(fechaCorta(new Date())), []);

  async function salir() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.replace("/login");
  }

  return (
    <header
      data-noprint
      className="flex h-14 flex-none items-center gap-4 border-b border-line bg-surface px-6"
    >
      <div className="min-w-0">
        <div className="truncate text-base leading-5 font-semibold">{t}</div>
        <div className="text-[11px] leading-3.5 font-semibold tracking-[0.05em] whitespace-nowrap text-faint">
          {sub}
        </div>
      </div>
      <div className="flex-1" />
      <div className="hidden items-center gap-2 rounded-md border border-line bg-bg px-2 py-1.5 font-mono text-xs text-muted sm:flex">
        <Icon name="reloj" size={14} stroke={1.8} color="#75777D" />
        <span>{hoy}</span>
      </div>
      <div className="flex items-center gap-2 border-l border-line pl-4">
        <div className="grid h-7 w-7 place-items-center rounded-md bg-accent-soft text-[11px] font-bold text-primary-strong uppercase">
          {usuario.slice(0, 2)}
        </div>
        <div>
          <div className="text-[13px] leading-[15px] font-medium">
            {usuario}
          </div>
          <button
            onClick={salir}
            className="cursor-pointer border-none bg-transparent p-0 text-[11px] text-subtle underline"
          >
            Salir
          </button>
        </div>
      </div>
    </header>
  );
}

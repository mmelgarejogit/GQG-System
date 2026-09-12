"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/components/Icon";
import { cx } from "@/components/ui";

type Item = {
  href: string;
  icon: Parameters<typeof Icon>[0]["name"];
  label: string;
};

const OPERACION: Item[] = [
  { href: "/", icon: "inicio", label: "Inicio" },
  { href: "/ventas/nueva", icon: "mas", label: "Nueva venta" },
  { href: "/ventas", icon: "ventas", label: "Ventas" },
];

const CONFIGURACION: Item[] = [
  { href: "/plazos", icon: "plazos", label: "Plazos" },
  { href: "/clientes", icon: "clientes", label: "Clientes" },
  { href: "/productos", icon: "productos", label: "Productos" },
  { href: "/depositos", icon: "depositos", label: "Depósitos" },
  { href: "/empresa", icon: "empresa", label: "Empresa" },
];

function esActivo(href: string, path: string): boolean {
  if (href === "/") return path === "/";
  if (href === "/ventas")
    return (
      path === "/ventas" ||
      (path.startsWith("/ventas/") && path !== "/ventas/nueva")
    );
  return path === href || path.startsWith(`${href}/`);
}

export default function Sidebar({
  colapsada,
  onToggle,
}: {
  colapsada: boolean;
  onToggle: () => void;
}) {
  const path = usePathname();
  const ancho = colapsada ? "hidden" : "hidden lg:block";

  function grupo(titulo: string, items: Item[], primero: boolean) {
    return (
      <>
        <div
          className={cx(
            ancho,
            "px-2 pb-2 text-[11px] font-semibold tracking-[0.05em] text-faint",
            primero ? "pt-1" : "pt-4",
          )}
        >
          {titulo}
        </div>
        {!primero && (
          <div
            className={cx(
              colapsada ? "block" : "lg:hidden",
              "my-2 border-t border-line",
            )}
          />
        )}
        {items.map((it) => {
          const activo = esActivo(it.href, path);
          return (
            <Link
              key={it.href}
              href={it.href}
              title={it.label}
              className={cx(
                "relative flex w-full items-center gap-2.5 rounded-md p-2 text-ink no-underline hover:bg-hover",
                activo &&
                  "border-l-2 border-primary-strong bg-accent-soft hover:bg-accent-soft",
              )}
            >
              <Icon name={it.icon} color="#182232" className="flex-none" />
              <span
                className={cx(ancho, "text-sm font-medium whitespace-nowrap")}
              >
                {it.label}
              </span>
            </Link>
          );
        })}
      </>
    );
  }

  return (
    <aside
      data-noprint
      className={cx(
        "flex h-screen flex-none flex-col border-r border-line bg-surface",
        colapsada ? "w-16" : "w-16 lg:w-60",
      )}
    >
      <div className="flex h-14 flex-none items-center gap-2.5 border-b border-line px-4">
        <div className="grid h-7 w-7 flex-none place-items-center rounded-md bg-primary-strong text-xs font-bold text-white">
          GQ
        </div>
        <div className={cx(ancho, "min-w-0")}>
          <div className="text-[13px] leading-4 font-semibold whitespace-nowrap">
            GQG System
          </div>
          <div className="text-[11px] leading-3.5 whitespace-nowrap text-subtle">
            Crédito
          </div>
        </div>
      </div>

      <nav className="flex flex-col gap-0.5 overflow-y-auto px-2 py-3">
        {grupo("OPERACIÓN", OPERACION, true)}
        {grupo("CONFIGURACIÓN", CONFIGURACION, false)}
      </nav>

      <div className="mt-auto hidden border-t border-line px-2 py-3 lg:block">
        <button
          onClick={onToggle}
          title={colapsada ? "Expandir menú" : "Colapsar menú"}
          className="flex w-full cursor-pointer items-center gap-2.5 rounded-md p-2 hover:bg-hover"
        >
          <Icon name="colapsar" color="#75777D" className="flex-none" />
          <span
            className={cx(ancho, "text-[13px] whitespace-nowrap text-muted")}
          >
            Colapsar
          </span>
        </button>
      </div>
    </aside>
  );
}

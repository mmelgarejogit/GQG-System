import type { ReactNode } from "react";

const PATHS: Record<string, ReactNode> = {
  inicio: (
    <>
      <rect x="3" y="3" width="7" height="9" />
      <rect x="14" y="3" width="7" height="5" />
      <rect x="14" y="12" width="7" height="9" />
      <rect x="3" y="16" width="7" height="5" />
    </>
  ),
  mas: <path d="M12 5v14M5 12h14" />,
  ventas: (
    <>
      <path d="M5 3h14v18l-3-2-2 2-2-2-2 2-3-2z" />
      <path d="M9 8h6M9 12h6" />
    </>
  ),
  plazos: (
    <>
      <rect x="3" y="5" width="18" height="16" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  clientes: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20c0-3.2 2.7-5 6-5s6 1.8 6 5" />
      <path d="M16 7.5a3 3 0 010 6M18 20c0-2.6-1-4.2-2.5-5" />
    </>
  ),
  productos: (
    <>
      <path d="M3 8l9-5 9 5v8l-9 5-9-5z" />
      <path d="M3 8l9 5 9-5M12 13v8" />
    </>
  ),
  depositos: (
    <>
      <path d="M3 21V9l9-5 9 5v12" />
      <rect x="8" y="13" width="8" height="8" />
    </>
  ),
  empresa: (
    <>
      <rect x="4" y="7" width="16" height="14" />
      <path d="M4 7l2-4h12l2 4M9 21v-5h6v5" />
    </>
  ),
  colapsar: (
    <>
      <rect x="3" y="4" width="18" height="16" />
      <path d="M9 4v16" />
    </>
  ),
  reloj: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  alerta: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4M12 16h.01" />
    </>
  ),
  advertencia: (
    <>
      <path d="M12 9v5M12 17h.01" />
      <path d="M10.3 3.9L2.6 17.5A1.6 1.6 0 004 20h16a1.6 1.6 0 001.4-2.5L13.7 3.9a1.6 1.6 0 00-3.4 0z" />
    </>
  ),
  buscar: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M16.5 16.5L21 21" />
    </>
  ),
  barras: (
    <>
      <rect x="3" y="6" width="18" height="12" />
      <path d="M7 9v6M10 9v6M14 9v6M17 9v6" />
    </>
  ),
  borrar: <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />,
  atras: <path d="M15 6l-6 6 6 6" />,
  imprimir: (
    <>
      <path d="M7 8V3h10v5M7 18H4v-7h16v7h-3" />
      <rect x="7" y="14" width="10" height="7" />
    </>
  ),
  editar: <path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4" />,
  bloquear: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M5.7 5.7l12.6 12.6" />
    </>
  ),
  check: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l2.5 2.5L16 9.5" />
    </>
  ),
};

export default function Icon({
  name,
  size = 18,
  color = "currentColor",
  stroke = 1.6,
  className,
}: {
  name: keyof typeof PATHS;
  size?: number;
  color?: string;
  stroke?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}

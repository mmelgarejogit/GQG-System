import type { ComponentProps, ReactNode } from "react";
import Icon from "@/components/Icon";

export const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

export const inputCls =
  "h-9 w-full rounded-md border border-line-strong bg-surface px-2.5 text-sm text-ink disabled:bg-bg disabled:text-muted";
export const monoInputCls = cx(inputCls, "font-mono text-[13px]");
export const selectCls =
  "h-9 w-full rounded-md border border-line-strong bg-surface px-2 text-sm text-ink";
export const thCls =
  "px-2 py-2 text-left text-[11px] font-semibold tracking-[0.05em] text-muted";
export const tdCls = "px-2 py-2 text-[13px]";

export function Card({ className, ...p }: ComponentProps<"div">) {
  return (
    <div
      className={cx("rounded-md border border-line bg-surface", className)}
      {...p}
    />
  );
}

export function SectionLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "text-[11px] font-semibold tracking-[0.05em] text-subtle",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return (
    <label className="mb-1.5 block text-[11px] font-semibold tracking-[0.05em] text-muted">
      {children}
    </label>
  );
}

type BtnVariant = "primary" | "secondary" | "danger" | "danger-outline";

export function Button({
  variant = "secondary",
  size = "md",
  className,
  ...p
}: ComponentProps<"button"> & { variant?: BtnVariant; size?: "sm" | "md" }) {
  return (
    <button
      className={cx(
        "inline-flex cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        size === "md" ? "h-9 px-3.5 text-sm" : "h-8 px-2.5 text-[13px]",
        variant === "primary" &&
          "bg-primary font-semibold text-white hover:bg-primary-strong",
        variant === "secondary" &&
          "border border-line-strong bg-surface font-medium text-ink hover:bg-hover",
        variant === "danger" &&
          "bg-error font-semibold text-white hover:bg-error-strong",
        variant === "danger-outline" &&
          "border border-line-strong bg-surface font-medium text-error hover:border-error-line hover:bg-error-soft",
        className,
      )}
      {...p}
    />
  );
}

export function IconButton({
  icon,
  danger,
  className,
  ...p
}: ComponentProps<"button"> & {
  icon: Parameters<typeof Icon>[0]["name"];
  danger?: boolean;
}) {
  return (
    <button
      className={cx(
        "inline-grid h-7 w-7 cursor-pointer place-items-center rounded-md border border-line-strong bg-surface align-middle",
        danger
          ? "hover:border-error-line hover:bg-error-soft"
          : "hover:bg-hover",
        className,
      )}
      {...p}
    >
      <Icon
        name={icon}
        size={14}
        stroke={1.8}
        color={danger ? "#BA1A1A" : "#45474C"}
      />
    </button>
  );
}

export type ChipTono = "credito" | "neutro" | "ok" | "error" | "warn";

const CHIP: Record<ChipTono, string> = {
  credito: "bg-accent-soft text-primary-strong",
  neutro: "bg-head text-muted",
  ok: "bg-ok-bg text-ok",
  error: "bg-error-soft text-error-strong",
  warn: "bg-warn-soft text-warn",
};

export function Chip({
  tono,
  children,
}: {
  tono: ChipTono;
  children: ReactNode;
}) {
  return (
    <span
      className={cx(
        "inline-block whitespace-nowrap rounded-xs px-1.5 py-0.5 text-[11px] font-semibold tracking-[0.05em] uppercase",
        CHIP[tono],
      )}
    >
      {children}
    </span>
  );
}

export function ErrorBox({
  titulo,
  children,
}: {
  titulo?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-md border border-error-line bg-error-soft px-3.5 py-3">
      <Icon
        name="alerta"
        size={18}
        stroke={1.8}
        color="#93000A"
        className="mt-px flex-none"
      />
      <div className="text-[13px] text-error-strong">
        {titulo && <div className="font-semibold">{titulo}</div>}
        <div className={titulo ? "mt-0.5" : ""}>{children}</div>
      </div>
    </div>
  );
}

export function EmptyState({
  icon,
  titulo,
  texto,
  children,
}: {
  icon: Parameters<typeof Icon>[0]["name"];
  titulo: string;
  texto?: string;
  children?: ReactNode;
}) {
  return (
    <div className="px-6 py-16 text-center">
      <Icon
        name={icon}
        size={28}
        stroke={1.5}
        color="#9CA3AF"
        className="mx-auto mb-3"
      />
      <div className="mb-1 text-base font-semibold">{titulo}</div>
      {texto && <div className="text-[13px] text-muted">{texto}</div>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative w-full max-w-[360px] flex-1">
      <Icon
        name="buscar"
        size={16}
        stroke={1.8}
        color="#9CA3AF"
        className="absolute top-2.5 left-2.5"
      />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cx(inputCls, "pl-8")}
      />
    </div>
  );
}

export function Fila({
  k,
  v,
  mono,
  fuerte,
}: {
  k: string;
  v: ReactNode;
  mono?: boolean;
  fuerte?: boolean;
}) {
  return (
    <div className="flex justify-between border-b border-line-soft py-1.5">
      <span className="text-[13px] text-muted">{k}</span>
      <span
        className={cx(
          "text-[13px]",
          mono !== false && "font-mono",
          fuerte && "font-semibold",
        )}
      >
        {v}
      </span>
    </div>
  );
}

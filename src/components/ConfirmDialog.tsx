"use client";

import { useEffect, type ReactNode } from "react";
import Icon from "@/components/Icon";
import { Button, cx } from "@/components/ui";

type Props = {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  busy?: boolean;
  confirmDisabled?: boolean;
  children?: ReactNode;
  onConfirm: () => void;
  onClose: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  danger = false,
  busy = false,
  confirmDisabled = false,
  children,
  onConfirm,
  onClose,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-[rgba(27,27,29,0.32)] p-6"
      role="dialog"
      aria-modal="true"
      onClick={() => !busy && onClose()}
    >
      <div
        className="w-full max-w-[420px] rounded-md border border-line-strong bg-surface p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start gap-3">
          <div
            className={cx(
              "grid h-8 w-8 flex-none place-items-center rounded-md",
              danger ? "bg-error-soft" : "bg-accent-soft",
            )}
          >
            <Icon
              name={danger ? "advertencia" : "check"}
              size={18}
              stroke={1.8}
              color={danger ? "#BA1A1A" : "#182232"}
            />
          </div>
          <div>
            <div className="mb-1 text-base font-semibold">{title}</div>
            {message && (
              <div className="text-[13px] leading-5 text-muted">{message}</div>
            )}
          </div>
        </div>
        {children && <div className="mb-4">{children}</div>}
        <div className="flex justify-end gap-2">
          <Button onClick={onClose} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button
            variant={danger ? "danger" : "primary"}
            onClick={onConfirm}
            disabled={busy || confirmDisabled}
          >
            {busy ? "..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

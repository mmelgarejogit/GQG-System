"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { Label, inputCls } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    if (!usuario.trim() || !password)
      return setError("Ingresá usuario y contraseña.");
    setBusy(true);
    setError(null);
    const r = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario, password }),
    });
    if (r.ok) {
      router.replace("/");
      router.refresh();
    } else {
      setError(
        r.status === 401
          ? "Usuario o contraseña incorrectos."
          : "No se pudo iniciar sesión.",
      );
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-bg px-6 py-12">
      <div className="w-full max-w-[392px]">
        <div className="mb-6 flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-primary-strong text-[13px] font-bold tracking-[-0.02em] text-white">
            GQ
          </div>
          <div>
            <div className="text-base leading-5 font-semibold">GQG System</div>
            <div className="text-[11px] font-semibold tracking-[0.05em] text-subtle">
              MÓDULO DE CRÉDITO
            </div>
          </div>
        </div>
        <form
          onSubmit={entrar}
          className="rounded-md border border-line bg-surface p-6"
        >
          <div className="mb-1 text-xl font-semibold tracking-[-0.01em]">
            Iniciar sesión
          </div>
          <div className="mb-6 text-[13px] text-muted">
            Acceso exclusivo para administración.
          </div>
          <Label>USUARIO</Label>
          <input
            className={`${inputCls} mb-4`}
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            placeholder="admin"
            autoComplete="username"
            autoFocus
          />
          <Label>CONTRASEÑA</Label>
          <input
            className={`${inputCls} mb-2`}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
          />
          {error && (
            <div className="mb-2 flex items-start gap-2 rounded-md bg-error-soft px-2.5 py-2">
              <Icon
                name="alerta"
                size={16}
                stroke={1.8}
                color="#93000A"
                className="mt-px flex-none"
              />
              <span className="text-[13px] text-error-strong">{error}</span>
            </div>
          )}
          <button
            disabled={busy}
            className="mt-2 h-9 w-full cursor-pointer rounded-md bg-primary text-sm font-semibold text-white hover:bg-primary-strong disabled:opacity-50"
          >
            {busy ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </main>
  );
}

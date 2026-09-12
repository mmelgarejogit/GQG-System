"use client";

import { useEffect, useState, type ReactNode } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";

const CLAVE = "gqg-sidebar-colapsada";

export default function AppShell({
  usuario,
  children,
}: {
  usuario: string;
  children: ReactNode;
}) {
  const [colapsada, setColapsada] = useState(false);

  useEffect(() => {
    try {
      setColapsada(localStorage.getItem(CLAVE) === "1");
    } catch {}
  }, []);

  function toggle() {
    setColapsada((c) => {
      try {
        localStorage.setItem(CLAVE, c ? "0" : "1");
      } catch {}
      return !c;
    });
  }

  return (
    <div className="flex h-screen overflow-hidden print:block print:h-auto print:overflow-visible">
      <Sidebar colapsada={colapsada} onToggle={toggle} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header usuario={usuario} />
        <main className="flex min-w-0 flex-1 flex-col gap-6 overflow-y-auto p-6 print:overflow-visible print:p-0">
          {children}
        </main>
      </div>
    </div>
  );
}

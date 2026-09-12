import { redirect } from "next/navigation";
import { leerSesion } from "@/lib/auth";
import AppShell from "@/components/AppShell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sesion = await leerSesion();
  if (!sesion) redirect("/login");
  return <AppShell usuario={sesion.usuario}>{children}</AppShell>;
}

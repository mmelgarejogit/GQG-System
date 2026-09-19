export type DepositoValidado = {
  deposito: string;
  direccion: string;
  telefono: string;
};

export function validarDeposito(
  b: Record<string, unknown>,
): { error: string } | DepositoValidado {
  const deposito = String(b.deposito || "").trim();
  const direccion = String(b.direccion || "").trim();
  const telefono = String(b.telefono || "").trim();
  if (!deposito) return { error: "Nombre del depósito requerido" };
  if (deposito.length > 200)
    return { error: "El nombre no puede superar los 200 caracteres" };
  if (direccion.length > 150)
    return { error: "La dirección no puede superar los 150 caracteres" };
  if (telefono.length > 15)
    return { error: "El teléfono no puede superar los 15 caracteres" };
  return { deposito, direccion, telefono };
}

export type DetallePlazo = { cuota: number; dias: number };

export type PlazoValidado = {
  plazo: string;
  cuotas: number;
  irregular: number;
  detalles: DetallePlazo[];
};

export function validarPlazo(
  b: Record<string, unknown>,
  tipoid: number,
): { error: string } | PlazoValidado {
  const plazo = String(b.plazo || "").trim();
  const credito = tipoid === 1;
  const cuotas = credito ? Number(b.cuotas) : 1;
  const irregular = credito && b.irregular ? 1 : 0;
  const detalles = Array.isArray(b.detalles)
    ? (b.detalles as DetallePlazo[])
    : [];

  if (!plazo) return { error: "Nombre del plazo requerido" };
  if (plazo.length > 100)
    return { error: "El nombre no puede superar los 100 caracteres" };
  if (!Number.isInteger(cuotas) || cuotas < 1 || cuotas > 120)
    return { error: "Cantidad de cuotas invalida (1 a 120)" };
  if (!irregular) return { plazo, cuotas, irregular, detalles: [] };

  if (detalles.length !== cuotas)
    return { error: "Un plazo irregular necesita los dias de cada cuota" };
  let anterior = 0;
  const limpios: DetallePlazo[] = [];
  for (let i = 0; i < detalles.length; i++) {
    const dias = Number(detalles[i]?.dias);
    if (!Number.isInteger(dias) || dias < 1)
      return { error: "Dias de cuota invalidos" };
    if (dias <= anterior)
      return { error: "Los dias de cada cuota deben ser crecientes" };
    anterior = dias;
    limpios.push({ cuota: i + 1, dias });
  }
  return { plazo, cuotas, irregular, detalles: limpios };
}

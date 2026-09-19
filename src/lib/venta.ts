export type Cuota = {
  cuota: number;
  importe: number;
  cobrado: number;
  vence: string;
};
export type LineaVenta = {
  codbarra: string;
  producto: string;
  precio: number;
  cantidad: number;
  iva: number;
  total: number;
};
export type VentaDetalle = {
  id: number;
  serie: string;
  nrofactura: number;
  fechafactura: string;
  totalfactura: number;
  timbrado: string;
  timbrado_vence: string;
  anulada: number;
  anulada_fecha: string | null;
  anulada_usuario: string | null;
  anulada_motivo: string | null;
  cliente: string;
  documentonro: string;
  cliente_direccion: string;
  cliente_telefono: string;
  tipo: string;
  abreviatura: string;
  tipoid: number;
  plazo: string;
  deposito: string;
  moneda: string;
  cuotas: Cuota[];
  lineas: LineaVenta[];
};

export function liquidacionIva(lineas: LineaVenta[]) {
  let exento = 0,
    sub5 = 0,
    sub10 = 0;
  for (const l of lineas) {
    const t = Number(l.total);
    if (Number(l.iva) === 5) sub5 += t;
    else if (Number(l.iva) === 10) sub10 += t;
    else exento += t;
  }
  const iva5 = Math.round(sub5 / 21);
  const iva10 = Math.round(sub10 / 11);
  return {
    exento,
    sub5,
    sub10,
    iva5,
    iva10,
    grav5: sub5 - iva5,
    grav10: sub10 - iva10,
    totalIva: iva5 + iva10,
  };
}

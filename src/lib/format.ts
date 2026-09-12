// Formatos compartidos de la UI.

// Fecha -> DD/MM/YYYY (con ceros). Acepta 'YYYY-MM-DD', 'YYYY-MM-DD HH:MM:SS' o Date.
export function fechaCorta(valor: string | Date | null | undefined): string {
  if (!valor) return "-";
  if (typeof valor === "string") {
    const p = valor.slice(0, 10).split("-"); // YYYY-MM-DD
    if (p.length === 3) return `${p[2]}/${p[1]}/${p[0]}`;
  }
  const d = new Date(valor);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

// Numero de cuota -> "01/03" (ambos con dos digitos)
export function cuotaLabel(n: number, total: number): string {
  return `${String(n).padStart(2, "0")}/${String(total).padStart(2, "0")}`;
}

// Monto -> separador de miles es-PY, sin decimales (Guarani)
export function gs(n: number): string {
  return Math.round(Number(n) || 0).toLocaleString("es-PY");
}

export function nroFactura(serie: string, nro: number): string {
  return `${serie}-${String(nro).padStart(7, "0")}`;
}

export function hoyIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function sumarDias(iso: string, dias: number): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  const dt = new Date(y, m - 1, d + dias);
  return fechaCorta(dt);
}

export type EstadoCuota = "Cobrada" | "Vencida" | "Por vencer" | "Pendiente";

export function estadoCuota(c: {
  importe: number;
  cobrado: number;
  vence: string;
}): EstadoCuota {
  if (Number(c.cobrado) >= Number(c.importe)) return "Cobrada";
  const hoy = hoyIso();
  const vence = String(c.vence).slice(0, 10);
  if (vence < hoy) return "Vencida";
  const [y, m, d] = hoy.split("-").map(Number);
  const limite = new Date(y, m - 1, d + 7);
  const limiteIso = `${limite.getFullYear()}-${String(limite.getMonth() + 1).padStart(2, "0")}-${String(limite.getDate()).padStart(2, "0")}`;
  return vence <= limiteIso ? "Por vencer" : "Pendiente";
}

export function tonoEstado(e: EstadoCuota): "ok" | "error" | "warn" | "neutro" {
  if (e === "Cobrada") return "ok";
  if (e === "Vencida") return "error";
  if (e === "Por vencer") return "warn";
  return "neutro";
}

const UNIDADES = [
  "",
  "uno",
  "dos",
  "tres",
  "cuatro",
  "cinco",
  "seis",
  "siete",
  "ocho",
  "nueve",
  "diez",
  "once",
  "doce",
  "trece",
  "catorce",
  "quince",
  "dieciséis",
  "diecisiete",
  "dieciocho",
  "diecinueve",
  "veinte",
  "veintiuno",
  "veintidós",
  "veintitrés",
  "veinticuatro",
  "veinticinco",
  "veintiséis",
  "veintisiete",
  "veintiocho",
  "veintinueve",
];
const DECENAS = [
  "",
  "",
  "",
  "treinta",
  "cuarenta",
  "cincuenta",
  "sesenta",
  "setenta",
  "ochenta",
  "noventa",
];
const CENTENAS = [
  "",
  "ciento",
  "doscientos",
  "trescientos",
  "cuatrocientos",
  "quinientos",
  "seiscientos",
  "setecientos",
  "ochocientos",
  "novecientos",
];

function hasta999(n: number): string {
  if (n === 100) return "cien";
  const c = Math.floor(n / 100);
  const r = n % 100;
  let txt = CENTENAS[c];
  if (r > 0) {
    let dec: string;
    if (r < 30) dec = UNIDADES[r];
    else {
      const d = Math.floor(r / 10);
      const u = r % 10;
      dec = DECENAS[d] + (u ? ` y ${UNIDADES[u]}` : "");
    }
    txt = txt ? `${txt} ${dec}` : dec;
  }
  return txt;
}

function apocope(txt: string): string {
  return txt.replace(/veintiuno$/, "veintiún").replace(/uno$/, "un");
}

export function numeroALetras(valor: number): string {
  const n = Math.round(Math.abs(Number(valor) || 0));
  if (n === 0) return "cero";
  const millones = Math.floor(n / 1_000_000);
  const miles = Math.floor((n % 1_000_000) / 1000);
  const resto = n % 1000;
  const partes: string[] = [];
  if (millones)
    partes.push(
      millones === 1
        ? "un millón"
        : `${apocope(millones < 1000 ? hasta999(millones) : numeroALetras(millones))} millones`,
    );
  if (miles)
    partes.push(miles === 1 ? "mil" : `${apocope(hasta999(miles))} mil`);
  if (resto) partes.push(hasta999(resto));
  return partes.join(" ");
}

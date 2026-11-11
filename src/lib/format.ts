const moneyFmt = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
const numberFmt = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 });

export const money = (v: string | number | null | undefined) => moneyFmt.format(Number(v ?? 0));
export const num = (v: string | number | null | undefined) => numberFmt.format(Number(v ?? 0));

/** '2026-03-15' → '15/03/2026' (sin pasar por Date para no mover el día por zona horaria). */
export function date(iso: string | null | undefined) {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

/** Fecha-hora UTC de la API → hora local de Colombia. */
export function datetime(iso: string | null | undefined) {
  if (!iso) return '—';
  const d = new Date(iso.endsWith('Z') || iso.includes('+') ? iso : `${iso}Z`);
  return d.toLocaleString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export const todayISO = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

/** "1.234.567" → 1234567 */
export const digitsToNumber = (v: string) => Number(String(v).replace(/[^0-9]/g, '') || 0);

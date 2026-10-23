const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export const formatMoney = (value: number | null | undefined) => money.format(value ?? 0);

/**
 * El backend guarda las fechas en UTC pero las devuelve sin zona horaria
 * (ej. "2026-01-13T01:19:20"). Se marcan como UTC para que el navegador
 * las convierta a la hora local correctamente.
 */
export function parseApiDate(value: string | null | undefined): Date {
  if (!value) return new Date(NaN);
  const hasZone = /([zZ]|[+-]\d{2}:?\d{2})$/.test(value);
  return new Date(hasZone ? value : `${value}Z`);
}

export const formatDate = (value: string | null | undefined) =>
  parseApiDate(value).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });

export const formatDateTime = (value: string | null | undefined) =>
  parseApiDate(value).toLocaleString('es-VE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export const isSameLocalDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export const isSameLocalMonth = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

/** Iniciales para avatares: "Juan Pérez" -> "JP" */
export const initials = (name: string | null | undefined) =>
  (name ?? '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');

/** Búsqueda sin distinguir mayúsculas ni acentos */
export const normalize = (text: string | null | undefined) =>
  (text ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

export const matches = (query: string, ...fields: (string | null | undefined)[]) => {
  const q = normalize(query.trim());
  return !q || fields.some((f) => normalize(f).includes(q));
};

/** Separa "J-12345678" o "0412-1234567" en [prefijo, número] */
export function splitPrefixed(value: string | null | undefined, fallbackPrefix: string): [string, string] {
  if (value && value.includes('-')) {
    const [prefix, ...rest] = value.split('-');
    return [prefix, rest.join('').replace(/\D/g, '')];
  }
  return [fallbackPrefix, (value ?? '').replace(/\D/g, '')];
}

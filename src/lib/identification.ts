import { nitDv } from '@/lib/nit';

/** Tipos de identificación de clientes (persona o empresa). */
export type CustomerIdType = 'CC' | 'NIT' | 'CE' | 'PPT' | 'PP';

export const CUSTOMER_ID_TYPES: { value: CustomerIdType; label: string; short: string }[] = [
  { value: 'CC', label: 'Cédula de ciudadanía', short: 'C.C.' },
  { value: 'NIT', label: 'NIT (empresa)', short: 'NIT' },
  { value: 'CE', label: 'Cédula de extranjería', short: 'C.E.' },
  { value: 'PPT', label: 'Permiso por protección temporal', short: 'PPT' },
  { value: 'PP', label: 'Pasaporte', short: 'Pasaporte' },
];

const BY_VALUE = Object.fromEntries(CUSTOMER_ID_TYPES.map((t) => [t.value, t]));

/** Nombre corto del tipo: 'C.C.', 'NIT', ... */
export const idTypeShort = (type?: string | null) => BY_VALUE[type || 'CC']?.short ?? (type || 'C.C.');

/** Número para mostrar; el NIT lleva su dígito de verificación: 900123456-7. */
export function idNumber(type: string | null | undefined, number: string | null | undefined): string {
  if (!number) return '';
  return type === 'NIT' ? `${number}-${nitDv(number)}` : number;
}

/** 'NIT 900123456-7' · 'C.C. 1045737528' */
export const idFull = (type: string | null | undefined, number: string | null | undefined) =>
  number ? `${idTypeShort(type)} ${idNumber(type, number)}` : '';

/** Limpia lo que se escribe: solo dígitos para CC/NIT; letras y números para los demás. */
export function cleanIdNumber(type: string, value: string): string {
  if (type === 'CC' || type === 'NIT') return value.replace(/\D/g, '').slice(0, 10);
  return value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 20);
}

/** Dígito de verificación del NIT (algoritmo DIAN). */
export function nitDv(nit: string): string {
  const digits = (nit || '').replace(/\D/g, '');
  if (!digits) return '';
  const weights = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];
  const sum = digits.split('').reverse().reduce((acc, d, i) => acc + Number(d) * (weights[i] ?? 0), 0);
  const remainder = sum % 11;
  return String(remainder === 0 || remainder === 1 ? remainder : 11 - remainder);
}

export function onlyDigits(value: string): string {
  return (value || '').replace(/\D/g, '');
}

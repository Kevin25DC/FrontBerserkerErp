'use client';

import { useEffect, useState } from 'react';

/** Valor que se actualiza solo cuando el usuario deja de escribir (evita una petición por tecla). */
export function useDebounced<T>(value: T, ms = 300): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

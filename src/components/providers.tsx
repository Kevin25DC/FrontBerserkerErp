'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

type Toast = { id: number; kind: 'success' | 'error' | 'info'; text: string };
type ToastApi = { success: (t: string) => void; error: (t: string) => void; info: (t: string) => void };

const ToastCtx = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast fuera de <Providers>');
  return ctx;
}

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          // Navegar entre pantallas reutiliza lo ya cargado y refresca en segundo plano
          queries: { staleTime: 30_000, gcTime: 10 * 60_000, refetchOnWindowFocus: true, retry: 1 },
        },
      }),
  );
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((kind: Toast['kind'], text: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === 'error' ? 6000 : 3500);
  }, []);
  const [api] = useState<ToastApi>(() => ({
    success: (t) => push('success', t),
    error: (t) => push('error', t),
    info: (t) => push('info', t),
  }));

  return (
    <QueryClientProvider client={client}>
      <ToastCtx.Provider value={api}>
        {children}
        <div className="toasts" aria-live="polite">
          {toasts.map((t) => (
            <div key={t.id} className={`toast ${t.kind}`}>
              <i className={`bi ${t.kind === 'error' ? 'bi-exclamation-octagon' : t.kind === 'success' ? 'bi-check-circle' : 'bi-info-circle'}`} />
              <span>{t.text}</span>
            </div>
          ))}
        </div>
      </ToastCtx.Provider>
    </QueryClientProvider>
  );
}

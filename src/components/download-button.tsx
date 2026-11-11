'use client';

import { useState, type ReactNode } from 'react';
import { useToast } from '@/components/providers';
import { download } from '@/lib/api';

type Props = {
  /** URL directa (p. ej. /api/pdf/invoice/1). */
  href?: string;
  /** Ruta de la API (se antepone /api/backend). */
  path?: string;
  query?: Record<string, string | number | boolean | null | undefined>;
  fallbackName?: string;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
  loadingLabel?: string;
  successText?: (name: string) => string;
};

function filenameFrom(header: string | null, fallback: string) {
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(header ?? '');
  if (!match) return fallback;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

/** Enlace/btn de descarga: muestra spinner mientras baja y avisa arriba al terminar. */
export function DownloadButton({ href, path, query, fallbackName = 'archivo', children, className = 'btn', style, title, loadingLabel, successText }: Props) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function onClick(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      let name: string;
      if (path) {
        name = await download(path, query, fallbackName);
      } else if (href) {
        const res = await fetch(href, { cache: 'no-store' });
        if (!res.ok) {
          let detail = `Error ${res.status}`;
          try {
            const body = await res.json();
            if (typeof body?.detail === 'string') detail = body.detail;
          } catch {
            /* respuesta sin JSON */
          }
          throw new Error(detail);
        }
        name = filenameFrom(res.headers.get('content-disposition'), fallbackName);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
      } else {
        throw new Error('Descarga sin origen.');
      }
      toast.success(successText ? successText(name) : `Descarga lista: ${name}`);
    } catch (error) {
      toast.error((error as Error).message || 'No se pudo descargar el archivo.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <a
      href={href ?? '#'}
      className={`${className}${busy ? ' is-loading' : ''}`}
      style={style}
      title={title}
      aria-busy={busy}
      aria-disabled={busy}
      onClick={onClick}
    >
      {busy ? <><span className="spinner" />{loadingLabel ? <span>{loadingLabel}</span> : null}</> : children}
    </a>
  );
}

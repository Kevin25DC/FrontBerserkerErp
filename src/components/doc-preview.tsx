'use client';

import { useEffect, useRef, useState } from 'react';
import type { Rendered } from '@/components/doc-templates';

/** Vista previa del documento con la MISMA plantilla del PDF, aislada en un iframe
 *  (el CSS de la plantilla no se mezcla con el de la app). */
export function DocPreview({ doc, title }: { doc: Rendered; title: string }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(1100);
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${title}</title><style>${doc.css}</style></head><body>${doc.body}</body></html>`;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => setHeight((el.contentDocument?.documentElement.scrollHeight ?? 1100) + 8);
    el.addEventListener('load', fit);
    return () => el.removeEventListener('load', fit);
  }, [html]);
  return <iframe ref={ref} title={title} srcDoc={html} style={{ width: '100%', height, border: 0, display: 'block', background: '#fff' }} />;
}

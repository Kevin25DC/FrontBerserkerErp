'use client';

import { useEffect, useRef, useState } from 'react';
import type { Rendered } from '@/components/doc-templates';

/** Ancho de render del documento (A4 ~ 210mm). Se escala para caber en el contenedor:
 *  en el celular el PDF deja de verse "mocho" y se ve completo, más pequeño. */
const DOC_WIDTH = 900;

/** Vista previa del documento con la MISMA plantilla del PDF, aislada en un iframe
 *  (el CSS de la plantilla no se mezcla con el de la app). */
export function DocPreview({ doc, title }: { doc: Rendered; title: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(1100);
  const [scale, setScale] = useState(1);
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${title}</title><style>${doc.css}</style></head><body>${doc.body}</body></html>`;

  useEffect(() => {
    const el = ref.current;
    const wrap = wrapRef.current;
    if (!el || !wrap) return;
    const fitHeight = () => {
      const d = el.contentDocument;
      if (!d) return;
      setHeight(Math.max(d.documentElement.scrollHeight, d.body?.scrollHeight ?? 0) + 8);
    };
    const fitScale = () => setScale(Math.min(1, wrap.clientWidth / DOC_WIDTH));
    el.addEventListener('load', fitHeight);
    const observer = new ResizeObserver(fitScale);
    observer.observe(wrap);
    fitScale();
    return () => {
      el.removeEventListener('load', fitHeight);
      observer.disconnect();
    };
  }, [html]);

  return (
    <div ref={wrapRef} style={{ width: '100%', height: height * scale, overflow: 'hidden' }}>
      <iframe
        ref={ref}
        title={title}
        srcDoc={html}
        style={{
          width: DOC_WIDTH,
          height,
          border: 0,
          display: 'block',
          background: '#fff',
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          margin: scale === 1 ? '0 auto' : 0,
        }}
      />
    </div>
  );
}

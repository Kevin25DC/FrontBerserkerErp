'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { useDebounced } from '@/lib/hooks';
import type { Page, Supplier } from '@/lib/types';

const listStyle: React.CSSProperties = {
  position: 'absolute', zIndex: 20, left: 0, right: 0, top: 'calc(100% + 4px)', background: '#fff', border: '1px solid var(--border)',
  borderRadius: 8, boxShadow: 'var(--shadow-lg)', maxHeight: 300, overflowY: 'auto', padding: 4,
};
const optStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 8, width: '100%', padding: '8px 10px', border: 0, background: 'none', borderRadius: 6, cursor: 'pointer', textAlign: 'left' };

export function SupplierPicker({ value, onPick, placeholder = 'Buscar proveedor por nombre o NIT…' }: {
  value?: string; onPick: (supplier: Supplier) => void; placeholder?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [text, setText] = useState(value ?? '');
  const [open, setOpen] = useState(false);
  const q = useDebounced(text, 200);

  useEffect(() => {
    const handler = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  useEffect(() => setText(value ?? ''), [value]);

  const { data, isFetching } = useQuery({
    queryKey: ['supplier-picker', q],
    queryFn: () => api<Page<Supplier>>('/suppliers', { query: { q, active: true, page_size: 15 } }),
    enabled: open,
  });

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <input className="input" value={text} placeholder={placeholder} onFocus={() => setOpen(true)}
        onChange={(e) => { setText(e.target.value); setOpen(true); }} />
      {open ? (
        <div style={listStyle}>
          {isFetching && !data ? <div className="muted small" style={{ padding: 8 }}>Buscando…</div> : null}
          {data?.items.map((s) => (
            <button type="button" key={s.id} style={optStyle}
              onMouseDown={(e) => { e.preventDefault(); onPick(s); setText(s.name); setOpen(false); }}>
              <span><strong>{s.name}</strong><span className="muted small"> · {s.identification}</span></span>
              <span className="muted small nowrap">{s.id_type}</span>
            </button>
          ))}
          {data && !data.items.length ? <div className="muted small" style={{ padding: 8 }}>Sin resultados</div> : null}
        </div>
      ) : null}
    </div>
  );
}

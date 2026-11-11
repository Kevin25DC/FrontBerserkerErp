'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { money } from '@/lib/format';
import { useDebounced } from '@/lib/hooks';
import type { Customer, Item, Page } from '@/lib/types';

/** Buscador con autocompletado (consulta al servidor mientras se escribe). */
function useOutside(ref: React.RefObject<HTMLElement | null>, onOut: () => void) {
  useEffect(() => {
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && onOut();
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [ref, onOut]);
}

const listStyle: React.CSSProperties = {
  position: 'absolute', zIndex: 20, left: 0, right: 0, top: 'calc(100% + 4px)', background: '#fff', border: '1px solid var(--border)',
  borderRadius: 8, boxShadow: 'var(--shadow-lg)', maxHeight: 280, overflowY: 'auto', padding: 4,
};
const optStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 8, width: '100%', padding: '8px 10px', border: 0, background: 'none', borderRadius: 6, cursor: 'pointer', textAlign: 'left' };

export function ItemPicker({ value, onPick, onlyInStock = false, placeholder = 'Buscar producto…' }: {
  value?: string; onPick: (item: Item) => void; onlyInStock?: boolean; placeholder?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [text, setText] = useState(value ?? '');
  const [open, setOpen] = useState(false);
  const q = useDebounced(text, 200);
  useOutside(ref, () => setOpen(false));
  useEffect(() => setText(value ?? ''), [value]);
  const { data, isFetching } = useQuery({
    queryKey: ['item-picker', q, onlyInStock],
    queryFn: () => api<Page<Item>>('/items', { query: { q, active: true, in_stock: onlyInStock || undefined, page_size: 15 } }),
    enabled: open,
  });
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <input className="input" value={text} placeholder={placeholder} onFocus={() => setOpen(true)}
        onChange={(e) => { setText(e.target.value); setOpen(true); }} />
      {open ? (
        <div style={listStyle}>
          {isFetching && !data ? <div className="muted small" style={{ padding: 8 }}>Buscando…</div> : null}
          {data?.items.map((it) => (
            <button type="button" key={it.id} style={optStyle} className="picker-opt"
              onMouseDown={(e) => { e.preventDefault(); onPick(it); setText(it.name); setOpen(false); }}>
              <span><strong>{it.name}</strong><span className="muted small"> · {it.reference}</span></span>
              <span className="nowrap small">{money(it.price)} · <span className={it.stock <= 0 ? '' : 'muted'} style={it.stock <= 0 ? { color: 'var(--danger)' } : undefined}>stock {it.stock}</span></span>
            </button>
          ))}
          {data && !data.items.length ? <div className="muted small" style={{ padding: 8 }}>Sin resultados</div> : null}
        </div>
      ) : null}
    </div>
  );
}

export function CustomerPicker({ value, onPick }: { value?: string; onPick: (c: Customer) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [text, setText] = useState(value ?? '');
  const [open, setOpen] = useState(false);
  const q = useDebounced(text, 200);
  useOutside(ref, () => setOpen(false));
  useEffect(() => setText(value ?? ''), [value]);
  const { data } = useQuery({
    queryKey: ['customer-picker', q],
    queryFn: () => api<Page<Customer>>('/customers', { query: { q, page_size: 15 } }),
    enabled: open,
  });
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <input className="input" value={text} placeholder="Buscar cliente por nombre o cédula…" onFocus={() => setOpen(true)}
        onChange={(e) => { setText(e.target.value); setOpen(true); }} />
      {open ? (
        <div style={listStyle}>
          {data?.items.map((c) => (
            <button type="button" key={c.id} style={optStyle}
              onMouseDown={(e) => { e.preventDefault(); onPick(c); setText(`${c.name} ${c.lastname}`); setOpen(false); }}>
              <span><strong>{c.name} {c.lastname}</strong></span><span className="muted small">{c.cedula}</span>
            </button>
          ))}
          {data && !data.items.length ? <div className="muted small" style={{ padding: 8 }}>Sin resultados</div> : null}
        </div>
      ) : null}
    </div>
  );
}

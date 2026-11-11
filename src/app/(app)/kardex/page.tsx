'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ItemPicker } from '@/components/item-picker';
import { Badge, Empty, Field, Kpi, LoadingRows, PageHeader } from '@/components/ui';
import { api } from '@/lib/api';
import { datetime, todayISO } from '@/lib/format';
import { useDebounced } from '@/lib/hooks';
import type { Item, KardexOut, KardexSummaryRow } from '@/lib/types';

type Selected = { id: number; name: string; reference: string | null };

const firstOfMonth = () => `${todayISO().slice(0, 8)}01`;

export default function KardexPage() {
  const [selected, setSelected] = useState<Selected | null>(null);
  const [from, setFrom] = useState(firstOfMonth());
  const [to, setTo] = useState(todayISO());
  const [type, setType] = useState<'' | 'IN' | 'OUT'>('');
  const [q, setQ] = useState('');
  const search = useDebounced(q, 250);

  const summary = useQuery({
    queryKey: ['kardex-summary', from, to, search],
    queryFn: () => api<KardexSummaryRow[]>('/inventory/kardex/summary', {
      query: { date_from: from, date_to: to, q: search || undefined },
    }),
    enabled: !selected,
    placeholderData: keepPreviousData,
  });

  const ledger = useQuery({
    queryKey: ['kardex', selected?.id, from, to, type],
    queryFn: () => api<KardexOut>('/inventory/kardex', {
      query: { item_id: selected!.id, date_from: from, date_to: to, movement_type: type || undefined },
    }),
    enabled: !!selected,
    placeholderData: keepPreviousData,
  });

  function pickItem(id: number, name: string, reference: string | null) {
    setSelected({ id, name, reference });
    setType('');
  }

  const k = ledger.data;
  return (
    <>
      <PageHeader title="Kardex" subtitle="Entradas, salidas y saldo corrido por producto." />

      <div className="panel">
        <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <Field label="Producto">
            <div style={{ display: 'flex', gap: 6 }}>
              <div style={{ flex: 1 }}>
                <ItemPicker value={selected?.name} onPick={(it: Item) => pickItem(it.id, it.name, it.reference)} placeholder="Buscar producto…" />
              </div>
              {selected ? <button className="btn btn-icon" title="Ver todos" onClick={() => setSelected(null)}><i className="bi bi-x-lg" /></button> : null}
            </div>
          </Field>
          <Field label="Desde"><input className="input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
          <Field label="Hasta"><input className="input" type="date" value={to} onChange={(e) => setTo(e.target.value)} /></Field>
          <Field label="Tipo">
            <select className="select" value={type} onChange={(e) => setType(e.target.value as typeof type)}>
              <option value="">Entradas y salidas</option>
              <option value="IN">Solo entradas</option>
              <option value="OUT">Solo salidas</option>
            </select>
          </Field>
        </div>
      </div>

      {!selected ? (
        <div className="panel flush">
          <div className="toolbar">
            <h2 className="panel-title" style={{ margin: 0 }}><i className="bi bi-list-columns-reverse" /> Resumen por producto</h2>
            <input className="input" style={{ maxWidth: 320 }} placeholder="Buscar producto o referencia…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Producto</th><th>Referencia</th><th className="num">Stock actual</th><th className="num">Saldo inicial</th><th className="num">Entradas</th><th className="num">Salidas</th><th className="num">Saldo final</th></tr>
              </thead>
              <tbody>
                {summary.isLoading ? <LoadingRows cols={7} /> : summary.data?.length ? summary.data.map((row) => (
                  <tr key={row.item_id} className="row-click" onClick={() => pickItem(row.item_id, row.item_name, row.reference)}>
                    <td className="strong">{row.item_name}</td>
                    <td className="muted">{row.reference || '—'}</td>
                    <td className="num">{row.stock}</td>
                    <td className="num">{row.opening}</td>
                    <td className="num" style={{ color: 'var(--brand)' }}>+{row.entries}</td>
                    <td className="num" style={{ color: 'var(--danger)' }}>-{row.exits}</td>
                    <td className="num strong">{row.closing}</td>
                  </tr>
                )) : <tr><td colSpan={7}><Empty icon="bi-journal-bookmark">No hay productos con esa búsqueda.</Empty></td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <>
          <div className="kpi-grid">
            <Kpi icon="bi-box" label="Saldo inicial" value={k?.opening ?? '—'} />
            <Kpi icon="bi-arrow-down-circle" label="Entradas" value={k ? `+${k.entries}` : '—'} />
            <Kpi icon="bi-arrow-up-circle" tone="danger" label="Salidas" value={k ? `-${k.exits}` : '—'} />
            <Kpi icon="bi-calculator" label="Saldo final" value={k?.closing ?? '—'} />
            <Kpi icon="bi-box-seam" tone="info" label="Stock actual" value={k?.stock ?? '—'} />
          </div>

          <div className="panel flush">
            <div className="toolbar">
              <h2 className="panel-title" style={{ margin: 0 }}>
                <i className="bi bi-journal-text" /> {selected.name}
                {selected.reference ? <span className="muted small" style={{ fontWeight: 400 }}> · {selected.reference}</span> : null}
              </h2>
              <button className="btn btn-sm" onClick={() => setSelected(null)}><i className="bi bi-arrow-left" /> Ver todos</button>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>Fecha</th><th>Tipo</th><th>Referencia</th><th>Detalle</th><th>Usuario</th><th className="num">Cantidad</th><th className="num">Saldo</th></tr>
                </thead>
                <tbody>
                  {ledger.isLoading ? <LoadingRows cols={7} /> : k?.rows.length ? k.rows.map((row, i) => (
                    <tr key={`${row.date}-${i}`}>
                      <td className="nowrap">{datetime(row.date)}</td>
                      <td>{row.movement_type === 'IN' ? <Badge tone="success">Entrada</Badge> : <Badge tone="danger">Salida</Badge>}</td>
                      <td className="strong">{row.reference}</td>
                      <td className="muted">{row.detail || '—'}</td>
                      <td>{row.username || '—'}</td>
                      <td className="num" style={{ color: row.movement_type === 'IN' ? 'var(--brand)' : 'var(--danger)', fontWeight: 600 }}>
                        {row.movement_type === 'IN' ? '+' : '-'}{row.quantity}
                      </td>
                      <td className="num strong">{row.balance}</td>
                    </tr>
                  )) : <tr><td colSpan={7}><Empty icon="bi-inbox">No hay movimientos en el período.</Empty></td></tr>}
                </tbody>
              </table>
            </div>
          </div>
          {type ? <p className="small muted">El saldo corrido y los totales consideran todos los movimientos; el filtro solo oculta filas.</p> : null}
        </>
      )}
    </>
  );
}

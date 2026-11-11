'use client';

import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { CancelModal } from '@/components/cancel-modal';
import { useToast } from '@/components/providers';
import { StatusBadge } from '@/components/status-badge';
import { Empty, PageHeader, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import { date, money } from '@/lib/format';
import { useDebounced } from '@/lib/hooks';
import type { InvoiceDetail, InvoiceSummary } from '@/lib/types';

export default function AnularPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState<number | null>(null);
  const [confirming, setConfirming] = useState(false);
  const search = useDebounced(q);
  const { data, isLoading } = useQuery({
    queryKey: ['invoices', search, status],
    queryFn: () => api<{ items: InvoiceSummary[] }>('/invoices', { query: { q: search, status } }),
    placeholderData: keepPreviousData,
  });
  const { data: inv, isFetching } = useQuery({
    queryKey: ['invoice', String(selected)], enabled: !!selected,
    queryFn: () => api<InvoiceDetail>(`/invoices/${selected}`),
  });

  return (
    <>
      <PageHeader title="Anular factura" subtitle="Busca la factura, revisa su detalle y genera el comprobante de anulación." />
      <div className="grid" style={{ gridTemplateColumns: 'minmax(280px, 380px) 1fr', alignItems: 'start' }}>
        <div className="panel flush">
          <div className="toolbar" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <input className="input" placeholder="Cliente, cédula o N° de factura…" value={q} onChange={(e) => setQ(e.target.value)} />
            <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Todos los estados</option><option value="Pagada">Pagadas</option><option value="Credito">Crédito</option><option value="Anulada">Anuladas</option>
            </select>
          </div>
          <div style={{ maxHeight: 'calc(100vh - 300px)', overflowY: 'auto', padding: 6 }}>
            {isLoading ? <div style={{ padding: 16 }}><Spinner /></div> : data?.items.length ? data.items.slice(0, 300).map((i) => (
              <button key={i.id} onClick={() => setSelected(i.id)}
                style={{ display: 'block', width: '100%', textAlign: 'left', border: '1px solid', borderColor: selected === i.id ? 'var(--brand-100)' : 'transparent', background: selected === i.id ? 'var(--brand-50)' : 'none', borderRadius: 8, padding: 10, cursor: 'pointer' }}>
                <div className="strong">{i.customer_name}</div>
                <div className="small muted" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginTop: 2 }}>
                  <strong style={{ color: 'var(--ink)' }}>#{i.invoice_number}</strong><span>{money(i.total)}</span><span>{date(i.date)}</span><StatusBadge status={i.status} />
                </div>
              </button>
            )) : <Empty>No hay facturas con esos filtros.</Empty>}
          </div>
        </div>
        <div className="panel">
          {!selected ? <Empty icon="bi-hand-index">Selecciona una factura.</Empty> : !inv || isFetching ? <Spinner /> : (
            <>
              <h2 style={{ fontSize: 18, marginBottom: 12 }}>Factura #{inv.invoice_number} <StatusBadge status={inv.status} /></h2>
              <div className="form-grid" style={{ marginBottom: 14 }}>
                <div><div className="kpi-label">Cliente</div><div className="strong">{inv.customer_name}</div></div>
                <div><div className="kpi-label">Fecha</div><div>{date(inv.date)}</div></div>
                <div><div className="kpi-label">Total</div><div className="money">{money(inv.total)}</div></div>
                <div><div className="kpi-label">Método</div><div>{inv.payment_method}</div></div>
              </div>
              <table className="table">
                <thead><tr><th>Producto</th><th className="num">Cant.</th><th className="num">Precio</th><th className="num">Subtotal</th></tr></thead>
                <tbody>{inv.lines.map((l, k) => <tr key={k}><td>{l.name}</td><td className="num">{l.quantity}</td><td className="num">{money(l.price)}</td><td className="num money">{money(l.subtotal)}</td></tr>)}</tbody>
              </table>
              <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                {inv.status === 'Anulada' ? (
                  <>
                    <div className="alert danger" style={{ margin: 0, flex: 1 }}>Anulada · {inv.cancel_number} · {inv.cancel_reason}</div>
                    <a className="btn" href={`/api/pdf/invoice/${inv.id}`}><i className="bi bi-download" /> Comprobante</a>
                  </>
                ) : <button className="btn btn-danger" onClick={() => setConfirming(true)}><i className="bi bi-x-octagon" /> Anular factura</button>}
              </div>
            </>
          )}
        </div>
      </div>
      {confirming && inv ? (
        <CancelModal inv={inv} onClose={() => setConfirming(false)} onDone={(n) => {
          toast.success(`Factura anulada (${n}). Se devolvió el stock.`);
          ['invoice', 'invoices', 'items', 'quotas', 'dashboard'].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
          setConfirming(false);
          window.open(`/api/pdf/invoice/${inv.id}?inline=1`, '_blank');
        }} />
      ) : null}
    </>
  );
}

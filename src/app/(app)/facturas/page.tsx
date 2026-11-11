'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { StatusBadge } from '@/components/status-badge';
import { Empty, Kpi, LoadingRows, PageHeader, Pagination } from '@/components/ui';
import { api } from '@/lib/api';
import { date, money } from '@/lib/format';
import { useDebounced } from '@/lib/hooks';
import type { InvoiceKpis, InvoiceSummary } from '@/lib/types';

const PAGE_SIZE = 25;

export default function FacturasPage() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const search = useDebounced(q);
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['invoices', search, status],
    queryFn: () => api<{ items: InvoiceSummary[]; kpis: InvoiceKpis }>('/invoices', { query: { q: search, status } }),
    placeholderData: keepPreviousData,
  });
  const rows = useMemo(() => (data?.items ?? []).slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [data, page]);
  const k = data?.kpis;

  return (
    <>
      <PageHeader title="Facturas" subtitle="Historial de ventas de contado y a crédito."
        actions={<>
          <Link href="/anular" className="btn"><i className="bi bi-x-octagon" /> Anular</Link>
          <Link href="/facturar" className="btn btn-primary"><i className="bi bi-plus-lg" /> Nueva factura</Link>
        </>} />
      <div className="kpi-grid">
        <Kpi icon="bi-receipt" label="Total facturado" value={k ? money(k.total_invoiced) : '…'} hint={k ? `${k.invoice_count} facturas vigentes` : ''} />
        <Kpi icon="bi-check2-circle" tone="info" label="Contado pagado" value={k ? money(k.cash_paid) : '…'} hint={k ? `${k.cash_paid_count} facturas` : ''} />
        <Kpi icon="bi-credit-card" tone="warning" label="Vendido a crédito" value={k ? money(k.credit_sold) : '…'} hint={k ? `${k.credit_count} facturas` : ''} />
        <Kpi icon="bi-hourglass-split" tone="danger" label="Saldo en cartera" value={k ? money(k.portfolio_balance) : '…'} hint={k ? `${k.credits_with_balance} créditos con cuotas pendientes` : ''} />
      </div>
      <div className="panel flush">
        <div className="toolbar">
          <div style={{ display: 'flex', gap: 8, flex: 1, flexWrap: 'wrap' }}>
            <input className="input" style={{ maxWidth: 360 }} placeholder="Buscar por cliente, cédula o número…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
            <select className="select" style={{ width: 'auto' }} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
              <option value="">Todos los estados</option><option value="Pagada">Pagadas</option><option value="Credito">Crédito</option><option value="Anulada">Anuladas</option>
            </select>
          </div>
          {isFetching ? <span className="spinner muted" /> : null}
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Fecha</th><th>Factura</th><th>Cliente</th><th className="num">Total</th><th>Estado</th><th>Cartera</th><th className="num">Acciones</th></tr></thead>
            <tbody>
              {isLoading ? <LoadingRows cols={7} /> : rows.length ? rows.map((i) => (
                <tr key={i.id}>
                  <td className="nowrap">{date(i.date)}</td>
                  <td className="strong"><Link href={`/facturas/${i.id}`} style={{ color: 'inherit' }}>#{i.invoice_number}</Link></td>
                  <td>{i.customer_name}</td>
                  <td className="num money">{money(i.total)}</td>
                  <td><StatusBadge status={i.status} /></td>
                  <td>
                    {i.status === 'Anulada' ? <span className="muted">—</span>
                      : i.payment_method === 'Credito' && i.has_unpaid_quotas
                        ? <Link href={`/deudas?customer=${i.customer_id}&invoice=${i.id}`} className="btn btn-sm"><i className="bi bi-credit-card" /> {money(i.balance)}</Link>
                        : <span className="muted small"><i className="bi bi-check2" /> Al día</span>}
                  </td>
                  <td className="num nowrap">
                    <Link href={`/facturas/${i.id}`} className="btn btn-icon" title="Ver"><i className="bi bi-eye" /></Link>{' '}
                    <a href={`/api/pdf/invoice/${i.id}`} className="btn btn-icon" title="Descargar PDF"><i className="bi bi-file-earmark-arrow-down" /></a>{' '}
                    {i.status !== 'Anulada' ? <Link href={`/facturas/${i.id}/editar`} className="btn btn-icon" title="Editar"><i className="bi bi-pencil" /></Link> : null}
                  </td>
                </tr>
              )) : <tr><td colSpan={7}><Empty icon="bi-receipt">No hay facturas{search || status ? ' con ese filtro' : ''}.</Empty></td></tr>}
            </tbody>
          </table>
        </div>
        {data ? <Pagination page={page} pageSize={PAGE_SIZE} total={data.items.length} onPage={setPage} /> : null}
      </div>
    </>
  );
}

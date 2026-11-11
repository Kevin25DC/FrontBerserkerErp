'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { DownloadButton } from '@/components/download-button';
import { Badge, Empty, Kpi, LoadingRows, PageHeader } from '@/components/ui';
import { api } from '@/lib/api';
import { date, money } from '@/lib/format';
import { useDebounced } from '@/lib/hooks';

type Row = { invoice_id: number; customer: string; nit: string; invoice_label: string; date: string; total: string; paid: string; balance: string; due_date: string; status: string };
type Report = { rows: Row[]; invoiced: string; collected: string; pending: string };
const TONE: Record<string, 'success' | 'info' | 'danger' | 'warning'> = { Pagada: 'success', 'Pago Parcial': 'info', Vencida: 'danger', Pendiente: 'warning' };

export default function EstadoCuentaPage() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const search = useDebounced(q);
  const { data, isLoading } = useQuery({
    queryKey: ['report-accounts', search, status],
    queryFn: () => api<Report>('/reports/accounts', { query: { q: search, status } }),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <PageHeader back={{ href: '/reportes', label: 'Reportes' }} title="Estado de cuenta de clientes" subtitle="Facturado, cobrado y saldo pendiente por cliente."
        actions={<DownloadButton path="/reports/accounts/export" query={{ q: search, status }} fallbackName="Estado_de_cuenta.xlsx" loadingLabel="Exportando…"><i className="bi bi-file-earmark-excel" /> Excel</DownloadButton>} />
      <div className="kpi-grid">
        <Kpi icon="bi-receipt" tone="info" label="Total facturado" value={data ? money(data.invoiced) : '…'} />
        <Kpi icon="bi-check2-circle" label="Total cobrado" value={data ? money(data.collected) : '…'} />
        <Kpi icon="bi-hourglass-split" tone="danger" label="Saldo pendiente" value={data ? money(data.pending) : '…'} />
      </div>
      <div className="panel flush">
        <div className="toolbar">
          <div style={{ display: 'flex', gap: 8, flex: 1, flexWrap: 'wrap' }}>
            <input className="input" style={{ maxWidth: 360 }} placeholder="Buscar por cliente, NIT o factura…" value={q} onChange={(e) => setQ(e.target.value)} />
            <select className="select" style={{ width: 'auto' }} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Todos los estados</option>{Object.keys(TONE).map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Cliente</th><th>NIT</th><th>Factura</th><th>Fecha</th><th className="num">Total</th><th className="num">Pagado</th><th className="num">Saldo</th><th>Vence</th><th>Estado</th></tr></thead>
            <tbody>
              {isLoading ? <LoadingRows cols={9} /> : data?.rows.length ? data.rows.slice(0, 500).map((r) => (
                <tr key={r.invoice_id}>
                  <td>{r.customer}</td><td className="muted">{r.nit}</td>
                  <td className="strong"><Link href={`/facturas/${r.invoice_id}`}>{r.invoice_label}</Link></td>
                  <td>{date(r.date)}</td><td className="num">{money(r.total)}</td><td className="num">{money(r.paid)}</td>
                  <td className="num money">{money(r.balance)}</td><td>{date(r.due_date)}</td><td><Badge tone={TONE[r.status]}>{r.status}</Badge></td>
                </tr>
              )) : <tr><td colSpan={9}><Empty>No hay resultados.</Empty></td></tr>}
            </tbody>
          </table>
        </div>
        {data && data.rows.length > 500 ? <div className="pagination">Mostrando 500 de {data.rows.length}. Usa la búsqueda o exporta a Excel para ver todo.</div> : null}
      </div>
    </>
  );
}

'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { DownloadButton } from '@/components/download-button';
import { Badge, Empty, LoadingRows, PageHeader, Pagination } from '@/components/ui';
import { api } from '@/lib/api';
import { date, money, todayISO } from '@/lib/format';
import { useDebounced } from '@/lib/hooks';
import type { Page, PurchaseStatus, PurchaseSummary } from '@/lib/types';

const PAGE_SIZE = 20;
const TONE: Record<PurchaseStatus, 'neutral' | 'success' | 'danger'> = {
  borrador: 'neutral', confirmada: 'success', anulada: 'danger',
};
const LABEL: Record<PurchaseStatus, string> = {
  borrador: 'Borrador', confirmada: 'Confirmada', anulada: 'Anulada',
};

export default function ComprasPage() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'' | PurchaseStatus>('');
  const [from, setFrom] = useState(`${todayISO().slice(0, 4)}-01-01`);
  const [to, setTo] = useState(todayISO());
  const [page, setPage] = useState(1);
  const search = useDebounced(q);

  const { data, isLoading } = useQuery({
    queryKey: ['purchases', search, status, from, to, page],
    queryFn: () => api<Page<PurchaseSummary>>('/purchases', {
      query: { q: search, status: status || undefined, date_from: from, date_to: to, page, page_size: PAGE_SIZE },
    }),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <PageHeader title="Compras" subtitle="Compras a proveedores: al confirmar entran al inventario."
        actions={<Link href="/compras/nueva" className="btn btn-primary"><i className="bi bi-plus-lg" /> Nueva compra</Link>} />

      <div className="panel flush">
        <div className="toolbar">
          <input className="input" style={{ maxWidth: 340 }} placeholder="Buscar por número, proveedor o documento…"
            value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
          <select className="select" style={{ width: 'auto' }} value={status} onChange={(e) => { setStatus(e.target.value as typeof status); setPage(1); }}>
            <option value="">Todos los estados</option>
            <option value="borrador">Borradores</option>
            <option value="confirmada">Confirmadas</option>
            <option value="anulada">Anuladas</option>
          </select>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <input className="input" type="date" style={{ width: 'auto' }} value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} />
            <span className="muted">a</span>
            <input className="input" type="date" style={{ width: 'auto' }} value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} />
          </div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>No.</th><th>Fecha</th><th>Proveedor</th><th>Doc. proveedor</th><th className="num">Total</th><th>Estado</th><th className="num">Acciones</th></tr>
            </thead>
            <tbody>
              {isLoading ? <LoadingRows cols={7} /> : data?.items.length ? data.items.map((p) => (
                <tr key={p.id}>
                  <td className="strong"><Link href={`/compras/${p.id}`} style={{ color: 'inherit' }}>{p.code}</Link></td>
                  <td>{date(p.date)}</td>
                  <td>{p.supplier_name}<div className="small muted">{p.supplier_id_type} {p.supplier_identification}</div></td>
                  <td>{p.supplier_document || '—'}</td>
                  <td className="num money">{money(p.total)}</td>
                  <td><Badge tone={TONE[p.status]}>{LABEL[p.status]}</Badge></td>
                  <td className="num nowrap">
                    <Link href={`/compras/${p.id}`} className="btn btn-icon" title="Ver"><i className="bi bi-eye" /></Link>{' '}
                    <DownloadButton href={`/api/pdf/purchase/${p.id}`} className="btn btn-icon" title="Descargar PDF"
                      fallbackName={`Compra_${p.code}.pdf`}><i className="bi bi-file-earmark-arrow-down" /></DownloadButton>
                  </td>
                </tr>
              )) : <tr><td colSpan={7}><Empty icon="bi-bag-check">No hay compras{search || status ? ' con ese filtro' : ''}.</Empty></td></tr>}
            </tbody>
          </table>
        </div>
        {data ? <Pagination page={page} pageSize={PAGE_SIZE} total={data.total} onPage={setPage} /> : null}
      </div>
    </>
  );
}

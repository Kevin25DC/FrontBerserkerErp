'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { useToast } from '@/components/providers';
import { Badge, Empty, LoadingRows, PageHeader, Pagination } from '@/components/ui';
import { api } from '@/lib/api';
import { date, money } from '@/lib/format';
import { useDebounced } from '@/lib/hooks';
import type { Page, Quote } from '@/lib/types';

const PAGE_SIZE = 25;

export default function CotizacionesPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const search = useDebounced(q);
  const { data, isLoading } = useQuery({
    queryKey: ['quotes', search, status, page],
    queryFn: () => api<Page<Quote>>('/quotes', { query: { q: search, status, page, page_size: PAGE_SIZE } }),
    placeholderData: keepPreviousData,
  });
  const cancel = useMutation({
    mutationFn: (id: number) => api(`/quotes/${id}/cancel`, { method: 'POST' }),
    onSuccess: () => { toast.success('Cotización anulada.'); qc.invalidateQueries({ queryKey: ['quotes'] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader title="Cotizaciones" subtitle='Las pendientes se pueden traer al facturar con el botón "Traer cotización".'
        actions={<Link href="/cotizaciones/nueva" className="btn btn-primary"><i className="bi bi-plus-lg" /> Nueva cotización</Link>} />
      <div className="panel flush">
        <div className="toolbar">
          <div style={{ display: 'flex', gap: 8, flex: 1, flexWrap: 'wrap' }}>
            <input className="input" style={{ maxWidth: 360 }} placeholder="Buscar por cliente, cédula o número…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
            <select className="select" style={{ width: 'auto' }} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
              <option value="">Todos los estados</option><option value="pendiente">Pendientes</option><option value="facturada">Facturadas</option><option value="anulada">Anuladas</option>
            </select>
          </div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>No.</th><th>Cliente</th><th>Fecha</th><th>Válida hasta</th><th className="num">Total</th><th>Estado</th><th>Factura</th><th className="num">Acciones</th></tr></thead>
            <tbody>
              {isLoading ? <LoadingRows cols={8} /> : data?.items.length ? data.items.map((x) => (
                <tr key={x.id}>
                  <td className="strong"><Link href={`/cotizaciones/${x.id}`} style={{ color: 'inherit' }}>{x.code}</Link></td>
                  <td>{x.customer_name}<div className="small muted">{x.customer_cedula}</div></td>
                  <td>{date(x.quote_date)}</td>
                  <td>{date(x.valid_until)}</td>
                  <td className="num money">{money(x.total)}</td>
                  <td>{x.is_expired ? <Badge tone="warning">Vencida</Badge> : x.status === 'pendiente' ? <Badge tone="info">Pendiente</Badge> : x.status === 'facturada' ? <Badge tone="success">Facturada</Badge> : <Badge tone="neutral">Anulada</Badge>}</td>
                  <td>{x.invoice_id ? <Link href={`/facturas/${x.invoice_id}`}>#{x.invoice_number}</Link> : '—'}</td>
                  <td className="num nowrap">
                    <Link href={`/cotizaciones/${x.id}`} className="btn btn-icon" title="Ver"><i className="bi bi-eye" /></Link>{' '}
                    <a href={`/api/pdf/quote/${x.id}`} className="btn btn-icon" title="PDF"><i className="bi bi-file-earmark-arrow-down" /></a>{' '}
                    {x.status === 'pendiente' ? <>
                      <Link href={`/cotizaciones/${x.id}/editar`} className="btn btn-icon" title="Editar"><i className="bi bi-pencil" /></Link>{' '}
                      <Link href={`/facturar?quote=${x.id}`} className="btn btn-primary btn-sm">Facturar</Link>{' '}
                      <button className="btn btn-icon btn-ghost-danger" title="Anular" onClick={() => confirm(`¿Anular ${x.code}? Ya no se podrá traer al facturar.`) && cancel.mutate(x.id)}><i className="bi bi-x-lg" /></button>
                    </> : null}
                  </td>
                </tr>
              )) : <tr><td colSpan={8}><Empty icon="bi-file-earmark-text">No hay cotizaciones{search || status ? ' con ese filtro' : ''}.</Empty></td></tr>}
            </tbody>
          </table>
        </div>
        {data ? <Pagination page={page} pageSize={PAGE_SIZE} total={data.total} onPage={setPage} /> : null}
      </div>
    </>
  );
}

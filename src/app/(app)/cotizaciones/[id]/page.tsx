'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { use } from 'react';
import { DocPreview } from '@/components/doc-preview';
import { quoteDoc } from '@/components/doc-templates';
import { PageHeader, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import type { QuoteDetail } from '@/lib/types';

export default function CotizacionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: q, error } = useQuery({ queryKey: ['quote', id], queryFn: () => api<QuoteDetail>(`/quotes/${id}`) });
  const { data: company } = useQuery({ queryKey: ['company'], queryFn: () => api<{ name: string; nit: string }>('/company'), staleTime: Infinity });
  if (error) return <div className="alert danger">{(error as Error).message}</div>;
  if (!q || !company) return <Spinner />;
  return (
    <>
      <PageHeader back={{ href: '/cotizaciones', label: 'Cotizaciones' }} title={q.code} subtitle={`${q.customer_name} · ${q.status}`}
        actions={<>
          <a href={`/api/pdf/quote/${q.id}`} className="btn btn-primary"><i className="bi bi-file-earmark-arrow-down" /> Descargar PDF</a>
          {q.status === 'pendiente' ? <>
            <Link href={`/cotizaciones/${q.id}/editar`} className="btn"><i className="bi bi-pencil" /> Editar</Link>
            <Link href={`/facturar?quote=${q.id}`} className="btn"><i className="bi bi-receipt" /> Facturar</Link>
          </> : null}
          {q.invoice_id ? <Link href={`/facturas/${q.invoice_id}`} className="btn">Ver factura #{q.invoice_number}</Link> : null}
        </>} />
      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        <DocPreview title={q.code} doc={quoteDoc(q, company, { logo: '/logo-doc.png', firma: '/firma-doc.png' })} />
      </div>
    </>
  );
}

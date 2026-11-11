'use client';

import { useQuery } from '@tanstack/react-query';
import { use } from 'react';
import { PageHeader, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import type { QuoteDetail } from '@/lib/types';
import { QuoteForm } from '../../quote-form';

export default function EditarCotizacionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, error } = useQuery({ queryKey: ['quote', id], queryFn: () => api<QuoteDetail>(`/quotes/${id}`) });
  if (error) return <div className="alert danger">{(error as Error).message}</div>;
  if (!data) return <Spinner />;
  if (data.status !== 'pendiente') return <div className="alert warning">La cotización {data.code} está {data.status} y no se puede editar.</div>;
  return (
    <>
      <PageHeader back={{ href: `/cotizaciones/${id}`, label: data.code }} title={`Editar ${data.code}`} />
      <QuoteForm quote={data} />
    </>
  );
}

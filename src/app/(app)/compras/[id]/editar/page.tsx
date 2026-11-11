'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { use } from 'react';
import { PageHeader, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import type { PurchaseDetail } from '@/lib/types';
import { PurchaseForm } from '../../purchase-form';

export default function EditarCompraPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, error } = useQuery({ queryKey: ['purchase', id], queryFn: () => api<PurchaseDetail>(`/purchases/${id}`) });
  if (error) return <div className="alert danger">{(error as Error).message}</div>;
  if (!data) return <Spinner />;
  if (data.status !== 'borrador') {
    return (
      <>
        <PageHeader back={{ href: `/compras/${id}`, label: 'Compra' }} title="Compra no editable"
          subtitle="Solo se pueden editar compras en borrador." />
        <div className="alert info">
          <i className="bi bi-info-circle" /> Esta compra está {data.status}.
          <Link href={`/compras/${id}`} style={{ marginLeft: 8 }}>Ver compra</Link>
        </div>
      </>
    );
  }
  return <PurchaseForm purchase={data} />;
}

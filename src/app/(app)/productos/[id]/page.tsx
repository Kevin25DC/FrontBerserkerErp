'use client';

import { useQuery } from '@tanstack/react-query';
import { use } from 'react';
import { PageHeader, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import type { Item } from '@/lib/types';
import { ItemForm } from '../item-form';

export default function EditarProductoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, error } = useQuery({ queryKey: ['item', id], queryFn: () => api<Item>(`/items/${id}`) });
  if (error) return <div className="alert danger">{(error as Error).message}</div>;
  if (!data) return <Spinner />;
  return (
    <>
      <PageHeader back={{ href: '/productos', label: 'Productos' }} title={data.name} subtitle={`Producto #${data.id} · Stock actual: ${data.stock}`} />
      <ItemForm item={data} />
    </>
  );
}

'use client';

import { useQuery } from '@tanstack/react-query';
import { use } from 'react';
import { PageHeader, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import { idFull } from '@/lib/identification';
import type { Customer } from '@/lib/types';
import { CustomerForm } from '../customer-form';

export default function EditarClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, error } = useQuery({ queryKey: ['customer', id], queryFn: () => api<Customer>(`/customers/${id}`) });
  if (error) return <div className="alert danger">{(error as Error).message}</div>;
  if (!data) return <Spinner />;
  return (
    <>
      <PageHeader back={{ href: '/clientes', label: 'Clientes' }} title={`${data.name} ${data.lastname}`.trim()} subtitle={`Cliente #${data.id} · ${idFull(data.id_type, data.cedula)}`} />
      <CustomerForm customer={data} />
    </>
  );
}

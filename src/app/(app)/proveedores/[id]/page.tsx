'use client';

import { useQuery } from '@tanstack/react-query';
import { use } from 'react';
import { PageHeader, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import type { Supplier } from '@/lib/types';
import { SupplierForm } from '../supplier-form';

export default function EditarProveedorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, error } = useQuery({ queryKey: ['supplier', id], queryFn: () => api<Supplier>(`/suppliers/${id}`) });
  if (error) return <div className="alert danger">{(error as Error).message}</div>;
  if (!data) return <Spinner />;
  return (
    <>
      <PageHeader back={{ href: '/proveedores', label: 'Proveedores' }} title={`Editar ${data.name}`}
        subtitle={`${data.id_type} ${data.identification}${data.dv ? `-${data.dv}` : ''}`} />
      <SupplierForm supplier={data} />
    </>
  );
}

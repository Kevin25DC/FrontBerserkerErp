'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { useToast } from '@/components/providers';
import { ImportModal } from '@/components/import-modal';
import { Badge, Empty, LoadingRows, PageHeader, Pagination } from '@/components/ui';
import { api, download } from '@/lib/api';
import { useDebounced } from '@/lib/hooks';
import type { Customer, Page } from '@/lib/types';

const PAGE_SIZE = 25;

export default function ClientesPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [importOpen, setImportOpen] = useState(false);
  const search = useDebounced(q);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['customers', search, page],
    queryFn: () => api<Page<Customer>>('/customers', { query: { q: search, page, page_size: PAGE_SIZE } }),
    placeholderData: keepPreviousData,
  });

  const remove = useMutation({
    mutationFn: (id: number) => api(`/customers/${id}`, { method: 'DELETE' }),
    onSuccess: () => { toast.success('Cliente eliminado.'); qc.invalidateQueries({ queryKey: ['customers'] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader
        title="Clientes"
        subtitle={data ? (search ? `${data.total.toLocaleString('es-CO')} resultado${data.total === 1 ? '' : 's'} para «${search}»` : `${data.total.toLocaleString('es-CO')} clientes registrados`) : ' '}
        actions={
          <>
            <button className="btn" onClick={() => setImportOpen(true)}><i className="bi bi-upload" /> Importar</button>
            <button className="btn" onClick={() => download('/exports/customers.xlsx', undefined, 'Clientes.xlsx').catch((e) => toast.error(e.message))}>
              <i className="bi bi-download" /> Exportar
            </button>
            <Link href="/clientes/nuevo" className="btn btn-primary"><i className="bi bi-plus-lg" /> Nuevo cliente</Link>
          </>
        }
      />

      <div className="panel flush">
        <div className="toolbar">
          <input className="input" style={{ maxWidth: 360 }} placeholder="Buscar por nombre, cédula o teléfono…" value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }} aria-label="Buscar clientes" />
          {isFetching ? <span className="spinner muted" /> : null}
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>#</th><th>Cédula</th><th>Nombre</th><th>Teléfono</th><th>Ciudad</th><th>Documento</th><th className="num">Acciones</th></tr>
            </thead>
            <tbody>
              {isLoading ? <LoadingRows cols={7} /> : data?.items.length ? data.items.map((c) => (
                <tr key={c.id}>
                  <td className="muted">{c.id}</td>
                  <td className="strong">{c.cedula}</td>
                  <td>{c.name} {c.lastname}</td>
                  <td>{c.phone}</td>
                  <td>{c.city}</td>
                  <td>
                    {c.has_pdf
                      ? <button className="btn btn-sm" onClick={() => download(`/customers/${c.id}/document`, undefined, 'documento.pdf').catch((e) => toast.error(e.message))}><i className="bi bi-file-earmark-pdf" /> Descargar</button>
                      : <Badge tone="neutral">Sin PDF</Badge>}
                  </td>
                  <td className="num nowrap">
                    <Link href={`/clientes/${c.id}`} className="btn btn-icon" title="Editar"><i className="bi bi-pencil" /></Link>{' '}
                    <button className="btn btn-icon btn-ghost-danger" title="Eliminar" disabled={remove.isPending}
                      onClick={() => confirm(`¿Eliminar a ${c.name} ${c.lastname}? Esta acción no se puede deshacer.`) && remove.mutate(c.id)}>
                      <i className="bi bi-trash" />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={7}><Empty icon="bi-people">{search ? 'No hay clientes con esa búsqueda.' : 'No hay clientes registrados.'}</Empty></td></tr>
              )}
            </tbody>
          </table>
        </div>
        {data ? <Pagination page={page} pageSize={PAGE_SIZE} total={data.total} onPage={setPage} /> : null}
      </div>

      {importOpen ? <ImportModal kind="customers" onClose={() => setImportOpen(false)} onDone={() => qc.invalidateQueries({ queryKey: ['customers'] })} /> : null}
    </>
  );
}

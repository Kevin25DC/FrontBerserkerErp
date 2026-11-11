'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { ImportModal } from '@/components/import-modal';
import { useToast } from '@/components/providers';
import { Badge, Empty, LoadingRows, PageHeader, Pagination } from '@/components/ui';
import { api } from '@/lib/api';
import { money } from '@/lib/format';
import { useDebounced } from '@/lib/hooks';
import type { Item, Page } from '@/lib/types';

const PAGE_SIZE = 25;

export default function ProductosPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'' | 'true' | 'false'>('');
  const [page, setPage] = useState(1);
  const [importOpen, setImportOpen] = useState(false);
  const search = useDebounced(q);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['items', search, status, page],
    queryFn: () => api<Page<Item>>('/items', { query: { q: search, active: status, page, page_size: PAGE_SIZE } }),
    placeholderData: keepPreviousData,
  });

  const remove = useMutation({
    mutationFn: (id: number) => api(`/items/${id}`, { method: 'DELETE' }),
    onSuccess: () => { toast.success('Producto eliminado.'); qc.invalidateQueries({ queryKey: ['items'] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader
        title="Productos"
        subtitle={data ? `${data.total.toLocaleString('es-CO')} ${search || status ? 'resultados' : 'productos en el catálogo'}` : ' '}
        actions={
          <>
            <button className="btn" onClick={() => setImportOpen(true)}><i className="bi bi-upload" /> Importar</button>
            <Link href="/productos/nuevo" className="btn btn-primary"><i className="bi bi-plus-lg" /> Nuevo producto</Link>
          </>
        }
      />
      <div className="panel flush">
        <div className="toolbar">
          <div style={{ display: 'flex', gap: 8, flex: 1, flexWrap: 'wrap' }}>
            <input className="input" style={{ maxWidth: 360 }} placeholder="Buscar por nombre, referencia o descripción…" value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }} aria-label="Buscar productos" />
            <select className="select" style={{ width: 'auto' }} value={status} onChange={(e) => { setStatus(e.target.value as typeof status); setPage(1); }}>
              <option value="">Todos</option><option value="true">Activos</option><option value="false">Inactivos</option>
            </select>
          </div>
          {isFetching ? <span className="spinner muted" /> : null}
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>#</th><th>Producto</th><th>Referencia</th><th>Descripción</th><th className="num">Precio</th><th className="num">Stock</th><th>Estado</th><th className="num">Acciones</th></tr>
            </thead>
            <tbody>
              {isLoading ? <LoadingRows cols={8} /> : data?.items.length ? data.items.map((it) => (
                <tr key={it.id}>
                  <td className="muted">{it.id}</td>
                  <td className="strong">{it.name}</td>
                  <td className="muted small">{it.reference || '—'}</td>
                  <td className="muted small" style={{ maxWidth: 320 }}>{(it.description ?? '').slice(0, 90)}</td>
                  <td className="num money">{money(it.price)}</td>
                  <td className="num">
                    {it.stock <= 0 ? <Badge tone="danger">Agotado · {it.stock}</Badge> : it.stock <= 4 ? <Badge tone="warning">Bajo · {it.stock}</Badge> : <span className="strong">{it.stock}</span>}
                  </td>
                  <td>{it.active ? <Badge tone="success">Activo</Badge> : <Badge tone="neutral">Inactivo</Badge>}</td>
                  <td className="num nowrap">
                    <Link href={`/productos/${it.id}`} className="btn btn-icon" title="Editar"><i className="bi bi-pencil" /></Link>{' '}
                    <button className="btn btn-icon btn-ghost-danger" title="Eliminar" disabled={remove.isPending}
                      onClick={() => confirm(`¿Eliminar "${it.name}"?`) && remove.mutate(it.id)}><i className="bi bi-trash" /></button>
                  </td>
                </tr>
              )) : <tr><td colSpan={8}><Empty icon="bi-box-seam">No hay productos{search ? ' con esa búsqueda' : ''}.</Empty></td></tr>}
            </tbody>
          </table>
        </div>
        {data ? <Pagination page={page} pageSize={PAGE_SIZE} total={data.total} onPage={setPage} /> : null}
      </div>
      {importOpen ? <ImportModal kind="items" onClose={() => setImportOpen(false)} onDone={() => qc.invalidateQueries({ queryKey: ['items'] })} /> : null}
    </>
  );
}

'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { useToast } from '@/components/providers';
import { Badge, Empty, LoadingRows, PageHeader, Pagination } from '@/components/ui';
import { api } from '@/lib/api';
import { useDebounced } from '@/lib/hooks';
import type { Page, Supplier } from '@/lib/types';

const PAGE_SIZE = 20;

const toBody = (s: Supplier) => ({
  id_type: s.id_type, identification: s.identification, dv: s.dv, name: s.name, trade_name: s.trade_name,
  person_type: s.person_type, contact_name: s.contact_name, phone: s.phone, email: s.email, address: s.address,
  city: s.city, department: s.department, country: s.country, payment_terms: s.payment_terms,
  credit_days: s.credit_days, notes: s.notes, active: s.active,
});

export default function ProveedoresPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [active, setActive] = useState<'all' | '1' | '0'>('1');
  const [page, setPage] = useState(1);
  const search = useDebounced(q);

  const { data, isLoading } = useQuery({
    queryKey: ['suppliers', search, active, page],
    queryFn: () => api<Page<Supplier>>('/suppliers', {
      query: { q: search, active: active === 'all' ? undefined : active === '1', page, page_size: PAGE_SIZE },
    }),
    placeholderData: keepPreviousData,
  });

  const toggle = useMutation({
    mutationFn: (s: Supplier) => api(`/suppliers/${s.id}`, { method: 'PUT', json: { ...toBody(s), active: !s.active } }),
    onSuccess: (_r, s) => {
      toast.success(s.active ? 'Proveedor desactivado.' : 'Proveedor activado.');
      qc.invalidateQueries({ queryKey: ['suppliers'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (s: Supplier) => api(`/suppliers/${s.id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Proveedor eliminado.');
      qc.invalidateQueries({ queryKey: ['suppliers'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader title="Proveedores" subtitle="Terceros de compra: NIT, cédula, cédula de extranjería o pasaporte."
        actions={<Link href="/proveedores/nuevo" className="btn btn-primary"><i className="bi bi-plus-lg" /> Nuevo proveedor</Link>} />

      <div className="panel flush">
        <div className="toolbar">
          <input className="input" style={{ maxWidth: 380 }} placeholder="Buscar por nombre, identificación, contacto o teléfono…"
            value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
          <select className="select" style={{ width: 'auto' }} value={active} onChange={(e) => { setActive(e.target.value as typeof active); setPage(1); }}>
            <option value="1">Activos</option>
            <option value="0">Inactivos</option>
            <option value="all">Todos</option>
          </select>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Tipo ID</th><th>Identificación</th><th>Proveedor</th><th>Contacto</th><th>Teléfono</th><th>Ciudad</th><th className="num">Compras</th><th>Estado</th><th className="num">Acciones</th></tr>
            </thead>
            <tbody>
              {isLoading ? <LoadingRows cols={9} /> : data?.items.length ? data.items.map((s) => (
                <tr key={s.id}>
                  <td><Badge tone="neutral">{s.id_type}</Badge></td>
                  <td className="strong">{s.identification}{s.dv ? `-${s.dv}` : ''}</td>
                  <td>{s.name}{s.trade_name ? <div className="small muted">{s.trade_name}</div> : null}</td>
                  <td>{s.contact_name || '—'}</td>
                  <td>{s.phone || '—'}</td>
                  <td>{s.city || '—'}</td>
                  <td className="num">{s.purchase_count}</td>
                  <td>{s.active ? <Badge tone="success">Activo</Badge> : <Badge tone="neutral">Inactivo</Badge>}</td>
                  <td className="num nowrap">
                    <Link href={`/proveedores/${s.id}`} className="btn btn-icon" title="Editar"><i className="bi bi-pencil" /></Link>{' '}
                    <button className="btn btn-icon" title={s.active ? 'Desactivar' : 'Activar'} disabled={toggle.isPending}
                      onClick={() => toggle.mutate(s)}><i className={`bi ${s.active ? 'bi-pause-circle' : 'bi-play-circle'}`} /></button>{' '}
                    <button className="btn btn-icon btn-ghost-danger" title={s.purchase_count ? 'Tiene compras' : 'Eliminar'}
                      disabled={remove.isPending || s.purchase_count > 0}
                      onClick={() => confirm(`¿Eliminar el proveedor ${s.name}?`) && remove.mutate(s)}>
                      <i className="bi bi-trash" />
                    </button>
                  </td>
                </tr>
              )) : <tr><td colSpan={9}><Empty icon="bi-truck">No hay proveedores{search ? ' con esa búsqueda' : ''}.</Empty></td></tr>}
            </tbody>
          </table>
        </div>
        {data ? <Pagination page={page} pageSize={PAGE_SIZE} total={data.total} onPage={setPage} /> : null}
      </div>
    </>
  );
}

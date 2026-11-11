'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { ItemPicker } from '@/components/item-picker';
import { useToast } from '@/components/providers';
import { Badge, Empty, Field, LoadingRows, PageHeader, Pagination } from '@/components/ui';
import { api, download } from '@/lib/api';
import { datetime, todayISO } from '@/lib/format';
import type { Adjustment, Item, Page } from '@/lib/types';

const PAGE_SIZE = 15;

export default function AjustesPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [item, setItem] = useState<Item | null>(null);
  const [type, setType] = useState<'' | 'IN' | 'OUT'>('');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [page, setPage] = useState(1);
  const [from, setFrom] = useState(todayISO().slice(0, 8) + '01');
  const [to, setTo] = useState(todayISO());

  const { data, isLoading } = useQuery({
    queryKey: ['adjustments', page],
    queryFn: () => api<Page<Adjustment>>('/inventory/adjustments', { query: { page, page_size: PAGE_SIZE } }),
    placeholderData: keepPreviousData,
  });
  const create = useMutation({
    mutationFn: () => api<Adjustment>('/inventory/adjustments', { json: { item_id: item!.id, adjustment_type: type, quantity: Number(quantity), reason: reason || null } }),
    onSuccess: (a) => {
      toast.success(`Ajuste registrado: ${a.item_name} quedó con ${a.stock_after} unidades.`);
      setItem(null); setType(''); setQuantity(''); setReason('');
      qc.invalidateQueries({ queryKey: ['adjustments'] }); qc.invalidateQueries({ queryKey: ['items'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader title="Ajustes de inventario" subtitle="Registra entradas y salidas manuales de stock." />
      <div className="grid grid-7-5">
        <form className="panel" onSubmit={(e: FormEvent) => { e.preventDefault(); if (!item) return toast.error('Selecciona un producto.'); create.mutate(); }}>
          <h2 className="panel-title"><i className="bi bi-arrow-left-right" /> Nuevo ajuste</h2>
          <div className="form-grid">
            <Field label="Producto" full help={item ? `Stock actual: ${item.stock}` : undefined}><ItemPicker value={item?.name} onPick={setItem} /></Field>
            <Field label="Tipo">
              <select className="select" value={type} onChange={(e) => setType(e.target.value as typeof type)} required>
                <option value="">Seleccione…</option><option value="IN">Entrada</option><option value="OUT">Salida</option>
              </select>
            </Field>
            <Field label="Cantidad"><input className="input" type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} required /></Field>
            <Field label="Motivo" full><input className="input" placeholder="Opcional: compra a proveedor, daño, conteo físico…" value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
          </div>
          <div className="form-actions"><button className="btn btn-primary" disabled={create.isPending}><i className="bi bi-check-lg" /> Guardar ajuste</button></div>
        </form>
        <div className="panel">
          <h2 className="panel-title"><i className="bi bi-file-earmark-arrow-down" /> Exportar por fechas</h2>
          <div className="form-grid">
            <Field label="Desde"><input className="input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
            <Field label="Hasta"><input className="input" type="date" value={to} onChange={(e) => setTo(e.target.value)} /></Field>
          </div>
          <button className="btn" style={{ marginTop: 14 }} onClick={() => download('/exports/inventory-adjustments.xlsx', { date_from: from, date_to: to }).catch((e) => toast.error(e.message))}>
            <i className="bi bi-file-earmark-excel" /> Excel
          </button>
        </div>
      </div>
      <div className="panel flush">
        <div className="toolbar"><h2 className="panel-title" style={{ margin: 0 }}><i className="bi bi-clock-history" /> Historial de ajustes</h2></div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Fecha</th><th>Producto</th><th>Tipo</th><th className="num">Cantidad</th><th className="num">Stock</th><th>Motivo</th><th>Usuario</th></tr></thead>
            <tbody>
              {isLoading ? <LoadingRows cols={7} /> : data?.items.length ? data.items.map((a) => (
                <tr key={a.id}>
                  <td className="nowrap">{datetime(a.created_at)}</td>
                  <td className="strong">{a.item_name}</td>
                  <td>{a.adjustment_type === 'IN' ? <Badge tone="success">Entrada</Badge> : <Badge tone="danger">Salida</Badge>}</td>
                  <td className="num strong">{a.quantity}</td>
                  <td className="num muted">{a.stock_before ?? '—'} → {a.stock_after ?? '—'}</td>
                  <td className="muted">{a.reason || '—'}</td>
                  <td className="muted">{a.username}</td>
                </tr>
              )) : <tr><td colSpan={7}><Empty>No hay ajustes registrados.</Empty></td></tr>}
            </tbody>
          </table>
        </div>
        {data ? <Pagination page={page} pageSize={PAGE_SIZE} total={data.total} onPage={setPage} /> : null}
      </div>
    </>
  );
}

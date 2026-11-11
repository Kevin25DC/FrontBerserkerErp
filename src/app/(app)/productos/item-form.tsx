'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { useToast } from '@/components/providers';
import { Field } from '@/components/ui';
import { api } from '@/lib/api';
import { digitsToNumber } from '@/lib/format';
import type { Item, Tax } from '@/lib/types';

export function ItemForm({ item }: { item?: Item }) {
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();
  const { data: taxes } = useQuery({ queryKey: ['taxes'], queryFn: () => api<Tax[]>('/taxes') });
  const [name, setName] = useState(item?.name ?? '');
  const [reference, setReference] = useState(item?.reference ?? '');
  const [description, setDescription] = useState(item?.description ?? '');
  const [price, setPrice] = useState(item ? Math.round(Number(item.price)) : 0);
  const [stock, setStock] = useState(0);
  const [taxId, setTaxId] = useState(item?.tax_id ? String(item.tax_id) : '');
  const [active, setActive] = useState(item?.active ?? true);

  const save = useMutation({
    mutationFn: () => {
      const body = { name, reference, description, price, tax_id: taxId ? Number(taxId) : null, active };
      return item ? api(`/items/${item.id}`, { method: 'PUT', json: body }) : api('/items', { json: { ...body, stock } });
    },
    onSuccess: () => { toast.success('Producto guardado.'); qc.invalidateQueries({ queryKey: ['items'] }); router.push('/productos'); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <form onSubmit={(e: FormEvent) => { e.preventDefault(); save.mutate(); }}>
      <div className="grid grid-7-5">
        <div className="panel">
          <h2 className="panel-title"><i className="bi bi-info-circle" /> Información básica</h2>
          <div style={{ display: 'grid', gap: 14 }}>
            <Field label="Nombre *"><input className="input" value={name} onChange={(e) => setName(e.target.value)} required autoFocus /></Field>
            <Field label="Referencia *" help="Única por producto"><input className="input" value={reference} onChange={(e) => setReference(e.target.value)} required /></Field>
            <Field label="Descripción *"><textarea className="textarea" value={description} onChange={(e) => setDescription(e.target.value)} required /></Field>
          </div>
        </div>
        <div>
          <div className="panel">
            <h2 className="panel-title"><i className="bi bi-currency-dollar" /> Datos comerciales</h2>
            <div style={{ display: 'grid', gap: 14 }}>
              <Field label="Precio *">
                <div className="input-group"><span className="addon">$</span>
                  <input className="input" inputMode="numeric" value={price ? price.toLocaleString('es-CO') : ''} onChange={(e) => setPrice(digitsToNumber(e.target.value))} required /></div>
              </Field>
              {item ? (
                <Field label="Stock" help={<>Cambia con las ventas y los <Link href="/ajustes">ajustes de inventario</Link>.</>}>
                  <input className="input" value={item.stock} disabled />
                </Field>
              ) : (
                <Field label="Cantidad inicial *"><input className="input" type="number" min={0} value={stock} onChange={(e) => setStock(Number(e.target.value))} required /></Field>
              )}
              <Field label="Impuesto">
                <select className="select" value={taxId} onChange={(e) => setTaxId(e.target.value)}>
                  <option value="">Sin impuesto</option>
                  {taxes?.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </Field>
            </div>
          </div>
          <div className="panel">
            <h2 className="panel-title"><i className="bi bi-toggle-on" /> Estado</h2>
            <div style={{ display: 'flex', gap: 24 }}>
              <label className="check"><input type="radio" checked={active} onChange={() => setActive(true)} /> Activo</label>
              <label className="check"><input type="radio" checked={!active} onChange={() => setActive(false)} /> Inactivo</label>
            </div>
          </div>
        </div>
      </div>
      <div className="form-actions">
        <Link href="/productos" className="btn">Cancelar</Link>
        <button className="btn btn-primary" disabled={save.isPending}>{save.isPending ? <span className="spinner" /> : <i className="bi bi-check-lg" />} Guardar</button>
      </div>
    </form>
  );
}

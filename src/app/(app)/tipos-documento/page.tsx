'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { useToast } from '@/components/providers';
import { Badge, Empty, Field, LoadingRows, PageHeader } from '@/components/ui';
import { api } from '@/lib/api';
import type { TransactionType } from '@/lib/types';

const EMPTY = { name: '', consecutive: '', prefix: '' };

export default function TiposDocumentoPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY);
  const { data, isLoading } = useQuery({ queryKey: ['transaction-types'], queryFn: () => api<TransactionType[]>('/transaction-types') });
  const reset = () => { setEditing(null); setForm(EMPTY); };

  const save = useMutation({
    mutationFn: () => {
      const body = { name: form.name, consecutive: Number(form.consecutive), prefix: form.prefix };
      return editing ? api(`/transaction-types/${editing}`, { method: 'PUT', json: body }) : api('/transaction-types', { json: body });
    },
    onSuccess: () => { toast.success('Tipo de documento guardado.'); reset(); qc.invalidateQueries({ queryKey: ['transaction-types'] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: (id: number) => api(`/transaction-types/${id}`, { method: 'DELETE' }),
    onSuccess: () => { toast.success('Eliminado.'); qc.invalidateQueries({ queryKey: ['transaction-types'] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader title="Tipos de documento" subtitle="Consecutivos de facturas, crédito y anulaciones." />
      <div className="alert warning"><i className="bi bi-exclamation-triangle" />
        <span>El consecutivo sube solo al generar cada documento y <strong>no debe retrocederse</strong>: hacerlo generaría números duplicados.</span>
      </div>
      <div className="grid grid-1-2">
        <form className="panel" onSubmit={(e: FormEvent) => { e.preventDefault(); save.mutate(); }}>
          <h2 className="panel-title"><i className={`bi ${editing ? 'bi-pencil' : 'bi-plus-circle'}`} /> {editing ? 'Editar tipo' : 'Nuevo tipo'}</h2>
          <div style={{ display: 'grid', gap: 14 }}>
            <Field label="Nombre"><input className="input" placeholder="Ej. Factura de venta" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
            <div className="form-grid">
              <Field label="Consecutivo"><input className="input" type="number" min={1} value={form.consecutive} onChange={(e) => setForm({ ...form, consecutive: e.target.value })} required /></Field>
              <Field label="Prefijo"><input className="input" maxLength={10} value={form.prefix} onChange={(e) => setForm({ ...form, prefix: e.target.value.toUpperCase() })} required /></Field>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" disabled={save.isPending}>{editing ? 'Actualizar' : 'Guardar'}</button>
              {editing ? <button type="button" className="btn" onClick={reset}>Cancelar</button> : null}
            </div>
          </div>
        </form>
        <div className="panel flush">
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Nombre</th><th>Prefijo</th><th className="num">Próximo consecutivo</th><th className="num">Acciones</th></tr></thead>
              <tbody>
                {isLoading ? <LoadingRows cols={4} rows={4} /> : data?.length ? data.map((t) => (
                  <tr key={t.id}>
                    <td className="strong">{t.name}</td>
                    <td><Badge tone="neutral">{t.prefix || '—'}</Badge></td>
                    <td className="num">{t.consecutive}</td>
                    <td className="num nowrap">
                      <button className="btn btn-icon" title="Editar" onClick={() => { setEditing(t.id); setForm({ name: t.name, consecutive: String(t.consecutive), prefix: t.prefix ?? '' }); }}><i className="bi bi-pencil" /></button>{' '}
                      <button className="btn btn-icon btn-ghost-danger" title="Eliminar"
                        onClick={() => confirm(`¿Eliminar "${t.name}"? Si tiene documentos asociados no se podrá.`) && remove.mutate(t.id)}><i className="bi bi-trash" /></button>
                    </td>
                  </tr>
                )) : <tr><td colSpan={4}><Empty icon="bi-hash">No hay tipos de documento.</Empty></td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { useToast } from '@/components/providers';
import { Badge, Empty, Field, LoadingRows, PageHeader } from '@/components/ui';
import { api } from '@/lib/api';
import { date } from '@/lib/format';
import type { Tax } from '@/lib/types';

export default function ImpuestosPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [name, setName] = useState('');
  const [rate, setRate] = useState('');
  const { data, isLoading } = useQuery({ queryKey: ['taxes'], queryFn: () => api<Tax[]>('/taxes') });
  const create = useMutation({
    mutationFn: () => api('/taxes', { json: { name, rate } }),
    onSuccess: () => { toast.success(`Impuesto "${name}" creado.`); setName(''); setRate(''); qc.invalidateQueries({ queryKey: ['taxes'] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader title="Impuestos" subtitle="Tarifas que se asignan a los productos." />
      <div className="grid grid-1-2">
        <form className="panel" onSubmit={(e: FormEvent) => { e.preventDefault(); create.mutate(); }}>
          <h2 className="panel-title"><i className="bi bi-plus-circle" /> Nuevo impuesto</h2>
          <div style={{ display: 'grid', gap: 14 }}>
            <Field label="Nombre"><input className="input" placeholder="Ej. IVA 19%" value={name} onChange={(e) => setName(e.target.value)} required /></Field>
            <Field label="Porcentaje">
              <div className="input-group"><input className="input" style={{ borderRadius: '8px 0 0 8px' }} type="number" min="0.01" max="100" step="0.01" value={rate} onChange={(e) => setRate(e.target.value)} required />
                <span className="addon" style={{ borderLeft: 0, borderRight: '1px solid var(--border-strong)', borderRadius: '0 8px 8px 0' }}>%</span></div>
            </Field>
            <button className="btn btn-primary" disabled={create.isPending}>Guardar</button>
          </div>
        </form>
        <div className="panel flush">
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Nombre</th><th className="num">Tarifa</th><th>Estado</th><th>Creado</th></tr></thead>
              <tbody>
                {isLoading ? <LoadingRows cols={4} rows={3} /> : data?.length ? data.map((t) => (
                  <tr key={t.id}>
                    <td className="strong">{t.name}</td>
                    <td className="num">{Number(t.rate).toLocaleString('es-CO')}%</td>
                    <td>{t.is_active ? <Badge tone="success">Activo</Badge> : <Badge tone="neutral">Inactivo</Badge>}</td>
                    <td className="muted">{date(t.created_at)}</td>
                  </tr>
                )) : <tr><td colSpan={4}><Empty icon="bi-percent">No hay impuestos creados.</Empty></td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

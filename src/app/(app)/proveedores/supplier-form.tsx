'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { useToast } from '@/components/providers';
import { Field } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { nitDv } from '@/lib/nit';
import type { IdType, Supplier, SupplierIn } from '@/lib/types';

const EMPTY: SupplierIn = {
  id_type: 'NIT', identification: '', dv: '', name: '', trade_name: '', person_type: 'juridica',
  contact_name: '', phone: '', email: '', address: '', city: '', department: '', country: 'Colombia',
  payment_terms: 'Contado', credit_days: 0, notes: '', active: true,
};

const TYPES: { value: IdType; label: string }[] = [
  { value: 'NIT', label: 'NIT (empresa)' },
  { value: 'CC', label: 'Cédula de ciudadanía' },
  { value: 'CE', label: 'Cédula de extranjería' },
  { value: 'PP', label: 'Pasaporte' },
  { value: 'OTRO', label: 'Otro' },
];

export function SupplierForm({ supplier }: { supplier?: Supplier }) {
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();
  const [form, setForm] = useState<SupplierIn>(supplier ? { ...EMPTY, ...supplier } : EMPTY);

  function set<K extends keyof SupplierIn>(key: K, value: SupplierIn[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function changeType(idType: IdType) {
    setForm((f) => ({
      ...f, id_type: idType, person_type: idType === 'NIT' ? 'juridica' : 'natural',
      dv: idType === 'NIT' ? f.dv || nitDv(f.identification) : null,
      trade_name: idType === 'NIT' ? f.trade_name : null,
    }));
  }

  function changeIdentification(value: string) {
    setForm((f) => ({ ...f, identification: value, dv: f.id_type === 'NIT' ? nitDv(value) : f.dv }));
  }

  const save = useMutation({
    mutationFn: () => {
      const body = {
        id_type: form.id_type,
        identification: form.identification.trim(),
        dv: form.id_type === 'NIT' ? (form.dv || nitDv(form.identification)) : null,
        name: form.name.trim(),
        trade_name: form.id_type === 'NIT' ? (form.trade_name?.trim() || null) : null,
        person_type: form.person_type,
        contact_name: form.contact_name?.trim() || null,
        phone: form.phone?.trim() || null,
        email: form.email?.trim() || null,
        address: form.address?.trim() || null,
        city: form.city?.trim() || null,
        department: form.department?.trim() || null,
        country: form.country?.trim() || 'Colombia',
        payment_terms: form.payment_terms?.trim() || null,
        credit_days: Number(form.credit_days) || 0,
        notes: form.notes?.trim() || null,
        active: form.active,
      };
      return supplier
        ? api<Supplier>(`/suppliers/${supplier.id}`, { method: 'PUT', json: body })
        : api<Supplier>('/suppliers', { json: body });
    },
    onSuccess: () => {
      toast.success('Proveedor guardado.');
      qc.invalidateQueries({ queryKey: ['suppliers'] });
      router.push('/proveedores');
    },
    onError: (e: Error) => toast.error(e instanceof ApiError ? e.message : 'No se pudo guardar el proveedor.'),
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    save.mutate();
  }

  const isNit = form.id_type === 'NIT';
  return (
    <form onSubmit={submit}>
      <div className="grid grid-2">
        <div className="panel">
          <h2 className="panel-title"><i className="bi bi-card-text" /> Identificación</h2>
          <div className="form-grid">
            <Field label="Tipo de identificación *">
              <select className="select" value={form.id_type} onChange={(e) => changeType(e.target.value as IdType)}>
                {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </Field>
            <Field label="Número de identificación *">
              <input className="input" inputMode={isNit ? 'numeric' : 'text'} value={form.identification}
                onChange={(e) => changeIdentification(e.target.value)} required />
            </Field>
            {isNit ? (
              <Field label="Dígito de verificación (DV)" help="Se calcula automáticamente">
                <div className="input-group">
                  <input className="input" maxLength={1} value={form.dv ?? ''} onChange={(e) => set('dv', e.target.value.replace(/\D/g, '').slice(0, 1))} />
                  <button type="button" className="btn" onClick={() => set('dv', nitDv(form.identification))}>Calcular</button>
                </div>
              </Field>
            ) : null}
            <Field label={isNit ? 'Razón social *' : 'Nombres y apellidos *'} full>
              <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} required />
            </Field>
            {isNit ? (
              <Field label="Nombre comercial" full>
                <input className="input" value={form.trade_name ?? ''} onChange={(e) => set('trade_name', e.target.value)} />
              </Field>
            ) : null}
          </div>
        </div>

        <div className="panel">
          <h2 className="panel-title"><i className="bi bi-person-lines-fill" /> Contacto</h2>
          <div className="form-grid">
            <Field label="Persona de contacto"><input className="input" value={form.contact_name ?? ''} onChange={(e) => set('contact_name', e.target.value)} /></Field>
            <Field label="Teléfono"><input className="input" value={form.phone ?? ''} onChange={(e) => set('phone', e.target.value)} /></Field>
            <Field label="Correo electrónico" full><input className="input" type="email" value={form.email ?? ''} onChange={(e) => set('email', e.target.value)} /></Field>
          </div>
        </div>

        <div className="panel">
          <h2 className="panel-title"><i className="bi bi-geo-alt" /> Ubicación</h2>
          <div className="form-grid">
            <Field label="Dirección" full><input className="input" value={form.address ?? ''} onChange={(e) => set('address', e.target.value)} /></Field>
            <Field label="Ciudad"><input className="input" value={form.city ?? ''} onChange={(e) => set('city', e.target.value)} /></Field>
            <Field label="Departamento"><input className="input" value={form.department ?? ''} onChange={(e) => set('department', e.target.value)} /></Field>
            <Field label="País"><input className="input" value={form.country ?? ''} onChange={(e) => set('country', e.target.value)} /></Field>
          </div>
        </div>

        <div className="panel">
          <h2 className="panel-title"><i className="bi bi-cash-coin" /> Condiciones</h2>
          <div className="form-grid">
            <Field label="Forma de pago">
              <select className="select" value={form.payment_terms ?? 'Contado'} onChange={(e) => set('payment_terms', e.target.value)}>
                <option>Contado</option><option>Crédito</option>
              </select>
            </Field>
            <Field label="Días de crédito">
              <input className="input" type="number" min={0} value={form.credit_days} onChange={(e) => set('credit_days', Number(e.target.value) || 0)} />
            </Field>
            <Field label="Notas" full><textarea className="textarea" value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} /></Field>
          </div>
          <label className="check" style={{ marginTop: 14 }}>
            <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} /> Proveedor activo
          </label>
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn" onClick={() => router.push('/proveedores')}>Cancelar</button>
        <button className="btn btn-primary" disabled={save.isPending}>
          {save.isPending ? <span className="spinner" /> : <i className="bi bi-check-lg" />} Guardar proveedor
        </button>
      </div>
    </form>
  );
}

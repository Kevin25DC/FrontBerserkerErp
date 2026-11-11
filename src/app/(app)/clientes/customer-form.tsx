'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useRef, useState, type FormEvent } from 'react';
import { useToast } from '@/components/providers';
import { Field } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import type { Customer, CustomerIn } from '@/lib/types';

const EMPTY: CustomerIn = { name: '', lastname: '', cedula: '', phone: '', email: '', address: '', city: '' };

export function CustomerForm({ customer }: { customer?: Customer }) {
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<CustomerIn>(customer ? { ...EMPTY, ...customer } : EMPTY);
  const set = (k: keyof CustomerIn) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: k === 'cedula' ? e.target.value.replace(/\D/g, '').slice(0, 10) : e.target.value }));

  const save = useMutation({
    mutationFn: async () => {
      const body = { name: form.name, lastname: form.lastname, cedula: form.cedula, phone: form.phone, email: form.email, address: form.address, city: form.city };
      const saved = customer
        ? await api<Customer>(`/customers/${customer.id}`, { method: 'PUT', json: body })
        : await api<Customer>('/customers', { json: body });
      const file = fileRef.current?.files?.[0];
      if (file) {
        const fd = new FormData();
        fd.append('file', file);
        await api(`/customers/${saved.id}/document`, { form: fd });
      }
      return saved;
    },
    onSuccess: () => {
      toast.success('Cliente guardado.');
      qc.invalidateQueries({ queryKey: ['customers'] });
      router.push('/clientes');
    },
    onError: (e: Error) => toast.error(e instanceof ApiError ? e.message : 'No se pudo guardar.'),
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    save.mutate();
  }

  return (
    <form onSubmit={submit}>
      <div className="grid grid-7-5">
        <div className="panel">
          <h2 className="panel-title"><i className="bi bi-person" /> Datos personales</h2>
          <div className="form-grid">
            <Field label="Nombre *"><input className="input" value={form.name} onChange={set('name')} required /></Field>
            <Field label="Apellido *"><input className="input" value={form.lastname} onChange={set('lastname')} required /></Field>
            <Field label="Cédula *" help="Entre 8 y 10 dígitos"><input className="input" inputMode="numeric" value={form.cedula} onChange={set('cedula')} required minLength={8} /></Field>
            <Field label="Teléfono *"><input className="input" value={form.phone} onChange={set('phone')} required /></Field>
            <Field label="Correo electrónico *" full help={customer ? undefined : 'Se le enviará un correo de bienvenida.'}>
              <input className="input" type="email" value={form.email} onChange={set('email')} required />
            </Field>
          </div>
        </div>
        <div>
          <div className="panel">
            <h2 className="panel-title"><i className="bi bi-house" /> Residencia</h2>
            <div style={{ display: 'grid', gap: 14 }}>
              <Field label="Dirección *"><input className="input" value={form.address} onChange={set('address')} required /></Field>
              <Field label="Ciudad *"><input className="input" value={form.city} onChange={set('city')} required /></Field>
            </div>
          </div>
          <div className="panel">
            <h2 className="panel-title"><i className="bi bi-paperclip" /> Documento (opcional)</h2>
            <input ref={fileRef} type="file" accept="application/pdf" className="input" />
            <p className="help" style={{ margin: '6px 0 0' }}>{customer?.has_pdf ? 'Ya tiene un PDF; si subes otro, lo reemplaza.' : 'PDF con documentos del cliente (máx. 10 MB).'}</p>
          </div>
        </div>
      </div>
      <div className="form-actions">
        <button type="button" className="btn" onClick={() => router.push('/clientes')}>Cancelar</button>
        <button className="btn btn-primary" disabled={save.isPending}>{save.isPending ? <span className="spinner" /> : <i className="bi bi-check-lg" />} Guardar</button>
      </div>
    </form>
  );
}

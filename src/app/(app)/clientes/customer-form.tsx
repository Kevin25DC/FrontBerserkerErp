'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useRef, useState, type FormEvent } from 'react';
import { useToast } from '@/components/providers';
import { Field } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { cleanIdNumber, CUSTOMER_ID_TYPES, idNumber } from '@/lib/identification';
import type { Customer, CustomerIn } from '@/lib/types';

const EMPTY: CustomerIn = { id_type: 'CC', name: '', lastname: '', cedula: '', phone: '', email: '', address: '', city: '' };

export function CustomerForm({ customer }: { customer?: Customer }) {
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<CustomerIn>(customer ? { ...EMPTY, ...customer } : EMPTY);
  const set = (k: keyof CustomerIn) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: k === 'cedula' ? cleanIdNumber(f.id_type, e.target.value) : e.target.value }));
  const isCompany = form.id_type === 'NIT';
  const numberHelp = {
    CC: 'Entre 8 y 10 dígitos',
    NIT: form.cedula.length >= 6 ? `Sin dígito de verificación · DV ${idNumber('NIT', form.cedula).split('-')[1]}` : 'Sin dígito de verificación (se calcula solo)',
    CE: 'Letras o números, sin espacios',
    PPT: 'Letras o números, sin espacios',
    PP: 'Letras o números, sin espacios',
  }[form.id_type];

  const save = useMutation({
    mutationFn: async () => {
      const body = { id_type: form.id_type, name: form.name, lastname: isCompany ? '' : form.lastname, cedula: form.cedula, phone: form.phone, email: form.email, address: form.address, city: form.city };
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
          <h2 className="panel-title"><i className={`bi ${isCompany ? 'bi-building' : 'bi-person'}`} /> {isCompany ? 'Datos de la empresa' : 'Datos personales'}</h2>
          <div className="form-grid">
            <Field label="Tipo de identificación *">
              <select className="select" value={form.id_type}
                onChange={(e) => { const t = e.target.value as CustomerIn['id_type']; setForm((f) => ({ ...f, id_type: t, cedula: cleanIdNumber(t, f.cedula) })); }}>
                {CUSTOMER_ID_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </Field>
            <Field label="Número de identificación *" help={numberHelp}>
              <input className="input" inputMode={form.id_type === 'CC' || isCompany ? 'numeric' : 'text'} value={form.cedula} onChange={set('cedula')}
                required minLength={form.id_type === 'CC' ? 8 : isCompany ? 6 : 3} />
            </Field>
            <Field label={isCompany ? 'Razón social *' : 'Nombre *'} full={isCompany}><input className="input" value={form.name} onChange={set('name')} required maxLength={100} /></Field>
            {isCompany ? null : <Field label="Apellido *"><input className="input" value={form.lastname} onChange={set('lastname')} required maxLength={100} /></Field>}
            <Field label="Teléfono *"><input className="input" value={form.phone} onChange={set('phone')} required /></Field>
            <Field label="Correo electrónico *" full help={customer ? undefined : 'Se le enviará un correo de bienvenida.'}>
              <input className="input" type="email" value={form.email} onChange={set('email')} required />
            </Field>
          </div>
        </div>
        <div>
          <div className="panel">
            <h2 className="panel-title"><i className="bi bi-house" /> {isCompany ? 'Ubicación' : 'Residencia'}</h2>
            <div style={{ display: 'grid', gap: 14 }}>
              <Field label="Dirección *"><input className="input" value={form.address} onChange={set('address')} required /></Field>
              <Field label="Ciudad *"><input className="input" value={form.city} onChange={set('city')} required /></Field>
            </div>
          </div>
          <div className="panel">
            <h2 className="panel-title"><i className="bi bi-paperclip" /> Documento (opcional)</h2>
            <input ref={fileRef} type="file" accept="application/pdf" className="input" />
            <p className="help" style={{ margin: '6px 0 0' }}>{customer?.has_pdf ? 'Ya tiene un PDF; si subes otro, lo reemplaza.' : isCompany ? 'PDF con RUT, cámara de comercio u otros documentos (máx. 10 MB).' : 'PDF con documentos del cliente (máx. 10 MB).'}</p>
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

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, type FormEvent } from 'react';
import { useToast } from '@/components/providers';
import { Field, PageHeader, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import { datetime } from '@/lib/format';
import type { User } from '@/lib/types';

export default function PerfilPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const { data: me } = useQuery({ queryKey: ['me'], queryFn: () => api<User>('/auth/me') });
  const [form, setForm] = useState({ username: '', email: '', first_name: '', last_name: '' });
  const [pwd, setPwd] = useState({ current_password: '', new_password: '', confirm: '' });
  useEffect(() => { if (me) setForm({ username: me.username, email: me.email, first_name: me.first_name, last_name: me.last_name }); }, [me]);

  const save = useMutation({
    mutationFn: () => api('/auth/me', { method: 'PUT', json: form }),
    onSuccess: () => { toast.success('Perfil actualizado.'); qc.invalidateQueries({ queryKey: ['me'] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const changePwd = useMutation({
    mutationFn: () => api('/auth/password', { json: { current_password: pwd.current_password, new_password: pwd.new_password } }),
    onSuccess: () => { toast.success('Contraseña actualizada.'); setPwd({ current_password: '', new_password: '', confirm: '' }); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!me) return <Spinner />;
  return (
    <>
      <PageHeader title="Mi perfil" subtitle={`Último acceso: ${datetime(me.last_login)}`} />
      <div className="grid grid-2" style={{ maxWidth: 1000 }}>
        <form className="panel" onSubmit={(e: FormEvent) => { e.preventDefault(); save.mutate(); }}>
          <h2 className="panel-title"><i className="bi bi-person" /> Datos de la cuenta</h2>
          <div className="form-grid">
            <Field label="Usuario"><input className="input" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required /></Field>
            <Field label="Correo"><input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></Field>
            <Field label="Nombre"><input className="input" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} /></Field>
            <Field label="Apellido"><input className="input" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></Field>
          </div>
          <div className="form-actions"><button className="btn btn-primary" disabled={save.isPending}>Guardar</button></div>
        </form>
        <form className="panel" onSubmit={(e: FormEvent) => {
          e.preventDefault();
          if (pwd.new_password !== pwd.confirm) return toast.error('Las contraseñas nuevas no coinciden.');
          changePwd.mutate();
        }}>
          <h2 className="panel-title"><i className="bi bi-shield-lock" /> Cambiar contraseña</h2>
          <div style={{ display: 'grid', gap: 14 }}>
            <Field label="Contraseña actual"><input className="input" type="password" autoComplete="current-password" value={pwd.current_password} onChange={(e) => setPwd({ ...pwd, current_password: e.target.value })} required /></Field>
            <Field label="Nueva contraseña"><input className="input" type="password" autoComplete="new-password" minLength={4} value={pwd.new_password} onChange={(e) => setPwd({ ...pwd, new_password: e.target.value })} required /></Field>
            <Field label="Confirmar"><input className="input" type="password" autoComplete="new-password" value={pwd.confirm} onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })} required /></Field>
          </div>
          <div className="form-actions"><button className="btn btn-primary" disabled={changePwd.isPending}>Cambiar contraseña</button></div>
        </form>
      </div>
    </>
  );
}

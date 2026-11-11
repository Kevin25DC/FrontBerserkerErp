'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, type FormEvent } from 'react';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const r = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!r.ok) {
      const body = await r.json().catch(() => ({}));
      setError(body.detail ?? 'No se pudo iniciar sesión.');
      setBusy(false);
      return;
    }
    // Solo rutas internas (evita redirecciones a otros sitios)
    const next = params.get('next');
    router.replace(next && next.startsWith('/') && !next.startsWith('//') ? next : '/');
    router.refresh();
  }

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={submit}>
        <img src="/logo.png" alt="Berserker ERP" className="auth-logo" />
        <h1 style={{ fontSize: 20, textAlign: 'center' }}>Iniciar sesión</h1>
        <p className="muted" style={{ textAlign: 'center', marginTop: 4 }}>Usa tu usuario del sistema</p>
        {error ? <div className="alert danger"><i className="bi bi-exclamation-octagon" /> {error}</div> : null}
        <div style={{ display: 'grid', gap: 14, marginTop: 16 }}>
          <label className="field">
            <span className="label">Usuario o correo</span>
            <input className="input" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus />
          </label>
          <label className="field">
            <span className="label">Contraseña</span>
            <input className="input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          <button className="btn btn-primary" disabled={busy} style={{ width: '100%', marginTop: 4 }}>
            {busy ? <span className="spinner" /> : null} Entrar
          </button>
        </div>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}

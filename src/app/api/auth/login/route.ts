import { NextResponse } from 'next/server';
import { API_URL, IS_PROD, SESSION_COOKIE } from '@/lib/server';

/** Inicia sesión contra la API y guarda el token en una cookie httpOnly. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const r = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: body.username ?? '', password: body.password ?? '' }),
    cache: 'no-store',
  });
  const data = await r.json().catch(() => ({ detail: 'No se pudo contactar la API.' }));
  if (!r.ok) {
    return NextResponse.json({ detail: data.detail ?? 'Usuario o contraseña incorrectos.' }, { status: r.status });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, data.access_token, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'lax',
    path: '/',
    maxAge: data.expires_in,
  });
  return res;
}

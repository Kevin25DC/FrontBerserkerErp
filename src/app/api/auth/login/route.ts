import { NextResponse } from 'next/server';
import { API_URL, IS_PROD, SESSION_COOKIE } from '@/lib/server';

/** Inicia sesión contra la API y guarda el token en una cookie httpOnly. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  let r: Response;
  try {
    r = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: body.username ?? '', password: body.password ?? '' }),
      cache: 'no-store',
    });
  } catch (err) {
    console.error(`No se pudo contactar la API en ${API_URL}:`, err);
    return NextResponse.json({ detail: 'No se pudo contactar la API.' }, { status: 502 });
  }
  const data = await r.json().catch(() => ({ detail: 'No se pudo contactar la API.' }));
  if (!r.ok) {
    return NextResponse.json({ detail: data.detail ?? 'Usuario o contraseña incorrectos.' }, { status: r.status });
  }
  if (!data.access_token) {
    console.error('La API de login no devolvió access_token:', data);
    return NextResponse.json({ detail: 'Respuesta inválida de la API.' }, { status: 502 });
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

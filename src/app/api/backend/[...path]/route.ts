import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { API_URL, SESSION_COOKIE } from '@/lib/server';

/**
 * Proxy del navegador hacia la API: agrega el token de la cookie httpOnly.
 * Mismo origen para el navegador (sin CORS) y el token nunca queda expuesto a JavaScript.
 * Reenvía tal cual el cuerpo (JSON, multipart, binario) y la respuesta (JSON, Excel, PDF).
 */
async function forward(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ detail: 'Sesión no iniciada.', code: 'unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const target = `${API_URL}/${path.map(encodeURIComponent).join('/')}${url.search}`;
  const headers = new Headers();
  headers.set('Authorization', `Bearer ${token}`);
  const contentType = req.headers.get('content-type');
  if (contentType) headers.set('Content-Type', contentType);

  const hasBody = !['GET', 'HEAD'].includes(req.method);
  const upstream = await fetch(target, {
    method: req.method,
    headers,
    body: hasBody ? await req.arrayBuffer() : undefined,
    cache: 'no-store',
  });

  const out = new Headers();
  for (const h of ['content-type', 'content-disposition']) {
    const v = upstream.headers.get(h);
    if (v) out.set(h, v);
  }
  const res = new NextResponse(upstream.status === 204 ? null : upstream.body, { status: upstream.status, headers: out });
  if (upstream.status === 401) res.cookies.delete(SESSION_COOKIE);
  return res;
}

export { forward as GET, forward as POST, forward as PUT, forward as PATCH, forward as DELETE };

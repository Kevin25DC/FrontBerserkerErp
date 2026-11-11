import { NextResponse, type NextRequest } from 'next/server';

const SESSION_COOKIE = 'berserker_session';
const PUBLIC = ['/login', '/api/auth/login', '/api/pdf'];

/** Sin sesión → al login, recordando a dónde quería ir (?next=). */
export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (PUBLIC.some((p) => pathname.startsWith(p))) return NextResponse.next();
  if (req.cookies.get(SESSION_COOKIE)) return NextResponse.next();
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ detail: 'Sesión no iniciada.', code: 'unauthorized' }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = '/login';
  url.search = pathname === '/' ? '' : `?next=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Archivos estáticos (imágenes, fuentes, etc.) nunca pasan por la verificación de sesión
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\.(?:png|jpg|jpeg|svg|gif|webp|ico|woff2?|css|js)$).*)'],
};

/** Cliente de la API para el navegador: todo pasa por /api/backend (proxy con la cookie). */

export class ApiError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message);
  }
}

type Options = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  json?: unknown;
  form?: FormData;
  query?: Record<string, string | number | boolean | null | undefined>;
};

function buildUrl(path: string, query?: Options['query']) {
  const qs = new URLSearchParams();
  Object.entries(query ?? {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
  });
  const s = qs.toString();
  return `/api/backend${path}${s ? `?${s}` : ''}`;
}

async function request(path: string, opts: Options = {}): Promise<Response> {
  const init: RequestInit = { method: opts.method ?? (opts.json || opts.form ? 'POST' : 'GET') };
  if (opts.json !== undefined) {
    init.headers = { 'Content-Type': 'application/json' };
    init.body = JSON.stringify(opts.json);
  } else if (opts.form) {
    init.body = opts.form;
  }
  const res = await fetch(buildUrl(path, opts.query), init);
  if (res.status === 401 && typeof window !== 'undefined') {
    window.location.href = `/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
  }
  if (!res.ok) {
    let detail = `Error ${res.status}`;
    let code: string | undefined;
    try {
      const body = await res.json();
      code = body.code;
      if (typeof body.detail === 'string') detail = body.detail;
      else if (Array.isArray(body.detail)) detail = body.detail.map((d: { msg: string }) => d.msg).join(' · ');
    } catch {
      /* respuesta sin JSON */
    }
    throw new ApiError(res.status, detail, code);
  }
  return res;
}

export async function api<T = unknown>(path: string, opts: Options = {}): Promise<T> {
  const res = await request(path, opts);
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/** Descarga un archivo (Excel/PDF) respetando el nombre que manda el servidor. */
export async function download(path: string, query?: Options['query'], fallbackName = 'archivo') {
  const res = await request(path, { query });
  const cd = res.headers.get('content-disposition') ?? '';
  const name = /filename="?([^";]+)"?/i.exec(cd)?.[1] ?? fallbackName;
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return name;
}

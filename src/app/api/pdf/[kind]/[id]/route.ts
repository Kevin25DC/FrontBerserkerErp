import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { pdfResponse, renderDocPdf } from '@/lib/render-doc';
import { API_URL, SESSION_COOKIE } from '@/lib/server';
import type { InvoiceDetail, QuoteDetail } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 30;

/** Descarga desde el navegador: GET /api/pdf/{invoice|quote}/{id} (con la sesión del usuario). */
export async function GET(req: Request, ctx: { params: Promise<{ kind: string; id: string }> }) {
  const { kind, id } = await ctx.params;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ detail: 'Sesión no iniciada.' }, { status: 401 });
  const inline = new URL(req.url).searchParams.get('inline') === '1';
  const get = async <T,>(path: string) => {
    const r = await fetch(`${API_URL}${path}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
    if (!r.ok) throw new Response((await r.text()) || 'Error', { status: r.status });
    return r.json() as Promise<T>;
  };
  try {
    if (kind === 'invoice') {
      const { pdf, filename } = await renderDocPdf({ kind: 'invoice', invoice: await get<InvoiceDetail>(`/invoices/${id}`) });
      return pdfResponse(pdf, filename, inline);
    }
    if (kind === 'quote') {
      const [quote, company] = await Promise.all([get<QuoteDetail>(`/quotes/${id}`), get<{ name: string; nit: string }>('/company')]);
      const { pdf, filename } = await renderDocPdf({ kind: 'quote', quote, company_name: company.name, company_nit: company.nit });
      return pdfResponse(pdf, filename, inline);
    }
    // Recibo de abono / anulación de pago: /api/pdf/quota-receipt/{quotaId}?invoice=ID&amount=X
    if (kind === 'quota-receipt' || kind === 'quota-reversal') {
      const qs = new URL(req.url).searchParams;
      const invoice = await get<InvoiceDetail>(`/invoices/${qs.get('invoice')}`);
      const { pdf, filename } = await renderDocPdf({ kind, invoice, quota_id: Number(id), amount: qs.get('amount') ?? '0' });
      return pdfResponse(pdf, filename, inline);
    }
    return NextResponse.json({ detail: 'Documento desconocido.' }, { status: 404 });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ detail: `No se pudo generar el PDF: ${(e as Error).message}` }, { status: 500 });
  }
}

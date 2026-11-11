import { NextResponse } from 'next/server';
import { pdfResponse, renderDocPdf, type DocPayload } from '@/lib/render-doc';

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * Servicio de PDF para la API (adjuntos de correo/WhatsApp):
 * POST /api/pdf/{kind} con los datos del documento y Authorization: Bearer PDF_SERVICE_TOKEN.
 * Solo renderiza: no consulta la API ni la base de datos.
 */
export async function POST(req: Request, ctx: { params: Promise<{ kind: string }> }) {
  const expected = process.env.PDF_SERVICE_TOKEN;
  if (!expected || req.headers.get('authorization') !== `Bearer ${expected}`) {
    return NextResponse.json({ detail: 'No autorizado.' }, { status: 401 });
  }
  const { kind } = await ctx.params;
  if (!['invoice', 'quote', 'quota-receipt', 'quota-reversal'].includes(kind)) {
    return NextResponse.json({ detail: 'Documento desconocido.' }, { status: 404 });
  }
  const payload = { ...(await req.json()), kind } as DocPayload;
  const { pdf, filename } = await renderDocPdf(payload);
  return pdfResponse(pdf, filename);
}

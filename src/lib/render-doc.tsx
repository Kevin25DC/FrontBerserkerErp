import 'server-only';

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { invoiceDoc, purchaseDoc, quotaReceipt, quotaReversal, quoteDoc, type Assets } from '@/components/doc-templates';
import { htmlPage, htmlToPdf } from '@/lib/pdf';
import type { InvoiceDetail, PurchaseDetail, QuoteDetail } from '@/lib/types';

export type DocPayload =
  | { kind: 'invoice'; invoice: InvoiceDetail }
  | { kind: 'quote'; quote: QuoteDetail; company_name: string; company_nit: string }
  | { kind: 'purchase'; purchase: PurchaseDetail }
  | { kind: 'quota-receipt' | 'quota-reversal'; invoice: InvoiceDetail; quota_id: number; amount: string | number; when?: string };

let assets: Assets | null = null;
/** Logo y firma embebidos (data URI): Chromium no descarga nada por red. */
async function getAssets(): Promise<Assets> {
  if (!assets) {
    const read = async (f: string) => `data:image/png;base64,${(await readFile(path.join(process.cwd(), 'public', f))).toString('base64')}`;
    assets = { logo: await read('logo-doc.png'), firma: await read('firma-doc.png') };
  }
  return assets;
}

export async function renderDocPdf(p: DocPayload): Promise<{ pdf: Uint8Array; filename: string }> {
  const a = await getAssets();
  let doc;
  let filename: string;
  switch (p.kind) {
    case 'invoice':
      doc = invoiceDoc(p.invoice, a);
      filename = p.invoice.status === 'Anulada' ? `Anulacion_Factura_${p.invoice.invoice_number}.pdf` : `Factura_${p.invoice.invoice_number}.pdf`;
      break;
    case 'quote':
      doc = quoteDoc(p.quote, { name: p.company_name, nit: p.company_nit }, a);
      filename = `Cotizacion_${p.quote.code}.pdf`;
      break;
    case 'purchase':
      doc = purchaseDoc(p.purchase, a);
      filename = `Compra_${p.purchase.code}.pdf`;
      break;
    case 'quota-receipt':
      doc = quotaReceipt(p.invoice, p.quota_id, p.amount);
      filename = `Recibo_Cuota_${p.quota_id}.pdf`;
      break;
    default:
      doc = quotaReversal(p.invoice, p.quota_id, p.amount);
      filename = `Anulacion_Cuota_${p.quota_id}.pdf`;
  }
  const pdf = await htmlToPdf(htmlPage(doc.body, doc.css, filename));
  return { pdf, filename };
}

export function pdfResponse(pdf: Uint8Array, filename: string, inline = false) {
  return new Response(Buffer.from(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}

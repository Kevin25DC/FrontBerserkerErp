'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, use, useState } from 'react';
import { DocPreview } from '@/components/doc-preview';
import { invoiceDoc } from '@/components/doc-templates';
import { CancelModal } from '@/components/cancel-modal';
import { DownloadButton } from '@/components/download-button';
import { useToast } from '@/components/providers';
import { Modal, PageHeader, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import type { InvoiceDetail } from '@/lib/types';

function InvoiceView({ id }: { id: string }) {
  const params = useSearchParams();
  const qc = useQueryClient();
  const toast = useToast();
  const [sendOpen, setSendOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const { data: inv, error } = useQuery({ queryKey: ['invoice', id], queryFn: () => api<InvoiceDetail>(`/invoices/${id}`) });

  if (error) return <div className="alert danger">{(error as Error).message}</div>;
  if (!inv) return <Spinner />;
  const voided = inv.status === 'Anulada';

  return (
    <>
      <PageHeader back={{ href: '/facturas', label: 'Facturas' }} title={`Factura #${inv.invoice_number}`}
        subtitle={`${inv.customer_name} · ${voided ? `Anulada ${inv.cancel_number ?? ''}` : inv.payment_method === 'Credito' ? 'Crédito' : inv.status}`}
        actions={<>
          <DownloadButton href={`/api/pdf/invoice/${inv.id}`} className="btn btn-primary" loadingLabel="Descargando…" fallbackName={`Factura_${inv.invoice_number}.pdf`}><i className="bi bi-file-earmark-arrow-down" /> Descargar PDF</DownloadButton>
          <a href={`/api/pdf/invoice/${inv.id}?inline=1`} target="_blank" rel="noreferrer" className="btn"><i className="bi bi-printer" /> Imprimir</a>
          {!voided ? <>
            <button className="btn" onClick={() => setSendOpen(true)}><i className="bi bi-send" /> Enviar</button>
            <Link href={`/facturas/${inv.id}/editar`} className="btn"><i className="bi bi-pencil" /> Editar</Link>
            <button className="btn btn-ghost-danger" onClick={() => setCancelOpen(true)}><i className="bi bi-x-octagon" /> Anular</button>
          </> : null}
        </>} />
      {params.get('nueva') ? <div className="alert info"><i className="bi bi-check-circle" /> Factura creada. Descarga o imprime el PDF desde los botones de arriba.</div> : null}
      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        <DocPreview title={`Factura ${inv.invoice_number}`} doc={invoiceDoc(inv, { logo: '/logo-doc.png', firma: '/firma-doc.png' })} />
      </div>

      {sendOpen ? <SendModal inv={inv} onClose={() => setSendOpen(false)} /> : null}
      {cancelOpen ? (
        <CancelModal inv={inv} onClose={() => setCancelOpen(false)} onDone={(n) => {
          toast.success(`Factura anulada (${n}). Se devolvió el stock.`);
          ['invoice', 'invoices', 'items', 'quotas', 'dashboard'].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
          setCancelOpen(false);
        }} />
      ) : null}
    </>
  );
}

function SendModal({ inv, onClose }: { inv: InvoiceDetail; onClose: () => void }) {
  const toast = useToast();
  const [email, setEmail] = useState(true);
  const [whatsapp, setWhatsapp] = useState(false);
  // El modal se cierra al instante y el envío sigue en segundo plano; el resultado llega como aviso.
  function send() {
    if (email && !inv.customer.email) return toast.error('El cliente no tiene correo registrado.');
    if (whatsapp && !inv.customer.phone) return toast.error('El cliente no tiene teléfono registrado.');
    const n = inv.invoice_number;
    onClose();
    toast.info(`Enviando factura #${n}…`);
    api<{ email: string | null; whatsapp: string | null }>(`/invoices/${inv.id}/send`, { json: { email, whatsapp } })
      .then((r) => toast.success(`Factura #${n} · ${[r.email && `Correo: ${r.email}`, r.whatsapp && `WhatsApp: ${r.whatsapp}`].filter(Boolean).join(' · ')}`))
      .catch((e: Error) => toast.error(`Factura #${n}: ${e.message}`));
  }
  return (
    <Modal title="Enviar factura" onClose={onClose}
      footer={<><button className="btn" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" disabled={!email && !whatsapp} onClick={send}><i className="bi bi-send" /> Enviar</button></>}>
      <p className="muted" style={{ marginTop: 0 }}>Cliente: <strong>{inv.customer_name}</strong></p>
      <div style={{ display: 'grid', gap: 10 }}>
        <label className="check"><input type="checkbox" checked={email} onChange={(e) => setEmail(e.target.checked)} /> Correo ({inv.customer.email || 'sin correo'})</label>
        <label className="check"><input type="checkbox" checked={whatsapp} onChange={(e) => setWhatsapp(e.target.checked)} /> WhatsApp ({inv.customer.phone || 'sin teléfono'})</label>
      </div>
    </Modal>
  );
}

export default function FacturaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <Suspense><InvoiceView id={id} /></Suspense>;
}

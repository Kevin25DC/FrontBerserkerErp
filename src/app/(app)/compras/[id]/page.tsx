'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useState } from 'react';
import { DocPreview } from '@/components/doc-preview';
import { purchaseDoc } from '@/components/doc-templates';
import { DownloadButton } from '@/components/download-button';
import { useToast } from '@/components/providers';
import { Badge, Field, Modal, PageHeader, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import { date, datetime, money } from '@/lib/format';
import type { PurchaseDetail, PurchaseStatus } from '@/lib/types';

const TONE: Record<PurchaseStatus, 'neutral' | 'success' | 'danger'> = {
  borrador: 'neutral', confirmada: 'success', anulada: 'danger',
};
const LABEL: Record<PurchaseStatus, string> = {
  borrador: 'Borrador', confirmada: 'Confirmada', anulada: 'Anulada',
};

function PurchaseView({ id }: { id: string }) {
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState('');
  const { data: p, error } = useQuery({ queryKey: ['purchase', id], queryFn: () => api<PurchaseDetail>(`/purchases/${id}`) });

  const invalidate = () => ['purchase', 'purchases', 'items', 'adjustments', 'dashboard']
    .forEach((k) => qc.invalidateQueries({ queryKey: [k] }));

  const confirmPurchase = useMutation({
    mutationFn: () => api<PurchaseDetail>(`/purchases/${id}/confirm`, { method: 'POST' }),
    onSuccess: () => { toast.success('Compra confirmada: entró al inventario.'); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const cancelPurchase = useMutation({
    mutationFn: () => api<PurchaseDetail>(`/purchases/${id}/cancel`, { method: 'POST', json: { reason } }),
    onSuccess: () => { toast.success('Compra anulada: se revirtió el inventario.'); setCancelOpen(false); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: () => api(`/purchases/${id}`, { method: 'DELETE' }),
    onSuccess: () => { toast.success('Borrador eliminado.'); qc.invalidateQueries({ queryKey: ['purchases'] }); router.push('/compras'); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (error) return <div className="alert danger">{(error as Error).message}</div>;
  if (!p) return <Spinner />;

  return (
    <>
      <PageHeader back={{ href: '/compras', label: 'Compras' }} title={`Compra ${p.code}`}
        subtitle={`${p.supplier_name} · ${LABEL[p.status]}`}
        actions={<>
          <DownloadButton href={`/api/pdf/purchase/${p.id}`} className="btn btn-primary" loadingLabel="Descargando…"
            fallbackName={`Compra_${p.code}.pdf`}><i className="bi bi-file-earmark-arrow-down" /> Descargar PDF</DownloadButton>
          {p.status === 'borrador' ? <>
            <Link href={`/compras/${p.id}/editar`} className="btn"><i className="bi bi-pencil" /> Editar</Link>
            <button className="btn" disabled={confirmPurchase.isPending} onClick={() => confirm('¿Confirmar la compra? Entrará al inventario.') && confirmPurchase.mutate()}>
              {confirmPurchase.isPending ? <span className="spinner" /> : <i className="bi bi-check-circle" />} Confirmar
            </button>
            <button className="btn btn-ghost-danger" disabled={remove.isPending} onClick={() => confirm('¿Eliminar el borrador?') && remove.mutate()}>
              <i className="bi bi-trash" /> Eliminar
            </button>
          </> : null}
          {p.status === 'confirmada' ? <button className="btn btn-ghost-danger" onClick={() => setCancelOpen(true)}><i className="bi bi-x-octagon" /> Anular</button> : null}
        </>} />

      <div className="panel">
        <div className="grid grid-2" style={{ gap: 16 }}>
          <div>
            <div className="kpi-label">Proveedor</div>
            <div className="strong">{p.supplier_name}</div>
            <div className="small muted">{p.supplier_id_type} {p.supplier_identification}{p.supplier.dv ? `-${p.supplier.dv}` : ''}</div>
            <div className="small muted">{p.supplier.phone || ''} {p.supplier.email || ''}</div>
          </div>
          <div>
            <div className="kpi-label">Documento</div>
            <div>Fecha: <strong>{date(p.date)}</strong></div>
            <div>{p.document_type}{p.supplier_document ? ` · ${p.supplier_document}` : ''}</div>
            <div className="small muted">Pago: {p.payment_method}{p.payment_terms ? ` · ${p.payment_terms}` : ''}{p.due_date ? ` · vence ${date(p.due_date)}` : ''}</div>
          </div>
        </div>
        <div className="grid grid-2" style={{ gap: 16, marginTop: 16 }}>
          <div>
            <div className="kpi-label">Estado</div>
            <Badge tone={TONE[p.status]}>{LABEL[p.status]}</Badge>
            {p.confirmed_at ? <div className="small muted" style={{ marginTop: 6 }}>Confirmada: {datetime(p.confirmed_at)}</div> : null}
            {p.canceled_at ? <div className="small danger" style={{ marginTop: 6 }}>Anulada: {datetime(p.canceled_at)}</div> : null}
          </div>
          <div>
            <div className="kpi-label">Total</div>
            <div className="kpi-value">{money(p.total)}</div>
            <div className="small muted">Subtotal {money(p.subtotal)} · Desc. {money(p.discount_total)} · IVA {money(p.tax_total)}</div>
          </div>
        </div>
        {p.notes ? <p className="small muted" style={{ marginBottom: 0, marginTop: 16 }}>Notas: {p.notes}</p> : null}
        {p.cancel_reason ? <div className="alert danger" style={{ marginTop: 16, marginBottom: 0 }}>Anulación: {p.cancel_reason}</div> : null}
      </div>

      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        <DocPreview title={`Compra ${p.code}`} doc={purchaseDoc(p, { logo: '/logo-doc.png', firma: '/firma-doc.png' })} />
      </div>

      {cancelOpen ? (
        <Modal title="Anular compra" onClose={() => setCancelOpen(false)}
          footer={<><button className="btn" onClick={() => setCancelOpen(false)}>Cancelar</button>
            <button className="btn btn-danger" disabled={cancelPurchase.isPending} onClick={() => cancelPurchase.mutate()}>
              {cancelPurchase.isPending ? <span className="spinner" /> : null} Anular compra
            </button></>}>
          <p className="muted" style={{ marginTop: 0 }}>Se revertirá el stock de los productos. Debe haber stock suficiente.</p>
          <Field label="Motivo"><textarea className="textarea" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Motivo de la anulación" /></Field>
        </Modal>
      ) : null}
    </>
  );
}

export default function CompraPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <PurchaseView id={id} />;
}

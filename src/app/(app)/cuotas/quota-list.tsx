'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { CustomerPicker } from '@/components/item-picker';
import { useToast } from '@/components/providers';
import { Badge, Empty, Field, Kpi, LoadingRows, Modal, PageHeader, Pagination } from '@/components/ui';
import { api } from '@/lib/api';
import { date, digitsToNumber, money } from '@/lib/format';
import type { QuotaPage, QuotaRow } from '@/lib/types';

const PAGE_SIZE = 50;

type ToastApi = ReturnType<typeof useToast>;

/** Aviso de la API sobre el correo al cliente: verde si salió, rojo si falló, azul si no aplica. */
function noticeToast(toast: ToastApi, notice?: string | null) {
  if (!notice) return;
  if (notice.startsWith('Correo enviado')) toast.success(notice);
  else if (notice.includes('falló')) toast.error(notice);
  else toast.info(notice);
}

/** El pago ya quedó registrado; el correo (PDF + SMTP) va aparte para no hacer esperar al cajero. */
function sendEmail(toast: ToastApi, quotaId: number, body: { kind: 'receipt' | 'reversal'; amount?: string }) {
  toast.info('Enviando comprobante por correo…');
  api<{ notice: string }>(`/quotas/${quotaId}/notify`, { json: body })
    .then((r) => noticeToast(toast, r.notice))
    .catch((e: Error) => toast.error(`El pago quedó registrado, pero el correo no salió: ${e.message}`));
}

/** Abre el PDF del recibo en otra pestaña (igual que el sistema actual: el recibo sale al pagar). */
const openReceipt = (kind: 'quota-receipt' | 'quota-reversal', q: QuotaRow, amount: number | string) =>
  window.open(`/api/pdf/${kind}/${q.id}?invoice=${q.invoice_id}&amount=${amount}&inline=1`, '_blank');

export function QuotaList({ title, subtitle, byInvoice }: { title: string; subtitle: string; byInvoice: boolean }) {
  const params = useSearchParams();
  const qc = useQueryClient();
  const toast = useToast();
  const [customer, setCustomer] = useState<{ id: number; name: string } | null>(params.get('customer') ? { id: Number(params.get('customer')), name: `Cliente #${params.get('customer')}` } : null);
  const [invoiceId, setInvoiceId] = useState(params.get('invoice') ?? '');
  const [state, setState] = useState<'todas' | 'pendientes' | 'pagadas' | 'vencidas'>(params.get('invoice') ? 'todas' : 'pendientes');
  const [page, setPage] = useState(1);
  const [paying, setPaying] = useState<QuotaRow | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['quotas', customer?.id, invoiceId, state, page],
    queryFn: () => api<QuotaPage>('/quotas', { query: { customer_id: customer?.id, invoice_id: invoiceId || undefined, state, page, page_size: PAGE_SIZE } }),
    placeholderData: keepPreviousData,
  });
  const invalidate = () => ['quotas', 'invoices', 'invoice', 'dashboard'].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
  const reverse = useMutation({
    mutationFn: (q: QuotaRow) => api<{ reversed_amount: string }>(`/quotas/${q.id}/reverse`, { method: 'POST', query: { notify: false } }),
    onSuccess: (r, q) => { toast.success('Pago anulado: la cuota volvió a pendiente.'); sendEmail(toast, q.id, { kind: 'reversal', amount: r.reversed_amount }); invalidate(); openReceipt('quota-reversal', q, r.reversed_amount); },
    onError: (e: Error) => toast.error(e.message),
  });
  const c = data?.counters;

  return (
    <>
      <PageHeader title={title} subtitle={subtitle} />
      <div className="panel">
        <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', alignItems: 'end' }}>
          <Field label="Cliente">
            <div style={{ display: 'flex', gap: 6 }}>
              <div style={{ flex: 1 }}><CustomerPicker value={customer?.name} onPick={(x) => { setCustomer({ id: x.id, name: `${x.name} ${x.lastname}` }); setPage(1); }} /></div>
              {customer ? <button className="btn btn-icon" title="Quitar" onClick={() => { setCustomer(null); setInvoiceId(''); setPage(1); }}><i className="bi bi-x-lg" /></button> : null}
            </div>
          </Field>
          {byInvoice ? <Field label="Factura (id interno)"><input className="input" value={invoiceId} onChange={(e) => { setInvoiceId(e.target.value.replace(/\D/g, '')); setPage(1); }} placeholder="Todas" /></Field> : null}
          <Field label="Estado de la cuota">
            <select className="select" value={state} onChange={(e) => { setState(e.target.value as typeof state); setPage(1); }}>
              <option value="todas">Todas</option><option value="pendientes">Pendientes</option><option value="vencidas">Vencidas</option><option value="pagadas">Pagadas</option>
            </select>
          </Field>
        </div>
      </div>
      <div className="kpi-grid">
        <Kpi icon="bi-exclamation-triangle" tone="danger" label="Cuotas vencidas" value={c?.overdue.toLocaleString('es-CO') ?? '…'} hint="Pendientes con fecha pasada" />
        <Kpi icon="bi-clock" tone="warning" label="Cuotas pendientes" value={c?.unpaid.toLocaleString('es-CO') ?? '…'} hint="Por cobrar" />
        <Kpi icon="bi-check2-circle" label="Cuotas pagadas" value={c?.paid.toLocaleString('es-CO') ?? '…'} hint="Completadas" />
      </div>
      <div className="panel flush">
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Factura</th><th>Cliente</th><th>Cuota</th><th>Vencimiento</th><th className="num">Valor</th><th className="num">Saldo</th><th>Estado</th><th className="num">Acciones</th></tr></thead>
            <tbody>
              {isLoading ? <LoadingRows cols={8} /> : data?.items.length ? data.items.map((q) => (
                <tr key={q.id}>
                  <td className="strong">#{q.invoice_number}</td>
                  <td>{q.customer_name}</td>
                  <td className="muted">{q.number === 0 ? 'Inicial' : q.number}</td>
                  <td className="nowrap">{date(q.payment_date)}</td>
                  <td className="num">{money(q.amount)}</td>
                  <td className="num money">{money(q.balance)}</td>
                  <td>{q.number === 0 ? <Badge tone="info">Inicial</Badge> : q.is_paid ? <Badge tone="success">Pagada</Badge> : q.is_overdue ? <Badge tone="danger">Vencida</Badge> : <Badge tone="warning">Pendiente</Badge>}</td>
                  <td className="num nowrap">
                    {q.number === 0 ? <span className="muted">—</span> : !q.is_paid ? (
                      <button className="btn btn-primary btn-sm" onClick={() => setPaying(q)}><i className="bi bi-cash-coin" /> Pagar</button>
                    ) : (
                      <>
                        <button className="btn btn-icon" title="Recibo" onClick={() => openReceipt('quota-receipt', q, q.paid_amount)}><i className="bi bi-file-earmark-pdf" /></button>{' '}
                        <button className="btn btn-icon btn-ghost-danger" title="Anular pago" disabled={reverse.isPending}
                          onClick={() => confirm(`¿Anular los pagos de la cuota ${q.number} (factura #${q.invoice_number})? Volverá a quedar pendiente.`) && reverse.mutate(q)}>
                          <i className="bi bi-arrow-counterclockwise" />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              )) : <tr><td colSpan={8}><Empty>No hay cuotas con los filtros aplicados.</Empty></td></tr>}
            </tbody>
          </table>
        </div>
        {data ? <Pagination page={page} pageSize={PAGE_SIZE} total={data.total} onPage={setPage} /> : null}
      </div>
      {paying ? <PayModal quota={paying} onClose={() => setPaying(null)} onDone={(amount) => { invalidate(); openReceipt('quota-receipt', paying, amount); setPaying(null); }} /> : null}
    </>
  );
}

function PayModal({ quota, onClose, onDone }: { quota: QuotaRow; onClose: () => void; onDone: (amount: number) => void }) {
  const toast = useToast();
  const [amount, setAmount] = useState(Math.round(Number(quota.balance)));
  const pay = useMutation({
    mutationFn: () => api<{ is_paid: boolean; balance: string }>(`/quotas/${quota.id}/pay`, { json: { amount }, query: { notify: false } }),
    onSuccess: (r) => { toast.success(r.is_paid ? 'Cuota pagada completamente.' : `Abono registrado. Saldo: ${money(r.balance)}`); sendEmail(toast, quota.id, { kind: 'receipt' }); onDone(amount); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Modal title="Registrar pago de cuota" onClose={onClose}
      footer={<><button className="btn" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" disabled={pay.isPending || amount <= 0 || amount > Number(quota.balance)} onClick={() => pay.mutate()}>
          {pay.isPending ? <span className="spinner" /> : <i className="bi bi-check-lg" />} Confirmar pago</button></>}>
      <div className="form-grid" style={{ marginBottom: 14 }}>
        <div><div className="kpi-label">Factura</div><div className="strong">#{quota.invoice_number} · cuota {quota.number}</div></div>
        <div><div className="kpi-label">Vencimiento</div><div className="strong">{date(quota.payment_date)}</div></div>
      </div>
      <Field label="Importe a pagar" help={`Saldo de la cuota: ${money(quota.balance)}`}>
        <div className="input-group"><span className="addon">$</span>
          <input className="input" inputMode="numeric" autoFocus value={amount ? amount.toLocaleString('es-CO') : ''} onChange={(e) => setAmount(digitsToNumber(e.target.value))} /></div>
      </Field>
    </Modal>
  );
}

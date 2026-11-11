'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState, type FormEvent } from 'react';
import { CustomerPicker } from '@/components/item-picker';
import { LinesEditor, newLine, totals, TotalsBox, type Line } from '@/components/lines-editor';
import { useToast } from '@/components/providers';
import { Badge, Field, PageHeader, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import { digitsToNumber, money } from '@/lib/format';
import type { InvoiceDetail } from '@/lib/types';

type QuotaEdit = { id: number; number: number; amount: number; payment_date: string; locked: boolean; paid: number };

export default function EditarFacturaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();
  const { data: inv, error } = useQuery({ queryKey: ['invoice', id], queryFn: () => api<InvoiceDetail>(`/invoices/${id}`) });

  const [customer, setCustomer] = useState<{ id: number; name: string } | null>(null);
  const [invoiceDate, setInvoiceDate] = useState('');
  const [method, setMethod] = useState('');
  const [lines, setLines] = useState<Line[]>([newLine()]);
  const [discount, setDiscount] = useState(0);
  const [delivery, setDelivery] = useState(0);
  const [notes, setNotes] = useState('');
  const [quotasCount, setQuotasCount] = useState(0);
  const [frequency, setFrequency] = useState('Mensual');
  const [initialFee, setInitialFee] = useState(0);
  const [quotas, setQuotas] = useState<QuotaEdit[]>([]);
  const [touchedQuotas, setTouchedQuotas] = useState(false);

  useEffect(() => {
    if (!inv) return;
    setCustomer({ id: inv.customer_id, name: inv.customer_name });
    setInvoiceDate(inv.date);
    setMethod(inv.payment_method);
    setLines(inv.lines.map((l) => ({ ...newLine(), item_id: l.item_id, name: l.name, price: Math.round(Number(l.price)), quantity: l.quantity })));
    setDiscount(Number(inv.discount));
    setDelivery(Math.round(Number(inv.delivery_amount)));
    setNotes(inv.notes ?? '');
    setQuotasCount(inv.quotas ?? 0);
    setFrequency(inv.payment_frequency ?? 'Mensual');
    setInitialFee(Math.round(Number(inv.initial_fee)));
    setQuotas(inv.quota_list.filter((q) => q.number > 0).map((q) => ({
      id: q.id, number: q.number, amount: Number(q.amount), payment_date: q.payment_date,
      locked: q.is_paid || Number(q.paid_amount) > 0, paid: Number(q.paid_amount),
    })));
  }, [inv]);

  const credit = method === 'Credito';
  const t = totals(lines, discount, delivery);
  const financed = Math.max(t.subtotal - t.discount - initialFee, 0);
  const sumQuotas = quotas.reduce((s, q) => s + q.amount, 0);

  const save = useMutation({
    mutationFn: () => api(`/invoices/${id}`, {
      method: 'PUT',
      json: {
        customer_id: customer?.id, invoice_date: invoiceDate, payment_method: method,
        lines: lines.filter((l) => l.item_id).map((l) => ({ item_id: l.item_id, quantity: l.quantity, price: l.price })),
        discount_percent: discount, delivery_amount: delivery, notes: notes || null,
        ...(credit ? {
          quotas: quotasCount, payment_frequency: frequency, initial_fee: initialFee,
          // Si cambió el número de cuotas, la API reparte el saldo automáticamente
          quota_edits: touchedQuotas && quotasCount === quotas.length ? quotas.map((q) => ({ id: q.id, amount: q.amount, payment_date: q.payment_date })) : [],
        } : {}),
      },
    }),
    onSuccess: () => {
      toast.success('Factura actualizada.');
      ['invoice', 'invoices', 'quotas', 'items', 'dashboard'].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
      router.push(`/facturas/${id}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (error) return <div className="alert danger">{(error as Error).message}</div>;
  if (!inv) return <Spinner />;
  if (inv.status === 'Anulada') return <div className="alert warning">La factura está anulada y no se puede editar.</div>;

  return (
    <form onSubmit={(e: FormEvent) => { e.preventDefault(); save.mutate(); }}>
      <PageHeader back={{ href: `/facturas/${id}`, label: `Factura #${inv.invoice_number}` }} title={`Editar factura #${inv.invoice_number}`}
        subtitle="Puedes editar todo excepto el consecutivo. El stock se ajusta por la diferencia." />
      <div className="panel">
        <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <Field label="Fecha"><input className="input" type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} /></Field>
          <Field label="Cliente"><CustomerPicker value={customer?.name} onPick={(c) => setCustomer({ id: c.id, name: `${c.name} ${c.lastname}` })} /></Field>
          <Field label="Método de pago" help={credit && quotas.length ? 'Con cuotas registradas no se puede pasar a contado.' : undefined}>
            <select className="select" value={method} onChange={(e) => setMethod(e.target.value)}>
              {['Contado', 'Efectivo', 'Transferencia', 'Tarjeta débito', 'Tarjeta crédito', 'Credito', 'Otro'].map((m) => <option key={m} value={m}>{m === 'Credito' ? 'Crédito' : m}</option>)}
            </select>
          </Field>
        </div>
      </div>

      <LinesEditor lines={lines} onChange={setLines} />

      <div className="grid grid-3-1">
        <div className="panel">
          <div className="form-grid">
            <Field label="Descuento %"><input className="input" type="number" min={0} max={100} step="0.01" value={discount || ''} onChange={(e) => setDiscount(Number(e.target.value))} /></Field>
            <Field label="Domicilio"><div className="input-group"><span className="addon">$</span><input className="input" inputMode="numeric" value={delivery ? delivery.toLocaleString('es-CO') : ''} onChange={(e) => setDelivery(digitsToNumber(e.target.value))} /></div></Field>
            <Field label="Notas" full><input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
          </div>
        </div>
        <TotalsBox t={t} initialFee={credit ? initialFee : undefined} />
      </div>

      {credit ? (
        <div className="panel">
          <h2 className="panel-title"><i className="bi bi-credit-card" /> Cuotas</h2>
          <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: 14 }}>
            <Field label="Número de cuotas" help="Al cambiarlo, el saldo se reparte entre las cuotas sin pagos.">
              <input className="input" type="number" min={quotas.filter((q) => q.locked).length} value={quotasCount} onChange={(e) => setQuotasCount(Number(e.target.value))} />
            </Field>
            <Field label="Periodicidad"><select className="select" value={frequency} onChange={(e) => setFrequency(e.target.value)}><option>Mensual</option><option>Quincenal</option><option>Semanal</option></select></Field>
            <Field label="Cuota inicial"><div className="input-group"><span className="addon">$</span><input className="input" inputMode="numeric" value={initialFee ? initialFee.toLocaleString('es-CO') : ''} onChange={(e) => setInitialFee(digitsToNumber(e.target.value))} /></div></Field>
          </div>
          {quotasCount === quotas.length ? (
            <>
              <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Cuota</th><th>Vencimiento</th><th className="num">Valor</th><th className="num">Abonado</th><th /></tr></thead>
                <tbody>{quotas.map((q, i) => (
                  <tr key={q.id}>
                    <td className="strong">{q.number}</td>
                    <td><input className="input" type="date" value={q.payment_date} disabled={q.locked}
                      onChange={(e) => { setTouchedQuotas(true); setQuotas(quotas.map((x, j) => (j === i ? { ...x, payment_date: e.target.value } : x))); }} /></td>
                    <td className="num"><input className="input" style={{ textAlign: 'right' }} inputMode="decimal" value={q.amount} disabled={q.locked}
                      onChange={(e) => { setTouchedQuotas(true); setQuotas(quotas.map((x, j) => (j === i ? { ...x, amount: Number(e.target.value.replace(',', '.')) || 0 } : x))); }} /></td>
                    <td className="num">{money(q.paid)}</td>
                    <td>{q.locked ? <Badge tone="neutral">Con pagos</Badge> : null}</td>
                  </tr>
                ))}</tbody>
              </table>
              </div>
              <p className="small" style={{ marginTop: 10, color: Math.abs(sumQuotas - financed) < 0.01 ? 'var(--muted)' : 'var(--danger)' }}>
                Las cuotas suman {money(sumQuotas)}; deben sumar exactamente lo financiado: {money(financed)}.
              </p>
            </>
          ) : <div className="alert info"><i className="bi bi-info-circle" /> Se pasará de {quotas.length} a {quotasCount} cuotas y el saldo se repartirá automáticamente.</div>}
        </div>
      ) : null}

      <div className="form-actions">
        <button type="button" className="btn" onClick={() => router.push(`/facturas/${id}`)}>Cancelar</button>
        <button className="btn btn-primary" disabled={save.isPending}>{save.isPending ? <span className="spinner" /> : <i className="bi bi-check-lg" />} Guardar cambios</button>
      </div>
    </form>
  );
}

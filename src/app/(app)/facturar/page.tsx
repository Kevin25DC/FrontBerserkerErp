'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState, type FormEvent } from 'react';
import { CustomerPicker } from '@/components/item-picker';
import { LinesEditor, newLine, totals, TotalsBox, type Line } from '@/components/lines-editor';
import { useToast } from '@/components/providers';
import { Badge, Empty, Field, Modal, PageHeader } from '@/components/ui';
import { api } from '@/lib/api';
import { date, digitsToNumber, money, todayISO } from '@/lib/format';
import type { Customer, InvoiceDetail, Page, Quote, QuoteDetail, TransactionType } from '@/lib/types';

const METHODS = ['Efectivo', 'Transferencia', 'Tarjeta débito', 'Tarjeta crédito', 'Credito', 'Otro'];

function FacturarForm() {
  const router = useRouter();
  const params = useSearchParams();
  const qc = useQueryClient();
  const toast = useToast();
  const { data: types } = useQuery({ queryKey: ['transaction-types'], queryFn: () => api<TransactionType[]>('/transaction-types') });
  const saleTypes = useMemo(() => (types ?? []).filter((t) => !['AFV', 'AFC'].includes(t.prefix ?? '')), [types]);

  const [typeId, setTypeId] = useState<number | ''>('');
  const [invoiceDate, setInvoiceDate] = useState(todayISO());
  const [customer, setCustomer] = useState<{ id: number; name: string } | null>(null);
  const [method, setMethod] = useState('');
  const [lines, setLines] = useState<Line[]>([newLine()]);
  const [discount, setDiscount] = useState(0);
  const [delivery, setDelivery] = useState(0);
  const [notes, setNotes] = useState('');
  const [quotas, setQuotas] = useState(1);
  const [frequency, setFrequency] = useState<'Mensual' | 'Quincenal' | 'Semanal'>('Mensual');
  const [initialFee, setInitialFee] = useState(0);
  const [quote, setQuote] = useState<QuoteDetail | null>(null);
  const [pickQuote, setPickQuote] = useState(false);
  const credit = method === 'Credito';

  useEffect(() => { if (!typeId && saleTypes.length) setTypeId(saleTypes[0].id); }, [saleTypes, typeId]);

  // Llegada desde Cotizaciones → "Facturar" (?quote=ID)
  const preload = params.get('quote');
  // Solo al llegar con ?quote= (loadQuote no cambia nada que deba relanzar el efecto)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (preload) loadQuote(Number(preload)); }, [preload]);

  async function loadQuote(id: number) {
    try {
      const q = await api<QuoteDetail>(`/quotes/${id}`);
      if (q.status !== 'pendiente') return toast.error(`La cotización ${q.code} está ${q.status}.`);
      const usable = q.lines.filter((l) => l.active && l.stock > 0);
      const skipped = q.lines.filter((l) => !(l.active && l.stock > 0)).map((l) => `${l.name} (${l.active ? 'sin stock' : 'inactivo'})`);
      setCustomer({ id: q.customer_id, name: q.customer_name });
      setLines(usable.length ? usable.map((l) => ({ ...newLine(), item_id: l.item_id, name: l.name, price: Math.round(Number(l.price)), quantity: l.quantity, stock: l.stock })) : [newLine()]);
      setDiscount(Number(q.discount));
      setDelivery(Math.round(Number(q.delivery_amount)));
      setQuote(q);
      setPickQuote(false);
      if (q.is_expired) toast.info(`La cotización ${q.code} está vencida: revisa los precios.`);
      if (skipped.length) toast.error(`No se cargaron (no disponibles): ${skipped.join(', ')}`);
      else toast.success(`Cotización ${q.code} cargada.`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  const t = totals(lines, discount, delivery);
  const save = useMutation({
    mutationFn: () => api<InvoiceDetail>('/invoices', {
      json: {
        customer_id: customer?.id, transaction_type_id: typeId, invoice_date: invoiceDate, payment_method: method,
        lines: lines.filter((l) => l.item_id).map((l) => ({ item_id: l.item_id, quantity: l.quantity, price: l.price })),
        discount_percent: discount, delivery_amount: delivery, notes: notes || null,
        ...(credit ? { quotas, payment_frequency: frequency, initial_fee: initialFee } : {}),
        quote_id: quote?.id ?? null,
      },
    }),
    onSuccess: (inv) => {
      toast.success(`Factura #${inv.invoice_number} creada.`);
      ['invoices', 'quotas', 'items', 'dashboard', 'transaction-types', 'quotes'].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
      router.push(`/facturas/${inv.id}?nueva=1`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!customer) return toast.error('Selecciona el cliente.');
    if (!method) return toast.error('Selecciona el método de pago.');
    if (!lines.some((l) => l.item_id)) return toast.error('Agrega al menos un producto.');
    save.mutate();
  }

  const typeLabel = saleTypes.find((x) => x.id === typeId);
  return (
    <form onSubmit={submit}>
      <PageHeader title="Nueva factura" subtitle="Factura de contado o a crédito. Puedes traer una cotización pendiente."
        actions={typeLabel ? <Badge tone="neutral">{typeLabel.name} · {typeLabel.consecutive}</Badge> : null} />

      {quote ? (
        <div className="banner">
          <div>📋 Facturando desde la cotización <strong>{quote.code}</strong>
            <div className="small muted">{quote.customer_name}{quote.valid_until ? ` · válida hasta ${date(quote.valid_until)}` : ''}{quote.is_expired ? ' · VENCIDA' : ''}</div>
          </div>
          <button type="button" className="btn btn-sm" onClick={() => setQuote(null)}>Desvincular</button>
        </div>
      ) : null}

      <div className="panel">
        <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <Field label="Tipo de documento">
            <select className="select" value={typeId} onChange={(e) => setTypeId(Number(e.target.value))}>
              {saleTypes.map((x) => <option key={x.id} value={x.id}>{x.name} — {x.consecutive}</option>)}
            </select>
          </Field>
          <Field label="Fecha"><input className="input" type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} required /></Field>
          <Field label="Cliente"><CustomerPicker value={customer?.name} onPick={(c: Customer) => setCustomer({ id: c.id, name: `${c.name} ${c.lastname}` })} /></Field>
          <Field label="Método de pago">
            <select className="select" value={method} onChange={(e) => setMethod(e.target.value)} required>
              <option value="">Selecciona…</option>{METHODS.map((m) => <option key={m} value={m}>{m === 'Credito' ? 'Crédito' : m}</option>)}
            </select>
          </Field>
        </div>
        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-sm" onClick={() => setPickQuote(true)}><i className="bi bi-file-earmark-text" /> Traer cotización</button>
        </div>
      </div>

      {credit ? (
        <div className="panel" style={{ borderLeft: '4px solid var(--brand)' }}>
          <h2 className="panel-title"><i className="bi bi-credit-card" /> Crédito</h2>
          <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
            <Field label="Número de cuotas"><input className="input" type="number" min={1} value={quotas} onChange={(e) => setQuotas(Math.max(1, Number(e.target.value)))} /></Field>
            <Field label="Periodicidad">
              <select className="select" value={frequency} onChange={(e) => setFrequency(e.target.value as typeof frequency)}>
                <option>Mensual</option><option>Quincenal</option><option>Semanal</option>
              </select>
            </Field>
            <Field label="Cuota inicial">
              <div className="input-group"><span className="addon">$</span><input className="input" inputMode="numeric" value={initialFee ? initialFee.toLocaleString('es-CO') : ''} onChange={(e) => setInitialFee(digitsToNumber(e.target.value))} /></div>
            </Field>
            <Field label="Valor aprox. por cuota"><input className="input" disabled value={money(Math.max(t.subtotal - t.discount - initialFee, 0) / quotas)} /></Field>
          </div>
        </div>
      ) : null}

      <LinesEditor lines={lines} onChange={setLines} onlyInStock />

      <div className="grid grid-3-1">
        <div className="panel">
          <div className="form-grid">
            <Field label="Descuento %"><input className="input" type="number" min={0} max={100} step="0.01" value={discount || ''} onChange={(e) => setDiscount(Number(e.target.value))} /></Field>
            <Field label="Domicilio">
              <div className="input-group"><span className="addon">$</span><input className="input" inputMode="numeric" value={delivery ? delivery.toLocaleString('es-CO') : ''} onChange={(e) => setDelivery(digitsToNumber(e.target.value))} /></div>
            </Field>
            <Field label="Notas" full><input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Asunto u observaciones" /></Field>
          </div>
        </div>
        <TotalsBox t={t} initialFee={credit ? initialFee : undefined} />
      </div>

      <div className="form-actions">
        <button type="button" className="btn" onClick={() => router.push('/facturas')}>Cancelar</button>
        <button className="btn btn-primary" disabled={save.isPending}>{save.isPending ? <span className="spinner" /> : <i className="bi bi-check-lg" />} Guardar factura</button>
      </div>

      {pickQuote ? <QuotePickerModal customerId={customer?.id} onClose={() => setPickQuote(false)} onPick={loadQuote} /> : null}
    </form>
  );
}

function QuotePickerModal({ customerId, onClose, onPick }: { customerId?: number; onClose: () => void; onPick: (id: number) => void }) {
  const [onlyCustomer, setOnlyCustomer] = useState(!!customerId);
  const [q, setQ] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['quotes', 'pending', onlyCustomer ? customerId : null],
    queryFn: () => api<Page<Quote>>('/quotes', { query: { status: 'pendiente', customer_id: onlyCustomer ? customerId : undefined, page_size: 200 } }),
  });
  const rows = (data?.items ?? []).filter((x) => !q || `${x.code} ${x.customer_name} ${x.customer_cedula}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <Modal title="Traer cotización pendiente" onClose={onClose} size="lg">
      <div style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <input className="input" style={{ flex: 1 }} placeholder="Buscar por número, cliente o cédula…" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
        {customerId ? <label className="check"><input type="checkbox" checked={onlyCustomer} onChange={(e) => setOnlyCustomer(e.target.checked)} /> Solo del cliente elegido</label> : null}
      </div>
      <div className="table-wrap">
      <table className="table">
        <thead><tr><th>No.</th><th>Cliente</th><th>Fecha</th><th>Vence</th><th className="num">Total</th><th /></tr></thead>
        <tbody>
          {isLoading ? <tr><td colSpan={6}>Cargando…</td></tr> : rows.length ? rows.map((x) => (
            <tr key={x.id} className="row-click" onClick={() => onPick(x.id)}>
              <td className="strong">{x.code}</td>
              <td>{x.customer_name}<div className="small muted">{x.customer_cedula}</div></td>
              <td>{date(x.quote_date)}</td>
              <td>{date(x.valid_until)} {x.is_expired ? <Badge tone="warning">Vencida</Badge> : null}</td>
              <td className="num money">{money(x.total)}</td>
              <td className="num"><button type="button" className="btn btn-primary btn-sm">Traer</button></td>
            </tr>
          )) : <tr><td colSpan={6}><Empty icon="bi-file-earmark-text">No hay cotizaciones pendientes.</Empty></td></tr>}
        </tbody>
      </table>
      </div>
    </Modal>
  );
}

export default function FacturarPage() {
  return <Suspense><FacturarForm /></Suspense>;
}

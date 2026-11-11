'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { CustomerPicker } from '@/components/item-picker';
import { LinesEditor, newLine, totals, TotalsBox, type Line } from '@/components/lines-editor';
import { useToast } from '@/components/providers';
import { Field } from '@/components/ui';
import { api } from '@/lib/api';
import { digitsToNumber, todayISO } from '@/lib/format';
import type { QuoteDetail } from '@/lib/types';

export function QuoteForm({ quote }: { quote?: QuoteDetail }) {
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();
  const [customer, setCustomer] = useState(quote ? { id: quote.customer_id, name: quote.customer_name } : null);
  const [quoteDate, setQuoteDate] = useState(quote?.quote_date ?? todayISO());
  const [validUntil, setValidUntil] = useState(quote?.valid_until ?? '');
  const [lines, setLines] = useState<Line[]>(quote ? quote.lines.map((l) => ({ ...newLine(), item_id: l.item_id, name: l.name, price: Math.round(Number(l.price)), quantity: l.quantity, stock: l.stock })) : [newLine()]);
  const [discount, setDiscount] = useState(quote ? Number(quote.discount) : 0);
  const [delivery, setDelivery] = useState(quote ? Math.round(Number(quote.delivery_amount)) : 0);
  const [notes, setNotes] = useState(quote?.notes ?? '');

  const save = useMutation({
    mutationFn: () => {
      const body = {
        customer_id: customer?.id, quote_date: quoteDate, valid_until: validUntil || null, discount_percent: discount, delivery_amount: delivery,
        notes: notes || null, lines: lines.filter((l) => l.item_id).map((l) => ({ item_id: l.item_id, quantity: l.quantity, price: l.price })),
      };
      return quote ? api<QuoteDetail>(`/quotes/${quote.id}`, { method: 'PUT', json: body }) : api<QuoteDetail>('/quotes', { json: body });
    },
    onSuccess: (q) => { toast.success(`Cotización ${q.code} guardada.`); qc.invalidateQueries({ queryKey: ['quotes'] }); router.push(`/cotizaciones/${q.id}`); },
    onError: (e: Error) => toast.error(e.message),
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!customer) return toast.error('Selecciona el cliente.');
    if (!lines.some((l) => l.item_id)) return toast.error('Agrega al menos un producto.');
    save.mutate();
  }

  return (
    <form onSubmit={submit}>
      <div className="panel">
        <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          <Field label="Cliente"><CustomerPicker value={customer?.name} onPick={(c) => setCustomer({ id: c.id, name: `${c.name} ${c.lastname}` })} /></Field>
          <Field label="Fecha"><input className="input" type="date" value={quoteDate} onChange={(e) => setQuoteDate(e.target.value)} required /></Field>
          <Field label="Válida hasta" help={quote ? undefined : 'Vacío = 15 días'}><input className="input" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} /></Field>
        </div>
      </div>
      <LinesEditor lines={lines} onChange={setLines} />
      <div className="grid grid-3-1">
        <div className="panel">
          <div className="form-grid">
            <Field label="Descuento %"><input className="input" type="number" min={0} max={100} step="0.01" value={discount || ''} onChange={(e) => setDiscount(Number(e.target.value))} /></Field>
            <Field label="Domicilio"><div className="input-group"><span className="addon">$</span><input className="input" inputMode="numeric" value={delivery ? delivery.toLocaleString('es-CO') : ''} onChange={(e) => setDelivery(digitsToNumber(e.target.value))} /></div></Field>
            <Field label="Observaciones" full><textarea className="textarea" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Condiciones, tiempos de entrega, etc." /></Field>
          </div>
        </div>
        <TotalsBox t={totals(lines, discount, delivery)} />
      </div>
      <div className="form-actions">
        <button type="button" className="btn" onClick={() => router.push('/cotizaciones')}>Cancelar</button>
        <button className="btn btn-primary" disabled={save.isPending}>{save.isPending ? <span className="spinner" /> : <i className="bi bi-check-lg" />} Guardar cotización</button>
      </div>
    </form>
  );
}

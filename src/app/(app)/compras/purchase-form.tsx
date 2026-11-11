'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { PurchaseLinesEditor, PurchaseTotalsBox, newPurchaseLine, purchaseTotals, type PurchaseLineDraft } from '@/components/purchase-lines-editor';
import { useToast } from '@/components/providers';
import { SupplierPicker } from '@/components/supplier-picker';
import { Field, PageHeader } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { todayISO } from '@/lib/format';
import type { PurchaseDetail, Supplier, Tax } from '@/lib/types';

const METHODS = ['Contado', 'Transferencia', 'Crédito', 'Tarjeta', 'Otro'];
const DOC_TYPES = ['Factura', 'Remisión', 'Otro'];

export function PurchaseForm({ purchase }: { purchase?: PurchaseDetail }) {
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();
  const { data: taxes } = useQuery({ queryKey: ['taxes'], queryFn: () => api<Tax[]>('/taxes') });

  const [supplier, setSupplier] = useState<{ id: number; name: string } | null>(
    purchase ? { id: purchase.supplier.id, name: purchase.supplier.name } : null,
  );
  const [date, setDate] = useState(purchase?.date ?? todayISO());
  const [documentType, setDocumentType] = useState(purchase?.document_type ?? 'Factura');
  const [supplierDocument, setSupplierDocument] = useState(purchase?.supplier_document ?? '');
  const [paymentMethod, setPaymentMethod] = useState(purchase?.payment_method ?? 'Contado');
  const [paymentTerms, setPaymentTerms] = useState(purchase?.payment_terms ?? '');
  const [dueDate, setDueDate] = useState(purchase?.due_date ?? '');
  const [notes, setNotes] = useState(purchase?.notes ?? '');
  const [lines, setLines] = useState<PurchaseLineDraft[]>(
    purchase
      ? purchase.lines.map((l) => ({
          key: Math.random().toString(36).slice(2), item_id: l.item_id, name: l.name, quantity: l.quantity,
          unit_cost: Math.round(Number(l.unit_cost)), discount_pct: Number(l.discount_pct), tax_id: l.tax_id,
        }))
      : [newPurchaseLine()],
  );
  const totals = purchaseTotals(lines, taxes ?? []);

  const save = useMutation({
    mutationFn: (confirm: boolean) => {
      const body = {
        supplier_id: supplier?.id,
        date,
        document_type: documentType,
        supplier_document: supplierDocument || null,
        payment_method: paymentMethod,
        payment_terms: paymentTerms || null,
        due_date: dueDate || null,
        notes: notes || null,
        confirm,
        lines: lines
          .filter((l): l is PurchaseLineDraft & { item_id: number } => l.item_id !== null)
          .map((l) => ({
            item_id: l.item_id, quantity: l.quantity, unit_cost: l.unit_cost, discount_pct: l.discount_pct, tax_id: l.tax_id,
          })),
      };
      return purchase
        ? api<PurchaseDetail>(`/purchases/${purchase.id}`, { method: 'PUT', json: body })
        : api<PurchaseDetail>('/purchases', { json: body });
    },
    onSuccess: (p) => {
      toast.success(`Compra ${p.code} ${p.status === 'confirmada' ? 'confirmada' : 'guardada'}.`);
      ['purchases', 'purchase', 'items', 'adjustments', 'dashboard'].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
      router.push(`/compras/${p.id}`);
    },
    onError: (e: Error) => toast.error(e instanceof ApiError ? e.message : 'No se pudo guardar la compra.'),
  });

  function submit(e: { preventDefault: () => void }, confirm: boolean) {
    e.preventDefault();
    if (!supplier) return toast.error('Selecciona un proveedor.');
    if (!lines.some((l) => l.item_id)) return toast.error('Agrega al menos un producto.');
    save.mutate(confirm);
  }

  return (
    <form onSubmit={(e) => submit(e, false)}>
      <PageHeader back={{ href: '/compras', label: 'Compras' }}
        title={purchase ? `Editar ${purchase.code}` : 'Nueva compra'}
        subtitle="Al confirmar, la compra entra al inventario y actualiza el costo promedio." />

      <div className="panel">
        <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <Field label="Proveedor *">
            <SupplierPicker value={supplier?.name} onPick={(s: Supplier) => setSupplier({ id: s.id, name: s.name })} />
          </Field>
          <Field label="Fecha"><input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} required /></Field>
          <Field label="Tipo de documento">
            <select className="select" value={documentType} onChange={(e) => setDocumentType(e.target.value)}>
              {DOC_TYPES.map((d) => <option key={d}>{d}</option>)}
            </select>
          </Field>
          <Field label="No. documento del proveedor">
            <input className="input" value={supplierDocument} onChange={(e) => setSupplierDocument(e.target.value)} placeholder="Factura o remisión" />
          </Field>
          <Field label="Forma de pago">
            <select className="select" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              {METHODS.map((m) => <option key={m}>{m}</option>)}
            </select>
          </Field>
          <Field label="Condiciones">
            <input className="input" value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} placeholder="Ej. 30 días" />
          </Field>
          <Field label="Vencimiento">
            <input className="input" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </Field>
        </div>
      </div>

      <PurchaseLinesEditor lines={lines} onChange={setLines} taxes={taxes ?? []} />

      <div className="grid grid-3-1">
        <div className="panel">
          <Field label="Notas">
            <textarea className="textarea" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observaciones de la compra" />
          </Field>
        </div>
        <PurchaseTotalsBox totals={totals} />
      </div>

      <div className="form-actions">
        <button type="button" className="btn" onClick={() => router.push('/compras')}>Cancelar</button>
        <button type="submit" className="btn" disabled={save.isPending}>
          {save.isPending ? <span className="spinner" /> : <i className="bi bi-save" />} Guardar borrador
        </button>
        <button type="button" className="btn btn-primary" disabled={save.isPending}
          onClick={(e) => submit(e, true)}>
          {save.isPending ? <span className="spinner" /> : <i className="bi bi-check-lg" />} Guardar y confirmar
        </button>
      </div>
    </form>
  );
}

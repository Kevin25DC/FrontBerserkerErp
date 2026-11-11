'use client';

import { ItemPicker } from '@/components/item-picker';
import { digitsToNumber, money } from '@/lib/format';
import type { Tax } from '@/lib/types';

export type PurchaseLineDraft = {
  key: string; item_id: number | null; name: string;
  quantity: number; unit_cost: number; discount_pct: number; tax_id: number | null;
};

export const newPurchaseLine = (): PurchaseLineDraft => ({
  key: Math.random().toString(36).slice(2), item_id: null, name: '', quantity: 1, unit_cost: 0, discount_pct: 0, tax_id: null,
});

export function lineTotals(line: PurchaseLineDraft, taxes: Tax[]) {
  const rate = Number(taxes.find((t) => t.id === line.tax_id)?.rate ?? 0);
  const gross = line.item_id ? line.unit_cost * line.quantity : 0;
  const discount = gross * (line.discount_pct || 0) / 100;
  const subtotal = gross - discount;
  const tax = subtotal * rate / 100;
  return { gross, discount, subtotal, tax, total: subtotal + tax };
}

export function purchaseTotals(lines: PurchaseLineDraft[], taxes: Tax[]) {
  return lines.reduce(
    (acc, line) => {
      const t = lineTotals(line, taxes);
      return { subtotal: acc.subtotal + t.gross, discount: acc.discount + t.discount, tax: acc.tax + t.tax, total: acc.total + t.total };
    },
    { subtotal: 0, discount: 0, tax: 0, total: 0 },
  );
}

export function PurchaseLinesEditor({ lines, onChange, taxes }: {
  lines: PurchaseLineDraft[]; onChange: (lines: PurchaseLineDraft[]) => void; taxes: Tax[];
}) {
  const update = (key: string, patch: Partial<PurchaseLineDraft>) =>
    onChange(lines.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  return (
    <div className="panel flush">
      <div className="table-wrap" style={{ overflow: 'visible' }}>
        <table className="table lines-table">
          <thead>
            <tr><th style={{ width: '28%' }}>Producto</th><th>Cant.</th><th>Costo unit.</th><th>Desc. %</th><th>IVA</th><th className="num">Subtotal</th><th className="num">Total</th><th /></tr>
          </thead>
          <tbody>
            {lines.map((l) => {
              const t = lineTotals(l, taxes);
              return (
                <tr key={l.key}>
                  <td className="product">
                    <ItemPicker value={l.name}
                      onPick={(it) => update(l.key, {
                        item_id: it.id, name: it.name, unit_cost: Math.round(Number(it.cost)), tax_id: it.tax_id ?? l.tax_id,
                      })} />
                  </td>
                  <td className="qty" data-label="Cantidad">
                    <input className="input" type="number" min={1} value={l.quantity}
                      onChange={(e) => update(l.key, { quantity: Math.max(1, Number(e.target.value) || 1) })} />
                  </td>
                  <td className="cost" data-label="Costo unit.">
                    <div className="input-group"><span className="addon">$</span>
                      <input className="input" inputMode="numeric" value={l.unit_cost ? l.unit_cost.toLocaleString('es-CO') : ''}
                        onChange={(e) => update(l.key, { unit_cost: digitsToNumber(e.target.value) })} /></div>
                  </td>
                  <td className="discount" data-label="Descuento %">
                    <input className="input" type="number" min={0} max={100} step="0.01" value={l.discount_pct || ''}
                      onChange={(e) => update(l.key, { discount_pct: Number(e.target.value) || 0 })} />
                  </td>
                  <td className="tax" data-label="IVA">
                    <select className="select" value={l.tax_id ?? ''}
                      onChange={(e) => update(l.key, { tax_id: e.target.value ? Number(e.target.value) : null })}>
                      <option value="">—</option>
                      {taxes.map((tax) => <option key={tax.id} value={tax.id}>{tax.name}</option>)}
                    </select>
                  </td>
                  <td className="num subtotal" data-label="Subtotal">{money(t.subtotal)}</td>
                  <td className="num money line-total" data-label="Total">{money(t.total)}</td>
                  <td className="num actions">
                    <button type="button" className="btn btn-icon" title="Quitar"
                      onClick={() => onChange(lines.length > 1 ? lines.filter((x) => x.key !== l.key) : [newPurchaseLine()])}>
                      <i className="bi bi-x-lg" /> Quitar
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)' }}>
        <button type="button" className="btn btn-sm" onClick={() => onChange([...lines, newPurchaseLine()])}>
          <i className="bi bi-plus-lg" /> Agregar renglón
        </button>
      </div>
    </div>
  );
}

export function PurchaseTotalsBox({ totals }: { totals: ReturnType<typeof purchaseTotals> }) {
  const row = { display: 'flex', justifyContent: 'space-between', padding: '6px 0' } as const;
  return (
    <div className="panel">
      <div style={row}><span className="muted">Subtotal</span><span className="money">{money(totals.subtotal)}</span></div>
      {totals.discount ? <div style={row}><span className="muted">Descuento</span><span className="money" style={{ color: 'var(--danger)' }}>-{money(totals.discount)}</span></div> : null}
      {totals.tax ? <div style={row}><span className="muted">IVA</span><span className="money">{money(totals.tax)}</span></div> : null}
      <div style={{ ...row, borderTop: '1px solid var(--border)', marginTop: 6, paddingTop: 10, fontSize: 17 }}><strong>Total</strong><strong className="money">{money(totals.total)}</strong></div>
    </div>
  );
}

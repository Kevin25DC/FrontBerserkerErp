'use client';

import { ItemPicker } from '@/components/item-picker';
import { digitsToNumber, money } from '@/lib/format';

export type Line = { key: string; item_id: number | null; name: string; price: number; quantity: number; stock?: number };

export const newLine = (): Line => ({ key: Math.random().toString(36).slice(2), item_id: null, name: '', price: 0, quantity: 1 });

/** Misma regla de la API: descuento % solo sobre productos; el domicilio se suma aparte. */
export function totals(lines: Line[], discountPercent: number, delivery: number) {
  const subtotal = lines.reduce((s, l) => s + (l.item_id ? l.price * l.quantity : 0), 0);
  const discount = subtotal * (discountPercent || 0) / 100;
  return { subtotal, discount, delivery, total: subtotal - discount + (delivery || 0) };
}

export function LinesEditor({ lines, onChange, onlyInStock = false }: { lines: Line[]; onChange: (l: Line[]) => void; onlyInStock?: boolean }) {
  const update = (key: string, patch: Partial<Line>) => onChange(lines.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  return (
    <div className="panel flush">
      <div className="table-wrap" style={{ overflow: 'visible' }}>
        <table className="table lines-table">
          <thead>
            <tr><th style={{ width: '45%' }}>Producto</th><th style={{ width: '18%' }}>Precio</th><th style={{ width: '12%' }}>Cant.</th><th className="num">Total</th><th /></tr>
          </thead>
          <tbody>
            {lines.map((l) => (
              <tr key={l.key}>
                <td className="product">
                  <ItemPicker value={l.name} onlyInStock={onlyInStock}
                    onPick={(it) => update(l.key, { item_id: it.id, name: it.name, price: Math.round(Number(it.price)), stock: it.stock })} />
                  {l.item_id && l.stock !== undefined && l.quantity > l.stock ? (
                    <div className="small" style={{ color: 'var(--warning)', marginTop: 4 }}>Stock actual: {l.stock} · no alcanza</div>
                  ) : null}
                </td>
                <td className="price" data-label="Precio"><div className="input-group"><span className="addon">$</span>
                  <input className="input" inputMode="numeric" value={l.price ? l.price.toLocaleString('es-CO') : ''} onChange={(e) => update(l.key, { price: digitsToNumber(e.target.value) })} /></div></td>
                <td className="qty" data-label="Cantidad"><input className="input" type="number" min={1} value={l.quantity} onChange={(e) => update(l.key, { quantity: Math.max(1, Number(e.target.value) || 1) })} /></td>
                <td className="num money row-total" data-label="Total">{money(l.price * l.quantity)}</td>
                <td className="num actions">
                  <button type="button" className="btn btn-icon" title="Quitar" aria-label="Quitar renglón"
                    onClick={() => onChange(lines.length > 1 ? lines.filter((x) => x.key !== l.key) : [newLine()])}><i className="bi bi-x-lg" /> Quitar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)' }}>
        <button type="button" className="btn btn-sm" onClick={() => onChange([...lines, newLine()])}><i className="bi bi-plus-lg" /> Agregar renglón</button>
      </div>
    </div>
  );
}

export function TotalsBox({ t, initialFee }: { t: ReturnType<typeof totals>; initialFee?: number }) {
  const row = { display: 'flex', justifyContent: 'space-between', padding: '6px 0' } as const;
  return (
    <div className="panel">
      <div style={row}><span className="muted">Subtotal</span><span className="money">{money(t.subtotal)}</span></div>
      {t.discount ? <div style={row}><span className="muted">Descuento</span><span className="money" style={{ color: 'var(--danger)' }}>-{money(t.discount)}</span></div> : null}
      {t.delivery ? <div style={row}><span className="muted">Domicilio</span><span className="money">{money(t.delivery)}</span></div> : null}
      <div style={{ ...row, borderTop: '1px solid var(--border)', marginTop: 6, paddingTop: 10, fontSize: 17 }}><strong>Total</strong><strong className="money">{money(t.total)}</strong></div>
      {initialFee ? (
        <div style={{ ...row, color: 'var(--muted)' }}><span>Financiado (sin cuota inicial ni domicilio)</span><span className="money">{money(Math.max(t.subtotal - t.discount - initialFee, 0))}</span></div>
      ) : null}
    </div>
  );
}

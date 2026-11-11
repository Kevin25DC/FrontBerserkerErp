import { idFull, idNumber } from '@/lib/identification';
/**
 * Plantillas PDF portadas LITERALMENTE del sistema actual (VisualPos/templates):
 *   invoice-cash   ← Invoice/receipt_pdf.html
 *   invoice-credit ← Invoice/receipt_credit_pdf.html
 *   invoice-cancel ← Invoice/receipt_pdf_cancel.html
 *   quota-receipt  ← PaymentQuota/Receipt_ticket.html
 *   quota-reversal ← PaymentQuota/Receipt_ticket_cancel.html
 *   quote          ← quote/quote_pdf.html
 * El CSS de cada una es copia exacta (archivos *.css.ts). El marcado conserva las mismas
 * etiquetas, clases y textos; solo cambian las etiquetas de Django por los datos de la API.
 * Diferencias deliberadas: el descuento muestra su valor real (Django imprimía el % como
 * dinero) y las horas van en hora de Colombia (Django las imprimía en UTC).
 */
import type { InvoiceDetail, PurchaseDetail, Quota, QuoteDetail } from '@/lib/types';
import cashCss from './invoice-cash.css';
import cancelCss from './invoice-cancel.css';
import creditCss from './invoice-credit.css';
import purchaseCss from './purchase.css';
import quoteCss from './quote.css';
import receiptCss from './quota-receipt.css';
import reversalCss from './quota-reversal.css';

export type Assets = { logo: string; firma: string };
export type Rendered = { css: string; body: string };

// ---------------------------------------------------------------- equivalentes de filtros Django
const esc = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

/** {{ x|intcomma }} sobre un Decimal de 2 decimales → "170,000.00" (locale en-us del sistema). */
export function intcomma(v: string | number | null | undefined, decimals = 2) {
  return Number(v ?? 0).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
const ap = ['Jan.', 'Feb.', 'March', 'April', 'May', 'June', 'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.'];
/** {{ fecha }} con DATE_FORMAT por defecto de Django en-us ('N j, Y') → "Nov. 10, 2026". */
export function djDate(iso: string | null | undefined) {
  if (!iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return `${ap[m - 1]} ${d}, ${y}`;
}
const TZ = 'America/Bogota';
/** |date:"d/m/Y H:i" en hora de Colombia. */
export function dmyHm(iso: string | Date | null | undefined) {
  if (!iso) return '-';
  const dt = typeof iso === 'string' ? new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(iso) ? iso : `${iso}Z`) : iso;
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
    .formatToParts(dt).map((x) => [x.type, x.value]));
  return `${p.day}/${p.month}/${p.year} ${p.hour}:${p.minute}`;
}
const nowDmy = () => dmyHm(new Date()).split(' ');

// ---------------------------------------------------------------- piezas comunes de factura
const shapes = (extra = '') => `
    <div class="decorative-shapes${extra}">
      <div class="hex-top-right"></div>
      <div class="hex-small-top"></div>
      <div class="circle-top-left"></div>
      <div class="hex-bottom-right"></div>
      <div class="hex-medium-bottom"></div>
      <div class="hex-small-bottom-left"></div>
    </div>`;

const nitLine = (inv: InvoiceDetail) =>
  `<p class="company-nit" style="font-size:12px;color:#455a64;font-weight:600;margin-top:4px;">${esc(inv.company_name)} &middot; NIT ${esc(inv.company_nit)}</p>`;

const customerName = (inv: InvoiceDetail) => `${inv.customer.name} ${inv.customer.lastname}`.trim();
/** 'NIT 900123456-7' / 'C.C. 1045737528' (vacío si el cliente no tiene número). */
const customerId = (inv: InvoiceDetail) => idFull(inv.customer.id_type, inv.customer.cedula);

function topInfo(inv: InvoiceDetail, second: { label: string; value: string }) {
  const delivery = Number(inv.delivery_amount) > 1
    ? `<h3 style="margin-top: 15px;">Domicilio</h3>\n          <p class="highlight">$${intcomma(inv.delivery_amount)}</p>` : '';
  return `
      <div class="top-info-grid">
        <div class="info-block">
          <h3>Fecha de Factura</h3>
          <p class="highlight">${esc(djDate(inv.date))}</p>
          <h3 style="margin-top: 15px;">${second.label}</h3>
          <p>${esc(second.value)}</p>
        </div>
        <div class="info-block">
          <h3>Dirección:</h3>
          <p>Barranquilla, Colombia</p>
          ${delivery}
        </div>
        <div class="info-block">
          <h3>Teléfono:</h3>
          <p>${esc(inv.customer.phone || '+57 3005034055')}</p>
          <h3 style="margin-top: 15px;">Email:</h3>
          <p>${esc(inv.customer.email || 'info@celuproco.com.co')}</p>
        </div>
      </div>`;
}

function clientBox(inv: InvoiceDetail, label: string, amount: string | number | null) {
  return `
      <div class="client-total-section">
        <div class="client-info">
          <h3>Factura Para:</h3>
          <div class="client-name">${esc(customerName(inv))}</div>
          <p>${esc(customerId(inv))}</p>
          ${inv.customer.email ? `<p>${esc(inv.customer.email)}</p>` : ''}
          ${inv.customer.phone ? `<p>${esc(inv.customer.phone)}</p>` : ''}
        </div>
        <div class="total-due-box">
          <div class="total-due-label">${label}</div>
          <div class="total-due-amount">$${intcomma(amount)}</div>
        </div>
      </div>`;
}

function itemsTable(inv: InvoiceDetail) {
  const rows = inv.lines.map((l) => `
          <tr>
            <td>
              ${esc(l.name)}
              <span class="item-description">Producto de alta calidad</span>
            </td>
            <td>${l.quantity}</td>
            <td>$${intcomma(l.price)}</td>
            <td>0%</td>
            <td>$${intcomma(l.subtotal)}</td>
          </tr>`).join('');
  return `
      <table class="items-table">
        <thead>
          <tr>
            <th>DESCRIPCIÓN</th>
            <th>CANT.</th>
            <th>PRECIO</th>
            <th>DESC.</th>
            <th>TOTAL</th>
          </tr>
        </thead>
        <tbody>${rows}
        </tbody>
      </table>`;
}

const signature = (a: Assets) => `
        <div class="thank-you-section">
          <p>Gracias por tu compra</p>
          <div class="signature-area">
            <div class="signature-line">
                <img src="${a.firma}" alt="Firma">
            </div>
            <div class="signature-name">GERENTE GENERAL</div>
            <div class="signature-title">Gerente</div>
          </div>
        </div>`;

function discountRow(inv: InvoiceDetail) {
  const pct = Number(inv.discount);
  if (!pct) return '';
  const amount = Number(inv.subtotal) * pct / 100;
  return `
          <div class="total-row">
            <span class="label">Descuento (-${intcomma(inv.discount)}%)</span>
            <span class="value">-$${intcomma(amount)}</span>
          </div>`;
}

const header = (inv: InvoiceDetail, a: Assets, title: string, numberLine: string, badge = '') => `
    <div class="invoice-header">
      <div class="company-section">
        <div class="company-logo">
          <img src="${a.logo}" width="1890" height="945" alt="CELUPRO CO Logo">
        </div>
      </div>
      <div class="invoice-title">
        <h2>${title}</h2>
        <p class="invoice-number">${numberLine}</p>
        ${nitLine(inv)}
        ${badge}
      </div>
    </div>`;

// ---------------------------------------------------------------- factura de contado
export function invoiceCash(inv: InvoiceDetail, a: Assets): Rendered {
  const delivery = Number(inv.delivery_amount) > 1 ? `
          <div class="total-row">
            <span class="label">Domicilio</span>
            <span class="value">$${intcomma(inv.delivery_amount)}</span>
          </div>` : '';
  const body = `
  <div class="invoice-wrapper">${shapes()}
${header(inv, a, 'FACTURA', `NO. # ${inv.invoice_number}`)}
    <div class="invoice-body">${topInfo(inv, { label: 'Método de Pago', value: inv.payment_method })}${clientBox(inv, 'Total a Pagar', inv.total)}${itemsTable(inv)}
      <div class="totals-area">${signature(a)}
        <div class="totals-box">
          <div class="total-row">
            <span class="label">Subtotal</span>
            <span class="value">$${intcomma(inv.subtotal)}</span>
          </div>${discountRow(inv)}${delivery}
          <div class="total-row grand-total">
            <span class="label">Total a Pagar</span>
            <span class="value">$${intcomma(inv.total)}</span>
          </div>
        </div>
      </div>
    </div>
    <div class="invoice-footer">
      <h3 class="footer-title">Términos y Condiciones:</h3>
      <p class="footer-content">
        Esta factura corresponde a una venta de contado. Todos los productos tienen garantía según las políticas de CELUPRO CO.
        Para cualquier consulta o soporte técnico, comuníquese al +57 3005034055 o visite nuestro sitio web https://celuproco.com.co/
        Gracias por confiar en nosotros.
      </p>
    </div>
  </div>`;
  return { css: cashCss, body };
}

// ---------------------------------------------------------------- factura a crédito (+ plan de pagos)
export function invoiceCredit(inv: InvoiceDetail, a: Assets): Rendered {
  const quotaValue = inv.quota_value_is_range ? '' : `$${intcomma(inv.quota_value_min ?? inv.quota_value)}`;
  const initial = Number(inv.initial_fee) > 1;
  const quotas: Quota[] = [...inv.quota_list].sort((x, y) => x.id - y.id); // mismo orden que Django (.all())
  const paidCount = quotas.filter((q) => q.is_paid).length;
  const page1 = `
<div class="invoice-wrapper">${shapes()}
<div class="credit-ribbon">CRÉDITO</div>
${header(inv, a, 'FACTURA', `NO. # ${inv.invoice_number}`, '<span class="credit-badge">A CRÉDITO</span>')}
<div class="invoice-body">${topInfo(inv, { label: 'Estado', value: inv.status })}${clientBox(inv, 'Total a Financiar', inv.total_financed)}
<div class="credit-info-box">
<div class="credit-info-title">
📋 Información del Crédito
</div>
<div class="credit-info-grid">
<div class="credit-info-item">
<div class="credit-info-label">Número de Cuotas</div>
<div class="credit-info-value">${inv.quotas ?? ''} cuotas</div>
</div>
<div class="credit-info-item">
<div class="credit-info-label">Valor por Cuota</div>
<div class="credit-info-value">
${quotaValue}
</div>
</div>
<div class="credit-info-item">
<div class="credit-info-label">Frecuencia de Pago</div>
<div class="credit-info-value">${esc(inv.payment_frequency ?? '')}</div>
</div>
${initial ? `<div class="credit-info-item">
<div class="credit-info-label">Cuota Inicial Pagada</div>
<div class="credit-info-value">$${intcomma(inv.initial_fee)}</div>
</div>` : ''}
</div>
</div>${itemsTable(inv)}
<div class="totals-area">${signature(a)}
<div class="totals-box">
<div class="total-row">
<span class="label">Subtotal</span>
<span class="value">$${intcomma(inv.subtotal)}</span>
</div>${discountRow(inv)}
${Number(inv.delivery_amount) > 1 ? `<div class="total-row">
<span class="label">Domicilio (Pagado)</span>
<span class="value">$${intcomma(inv.delivery_amount)}</span>
</div>` : ''}
${initial ? `<div class="total-row deduction">
<span class="label">Cuota Inicial (Pagada)</span>
<span class="value">-$${intcomma(inv.initial_fee)}</span>
</div>` : ''}
<div class="total-row grand-total">
<span class="label">Total a Financiar</span>
<span class="value">$${intcomma(inv.total_financed)}</span>
</div>
</div>
</div>
</div>
<div class="invoice-footer">
<div class="footer-section">
<h4>💳 Información de Crédito</h4>
${inv.quota_value_is_range ? `<p><strong>${inv.quotas} cuotas</strong></p>` : `<p><strong>${inv.quotas} cuotas de ${quotaValue}</strong></p>`}
<p>Frecuencia: ${esc(inv.payment_frequency ?? '')}</p>
<p>Soporte: <strong>+57 3005034055</strong></p>
</div>
<div class="footer-section">
<h4>📋 Términos y Condiciones</h4>
<p>El pago debe realizarse en las fechas indicadas.</p>
<p>Mora aplica después de 5 días de retraso.</p>
<p>https://celuproco.com.co/</p>
</div>
</div>
</div>`;

  const rows = quotas.map((q) => `
<tr class="${q.is_paid ? 'paid' : 'pending'}">
<td>
${q.number === 0 ? '<strong>⭐ Cuota Inicial</strong>' : `Cuota ${q.number}`}
</td>
<td>${djDate(q.payment_date)}</td>
<td style="text-align: right; font-weight: 700;">$${intcomma(q.amount)}</td>
<td style="text-align: center;">
${q.is_paid ? '<span class="status-badge paid">✓ Pagada</span>' : '<span class="status-badge pending">⏳ Pendiente</span>'}
</td>
</tr>`).join('');

  const page2 = quotas.length ? `
<div class="payment-plan-page">${shapes(' decorative-shapes-blue')}
<div class="credit-ribbon credit-ribbon-blue">PLAN DE PAGOS</div>
${header(inv, a, 'PLAN DE PAGOS', `FACTURA NO. # ${inv.invoice_number}`, '<span class="credit-badge credit-badge-blue">A CRÉDITO</span>')}
<div class="payment-plan-content">
<div class="payment-plan-header">
<h1>📅 Cronograma de Pagos</h1>
<p>Cliente: <strong>${esc(customerName(inv))}</strong> | Factura: <strong>#${inv.invoice_number}</strong></p>
</div>
<div class="payment-summary-cards">
<div class="summary-card">
<div class="summary-card-label">Total a Financiar</div>
<div class="summary-card-value">$${intcomma(inv.total_financed)}</div>
</div>
<div class="summary-card">
<div class="summary-card-label">Número de Cuotas</div>
<div class="summary-card-value">${inv.quotas ?? ''}</div>
<div class="summary-card-subtext">Frecuencia: ${esc(inv.payment_frequency ?? '')}</div>
</div>
<div class="summary-card">
<div class="summary-card-label">Valor por Cuota</div>
<div class="summary-card-value">
${quotaValue}
</div>
</div>
<div class="summary-card">
<div class="summary-card-label">Cuotas Pagadas</div>
<div class="summary-card-value">${paidCount}</div>
<div class="summary-card-subtext">de ${quotas.length} cuotas</div>
</div>
</div>
<div class="payment-plan-section">
<div class="payment-plan-title">
📊 Detalle de Cuotas
</div>
<table class="payment-plan-table">
<thead>
<tr>
<th>CUOTA</th>
<th>FECHA DE PAGO</th>
<th style="text-align: right;">MONTO</th>
<th style="text-align: center;">ESTADO</th>
</tr>
</thead>
<tbody>${rows}
</tbody>
</table>
</div>
</div>
<div class="invoice-footer">
<div class="footer-section">
<h4>💳 Información de Contacto</h4>
<p><strong>CELUPRO CO</strong></p>
<p>Teléfono: <strong>+57 3005034055</strong></p>
<p>Email: <strong>info@celuproco.com.co</strong></p>
<p>Web: <strong>https://celuproco.com.co/</strong></p>
</div>
<div class="footer-section">
<h4>⚠️ Recordatorio Importante</h4>
<p>Por favor realice sus pagos en las fechas indicadas.</p>
<p>Mora aplica después de 5 días de retraso.</p>
<p>Para cualquier consulta, contáctenos.</p>
</div>
</div>
</div>` : '';
  return { css: creditCss, body: page1 + page2 };
}

// ---------------------------------------------------------------- comprobante de anulación de factura
export function invoiceCancel(inv: InvoiceDetail, a: Assets): Rendered {
  const items = inv.lines.length ? inv.lines.map((l) => `
<tr>
<td>${l.item_id}</td>
<td>
<div style="font-weight: 800; color: #111827;">${esc(l.name)}</div>
${l.reference ? `<div style="font-size: 11px; color: #6b7280;">Ref: ${esc(l.reference)}</div>` : ''}
</td>
<td class="right">${l.quantity}</td>
<td class="right">$${intcomma(l.price)}</td>
<td class="right">$${intcomma(l.subtotal)}</td>
</tr>`).join('') : '<tr>\n<td colspan="5" style="text-align:center; padding: 18px; color:#6b7280;">Sin ítems registrados</td>\n</tr>';
  const body = `
<div class="receipt-wrapper">
<div class="decorative-shapes">
<div class="hex-top-right"></div>
<div class="circle-top-left"></div>
<div class="hex-bottom-right"></div>
</div>
<div class="cancel-ribbon">ANULACIÓN</div>
<div class="receipt-header">
<div class="company-logo">
<img src="${a.logo}" alt="CELUPRO CO Logo">
</div>
<div class="title-box">
<h2>COMPROBANTE DE ANULACIÓN</h2>
<div class="subtitle">${esc(inv.company_name)} &middot; NIT ${esc(inv.company_nit)}</div>
<div class="subtitle">
Factura original No. <strong>#${inv.invoice_number}</strong>
</div>
<div class="cancel-number">${inv.cancel_number ? `No. Anulación: ${esc(inv.cancel_number)}` : 'Anulación'}</div>
</div>
</div>
<div class="receipt-body">
<div class="info-grid">
<div class="info-card">
<h3>Cliente</h3>
<p>${esc(customerName(inv))}</p>
${customerId(inv) ? `<p>${esc(customerId(inv))}</p>` : ''}
</div>
<div class="info-card">
<h3>Fecha Factura</h3>
<p>${esc(inv.created_at ? dmyHm(inv.created_at) : djDate(inv.date))}</p>
</div>
<div class="info-card">
<h3>Fecha Anulación</h3>
<p>${esc(dmyHm(inv.canceled_at))}</p>
</div>
<div class="info-card">
<h3>Método de Pago</h3>
<p>${esc(inv.payment_method)}</p>
</div>
<div class="info-card">
<h3>Estado</h3>
<p>${esc(inv.status)}</p>
</div>
<div class="info-card">
<h3>Responsable</h3>
<p>${esc(inv.canceled_by ?? '-')}</p>
</div>
</div>
<div class="reason-box">
<div class="label">Motivo de anulación</div>
<div class="value">
${esc(inv.cancel_reason || 'Sin motivo registrado.')}
</div>
</div>
<table class="items-table">
<thead>
<tr>
<th style="width: 70px;">Código</th>
<th>Descripción</th>
<th class="right" style="width: 80px;">Cant.</th>
<th class="right" style="width: 120px;">Precio</th>
<th class="right" style="width: 130px;">Subtotal</th>
</tr>
</thead>
<tbody>${items}
</tbody>
</table>
<div class="totals">
<div class="totals-box">
<div class="total-row">
<span class="label">Total original</span>
<span class="value">$${intcomma(inv.total)}</span>
</div>
${Number(inv.discount) ? `<div class="total-row">
<span class="label">Descuento</span>
<span class="value">${intcomma(inv.discount)}%</span>
</div>` : ''}
<div class="total-row grand">
<span class="label">Total anulado</span>
<span class="value">$${intcomma(inv.total)}</span>
</div>
</div>
</div>
</div>
<div class="receipt-footer">
<div class="footer-block">
<h4>Nota</h4>
<div>Este comprobante certifica la anulación de la factura indicada.</div>
</div>
<div class="footer-block" style="text-align:right;">
<h4>Generado</h4>
<div>${esc(dmyHm(new Date()))}</div>
</div>
</div>
</div>`;
  return { css: cancelCss, body };
}

// ---------------------------------------------------------------- recibo de abono / anulación de pago
export function quotaReceipt(inv: InvoiceDetail, quotaId: number, amount: string | number): Rendered {
  const q = inv.quota_list.find((x) => x.id === quotaId)!;
  const [d, t] = nowDmy();
  const balance = Number(q.balance) > 0 ? `
<div class="balance-section">
<div class="balance-row">
<span>Valor original de la cuota:</span>
<span>$${intcomma(q.amount)}</span>
</div>
<div class="balance-row">
<span>Monto pagado:</span>
<span>$${intcomma(amount)}</span>
</div>
<div class="balance-row">
<span>Saldo pendiente:</span>
<span>$${intcomma(q.balance)}</span>
</div>
</div>` : '';
  const body = `
<div class="receipt-container">
<div class="receipt-header">
<div class="receipt-icon">✓</div>
<h1 class="receipt-title">Pago Recibido</h1>
<p class="receipt-subtitle">Transacción Exitosa</p>
</div>
<div class="receipt-body">
<div class="company-info">
<div class="company-name">CELUPRO CO</div>
</div>
<div class="info-section">
<div class="info-row"><span class="info-label">Factura:</span><span class="info-value">#${inv.invoice_number}</span></div>
<div class="info-row"><span class="info-label">Cliente:</span><span class="info-value">${esc(customerName(inv))}</span></div>
<div class="info-row"><span class="info-label">Cuota:</span><span class="info-value">#${q.id}</span></div>
<div class="info-row"><span class="info-label">Fecha de pago:</span><span class="info-value">${djDate(q.payment_date)}</span></div>
<div class="info-row"><span class="info-label">Método de pago:</span><span class="info-value">${esc(inv.payment_method)}</span></div>
</div>
<div class="amount-section">
<div class="amount-label">Monto Pagado</div>
<div class="amount-value">$${intcomma(amount)}</div>
</div>${balance}
<div class="status-section">
<div class="status-text">
<span class="status-icon">✅</span>
${q.is_paid ? 'CUOTA PAGADA COMPLETAMENTE' : 'PAGO PARCIAL REGISTRADO'}
</div>
</div>
<div class="thank-you">
<p class="thank-you-text">¡Gracias por su pago!</p>
</div>
<div class="footer">
Recibo generado el ${d} a las ${t}
</div>
</div>
</div>`;
  return { css: receiptCss, body };
}

export function quotaReversal(inv: InvoiceDetail, quotaId: number, amount: string | number, reversedAt: string | Date = new Date()): Rendered {
  const q = inv.quota_list.find((x) => x.id === quotaId)!;
  const [d, t] = nowDmy();
  const body = `
<div class="receipt-container">
<div class="receipt-header">
<div class="receipt-icon">✕</div>
<h1 class="receipt-title">Anulación de Cuota</h1>
<p class="receipt-subtitle">Comprobante de reversa</p>
</div>
<div class="receipt-body">
<div class="company-info">
<div class="company-name">CELUPRO CO</div>
</div>
<div class="info-section">
<div class="info-row"><span class="info-label">Factura:</span><span class="info-value">#${inv.invoice_number}</span></div>
<div class="info-row"><span class="info-label">Cliente:</span><span class="info-value">${esc(customerName(inv))}</span></div>
<div class="info-row"><span class="info-label">Cuota:</span><span class="info-value">#${q.id}</span></div>
<div class="info-row"><span class="info-label">Vencimiento:</span><span class="info-value">${djDate(q.payment_date)}</span></div>
<div class="info-row"><span class="info-label">Fecha de anulación:</span><span class="info-value">${dmyHm(reversedAt)}</span></div>
</div>
<div class="amount-section">
<div class="amount-label">Monto reversado</div>
<div class="amount-value">$${intcomma(amount)}</div>
</div>
<div class="status-section">
<div class="status-text">La cuota quedó en estado: PENDIENTE</div>
</div>
<div class="thank-you">
<p class="thank-you-text">Conserve este comprobante para soporte.</p>
</div>
<div class="footer">
Comprobante generado el ${d} a las ${t}
</div>
</div>
</div>`;
  return { css: reversalCss, body };
}

// ---------------------------------------------------------------- cotización
const dmy = (iso: string | null) => (iso ? iso.slice(0, 10).split('-').reverse().join('/') : '—');
const int0 = (v: string | number | null | undefined) => intcomma(v, 0);

export function quoteDoc(q: QuoteDetail, company: { name: string; nit: string }, a: Assets): Rendered {
  const lines = q.lines.map((l) => `
        <tr>
          <td>${esc(l.name)}</td>
          <td class="num">${l.quantity}</td>
          <td class="num">$${int0(l.price)}</td>
          <td class="num">$${int0(l.subtotal)}</td>
        </tr>`).join('');
  const statusLabel = { pendiente: 'Pendiente', facturada: 'Facturada', anulada: 'Anulada' }[q.status];
  const discount = Number(q.discount) ? `
        <div class="row"><span>Descuento (${Number(q.discount)}%)</span><span>-$${int0(Number(q.subtotal) * Number(q.discount) / 100)}</span></div>` : '';
  const delivery = Number(q.delivery_amount) ? `
        <div class="row"><span>Domicilio</span><span>$${int0(q.delivery_amount)}</span></div>` : '';
  const body = `
<div class="page">
  <div class="header">
    <div class="logo">
      <img src="${a.logo}" width="1890" height="945" alt="${esc(company.name)} Logo">
    </div>
    <div class="title">
      <h2>COTIZACIÓN</h2>
      <p class="number">NO. ${esc(q.code)}</p>
      <p class="company-nit">${esc(company.name)} · NIT ${esc(company.nit)}</p>
    </div>
  </div>
  <div class="body">
    <div class="grid">
      <div class="block">
        <h3>Fecha</h3>
        <p class="highlight">${dmy(q.quote_date)}</p>
        <h3>Válida hasta</h3>
        <p>${dmy(q.valid_until)}</p>
      </div>
      <div class="block">
        <h3>Cliente</h3>
        <p class="highlight">${esc(q.customer_name)}</p>
        <h3>${q.customer_id_type === 'NIT' ? 'NIT' : 'Identificación'}</h3>
        <p>${esc(q.customer_cedula ? (q.customer_id_type === 'NIT' ? idNumber('NIT', q.customer_cedula) : idFull(q.customer_id_type, q.customer_cedula)) : '—')}</p>
      </div>
      <div class="block">
        <h3>Contacto</h3>
        <p>${esc(q.customer_phone || '—')}</p>
        <p>${esc(q.customer_email || '')}</p>
        <h3>Estado</h3>
        <p><span class="status status-${q.status}">${statusLabel}${q.invoice_number ? ` · Factura #${q.invoice_number}` : ''}</span></p>
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th>DESCRIPCIÓN</th>
          <th class="num">CANT.</th>
          <th class="num">PRECIO</th>
          <th class="num">TOTAL</th>
        </tr>
      </thead>
      <tbody>${lines}
      </tbody>
    </table>
    <div class="bottom">
      <div class="notes">
        ${q.notes ? `<h4>Observaciones</h4>\n        <p>${esc(q.notes).replace(/\n/g, '<br>')}</p>` : ''}
      </div>
      <div class="totals">
        <div class="row"><span>Subtotal</span><span>$${int0(q.subtotal)}</span></div>${discount}${delivery}
        <div class="row grand"><span>Total</span><span>$${int0(q.total)}</span></div>
      </div>
    </div>
  </div>
  <div class="footer">
    Esta cotización no es una factura y no compromete inventario. Precios sujetos a disponibilidad
    ${q.valid_until ? `y válidos hasta el ${dmy(q.valid_until)}` : ''}.
    ${esc(company.name)} · NIT ${esc(company.nit)} · +57 3005034055 · https://celuproco.com.co/
  </div>
</div>`;
  return { css: quoteCss, body };
}

/** Elige la plantilla de factura igual que el sistema actual. */
export function invoiceDoc(inv: InvoiceDetail, a: Assets): Rendered {
  if (inv.status === 'Anulada') return invoiceCancel(inv, a);
  return inv.payment_method === 'Credito' ? invoiceCredit(inv, a) : invoiceCash(inv, a);
}

// ---------------------------------------------------------------- compra
export function purchaseDoc(p: PurchaseDetail, a: Assets): Rendered {
  const statusLabel = p.status.toUpperCase();
  const supplierId = `${p.supplier.id_type} ${p.supplier.identification}${p.supplier.dv ? `-${p.supplier.dv}` : ''}`;
  const rows = p.lines.map((l) => `
    <tr>
      <td>${esc(l.reference || '—')}</td>
      <td>${esc(l.name)}</td>
      <td class="right">${l.quantity}</td>
      <td class="right">$${intcomma(l.unit_cost)}</td>
      <td class="right">${intcomma(l.discount_pct)}%</td>
      <td class="right">${intcomma(l.tax_rate)}%</td>
      <td class="right">$${intcomma(l.subtotal)}</td>
      <td class="right">$${intcomma(l.total)}</td>
    </tr>`).join('');
  const discount = Number(p.discount_total) ? `
    <div class="row"><span>Descuento</span><span>-$${intcomma(p.discount_total)}</span></div>` : '';
  const body = `
<div class="page">
  ${p.status !== 'confirmada' ? `<div class="watermark">${statusLabel}</div>` : ''}
  <div class="header">
    <div class="logo"><img src="${a.logo}" alt="Logo"></div>
    <div class="title">
      <h1>COMPRA</h1>
      <div class="code">${esc(p.code)}</div>
      <span class="status ${p.status}">${statusLabel}</span>
    </div>
  </div>
  <div class="blocks">
    <div class="block">
      <h3>Empresa</h3>
      <p class="strong">${esc(p.company_name)}</p>
      <p>NIT ${esc(p.company_nit)}</p>
    </div>
    <div class="block">
      <h3>Proveedor</h3>
      <p class="strong">${esc(p.supplier.name)}</p>
      <p>${esc(supplierId)}</p>
      ${p.supplier.address ? `<p>${esc(p.supplier.address)}</p>` : ''}
      ${p.supplier.city ? `<p>${esc(p.supplier.city)}${p.supplier.department ? `, ${esc(p.supplier.department)}` : ''}</p>` : ''}
      <p>${esc(p.supplier.phone || '')} ${esc(p.supplier.email || '')}</p>
    </div>
    <div class="block">
      <h3>Documento</h3>
      <p>Fecha: <b>${djDate(p.date)}</b></p>
      <p>Tipo: ${esc(p.document_type)}</p>
      <p>No. proveedor: ${esc(p.supplier_document || '—')}</p>
      <p>Pago: ${esc(p.payment_method)}${p.payment_terms ? ` · ${esc(p.payment_terms)}` : ''}</p>
      ${p.due_date ? `<p>Vence: ${djDate(p.due_date)}</p>` : ''}
    </div>
  </div>
  <table class="items">
    <thead>
      <tr>
        <th>Ref.</th>
        <th>Producto</th>
        <th class="right">Cant.</th>
        <th class="right">Costo</th>
        <th class="right">Desc.</th>
        <th class="right">IVA</th>
        <th class="right">Subtotal</th>
        <th class="right">Total</th>
      </tr>
    </thead>
    <tbody>${rows}
    </tbody>
  </table>
  <div class="bottom">
    <div class="notes">
      <h3>Notas</h3>
      <p>${esc(p.notes || '—').replace(/\n/g, '<br>')}</p>
    </div>
    <div class="totals">
      <div class="row"><span>Subtotal</span><span>$${intcomma(p.subtotal)}</span></div>${discount}
      <div class="row"><span>IVA</span><span>$${intcomma(p.tax_total)}</span></div>
      <div class="row grand"><span>Total</span><span>$${intcomma(p.total)}</span></div>
    </div>
  </div>
  <div class="signatures">
    <div><span></span><p>Recibido por</p></div>
    <div><span></span><p>Elaborado por</p></div>
  </div>
  <div class="footer">Documento generado por ${esc(p.company_name)} · ${esc(p.code)}</div>
</div>`;
  return { css: purchaseCss, body };
}

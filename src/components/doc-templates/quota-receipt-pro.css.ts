/** Complemento del CSS de la factura a crédito para los recibos de cuota (pago y anulación). */
const css = `
    .invoice-wrapper { page-break-after: auto; }
    .receipt-ribbon { background: linear-gradient(135deg, #047857 0%, #10b981 100%); box-shadow: 0 4px 15px rgba(16,185,129,.45); }
    .receipt-ribbon.partial { background: linear-gradient(135deg, #b45309 0%, #f59e0b 100%); box-shadow: 0 4px 15px rgba(245,158,11,.45); }
    .receipt-ribbon.reversal { background: linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%); box-shadow: 0 4px 15px rgba(220,38,38,.45); }
    .credit-badge.paid { background: linear-gradient(135deg, #059669 0%, #10b981 100%); }
    .credit-badge.partial { background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%); }
    .credit-badge.reversal { background: linear-gradient(135deg, #b91c1c 0%, #dc2626 100%); }
    .total-due-box.reversal { background: linear-gradient(135deg, #000000 0%, #b91c1c 100%); }

    .receipt-section-title {
      font-size: 10px; font-weight: 700; color: #0e1792; text-transform: uppercase; letter-spacing: .8px;
      margin: 4px 0 8px; padding-bottom: 6px; border-bottom: 2px solid #0b13f5;
    }
    .receipt-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    .receipt-table thead { background: #37474f; color: #fff; }
    .receipt-table th { padding: 9px 8px; font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: .5px; text-align: right; }
    .receipt-table th:first-child, .receipt-table td:first-child { text-align: left; }
    .receipt-table td { padding: 9px 8px; font-size: 11px; color: #333; text-align: right; border-bottom: 1px solid #e0e0e0; }
    .receipt-table td:first-child { font-weight: 600; }
    .receipt-table td .sub { display: block; font-size: 9px; color: #666; font-weight: 400; margin-top: 2px; }
    .receipt-table tr.this-payment td { background: #ecfdf5; font-weight: 700; color: #065f46; }
    .receipt-table tr.this-payment.reversal td { background: #fef2f2; color: #991b1b; }

    .credit-info-value.ok { color: #047857; }
    .credit-info-value.warn { color: #b45309; }
    .progress { height: 6px; background: #e2e8f0; border-radius: 4px; overflow: hidden; margin-top: 6px; }
    .progress > span { display: block; height: 100%; background: linear-gradient(90deg, #10b981, #059669); }

    .receipt-stamp {
      display: inline-flex; align-items: center; gap: 8px; margin-bottom: 10px; padding: 6px 12px;
      border: 2px solid #059669; color: #047857; border-radius: 6px; font-size: 11px; font-weight: 800;
      letter-spacing: 1px; text-transform: uppercase; transform: rotate(-2deg);
    }
    .receipt-stamp.partial { border-color: #d97706; color: #b45309; }
    .receipt-stamp.reversal { border-color: #dc2626; color: #b91c1c; }
    .receipt-note { font-size: 10px !important; color: #666; line-height: 1.5; max-width: 300px; margin-bottom: 0 !important; }

    /* Título más compacto: deja espacio a la cinta de la esquina */
    .invoice-title { padding-right: 46px; }
    .invoice-title h2 { font-size: 30px; }
    /* Una sola hoja: firma un poco más baja que en la factura */
    .signature-area { margin-top: 4px; }
    .signature-line img { height: 110px; }
  `;

export default css;

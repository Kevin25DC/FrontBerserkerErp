'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { BarChart } from '@/components/charts';
import { CustomerPicker } from '@/components/item-picker';
import { Empty, Field, Kpi, PageHeader, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import { date, datetime, money } from '@/lib/format';

type HistoryInvoice = { id: number; invoice_number: number; date: string; payment_method: string };
type History = { payments: { id: number; customer: string; invoice_number: number; quota_number: number; amount: string; date: string }[]; chart_labels: string[]; chart_values: string[]; total_paid: string; count: number };

export default function HistorialPagosPage() {
  const [customer, setCustomer] = useState<{ id: number; name: string } | null>(null);
  const [invoiceId, setInvoiceId] = useState('');
  const { data: invoices } = useQuery({
    queryKey: ['history-invoices', customer?.id], enabled: !!customer,
    queryFn: () => api<HistoryInvoice[]>(`/payments/history/invoices/${customer!.id}`),
  });
  const { data, isFetching } = useQuery({
    queryKey: ['history', customer?.id, invoiceId], enabled: !!customer,
    queryFn: () => api<History>('/payments/history', { query: { customer_id: customer!.id, invoice_id: invoiceId || undefined } }),
  });

  return (
    <>
      <PageHeader title="Historial de pagos" subtitle="Abonos registrados a las facturas a crédito de un cliente." />
      <div className="panel">
        <div className="form-grid">
          <Field label="Cliente"><CustomerPicker value={customer?.name} onPick={(c) => { setCustomer({ id: c.id, name: `${c.name} ${c.lastname}` }); setInvoiceId(''); }} /></Field>
          <Field label="Factura">
            <select className="select" value={invoiceId} onChange={(e) => setInvoiceId(e.target.value)} disabled={!customer}>
              <option value="">Todas las facturas a crédito</option>
              {invoices?.map((i) => <option key={i.id} value={i.id}>#{i.invoice_number} · {date(i.date)}</option>)}
            </select>
          </Field>
        </div>
      </div>
      {!customer ? <div className="panel"><Empty icon="bi-clock-history">Selecciona un cliente para ver sus pagos.</Empty></div> : !data || isFetching ? <Spinner /> : (
        <>
          <div className="kpi-grid">
            <Kpi icon="bi-cash-stack" label="Total abonado" value={money(data.total_paid)} />
            <Kpi icon="bi-receipt" tone="info" label="Pagos registrados" value={data.count} />
          </div>
          <div className="grid grid-7-5">
            <div className="panel flush">
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>Fecha</th><th>Factura</th><th>Cuota</th><th className="num">Importe</th></tr></thead>
                  <tbody>{data.payments.length ? data.payments.map((p) => (
                    <tr key={p.id}><td className="nowrap">{datetime(p.date)}</td><td className="strong">#{p.invoice_number}</td><td>{p.quota_number}</td><td className="num money">{money(p.amount)}</td></tr>
                  )) : <tr><td colSpan={4}><Empty>Este cliente no tiene abonos registrados.</Empty></td></tr>}</tbody>
                </table>
              </div>
            </div>
            <div className="panel">
              <h2 className="panel-title"><i className="bi bi-bar-chart" /> Abonos por día</h2>
              <div style={{ height: 280 }}><BarChart labels={data.chart_labels.map((l) => date(l))} values={data.chart_values.map(Number)} /></div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

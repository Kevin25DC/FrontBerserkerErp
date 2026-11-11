'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { CompareChart } from '@/components/charts';
import { DownloadButton } from '@/components/download-button';
import { Field, Kpi, PageHeader, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import { money, todayISO } from '@/lib/format';

type Row = { item_id: number; name: string; quantity: number; total: string; previous_total: string };
type Report = { top: Row[]; all: Row[]; totals: { current: string; previous: string; change_percent: number } };

export default function ProductosReportPage() {
  const [from, setFrom] = useState(`${todayISO().slice(0, 8)}01`);
  const [to, setTo] = useState(todayISO());
  const [top, setTop] = useState(15);
  const { data } = useQuery({ queryKey: ['report-products', from, to, top], queryFn: () => api<Report>('/reports/products', { query: { date_from: from, date_to: to, top } }) });

  return (
    <>
      <PageHeader back={{ href: '/reportes', label: 'Reportes' }} title="Ventas por producto" subtitle="Productos más vendidos por valor en el período elegido."
        actions={<DownloadButton path="/reports/products/export" query={{ date_from: from, date_to: to }} fallbackName="Reporte_productos.xlsx" loadingLabel="Exportando…"><i className="bi bi-file-earmark-excel" /> Excel</DownloadButton>} />
      <div className="panel">
        <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          <Field label="Desde"><input className="input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
          <Field label="Hasta"><input className="input" type="date" value={to} onChange={(e) => setTo(e.target.value)} /></Field>
          <Field label="Mostrar"><select className="select" value={top} onChange={(e) => setTop(Number(e.target.value))}>{[10, 15, 20, 25].map((n) => <option key={n} value={n}>Top {n}</option>)}</select></Field>
        </div>
      </div>
      {!data ? <Spinner /> : (
        <>
          <div className="kpi-grid">
            <Kpi icon="bi-box-seam" label="Vendido en el período" value={money(data.totals.current)} hint={`${data.all.length} productos con ventas`} />
            <Kpi icon="bi-clock-history" tone="info" label="Período anterior" value={money(data.totals.previous)} hint={`Variación ${data.totals.change_percent.toLocaleString('es-CO', { maximumFractionDigits: 1 })}%`} />
          </div>
          <div className="panel">
            <h2 className="panel-title"><i className="bi bi-trophy" /> Top {top} por valor vendido</h2>
            <div style={{ height: Math.max(260, data.top.length * 26) }}>
              <CompareChart kind="bar" labels={data.top.map((r) => r.name)} current={data.top.map((r) => Number(r.total))} previous={data.top.map((r) => Number(r.previous_total))} />
            </div>
          </div>
          <div className="panel flush">
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>#</th><th>Producto</th><th className="num">Cantidad</th><th className="num">Total</th><th className="num">Período anterior</th></tr></thead>
                <tbody>{data.all.map((r, i) => <tr key={r.item_id}><td className="muted">{i + 1}</td><td className="strong">{r.name}</td><td className="num">{r.quantity}</td><td className="num money">{money(r.total)}</td><td className="num muted">{money(r.previous_total)}</td></tr>)}</tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  );
}

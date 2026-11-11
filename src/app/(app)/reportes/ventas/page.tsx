'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { CompareChart } from '@/components/charts';
import { DownloadButton } from '@/components/download-button';
import { Field, Kpi, PageHeader, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import { date, money, todayISO } from '@/lib/format';

type Report = { labels: string[]; current: string[]; previous: string[]; totals: { current: string; previous: string; difference: string; change_percent: number }; previous_from: string; previous_to: string };
const PERIODS = [['daily', 'Diario'], ['weekly', 'Semanal'], ['monthly', 'Mensual'], ['yearly', 'Anual']] as const;

export default function VentasReportPage() {
  const [from, setFrom] = useState(`${todayISO().slice(0, 4)}-01-01`);
  const [to, setTo] = useState(todayISO());
  const [period, setPeriod] = useState<(typeof PERIODS)[number][0]>('monthly');
  const { data, isFetching, error } = useQuery({
    queryKey: ['report-sales', from, to, period],
    queryFn: () => api<Report>('/reports/sales', { query: { date_from: from, date_to: to, period } }),
  });
  const pct = data?.totals.change_percent ?? 0;

  return (
    <>
      <PageHeader back={{ href: '/reportes', label: 'Reportes' }} title="Ventas generales" subtitle="Ventas del período elegido comparadas con el período anterior."
        actions={<DownloadButton path="/reports/sales/export" query={{ date_from: from, date_to: to }} fallbackName="Reporte_ventas.xlsx" loadingLabel="Exportando…"><i className="bi bi-file-earmark-excel" /> Excel</DownloadButton>} />
      <div className="panel">
        <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', alignItems: 'end' }}>
          <Field label="Desde"><input className="input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
          <Field label="Hasta"><input className="input" type="date" value={to} onChange={(e) => setTo(e.target.value)} /></Field>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {PERIODS.map(([v, l]) => <button key={v} type="button" className={`btn btn-sm ${period === v ? 'btn-primary' : ''}`} onClick={() => setPeriod(v)}>{l}</button>)}
          </div>
        </div>
      </div>
      {error ? <div className="alert danger">{(error as Error).message}</div> : null}
      {data ? (
        <>
          <div className="kpi-grid">
            <Kpi icon="bi-graph-up" label="Período actual" value={money(data.totals.current)} hint={`${date(from)} – ${date(to)}`} />
            <Kpi icon="bi-clock-history" tone="info" label="Período anterior" value={money(data.totals.previous)} hint={`${date(data.previous_from)} – ${date(data.previous_to)}`} />
            <Kpi icon={pct >= 0 ? 'bi-arrow-up-right' : 'bi-arrow-down-right'} tone={pct >= 0 ? undefined : 'danger'} label="Variación"
              value={`${pct >= 0 ? '+' : ''}${pct.toLocaleString('es-CO', { maximumFractionDigits: 1 })}%`} hint={money(data.totals.difference)} />
          </div>
          <div className="panel">
            <h2 className="panel-title"><i className="bi bi-bar-chart" /> Comparativo entre períodos {isFetching ? <span className="spinner muted" /> : null}</h2>
            <div style={{ height: 340 }}><CompareChart labels={data.labels} current={data.current.map(Number)} previous={data.previous.map(Number)} kind={data.labels.length > 20 ? 'line' : 'bar'} /></div>
          </div>
        </>
      ) : <Spinner />}
    </>
  );
}

'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { BarChart } from '@/components/charts';
import { Badge, Empty, Kpi, PageHeader } from '@/components/ui';
import { api } from '@/lib/api';
import { money } from '@/lib/format';
import type { Dashboard, User } from '@/lib/types';

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

export default function DashboardPage() {
  const { data: me } = useQuery({ queryKey: ['me'], queryFn: () => api<User>('/auth/me') });
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: () => api<Dashboard>('/dashboard') });
  const now = new Date();
  const today = `${DIAS[now.getDay()]} ${now.getDate()} de ${MESES[now.getMonth()]}`;

  return (
    <>
      <PageHeader
        eyebrow={today.charAt(0).toUpperCase() + today.slice(1)}
        title={`Hola, ${me?.first_name || me?.username || ''}`}
        subtitle="Resumen general del negocio."
        actions={
          <>
            <Link href="/cotizaciones/nueva" className="btn"><i className="bi bi-file-earmark-text" /> Cotizar</Link>
            <Link href="/cuotas" className="btn"><i className="bi bi-cash-coin" /> Pagar cuota</Link>
            <Link href="/facturar" className="btn btn-primary"><i className="bi bi-plus-lg" /> Nueva factura</Link>
          </>
        }
      />

      <div className="kpi-grid">
        <Kpi href="/facturas" icon="bi-cash-stack" label="Ventas de contado" value={data ? money(data.cash_sales) : '…'} hint="Facturas pagadas, sin domicilio" />
        <Kpi href="/cuotas" icon="bi-credit-card" tone="warning" label="Ventas a crédito" value={data ? money(data.credit_sales) : '…'} hint="Valor vendido a crédito" />
        <Kpi href="/clientes" icon="bi-people" tone="info" label="Clientes" value={data?.customers.toLocaleString('es-CO') ?? '…'} hint="Registrados" />
        <Kpi href="/productos" icon="bi-box-seam" tone={data?.low_stock_count ? 'danger' : undefined} label="Productos activos"
          value={data?.active_items.toLocaleString('es-CO') ?? '…'}
          hint={data ? (data.low_stock_count ? `${data.low_stock_count} con stock bajo (≤ 2)` : 'Stock al día') : ''} />
      </div>

      <div className="grid grid-3-1">
        <div className="panel">
          <h2 className="panel-title"><i className="bi bi-bar-chart" /> Ventas por mes</h2>
          <div style={{ height: 300 }}>
            {data ? <BarChart labels={data.monthly_sales.map((p) => p.label)} values={data.monthly_sales.map((p) => Number(p.value))} /> : null}
          </div>
        </div>
        <div className="panel">
          <h2 className="panel-title"><i className="bi bi-exclamation-triangle" /> Stock bajo</h2>
          {isLoading ? <div className="skeleton" /> : data?.low_stock.length ? (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {data.low_stock.map((it, i) => (
                <li key={it.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '8px 0', borderBottom: i < data.low_stock.length - 1 ? '1px solid var(--border)' : 0 }}>
                  <Link href={`/productos/${it.id}`} style={{ color: 'var(--ink)' }}>{it.name}</Link>
                  {it.stock <= 0 ? <Badge tone="danger">Agotado</Badge> : <Badge tone="warning">{it.stock} und.</Badge>}
                </li>
              ))}
            </ul>
          ) : <Empty icon="bi-check2-circle">Todo el inventario tiene stock.</Empty>}
        </div>
      </div>

      <div className="grid grid-2">
        <div className="panel">
          <h2 className="panel-title"><i className="bi bi-trophy" /> Productos más vendidos</h2>
          <div style={{ height: 300 }}>
            {data ? <BarChart horizontal fmt="int" unit="unidades" labels={data.top_products.map((p) => p.label)} values={data.top_products.map((p) => Number(p.value))} /> : null}
          </div>
        </div>
        <div className="panel">
          <h2 className="panel-title"><i className="bi bi-person-plus" /> Clientes nuevos por día</h2>
          <div style={{ height: 300 }}>
            {data ? <BarChart fmt="int" unit="cliente(s)" labels={data.new_customers.map((p) => p.label)} values={data.new_customers.map((p) => Number(p.value))} /> : null}
          </div>
        </div>
      </div>
    </>
  );
}

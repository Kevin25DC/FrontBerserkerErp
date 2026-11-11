'use client';

import {
  BarElement, CategoryScale, Chart as ChartJS, Filler, Legend, LinearScale, LineElement, PointElement, Tooltip,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend, Filler);

const BRAND = '#16a34a';
const BRAND_DARK = '#15803d';
const GREY = '#94a3b8';
const GRID = '#eef2f6';
const INK_MUTED = '#64748b';

const moneyShort = (v: number) =>
  v >= 1e6 ? `$${(v / 1e6).toLocaleString('es-CO', { maximumFractionDigits: 1 })} M` : `$${v.toLocaleString('es-CO')}`;
const money = (v: number) => `$${Math.round(v).toLocaleString('es-CO')}`;

type Fmt = 'money' | 'int';

function scales(fmt: Fmt, horizontal = false) {
  const value = {
    beginAtZero: true, grid: { color: GRID }, border: { display: false },
    ticks: { color: INK_MUTED, callback: (v: string | number) => (fmt === 'money' ? moneyShort(Number(v)) : Number.isInteger(Number(v)) ? v : null) },
  };
  const cat = { grid: { display: false }, border: { color: GRID }, ticks: { color: INK_MUTED } };
  return horizontal ? { x: value, y: cat } : { x: cat, y: value };
}

/** Barras de una sola serie (el título del panel la nombra; sin leyenda). */
export function BarChart({ labels, values, fmt = 'money', horizontal = false, unit = '' }: {
  labels: string[]; values: number[]; fmt?: Fmt; horizontal?: boolean; unit?: string;
}) {
  return (
    <Bar
      data={{ labels, datasets: [{ data: values, backgroundColor: BRAND, hoverBackgroundColor: BRAND_DARK, borderRadius: 4, borderSkipped: 'start', maxBarThickness: 36 }] }}
      options={{
        indexAxis: horizontal ? 'y' : 'x', maintainAspectRatio: false, responsive: true,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => ` ${fmt === 'money' ? money(c.parsed[horizontal ? 'x' : 'y']) : `${c.parsed[horizontal ? 'x' : 'y']} ${unit}`}` } } },
        scales: scales(fmt, horizontal),
      }}
    />
  );
}

/** Comparativo período actual vs anterior (2 series → con leyenda). */
export function CompareChart({ labels, current, previous, kind = 'line' }: {
  labels: string[]; current: number[]; previous: number[]; kind?: 'line' | 'bar';
}) {
  const data = {
    labels,
    datasets: [
      { label: 'Período actual', data: current, borderColor: BRAND, backgroundColor: kind === 'bar' ? BRAND : 'rgba(22,163,74,.12)', fill: kind === 'line', tension: .3, borderWidth: 2, pointRadius: 3, borderRadius: 4 },
      { label: 'Período anterior', data: previous, borderColor: GREY, backgroundColor: kind === 'bar' ? '#cbd5e1' : 'transparent', borderDash: kind === 'line' ? [5, 4] : undefined, tension: .3, borderWidth: 2, pointRadius: 2, borderRadius: 4 },
    ],
  };
  const options = {
    maintainAspectRatio: false, responsive: true, interaction: { mode: 'index' as const, intersect: false },
    plugins: { legend: { display: true, position: 'top' as const, labels: { usePointStyle: true, boxWidth: 8 } }, tooltip: { callbacks: { label: (c: { dataset: { label?: string }; parsed: { y: number } }) => ` ${c.dataset.label}: ${money(c.parsed.y)}` } } },
    scales: scales('money'),
  };
  return kind === 'bar' ? <Bar data={data} options={options} /> : <Line data={data} options={options} />;
}

import Link from 'next/link';
import { PageHeader } from '@/components/ui';

export const metadata = { title: 'Reportes' };

const REPORTS = [
  { href: '/facturas', icon: 'bi-receipt', title: 'Facturas', text: 'Listado de ventas de contado y crédito con su estado y saldo.' },
  { href: '/reportes/ventas', icon: 'bi-graph-up', title: 'Ventas generales', text: 'Ventas por período (diario, semanal, mensual, anual) comparadas con el período anterior. Exporta a Excel.' },
  { href: '/reportes/productos', icon: 'bi-box-seam', title: 'Ventas por producto', text: 'Productos más vendidos por valor en un rango de fechas.' },
  { href: '/reportes/estado-cuenta', icon: 'bi-person-lines-fill', title: 'Estado de cuenta de clientes', text: 'Facturado, cobrado y saldo pendiente por cliente.' },
  { href: '/ajustes', icon: 'bi-arrow-left-right', title: 'Ajustes de inventario', text: 'Entradas y salidas manuales; exportables por fechas.' },
  { href: '/historial-pagos', icon: 'bi-clock-history', title: 'Historial de pagos', text: 'Abonos registrados a cada factura a crédito.' },
];

export default function ReportesPage() {
  return (
    <>
      <PageHeader title="Reportes" subtitle="Analiza ventas, productos y cartera." />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
        {REPORTS.map((r) => (
          <Link key={r.href} href={r.href} className="kpi" style={{ flexDirection: 'column', gap: 10 }}>
            <span className="kpi-icon"><i className={`bi ${r.icon}`} /></span>
            <strong style={{ fontSize: 15 }}>{r.title}</strong>
            <span className="muted small">{r.text}</span>
          </Link>
        ))}
      </div>
    </>
  );
}

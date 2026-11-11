'use client';

import { Suspense } from 'react';
import { QuotaList } from './quota-list';

export default function CuotasPage() {
  return <Suspense><QuotaList title="Pagar cuota" subtitle="Registra abonos a las cuotas de las ventas a crédito." byInvoice={false} /></Suspense>;
}

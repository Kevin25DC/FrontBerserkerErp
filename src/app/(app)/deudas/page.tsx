'use client';

import { Suspense } from 'react';
import { QuotaList } from '../cuotas/quota-list';

export default function DeudasPage() {
  return <Suspense><QuotaList title="Deudas por cliente" subtitle="Consulta las cuotas de un cliente o de una factura puntual." byInvoice /></Suspense>;
}

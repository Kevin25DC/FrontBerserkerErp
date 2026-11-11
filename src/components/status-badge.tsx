'use client';

import { Badge } from '@/components/ui';

export function StatusBadge({ status }: { status: string }) {
  if (status === 'Pagada') return <Badge tone="success">Pagada</Badge>;
  if (status === 'Credito') return <Badge tone="warning">Crédito</Badge>;
  if (status === 'Anulada') return <Badge tone="neutral">Anulada</Badge>;
  return <Badge tone="danger">{status}</Badge>;
}

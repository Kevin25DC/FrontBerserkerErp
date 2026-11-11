'use client';

import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useToast } from '@/components/providers';
import { Field, Modal } from '@/components/ui';
import { api } from '@/lib/api';

export function CancelModal({ inv, onClose, onDone }: { inv: { id: number; invoice_number: number }; onClose: () => void; onDone: (cancelNumber: string) => void }) {
  const toast = useToast();
  const [reason, setReason] = useState('');
  const cancel = useMutation({
    mutationFn: () => api<{ cancel_number: string }>(`/invoices/${inv.id}/cancel`, { json: { reason: reason || null } }),
    onSuccess: (r) => onDone(r.cancel_number),
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Modal title={`¿Anular la factura #${inv.invoice_number}?`} onClose={onClose}
      footer={<><button className="btn" onClick={onClose}>Cancelar</button>
        <button className="btn btn-danger" disabled={cancel.isPending} onClick={() => cancel.mutate()}>{cancel.isPending ? <span className="spinner" /> : null} Sí, anular</button></>}>
      <div className="alert warning"><i className="bi bi-exclamation-triangle" /> Esta acción no se puede deshacer: se genera el comprobante de anulación y se devuelve el stock.</div>
      <Field label="Motivo (opcional)"><textarea className="textarea" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Error en facturación, solicitud del cliente…" /></Field>
    </Modal>
  );
}

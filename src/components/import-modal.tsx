'use client';

import { useMutation } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { DownloadButton } from '@/components/download-button';
import { useToast } from '@/components/providers';
import { Modal } from '@/components/ui';
import { api } from '@/lib/api';

type ImportResult = { status: 'success' | 'warning' | 'error'; inserted: number; duplicates: string[]; errors: number; message: string };

export function ImportModal({ kind, onClose, onDone }: { kind: 'customers' | 'items'; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const upload = useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append('file', file);
      return api<ImportResult>(`/imports/${kind}`, { form });
    },
    onSuccess: (r) => { setResult(r); onDone(); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Modal title={`Importar ${kind === 'customers' ? 'clientes' : 'productos'} desde Excel`} onClose={onClose}
      footer={<button className="btn" onClick={onClose}>Cerrar</button>}>
      <p className="muted" style={{ marginTop: 0 }}>Usa la plantilla para respetar las columnas. Los registros que ya existen se omiten.</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input ref={fileRef} type="file" accept=".xlsx" className="input" style={{ flex: 1 }} />
        <button className="btn btn-primary" disabled={upload.isPending}
          onClick={() => { const f = fileRef.current?.files?.[0]; if (f) upload.mutate(f); else toast.error('Selecciona un archivo .xlsx'); }}>
          {upload.isPending ? <span className="spinner" /> : <i className="bi bi-upload" />} Cargar
        </button>
        <DownloadButton path={`/templates/${kind}.xlsx`} fallbackName="plantilla.xlsx" className="btn" loadingLabel="Descargando…"><i className="bi bi-download" /> Plantilla</DownloadButton>
      </div>
      {result ? (
        <div className={`alert ${result.status === 'success' ? 'info' : result.status === 'warning' ? 'warning' : 'danger'}`} style={{ marginTop: 16, flexDirection: 'column' }}>
          <strong>{result.message}</strong>
          {result.duplicates.length ? <span className="small">Ya existían: {result.duplicates.slice(0, 20).join(', ')}{result.duplicates.length > 20 ? '…' : ''}</span> : null}
          {result.errors ? <span className="small">Filas con error: {result.errors}</span> : null}
        </div>
      ) : null}
    </Modal>
  );
}

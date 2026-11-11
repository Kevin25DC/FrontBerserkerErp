'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useToast } from '@/components/providers';
import { Badge, PageHeader, Spinner } from '@/components/ui';
import { api, ApiError } from '@/lib/api';

type Status = { connected?: boolean; connection?: string; qr_data_url?: string | null; me?: { id?: string; name?: string } | null };

export default function WhatsAppPage() {
  const toast = useToast();
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ['whatsapp'], queryFn: () => api<Status>('/whatsapp/status'),
    refetchInterval: (q) => (q.state.data?.connected ? 15_000 : 3_000), retry: false,
  });
  const logout = useMutation({
    mutationFn: () => api('/whatsapp/logout', { method: 'POST' }),
    onSuccess: () => { toast.success('WhatsApp desconectado.'); refetch(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const unavailable = error instanceof ApiError;

  return (
    <>
      <PageHeader title="Conexión WhatsApp" subtitle="Escanea el QR con WhatsApp → Dispositivos vinculados para enviar facturas por WhatsApp." />
      <div className="panel" style={{ maxWidth: 560 }}>
        {isLoading ? <Spinner /> : unavailable ? (
          <div className="alert warning"><i className="bi bi-plug" /> {(error as Error).message}</div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              {data?.connected ? <Badge tone="success">Conectado {data.me?.name ? `· ${data.me.name}` : ''}</Badge> : <Badge tone="warning">{data?.connection ?? 'Desconectado'}</Badge>}
              <button className="btn btn-sm btn-ghost-danger" disabled={!data?.connected || logout.isPending} onClick={() => logout.mutate()}>Desconectar</button>
            </div>
            <div style={{ textAlign: 'center' }}>
              {data?.qr_data_url ? <img src={data.qr_data_url} alt="QR de WhatsApp" style={{ maxWidth: 320, width: '100%' }} />
                : data?.connected ? <p className="muted">La sesión está activa.</p> : <p className="muted">Esperando QR…</p>}
            </div>
          </>
        )}
      </div>
    </>
  );
}

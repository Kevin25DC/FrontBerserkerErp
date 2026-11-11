'use client';

import Link from 'next/link';
import { useEffect, type ReactNode } from 'react';

export function PageHeader({ title, subtitle, eyebrow, back, actions }: {
  title: ReactNode; subtitle?: ReactNode; eyebrow?: ReactNode; back?: { href: string; label: string }; actions?: ReactNode;
}) {
  return (
    <div className="page-header">
      <div>
        {back ? (
          <div className="page-eyebrow"><Link href={back.href}><i className="bi bi-arrow-left" /> {back.label}</Link></div>
        ) : eyebrow ? <div className="page-eyebrow">{eyebrow}</div> : null}
        <h1 className="page-title">{title}</h1>
        {subtitle ? <p className="page-subtitle">{subtitle}</p> : null}
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </div>
  );
}

export function Kpi({ icon, tone, label, value, hint, href }: {
  icon: string; tone?: 'info' | 'warning' | 'danger'; label: string; value: ReactNode; hint?: ReactNode; href?: string;
}) {
  const body = (
    <>
      <span className={`kpi-icon ${tone ?? ''}`}><i className={`bi ${icon}`} /></span>
      <div>
        <div className="kpi-label">{label}</div>
        <div className="kpi-value">{value}</div>
        {hint ? <div className="kpi-hint">{hint}</div> : null}
      </div>
    </>
  );
  return href ? <Link href={href} className="kpi">{body}</Link> : <div className="kpi">{body}</div>;
}

export const Badge = ({ tone, children }: { tone: 'success' | 'info' | 'warning' | 'danger' | 'neutral'; children: ReactNode }) => (
  <span className={`badge ${tone}`}>{children}</span>
);

export function Empty({ icon = 'bi-inbox', children }: { icon?: string; children: ReactNode }) {
  return <div className="empty-state"><i className={`bi ${icon}`} />{children}</div>;
}

export const Spinner = () => <span className="spinner" aria-label="Cargando" />;

export function LoadingRows({ cols, rows = 6 }: { cols: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r}>{Array.from({ length: cols }).map((__, c) => <td key={c}><div className="skeleton" /></td>)}</tr>
      ))}
    </>
  );
}

export function Pagination({ page, pageSize, total, onPage }: { page: number; pageSize: number; total: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <div className="pagination">
      <span>{from}–{to} de {total.toLocaleString('es-CO')}</span>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <button className="btn btn-sm" disabled={page <= 1} onClick={() => onPage(page - 1)}><i className="bi bi-chevron-left" /></button>
        <span>{page} / {pages}</span>
        <button className="btn btn-sm" disabled={page >= pages} onClick={() => onPage(page + 1)}><i className="bi bi-chevron-right" /></button>
      </div>
    </div>
  );
}

export function Modal({ title, onClose, children, footer, size }: {
  title: ReactNode; onClose: () => void; children: ReactNode; footer?: ReactNode; size?: 'lg';
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${size ?? ''}`} role="dialog" aria-modal="true">
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Cerrar"><i className="bi bi-x-lg" style={{ fontSize: 16 }} /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer ? <div className="modal-footer">{footer}</div> : null}
      </div>
    </div>
  );
}

export function Field({ label, error, help, children, full }: { label: string; error?: string; help?: ReactNode; children: ReactNode; full?: boolean }) {
  return (
    <label className={`field ${full ? 'full' : ''}`}>
      <span className="label">{label}</span>
      {children}
      {error ? <span className="field-error">{error}</span> : help ? <span className="help">{help}</span> : null}
    </label>
  );
}

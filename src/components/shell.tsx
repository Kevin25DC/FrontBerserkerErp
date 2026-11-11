'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { api } from '@/lib/api';
import type { User } from '@/lib/types';

type NavItem = { href: string; icon: string; label: string; match?: string[] };
const NAV: { section?: string; items: NavItem[] }[] = [
  { items: [{ href: '/', icon: 'bi-grid-1x2', label: 'Dashboard' }] },
  { section: 'Ventas', items: [
    { href: '/facturar', icon: 'bi-receipt', label: 'Facturar' },
    { href: '/facturas', icon: 'bi-journal-text', label: 'Facturas' },
    { href: '/cotizaciones', icon: 'bi-file-earmark-text', label: 'Cotizaciones' },
    { href: '/anular', icon: 'bi-x-octagon', label: 'Anular factura' },
  ] },
  { section: 'Cartera', items: [
    { href: '/cuotas', icon: 'bi-cash-coin', label: 'Pagar cuota' },
    { href: '/deudas', icon: 'bi-person-lines-fill', label: 'Deudas por cliente' },
    { href: '/historial-pagos', icon: 'bi-clock-history', label: 'Historial de pagos' },
  ] },
  { section: 'Inventario', items: [
    { href: '/productos', icon: 'bi-box-seam', label: 'Productos' },
    { href: '/ajustes', icon: 'bi-arrow-left-right', label: 'Ajustes de inventario' },
    { href: '/impuestos', icon: 'bi-percent', label: 'Impuestos' },
  ] },
  { section: 'Clientes', items: [{ href: '/clientes', icon: 'bi-people', label: 'Clientes' }] },
  { section: 'Análisis', items: [{ href: '/reportes', icon: 'bi-bar-chart-line', label: 'Reportes' }] },
  { section: 'Configuración', items: [
    { href: '/tipos-documento', icon: 'bi-hash', label: 'Tipos de documento' },
    { href: '/whatsapp', icon: 'bi-whatsapp', label: 'WhatsApp' },
  ] },
];

function isActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
}

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { data: me } = useQuery({ queryKey: ['me'], queryFn: () => api<User>('/auth/me'), staleTime: 5 * 60_000 });

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const close = (e: MouseEvent) => menuRef.current && !menuRef.current.contains(e.target as Node) && setMenu(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
    router.refresh();
  }

  const displayName = me ? `${me.first_name} ${me.last_name}`.trim() || me.username : '';

  return (
    <div className={open ? 'sidebar-open' : ''}>
      <aside className="app-sidebar" aria-label="Menú principal">
        <div className="sidebar-brand">
          <Link href="/"><img src="/logo.png" alt="Berserker" className="sidebar-logo" /></Link>
          <button className="icon-btn show-mobile" style={{ color: '#cbd5e1', fontSize: 18 }} onClick={() => setOpen(false)} aria-label="Cerrar menú">
            <i className="bi bi-x-lg" />
          </button>
        </div>
        <nav className="sidebar-nav">
          {NAV.map((group, i) => (
            <div key={i}>
              {group.section ? <div className="nav-section">{group.section}</div> : null}
              {group.items.map((it) => (
                <Link key={it.href} href={it.href} prefetch className={`nav-link ${isActive(pathname, it.href) ? 'active' : ''}`}>
                  <i className={`bi ${it.icon}`} /><span>{it.label}</span>
                </Link>
              ))}
            </div>
          ))}
        </nav>
      </aside>
      <div className="sidebar-backdrop" onClick={() => setOpen(false)} />

      <div className="app-main">
        <header className="app-topbar">
          <button className="icon-btn show-mobile" onClick={() => setOpen(true)} aria-label="Abrir menú"><i className="bi bi-list" /></button>
          <div className="topbar-actions">
            <Link href="/facturar" className="btn btn-primary btn-sm hide-mobile"><i className="bi bi-plus-lg" /> Nueva factura</Link>
            <div ref={menuRef} style={{ position: 'relative' }}>
              <button className="user-chip" onClick={() => setMenu((m) => !m)} aria-haspopup="menu" aria-expanded={menu}>
                <span className="avatar">{(me?.username ?? '·').charAt(0).toUpperCase()}</span>
                <span className="hide-mobile">
                  <span className="user-name">{displayName || '…'}</span>
                  <span className="user-mail">{me?.email}</span>
                </span>
                <i className="bi bi-chevron-down muted small" />
              </button>
              {menu ? (
                <div className="menu" role="menu">
                  <Link href="/perfil" onClick={() => setMenu(false)}><i className="bi bi-person" /> Mi perfil</Link>
                  <button onClick={logout} style={{ color: 'var(--danger)' }}><i className="bi bi-box-arrow-right" /> Cerrar sesión</button>
                </div>
              ) : null}
            </div>
          </div>
        </header>
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}

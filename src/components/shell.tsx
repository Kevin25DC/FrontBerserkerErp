'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { api } from '@/lib/api';
import type { User } from '@/lib/types';

type NavItem = { href: string; icon: string; label: string };
type NavGroup = { id: string; label: string; icon: string; items: NavItem[] };
type NavEntry = NavItem | NavGroup;

/**
 * Menú ordenado según el flujo del negocio: vender → cobrar → comprar → inventario.
 * Los grupos se pliegan; el del módulo actual se abre solo.
 */
const NAV: NavEntry[] = [
  { href: '/', icon: 'bi-grid-1x2', label: 'Dashboard' },
  { id: 'ventas', label: 'Ventas', icon: 'bi-receipt', items: [
    { href: '/facturar', icon: 'bi-plus-circle', label: 'Facturar' },
    { href: '/facturas', icon: 'bi-journal-text', label: 'Facturas' },
    { href: '/cotizaciones', icon: 'bi-file-earmark-text', label: 'Cotizaciones' },
    { href: '/clientes', icon: 'bi-people', label: 'Clientes' },
    { href: '/anular', icon: 'bi-x-octagon', label: 'Anular factura' },
  ] },
  { id: 'cartera', label: 'Cartera', icon: 'bi-wallet2', items: [
    { href: '/cuotas', icon: 'bi-cash-coin', label: 'Pagar cuota' },
    { href: '/deudas', icon: 'bi-person-lines-fill', label: 'Deudas por cliente' },
    { href: '/historial-pagos', icon: 'bi-clock-history', label: 'Historial de pagos' },
  ] },
  { id: 'compras', label: 'Compras', icon: 'bi-bag', items: [
    { href: '/compras', icon: 'bi-bag-check', label: 'Compras' },
    { href: '/proveedores', icon: 'bi-truck', label: 'Proveedores' },
  ] },
  { id: 'inventario', label: 'Inventario', icon: 'bi-box-seam', items: [
    { href: '/productos', icon: 'bi-box', label: 'Productos' },
    { href: '/kardex', icon: 'bi-journal-bookmark', label: 'Kardex' },
    { href: '/ajustes', icon: 'bi-arrow-left-right', label: 'Ajustes de inventario' },
  ] },
  { href: '/reportes', icon: 'bi-bar-chart-line', label: 'Reportes' },
  { id: 'config', label: 'Configuración', icon: 'bi-gear', items: [
    { href: '/tipos-documento', icon: 'bi-hash', label: 'Tipos de documento' },
    { href: '/impuestos', icon: 'bi-percent', label: 'Impuestos' },
    { href: '/whatsapp', icon: 'bi-whatsapp', label: 'WhatsApp' },
  ] },
];

const OPEN_KEY = 'berserker.nav.open';
const COLLAPSED_KEY = 'berserker.nav.collapsed';
const isGroup = (e: NavEntry): e is NavGroup => 'items' in e;

function isActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
}

function readOpen(): string[] {
  try { return JSON.parse(localStorage.getItem(OPEN_KEY) || '[]'); } catch { return []; }
}

function SidebarNav({ pathname, collapsed }: { pathname: string; collapsed: boolean }) {
  const current = NAV.find((e) => isGroup(e) && e.items.some((it) => isActive(pathname, it.href))) as NavGroup | undefined;
  const [open, setOpen] = useState<string[]>(current ? [current.id] : []);

  // Restaura lo que el usuario dejó abierto (y siempre abre el grupo de la página actual).
  useEffect(() => {
    const saved = readOpen();
    setOpen((o) => Array.from(new Set([...saved, ...o])));
  }, []);
  useEffect(() => {
    if (current) setOpen((o) => (o.includes(current.id) ? o : [...o, current.id]));
  }, [current]);

  function toggle(id: string) {
    setOpen((o) => {
      const next = o.includes(id) ? o.filter((x) => x !== id) : [...o, id];
      try { localStorage.setItem(OPEN_KEY, JSON.stringify(next)); } catch { /* sin almacenamiento */ }
      return next;
    });
  }

  return (
    <nav className="sidebar-nav">
      {NAV.map((entry) => {
        if (!isGroup(entry)) {
          return (
            <Link key={entry.href} href={entry.href} prefetch title={collapsed ? entry.label : undefined}
              className={`nav-link ${isActive(pathname, entry.href) ? 'active' : ''}`}>
              <i className={`bi ${entry.icon}`} /><span>{entry.label}</span>
            </Link>
          );
        }
        const expanded = open.includes(entry.id);
        const hasActive = current?.id === entry.id;
        return (
          <div key={entry.id} className={`nav-group ${expanded ? 'open' : ''}`}>
            <button type="button" className={`nav-link nav-group-btn ${hasActive ? 'has-active' : ''}`}
              onClick={() => toggle(entry.id)} aria-expanded={expanded} aria-controls={`nav-${entry.id}`}
              title={collapsed ? entry.label : undefined}>
              <i className={`bi ${entry.icon}`} /><span>{entry.label}</span>
              <i className="bi bi-chevron-down nav-chevron" aria-hidden />
            </button>
            <div className="nav-sub" id={`nav-${entry.id}`}>
              <div className="nav-sub-inner">
                <div className="nav-flyout-title">{entry.label}</div>
                {entry.items.map((it) => (
                  <Link key={it.href} href={it.href} prefetch tabIndex={expanded || collapsed ? 0 : -1}
                    className={`nav-link nav-sublink ${isActive(pathname, it.href) ? 'active' : ''}`}>
                    <i className={`bi ${it.icon}`} /><span>{it.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </nav>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  // Menú recogido (solo escritorio); se recuerda entre visitas.
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    try { setCollapsed(localStorage.getItem(COLLAPSED_KEY) === '1'); } catch { /* sin almacenamiento */ }
  }, []);
  function toggleCollapsed() {
    setCollapsed((c) => {
      try { localStorage.setItem(COLLAPSED_KEY, c ? '0' : '1'); } catch { /* sin almacenamiento */ }
      return !c;
    });
  }
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
    <div className={`${open ? 'sidebar-open' : ''} ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <aside className="app-sidebar" aria-label="Menú principal">
        <div className="sidebar-brand">
          <Link href="/"><img src="/logo.png" alt="Berserker" className="sidebar-logo" /></Link>
          <button className="icon-btn show-mobile" style={{ color: '#cbd5e1', fontSize: 18 }} onClick={() => setOpen(false)} aria-label="Cerrar menú">
            <i className="bi bi-x-lg" />
          </button>
        </div>
        <SidebarNav pathname={pathname} collapsed={collapsed} />
        <div className="sidebar-footer hide-mobile">
          <button type="button" className="nav-link sidebar-collapse-btn" onClick={toggleCollapsed}
            aria-label={collapsed ? 'Expandir menú' : 'Recoger menú'} title={collapsed ? 'Expandir menú' : 'Recoger menú'}>
            <i className={`bi ${collapsed ? 'bi-chevron-double-right' : 'bi-chevron-double-left'}`} />
            <span>Recoger menú</span>
          </button>
        </div>
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

import React, { useContext, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  Home, Droplets, Cloud, User, BarChart2,
  History, Bot, LogOut, Leaf, Menu, X, Sprout,
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard',        path: '/dashboard',                icon: Home },
  { name: 'Disease Detection',path: '/dashboard/detect',         icon: Leaf },
  { name: 'Weather',          path: '/dashboard/weather',        icon: Cloud },
  { name: 'Smart Irrigation', path: '/dashboard/irrigation',     icon: Droplets },
  { name: 'Sustainability',   path: '/dashboard/sustainability',  icon: BarChart2 },
  { name: 'AI Assistant',     path: '/dashboard/assistant',      icon: Bot },
  { name: 'History',          path: '/dashboard/history',        icon: History },
  { name: 'Profile',          path: '/dashboard/profile',        icon: User },
];

const DashboardLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const isActive = (path) =>
    path === '/dashboard'
      ? location.pathname === '/dashboard'
      : location.pathname.startsWith(path);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 9,
          background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Sprout size={20} color="#fff" />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--primary-700)', lineHeight: 1.1 }}>AgriSmart AI</div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Smart Farming Platform</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0.75rem 0.75rem', overflowY: 'auto' }}>
        {navItems.map(({ name, path, icon: Icon }) => (
          <Link
            key={path}
            to={path}
            className={`nav-link${isActive(path) ? ' active' : ''}`}
            onClick={() => setMobileOpen(false)}
            style={{ marginBottom: 2 }}
          >
            <Icon size={18} />
            {name}
          </Link>
        ))}
      </nav>

      {/* User + logout */}
      <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'var(--primary-600)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.78rem', fontWeight: 700, flexShrink: 0,
          }}>
            {initials}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name || 'Farmer'}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.email || ''}
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="btn-danger"
          style={{ width: '100%', justifyContent: 'center', fontSize: '0.82rem' }}
        >
          <LogOut size={15} /> Logout
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>

      {/* ── Desktop sidebar ── */}
      <aside style={{
        width: 240, flexShrink: 0,
        background: 'var(--bg-card)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex', flexDirection: 'column',
      }} className="hidden md:flex">
        <SidebarContent />
      </aside>

      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 40,
          }}
        />
      )}

      {/* ── Mobile drawer ── */}
      <aside style={{
        position: 'fixed', top: 0, left: 0, bottom: 0,
        width: 240,
        background: 'var(--bg-card)',
        borderRight: '1px solid var(--border-subtle)',
        zIndex: 50,
        transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.25s ease',
        display: 'flex', flexDirection: 'column',
      }} className="md:hidden">
        <button
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'absolute', top: 12, right: 12,
            background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
          }}
        >
          <X size={20} />
        </button>
        <SidebarContent />
      </aside>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, maxHeight: '100vh', overflow: 'hidden' }}>

        {/* Mobile topbar */}
        <header style={{
          background: 'var(--bg-card)',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '0.75rem 1rem',
          display: 'flex', alignItems: 'center', gap: 12,
        }} className="md:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-main)', lineHeight: 0 }}
          >
            <Menu size={22} />
          </button>
          <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--primary-700)' }}>AgriSmart AI</div>
        </header>

        <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '1.5rem' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

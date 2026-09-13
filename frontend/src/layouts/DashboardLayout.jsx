import React, { useContext, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';
import {
  Home,
  Droplets,
  Cloud,
  User,
  BarChart2,
  History,
  Bot,
  LogOut,
  Leaf,
  Menu,
  X,
  Sprout,
  Activity,
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard',         path: '/dashboard',                icon: Home },
  { name: 'Disease Detection', path: '/dashboard/detect',         icon: Leaf },
  { name: 'Weather Advisory',  path: '/dashboard/weather',        icon: Cloud },
  { name: 'Smart Irrigation',  path: '/dashboard/irrigation',     icon: Droplets },
  { name: 'Sustainability',    path: '/dashboard/sustainability', icon: BarChart2 },
  { name: 'AI Agronomist Chat',path: '/dashboard/assistant',      icon: Bot },
  { name: 'Scan History',      path: '/dashboard/history',        icon: History },
  { name: 'Profile & Settings',path: '/dashboard/profile',        icon: User },
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
    ? user.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'AG';

  const isActive = (path) =>
    path === '/dashboard'
      ? location.pathname === '/dashboard'
      : location.pathname.startsWith(path);

  const currentNav = navItems.find((item) => isActive(item.path)) || {
    name: 'AgriSmart Platform',
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-sidebar)' }}>
      {/* Brand Header */}
      <Link
        to="/dashboard"
        style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          textDecoration: 'none',
          cursor: 'pointer',
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(var(--primary-rgb), 0.3)',
          }}
        >
          <Sprout size={20} color="#ffffff" />
        </div>
        <div>
          <div
            style={{
              fontWeight: 800,
              fontSize: '1.05rem',
              color: 'var(--primary-600)',
              lineHeight: 1.1,
            }}
          >
            AgriSmart <span style={{ color: 'var(--text-main)' }}>AI</span>
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            Precision Agronomy Platform
          </div>
        </div>
      </Link>

      {/* Navigation List */}
      <nav style={{ flex: 1, padding: '1rem 0.75rem', overflowY: 'auto' }}>
        {navItems.map(({ name, path, icon: Icon }) => (
          <Link
            key={path}
            to={path}
            className={`nav-link${isActive(path) ? ' active' : ''}`}
            onClick={() => setMobileOpen(false)}
            style={{ marginBottom: 4 }}
          >
            <Icon size={18} />
            {name}
          </Link>
        ))}
      </nav>

      {/* User Status & Logout Footer */}
      <div
        style={{
          padding: '1rem 1.25rem',
          borderTop: '1px solid var(--border-subtle)',
          background: 'var(--bg-card)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 12,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary-600), var(--primary-800))',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.82rem',
              fontWeight: 800,
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: '0.88rem',
                color: 'var(--text-main)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {user?.name || 'Authorized Farmer'}
            </div>
            <div
              style={{
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {user?.email || 'farmer@agrismart.ai'}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="btn-secondary"
          style={{
            width: '100%',
            justifyContent: 'center',
            fontSize: '0.82rem',
            padding: '0.45rem',
            color: '#dc2626',
            borderColor: 'rgba(220, 38, 38, 0.25)',
          }}
        >
          <LogOut size={14} /> Log Out
        </button>
      </div>
    </div>
  );

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: 'var(--bg-base)',
        transition: 'background-color 0.3s ease',
      }}
    >
      {/* Desktop Sidebar */}
      <aside
        style={{
          width: 255,
          flexShrink: 0,
          background: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'background-color 0.3s ease, border-color 0.3s ease',
        }}
        className="hidden md:flex"
      >
        <SidebarContent />
      </aside>

      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 40,
          }}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: 260,
          background: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border-subtle)',
          zIndex: 50,
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          flexDirection: 'column',
        }}
        className="md:hidden"
      >
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            zIndex: 60,
          }}
        >
          <X size={20} />
        </button>
        <SidebarContent />
      </aside>

      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          maxHeight: '100vh',
          overflow: 'hidden',
        }}
      >
        {/* Top Header Bar */}
        <header
          style={{
            background: 'var(--bg-card)',
            borderBottom: '1px solid var(--border-subtle)',
            padding: '0.85rem 1.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'background-color 0.3s ease, border-color 0.3s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-main)',
                lineHeight: 0,
                padding: 4,
              }}
              className="md:hidden"
            >
              <Menu size={22} />
            </button>
            <div>
              <h2
                style={{
                  fontSize: '1.15rem',
                  fontWeight: 800,
                  color: 'var(--text-main)',
                  margin: 0,
                }}
              >
                {currentNav.name}
              </h2>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* Engine Status Badge */}
            <div
              className="hidden sm:flex"
              style={{
                alignItems: 'center',
                gap: 6,
                background: 'rgba(var(--primary-rgb), 0.12)',
                border: '1px solid rgba(var(--primary-rgb), 0.25)',
                padding: '4px 10px',
                borderRadius: 9999,
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--primary-500)',
              }}
            >
              <span className="live-blink" />
              <span>ONNX v2.4 Engine Active</span>
            </div>

            {/* Light / Dark Mode Toggle */}
            <ThemeToggle />
          </div>
        </header>

        {/* Scrollable Viewport */}
        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '1.75rem',
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

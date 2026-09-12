import React, { useContext } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Sprout } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const MainLayout = () => {
  const { isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-base)' }}>
      <nav style={{
        background: '#fff',
        borderBottom: '1px solid var(--border-subtle)',
        position: 'sticky', top: 0, zIndex: 30,
      }}>
        <div style={{
          maxWidth: 1100, margin: '0 auto', padding: '0 1.25rem',
          height: 62, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          {/* Logo */}
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9,
              background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Sprout size={18} color="#fff" />
            </div>
            <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary-700)' }}>
              AgriSmart AI
            </span>
          </Link>

          {/* Nav links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {isAuthenticated ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="btn-primary"
                style={{ textDecoration: 'none' }}
              >
                Go to Dashboard
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  style={{ textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-muted)' }}
                  onMouseEnter={e => e.target.style.color = 'var(--primary-600)'}
                  onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
                >
                  Login
                </Link>
                <Link to="/register" className="btn-primary" style={{ textDecoration: 'none' }}>
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      <footer style={{
        background: '#1f2937', color: '#9ca3af',
        padding: '2rem 1.25rem', textAlign: 'center', fontSize: '0.85rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 6 }}>
          <div style={{
            width: 26, height: 26, borderRadius: 7,
            background: 'var(--primary-600)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Sprout size={14} color="#fff" />
          </div>
          <span style={{ color: '#f9fafb', fontWeight: 700 }}>AgriSmart AI</span>
        </div>
        <p>&copy; {new Date().getFullYear()} AgriSmart AI. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default MainLayout;

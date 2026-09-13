import React, { useContext } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Sprout, ArrowRight, ShieldCheck, Heart } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';

const MainLayout = () => {
  const { isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-base)', transition: 'background-color 0.3s ease' }}>
      {/* Frosted Sticky Navbar */}
      <nav
        style={{
          background: 'var(--bg-nav)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border-subtle)',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          transition: 'background-color 0.3s ease, border-color 0.3s ease',
        }}
      >
        <div
          style={{
            maxWidth: 1180,
            margin: '0 auto',
            padding: '0 1.5rem',
            height: 68,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Brand Logo with Smooth Scroll to Top */}
          <Link
            to="/"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            style={{
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 11,
                background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(var(--primary-rgb), 0.35)',
              }}
            >
              <Sprout size={20} color="#ffffff" />
            </div>
            <div>
              <span
                style={{
                  fontWeight: 900,
                  fontSize: '1.2rem',
                  letterSpacing: '-0.02em',
                  color: 'var(--primary-600)',
                }}
              >
                AgriSmart{' '}
                <span style={{ color: 'var(--text-main)' }}>AI</span>
              </span>
              <span
                style={{
                  display: 'block',
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  color: 'var(--text-muted)',
                  marginTop: -3,
                }}
              >
                CROP HEALTH INTELLIGENCE
              </span>
            </div>
          </Link>

          {/* Center Navigation Links - SIH Hackathon Grade */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 26,
            }}
            className="hidden md:flex"
          >
            <a
              href="/#solutions"
              style={{
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => (e.target.style.color = 'var(--primary-500)')}
              onMouseLeave={(e) => (e.target.style.color = 'var(--text-muted)')}
            >
              Solutions
            </a>
            <a
              href="/#how-it-works"
              style={{
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => (e.target.style.color = 'var(--primary-500)')}
              onMouseLeave={(e) => (e.target.style.color = 'var(--text-muted)')}
            >
              How It Works
            </a>
            <a
              href="/#architecture"
              style={{
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => (e.target.style.color = 'var(--primary-500)')}
              onMouseLeave={(e) => (e.target.style.color = 'var(--text-muted)')}
            >
              Architecture
            </a>
            <a
              href="/#benchmarks"
              style={{
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => (e.target.style.color = 'var(--primary-500)')}
              onMouseLeave={(e) => (e.target.style.color = 'var(--text-muted)')}
            >
              Dual Benchmark
            </a>
            <a
              href="/#faq"
              style={{
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => (e.target.style.color = 'var(--primary-500)')}
              onMouseLeave={(e) => (e.target.style.color = 'var(--text-muted)')}
            >
              FAQ
            </a>
          </div>

          {/* Action Bar (Theme Toggle + Auth) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ThemeToggle />

            {isAuthenticated ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="btn-primary"
                style={{ textDecoration: 'none' }}
              >
                Dashboard <ArrowRight size={15} />
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  style={{
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: 'var(--text-main)',
                    padding: '0.5rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => (e.target.style.color = 'var(--primary-500)')}
                  onMouseLeave={(e) => (e.target.style.color = 'var(--text-main)')}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="btn-primary"
                  style={{ textDecoration: 'none' }}
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Main Routed Content */}
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      {/* Modern AgriSmart Footer */}
      <footer
        style={{
          background: 'var(--bg-card)',
          borderTop: '1px solid var(--border-subtle)',
          color: 'var(--text-muted)',
          padding: '3rem 1.5rem 2rem',
          transition: 'background-color 0.3s ease, border-color 0.3s ease',
        }}
      >
        <div
          style={{
            maxWidth: 1180,
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: 16,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9,
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: 'var(--primary-600)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sprout size={16} color="#ffffff" />
            </div>
            <span
              style={{
                color: 'var(--text-main)',
                fontWeight: 800,
                fontSize: '1.05rem',
              }}
            >
              AgriSmart AI
            </span>
          </div>

          <p style={{ maxWidth: 500, fontSize: '0.88rem', margin: 0, lineHeight: 1.6 }}>
            Empowering Indian agriculture with zero-latency, in-process ONNX leaf pathology,
            hyperlocal weather disease correlation, and precision irrigation.
          </p>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              fontSize: '0.82rem',
              fontWeight: 500,
              color: 'var(--text-muted)',
            }}
          >
            <span>PlantVillage & PlantDoc Dual-Calibrated</span>
            <span>·</span>
            <span>PostgreSQL & Prisma ORM</span>
            <span>·</span>
            <span>Smart India Hackathon 2026</span>
          </div>

          <div
            style={{
              borderTop: '1px solid var(--border-subtle)',
              width: '100%',
              paddingTop: '1.25rem',
              marginTop: '0.5rem',
              fontSize: '0.8rem',
              color: 'var(--text-light)',
            }}
          >
            &copy; {new Date().getFullYear()} AgriSmart AI. Built with precision for modern farmers.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;

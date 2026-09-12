import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Cloud, Droplets, Bot, BarChart2, ShieldCheck, ArrowRight } from 'lucide-react';

const features = [
  {
    icon: Leaf,
    color: '#16a34a',
    bg: '#dcfce7',
    title: 'AI Disease Detection',
    desc: 'Upload a leaf photo and get instant diagnosis powered by an ONNX deep-learning model trained on 38 crop diseases.',
  },
  {
    icon: Cloud,
    color: '#2563eb',
    bg: '#dbeafe',
    title: 'Weather Intelligence',
    desc: 'Real-time weather data with farming-specific risk alerts — know exactly when to spray, harvest, or irrigate.',
  },
  {
    icon: Droplets,
    color: '#0891b2',
    bg: '#cffafe',
    title: 'Smart Irrigation',
    desc: 'AI-driven water scheduling based on soil moisture, crop stage, and live rainfall forecasts.',
  },
  {
    icon: Bot,
    color: '#7c3aed',
    bg: '#ede9fe',
    title: 'AI Agronomist Chat',
    desc: 'Ask farming questions in English or Hindi and get expert-level answers grounded in your scan data.',
  },
  {
    icon: BarChart2,
    color: '#d97706',
    bg: '#fef3c7',
    title: 'Sustainability Score',
    desc: 'Track your farm\'s ecological footprint across water use, chemical inputs, and crop rotation practices.',
  },
  {
    icon: ShieldCheck,
    color: '#dc2626',
    bg: '#fee2e2',
    title: 'Scan History',
    desc: 'Every diagnosis is stored with Grad-CAM heatmaps so you can track disease progression over time.',
  },
];

const stats = [
  { value: '38+',   label: 'Disease Classes' },
  { value: '95%',   label: 'Model Accuracy' },
  { value: '<50ms', label: 'Inference Time' },
  { value: '10+',   label: 'Crops Supported' },
];

const LandingPage = () => (
  <div>
    {/* ── Hero ── */}
    <section style={{
      background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #f0fdf4 100%)',
      padding: '5rem 1.25rem 4rem',
      textAlign: 'center',
    }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: '#dcfce7', border: '1px solid #bbf7d0',
          borderRadius: 9999, padding: '5px 14px',
          fontSize: '0.8rem', fontWeight: 600, color: '#15803d',
          marginBottom: '1.5rem',
        }}>
          <ShieldCheck size={14} /> Powered by ONNX · No Python Required
        </div>

        <h1 style={{
          fontSize: 'clamp(2rem, 5vw, 3.25rem)',
          fontWeight: 900, lineHeight: 1.15,
          color: '#111827', marginBottom: '1.25rem',
        }}>
          AI-Powered Crop Health{' '}
          <span style={{ color: 'var(--primary-600)' }}>Intelligence</span>
        </h1>

        <p style={{ fontSize: '1.1rem', color: '#4b5563', lineHeight: 1.7, marginBottom: '2.25rem' }}>
          Detect diseases instantly, optimise irrigation, and get smart farming advice —
          all from a single platform built for modern farmers.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Link to="/register" className="btn-primary"
            style={{ textDecoration: 'none', padding: '0.75rem 1.75rem', fontSize: '0.95rem' }}>
            Start for Free <ArrowRight size={16} />
          </Link>
          <Link to="/login"
            style={{
              textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '0.75rem 1.75rem', fontSize: '0.95rem',
              border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)',
              color: 'var(--text-main)', fontWeight: 500, background: '#fff',
            }}>
            Sign In
          </Link>
        </div>
      </div>
    </section>

    {/* ── Stats ── */}
    <section style={{ background: 'var(--primary-600)', padding: '2.5rem 1.25rem' }}>
      <div style={{
        maxWidth: 900, margin: '0 auto',
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '1.5rem', textAlign: 'center',
      }}>
        {stats.map(s => (
          <div key={s.label}>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: '0.82rem', color: '#bbf7d0', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </section>

    {/* ── Features ── */}
    <section id="features" style={{ padding: '5rem 1.25rem', background: 'var(--bg-base)' }}>
      <div style={{ maxWidth: 1050, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#111827', marginBottom: 10 }}>
            Everything your farm needs
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: 520, margin: '0 auto' }}>
            Six intelligent modules working together to give you complete visibility and control over crop health.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.25rem',
        }}>
          {features.map(f => (
            <div key={f.title} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10,
                background: f.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <f.icon size={22} color={f.color} />
              </div>
              <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#111827' }}>{f.title}</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ── CTA ── */}
    <section style={{
      background: 'linear-gradient(135deg, var(--primary-600), var(--primary-700))',
      padding: '4rem 1.25rem', textAlign: 'center',
    }}>
      <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', marginBottom: '0.75rem' }}>
        Ready to protect your crops?
      </h2>
      <p style={{ color: '#bbf7d0', marginBottom: '2rem', fontSize: '1rem' }}>
        Join farmers already using AgriSmart AI to reduce crop loss and optimise yield.
      </p>
      <Link to="/register"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none',
          background: '#fff', color: 'var(--primary-700)',
          fontWeight: 700, fontSize: '0.95rem',
          padding: '0.75rem 2rem', borderRadius: 'var(--radius-sm)',
        }}>
        Create Free Account <ArrowRight size={16} />
      </Link>
    </section>
  </div>
);

export default LandingPage;

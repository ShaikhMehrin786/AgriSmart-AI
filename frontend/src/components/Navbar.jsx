import React from 'react';
import { Sprout, BarChart3, History, Bot, ShieldCheck } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  return (
    <header style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(10, 16, 13, 0.8)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 100 }}>
      <div className="container flex items-center justify-between" style={{ height: '70px' }}>
        <div className="flex items-center gap-4" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('detect')}>
          <div style={{ background: 'linear-gradient(135deg, #10b981, #059669)', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sprout color="#ffffff" size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(90deg, #34d399, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              AgriSmart AI
            </h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SIH 2026 • Decision Support</p>
          </div>
        </div>

        <nav className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab('detect')}
            className={activeTab === 'detect' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.875rem' }}
          >
            <Sprout size={16} /> Diagnosis
          </button>
          <button
            onClick={() => setActiveTab('advisory')}
            className={activeTab === 'advisory' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.875rem' }}
          >
            <BarChart3 size={16} /> Advisory
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={activeTab === 'history' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.875rem' }}
          >
            <History size={16} /> History
          </button>
        </nav>
      </div>
    </header>
  );
}

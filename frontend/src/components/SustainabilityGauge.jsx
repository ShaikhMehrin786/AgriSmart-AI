import React from 'react';
import { Leaf, Award } from 'lucide-react';

export default function SustainabilityGauge({ sustainability }) {
  if (!sustainability) return null;

  const { totalScore, grade, breakdown } = sustainability;

  return (
    <div className="glass-panel">
      <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
        <div className="flex items-center gap-4">
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '8px', borderRadius: '8px' }}>
            <Leaf size={20} color="#34d399" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Sustainability Index</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ecological stewardship & efficiency score</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Award size={18} color="#fbbf24" />
          <span style={{ fontWeight: 800, fontSize: '1.25rem', color: '#34d399' }}>{totalScore} / 100</span>
        </div>
      </div>

      <div className="flex-col gap-4">
        {breakdown?.map((item, idx) => (
          <div key={idx} style={{ marginBottom: '10px' }}>
            <div className="flex justify-between" style={{ fontSize: '0.8rem', marginBottom: '4px' }}>
              <span>{item.category}</span>
              <span style={{ color: 'var(--text-muted)' }}>{item.score} / {item.max} pts ({item.status})</span>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.08)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{
                width: `${(item.score / item.max) * 100}%`,
                background: 'linear-gradient(90deg, #10b981, #34d399)',
                height: '100%'
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

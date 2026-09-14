import React from 'react';
import { Leaf, Award, ShieldCheck } from 'lucide-react';

export default function SustainabilityGauge({ sustainability }) {
  if (!sustainability) return null;

  const score = sustainability.totalScore ?? sustainability.sustainabilityScore ?? sustainability.score ?? 80;
  const grade = sustainability.grade || (score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 55 ? 'C' : 'D');
  const level = sustainability.level || sustainability.rating || 'Good Stewardship';
  
  // Support both breakdown and factors
  const items = sustainability.breakdown || (sustainability.factors ? sustainability.factors.map(f => ({
    category: f.name,
    score: f.score,
    max: f.max || 100,
    status: f.score >= 80 ? 'Optimal' : f.score >= 60 ? 'Good' : 'Moderate'
  })) : []);

  const gradeColor = grade === 'A' ? '#16a34a' : grade === 'B' ? '#65a30d' : grade === 'C' ? '#d97706' : '#dc2626';

  return (
    <div className="card" style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            background: 'rgba(34, 197, 94, 0.12)',
            padding: 8,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Leaf size={20} color="#16a34a" />
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>Farm Sustainability Index</h3>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
              Resource efficiency & ecological stewardship
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: '0.8rem',
            fontWeight: 800,
            color: gradeColor,
            background: `${gradeColor}20`,
            padding: '2px 10px',
            borderRadius: 6
          }}>
            Grade {grade}
          </span>
          <span style={{ fontWeight: 800, fontSize: '1.2rem', color: gradeColor }}>
            {score} / 100
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((item, idx) => {
          const pct = Math.min(100, Math.round((item.score / (item.max || 100)) * 100));
          const barColor = pct >= 75 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626';
          return (
            <div key={idx}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 4 }}>
                <span style={{ fontWeight: 600 }}>{item.category}</span>
                <span style={{ color: 'var(--text-muted)' }}>
                  {item.score} / {item.max || 100} pts {item.status ? `(${item.status})` : ''}
                </span>
              </div>
              <div className="confidence-bar-track">
                <div
                  className="confidence-bar-fill"
                  style={{ width: `${pct}%`, background: barColor }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {sustainability.explanation && (
        <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
          <ShieldCheck size={14} color="#16a34a" style={{ flexShrink: 0, marginTop: 2 }} />
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            {sustainability.explanation}
          </span>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Leaf, Award, RefreshCw, AlertTriangle } from 'lucide-react';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';
import api from '../services/api';

const GRADE_COLOR = { A: '#16a34a', B: '#65a30d', C: '#d97706', D: '#ea580c', F: '#dc2626' };

const Skeleton = ({ h = 40 }) => (
  <div className="skeleton" style={{ height: h, borderRadius: 8, marginBottom: 10 }} />
);

const Sustainability = () => {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  const fetch_ = () => {
    setLoading(true);
    setError(false);
    api.get('/advisory/sustainability-score')
      .then(r => { if (r.data.success) setData(r.data.data); else setError(true); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch_(); }, []);

  const gradeColor = data ? (GRADE_COLOR[data.grade] || '#16a34a') : '#16a34a';
  const radialData = data ? [{ value: data.score, fill: gradeColor }] : [];

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: 4 }}>Farm Sustainability Score</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Track your ecological impact and efficiency metrics.</p>
        </div>
        <button className="btn-secondary" onClick={fetch_} disabled={loading}>
          <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="card">
          <Skeleton h={180} />
          <Skeleton h={40} />
          <Skeleton h={40} />
          <Skeleton h={40} />
        </div>
      ) : error ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>
          <AlertTriangle size={32} style={{ margin: '0 auto 10px', opacity: 0.4, display: 'block' }} />
          <p>Could not load sustainability data.</p>
          <button className="btn-primary" style={{ marginTop: 14 }} onClick={fetch_}>Retry</button>
        </div>
      ) : data && (
        <>
          {/* Score ring + grade */}
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
            {/* RadialBar gauge */}
            <div style={{ width: 180, height: 180, flexShrink: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  innerRadius="70%" outerRadius="100%"
                  data={radialData}
                  startAngle={210} endAngle={-30}
                  barSize={16}
                >
                  <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                  <RadialBar
                    background={{ fill: '#f0f0f0' }}
                    dataKey="value"
                    cornerRadius={8}
                    angleAxisId={0}
                    max={100}
                  />
                  {/* Centre text */}
                  <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle"
                    style={{ fill: gradeColor, fontSize: '2rem', fontWeight: 900 }}>
                    {data.score}
                  </text>
                  <text x="50%" y="64%" textAnchor="middle"
                    style={{ fill: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    / 100
                  </text>
                </RadialBarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <Award size={22} color="#f59e0b" />
                <span style={{
                  fontSize: '1.75rem', fontWeight: 900,
                  color: gradeColor,
                  background: `${gradeColor}22`, padding: '2px 14px', borderRadius: 8,
                }}>
                  Grade {data.grade}
                </span>
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 6 }}>{data.level}</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.65 }}>
                Your farm is performing{' '}
                <strong style={{ color: gradeColor }}>{data.score >= 75 ? 'above average' : data.score >= 50 ? 'at average' : 'below average'}</strong>{' '}
                in sustainability. Focus on the lowest-scoring factors below to improve your rating.
              </p>
            </div>
          </div>

          {/* Factor breakdown */}
          {data.factors?.length > 0 && (
            <div className="card">
              <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1.25rem' }}>Factor Breakdown</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {data.factors.map((f, i) => {
                  // backend may return score as 0-100 directly, or score/max
                  const rawScore = f.score ?? 0;
                  const maxVal   = f.max ?? 100;
                  const pct      = Math.min(100, Math.round((rawScore / maxVal) * 100));
                  const color    = pct >= 75 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626';
                  return (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.875rem' }}>
                        <span style={{ fontWeight: 600 }}>{f.name}</span>
                        <span style={{ fontWeight: 700, color }}>
                          {rawScore}{f.max ? ` / ${f.max}` : '%'}
                        </span>
                      </div>
                      <div className="confidence-bar-track">
                        <div className="confidence-bar-fill" style={{ width: `${pct}%`, background: color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="card" style={{ borderLeft: '4px solid #16a34a' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <Leaf size={18} color="#16a34a" />
              <h3 style={{ fontWeight: 700, fontSize: '0.95rem' }}>How to Improve</h3>
            </div>
            <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                'Reduce chemical pesticide use — switch to IPM (Integrated Pest Management).',
                'Optimise irrigation scheduling using the Smart Irrigation planner.',
                'Increase crop rotation frequency to improve soil health.',
                'Add organic matter (compost) to reduce synthetic fertiliser dependence.',
              ].map((tip, i) => (
                <li key={i} style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{tip}</li>
              ))}
            </ul>
          </div>
        </>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Sustainability;

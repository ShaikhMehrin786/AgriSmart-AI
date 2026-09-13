import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, AlertTriangle, Calendar, Leaf, BarChart2 } from 'lucide-react';
import api from '../services/api';

const Skeleton = ({ h = 20, mb = 8 }) => (
  <div className="skeleton" style={{ height: h, marginBottom: mb, borderRadius: 6 }} />
);

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';

const PredictionDetails = () => {
  const { id } = useParams();
  const [prediction, setPrediction] = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(false);
  const [advisory,   setAdvisory]   = useState(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
    api.get(`/predictions/${id}`)
      .then(r => {
        if (r.data.success) {
          setPrediction(r.data.prediction);
          // Fetch explainable recommendations grounded in weather and diagnosis
          api.post('/advisory/recommendations', {
            crop: r.data.prediction.crop,
            disease: r.data.prediction.disease
          })
            .then(recRes => {
              if (recRes.data.success) setAdvisory(recRes.data.data);
            })
            .catch(err => console.warn('Could not load recommendations:', err.message));
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  const isHealthy = prediction?.disease?.toLowerCase().includes('healthy');
  const confidencePct = prediction?.confidence ?? 0;
  const confColor = confidencePct >= 85 ? '#16a34a' : confidencePct >= 65 ? '#d97706' : '#dc2626';

  const cleanImagePath = prediction?.imagePath
    ? prediction.imagePath.replace(/\\/g, '/').replace(/^\/+/, '')
    : null;

  const imageUrl = cleanImagePath
    ? (cleanImagePath.startsWith('http://') || cleanImagePath.startsWith('https://')
        ? cleanImagePath
        : `${API_BASE}/${cleanImagePath}`)
    : null;

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Back */}
      <Link to="/dashboard/history"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.875rem', width: 'fit-content' }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--primary-600)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
      >
        <ArrowLeft size={16} /> Back to History
      </Link>

      {loading ? (
        <div className="card">
          <Skeleton h={28} mb={14} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <Skeleton h={280} />
            <div>
              <Skeleton h={32} mb={12} />
              <Skeleton h={20} mb={8} />
              <Skeleton h={20} mb={8} />
              <Skeleton h={20} mb={8} />
              <Skeleton h={60} mb={8} />
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>
          <AlertTriangle size={32} style={{ margin: '0 auto 10px', opacity: 0.4, display: 'block' }} />
          <p style={{ marginBottom: 14 }}>Could not load prediction details.</p>
          <Link to="/dashboard/history" className="btn-primary" style={{ textDecoration: 'none' }}>
            Back to History
          </Link>
        </div>
      ) : prediction && (
        <>
          {/* Page title */}
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
            Scan #{prediction.id?.substring(0, 8)}
          </h1>

          {/* Main grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.2fr)', gap: '1.25rem' }}>

            {/* Image */}
            <div className="card" style={{ padding: '0.85rem' }}>
              {imageUrl && !imageError ? (
                <>
                  <img
                    src={imageUrl}
                    alt="Scanned leaf"
                    onError={() => setImageError(true)}
                    style={{ width: '100%', borderRadius: 'var(--radius-sm)', objectFit: 'cover', maxHeight: 320 }}
                  />
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8, textAlign: 'center' }}>
                    Original uploaded image
                  </p>
                </>
              ) : (
                <div style={{
                  height: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', fontSize: '0.85rem', gap: 8
                }}>
                  <Leaf size={32} style={{ opacity: 0.35 }} />
                  <span>Image not available</span>
                </div>
              )}
            </div>

            {/* Details */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Status */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                background: isHealthy ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                border: isHealthy ? '1px solid rgba(34, 197, 94, 0.25)' : '1px solid rgba(239, 68, 68, 0.25)',
              }}>
                {isHealthy
                  ? <CheckCircle2 size={20} color="var(--primary-500)" />
                  : <AlertTriangle size={20} color="#ef4444" />}
                <span style={{ fontWeight: 700, color: isHealthy ? 'var(--primary-400)' : '#f87171', fontSize: '0.95rem' }}>
                  {isHealthy ? 'Healthy Crop' : 'Disease Detected'}
                </span>
              </div>

              {/* Diagnosis */}
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 2 }}>
                  Diagnosis
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: isHealthy ? '#16a34a' : '#dc2626' }}>
                  {prediction.disease}
                </div>
              </div>

              {/* Meta row */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { icon: Leaf,     label: 'Crop',     value: prediction.crop },
                  { icon: BarChart2, label: 'Severity', value: prediction.severity },
                  { icon: Calendar, label: 'Date',     value: new Date(prediction.createdAt).toLocaleString() },
                ].map(row => (
                  <div key={row.label} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px', background: '#f9fafb', borderRadius: 'var(--radius-sm)',
                    fontSize: '0.875rem',
                  }}>
                    <row.icon size={16} color="var(--text-muted)" />
                    <span style={{ color: 'var(--text-muted)', minWidth: 64 }}>{row.label}</span>
                    <span style={{ fontWeight: 600 }}>{row.value || '—'}</span>
                  </div>
                ))}
              </div>

              {/* Confidence bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.82rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Model Confidence</span>
                  <span style={{ fontWeight: 700, color: confColor }}>{confidencePct}%</span>
                </div>
                <div className="confidence-bar-track">
                  <div className="confidence-bar-fill" style={{ width: `${confidencePct}%`, background: confColor }} />
                </div>
              </div>

              {/* Ask assistant CTA */}
              <Link to="/dashboard/assistant"
                className="btn-primary"
                style={{ textDecoration: 'none', justifyContent: 'center', marginTop: 'auto' }}>
                Ask AI Assistant about this diagnosis
              </Link>
            </div>
          </div>

          {/* Recommendation Engine Advisory Panel */}
          {advisory && advisory.recommendations?.length > 0 ? (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <h3 style={{ fontWeight: 800, fontSize: '1.1rem' }}>Agronomic Recommendations</h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {advisory.summary}
                  </p>
                </div>
                <span className={
                  advisory.riskLevel === 'CRITICAL' ? 'badge badge-critical' :
                  advisory.riskLevel === 'HIGH' ? 'badge badge-high' :
                  advisory.riskLevel === 'MEDIUM' ? 'badge badge-moderate' : 'badge badge-low'
                }>
                  Risk: {advisory.riskLevel}
                </span>
              </div>

              {advisory.weather && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: '#f9fafb', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                  <span>Weather Context:</span>
                  <span>🌡️ {advisory.weather.temperature}°C</span>
                  <span>💧 {advisory.weather.humidity}% Humidity</span>
                  <span>🌧️ {advisory.weather.rainProbability}% Rain Prob.</span>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {advisory.recommendations.map((rec, i) => {
                  const isHigh = rec.priority === 'CRITICAL' || rec.priority === 'HIGH';
                  const isMed = rec.priority === 'MEDIUM';
                  return (
                    <div
                      key={i}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-sm)',
                        background: isHigh ? '#fef2f2' : isMed ? '#fefce8' : '#f0fdf4',
                        border: `1px solid ${isHigh ? '#fca5a5' : isMed ? '#fde047' : '#bbf7d0'}`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: isHigh ? '#991b1b' : isMed ? '#854d0e' : '#166534' }}>
                          {rec.title}
                        </span>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <span style={{
                            fontSize: '0.68rem', fontWeight: 700, padding: '1px 6px', borderRadius: 4,
                            background: isHigh ? '#fee2e2' : isMed ? '#fef9c3' : '#dcfce7',
                            color: isHigh ? '#991b1b' : isMed ? '#854d0e' : '#166534'
                          }}>
                            {rec.priority}
                          </span>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', padding: '1px 6px', background: '#ffffff', borderRadius: 4, border: '1px solid var(--border-subtle)' }}>
                            {rec.type}
                          </span>
                        </div>
                      </div>
                      <p style={{ fontSize: '0.84rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                        {rec.reason}
                      </p>
                      {rec.action && (
                        <p style={{ fontSize: '0.82rem', color: isHigh ? '#7f1d1d' : isMed ? '#713f12' : '#14532d', fontWeight: 500, marginTop: 2 }}>
                          👉 <strong>Action:</strong> {rec.action}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Fallback recommendation if advisory is loading or unavailable */
            <div className="card" style={{ borderLeft: `4px solid ${isHealthy ? '#16a34a' : '#d97706'}` }}>
              <h3 style={{ fontWeight: 700, marginBottom: 8, fontSize: '0.95rem' }}>Treatment Recommendation</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.7 }}>
                {isHealthy
                  ? 'Your crop is healthy. Maintain your current care routine. Continue monitoring weekly for any early signs of stress, discolouration, or lesions.'
                  : `${prediction.disease} has been detected. Consider consulting your agronomist or using the AI Assistant for specific organic and chemical treatment options tailored to your conditions.`}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PredictionDetails;

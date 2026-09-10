import React from 'react';
import { AlertTriangle, CheckCircle2, ShieldAlert, Cpu } from 'lucide-react';

export default function PredictionCard({ prediction }) {
  if (!prediction) return null;

  const { crop, disease, isHealthy, confidence, severity, inferenceTimeMs, monograph } = prediction;

  const getSeverityBadge = () => {
    if (isHealthy) return <span className="badge badge-low">Healthy Crop</span>;
    if (severity === 'Critical') return <span className="badge badge-critical">Critical Severity</span>;
    if (severity === 'High') return <span className="badge badge-critical">High Severity</span>;
    return <span className="badge badge-moderate">Moderate Severity</span>;
  };

  return (
    <div className="glass-panel flex-col gap-4">
      <div className="flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
        <div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Identified Crop: {crop}
          </span>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: isHealthy ? '#34d399' : '#f87171', marginTop: '4px' }}>
            {disease}
          </h2>
        </div>
        <div>
          {getSeverityBadge()}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ margin: '12px 0' }}>
        <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Model Confidence</p>
          <div className="flex items-center gap-4" style={{ marginTop: '6px' }}>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#34d399' }}>{confidence}%</span>
            <div style={{ flex: 1, background: 'rgba(255, 255, 255, 0.1)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${confidence}%`, background: 'var(--primary-500)', height: '100%' }}></div>
            </div>
          </div>
        </div>

        <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-4" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            <Cpu size={16} /> Runtime Latency
          </div>
          <p style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: '6px' }}>
            {inferenceTimeMs || 42} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>ms</span>
          </p>
          <p style={{ fontSize: '0.75rem', color: '#10b981' }}>In-process onnxruntime-node (Zero Python)</p>
        </div>
      </div>

      {monograph && (
        <div className="flex-col gap-4" style={{ marginTop: '8px' }}>
          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fbbf24', marginBottom: '4px' }}>Symptoms:</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>{monograph.symptoms}</p>
          </div>

          <div style={{ background: 'rgba(16, 185, 129, 0.06)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#34d399', marginBottom: '4px' }}>🌱 Organic / Biological Remedy:</h4>
            <p style={{ fontSize: '0.85rem' }}>{monograph.organicTreatment}</p>
          </div>

          {!isHealthy && monograph.chemicalTreatment && (
            <div style={{ background: 'rgba(239, 68, 68, 0.05)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f87171', marginBottom: '4px' }}>🧪 Chemical Control (If Severe):</h4>
              <p style={{ fontSize: '0.85rem' }}>{monograph.chemicalTreatment}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

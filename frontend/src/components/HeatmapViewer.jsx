import React, { useState } from 'react';
import { Eye, Layers, Sparkles } from 'lucide-react';

export default function HeatmapViewer({ heatmapUrl, originalPreview }) {
  const [opacity, setOpacity] = useState(80);
  const [viewMode, setViewMode] = useState('overlay'); // 'overlay', 'sideBySide'

  if (!heatmapUrl) return null;

  return (
    <div className="glass-panel">
      <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
        <div className="flex items-center gap-4">
          <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '8px', borderRadius: '8px' }}>
            <Sparkles size={20} color="#fbbf24" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Explainable AI (Grad-CAM)</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Visual proof of model lesion localization</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Heatmap Intensity:</label>
          <input
            type="range"
            min="0"
            max="100"
            value={opacity}
            onChange={(e) => setOpacity(e.target.value)}
            style={{ accentColor: 'var(--primary-500)', cursor: 'pointer' }}
          />
        </div>
      </div>

      <div style={{ position: 'relative', textAlign: 'center', background: '#000', borderRadius: 'var(--radius-md)', overflow: 'hidden', padding: '10px' }}>
        <img
          src={heatmapUrl}
          alt="Grad-CAM Overlay"
          style={{
            maxHeight: '300px',
            borderRadius: 'var(--radius-sm)',
            objectFit: 'contain',
            opacity: opacity / 100,
            transition: 'opacity 0.15s ease'
          }}
        />
        <div style={{ marginTop: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <span style={{ color: '#ef4444', fontWeight: 700 }}>■ Red:</span> High Neural Activation (Lesion Focus) | 
          <span style={{ color: '#3b82f6', fontWeight: 700 }}> ■ Blue:</span> Background Ignored
        </div>
      </div>
    </div>
  );
}

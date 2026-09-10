import React from 'react';
import { Waves, Check, Clock, AlertTriangle } from 'lucide-react';

export default function IrrigationCard({ advisory }) {
  if (!advisory) return null;

  const isDelay = advisory.action?.toLowerCase().includes('delay');
  const isUrgent = advisory.urgency === 'Urgent';

  return (
    <div className="glass-panel">
      <div className="flex items-center justify-between" style={{ marginBottom: '14px' }}>
        <div className="flex items-center gap-4">
          <div style={{ background: 'rgba(59, 130, 246, 0.15)', padding: '8px', borderRadius: '8px' }}>
            <Waves size={20} color="#60a5fa" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Smart Irrigation Advisory</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Weather & soil moisture balanced scheduling</p>
          </div>
        </div>

        <span className={isDelay ? 'badge badge-low' : isUrgent ? 'badge badge-critical' : 'badge badge-moderate'}>
          {advisory.action}
        </span>
      </div>

      <div style={{
        background: isDelay ? 'rgba(16, 185, 129, 0.08)' : 'rgba(59, 130, 246, 0.08)',
        border: `1px solid ${isDelay ? 'rgba(16, 185, 129, 0.25)' : 'rgba(59, 130, 246, 0.25)'}`,
        padding: '14px',
        borderRadius: 'var(--radius-sm)'
      }}>
        <div className="flex items-center gap-4" style={{ marginBottom: '6px' }}>
          {isDelay ? <Clock size={16} color="#34d399" /> : <AlertTriangle size={16} color="#60a5fa" />}
          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{advisory.action}</span>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
          {advisory.reason}
        </p>
      </div>
    </div>
  );
}

import React from 'react';
import { Waves, Clock, AlertTriangle, Droplets, CloudRain, Thermometer } from 'lucide-react';

export default function IrrigationCard({ advisory }) {
  if (!advisory) return null;

  const isDelay = advisory.action?.toLowerCase().includes('delay') || advisory.action?.toLowerCase().includes('no irrigation');
  const isUrgent = advisory.urgency === 'Urgent';
  const isLimit = advisory.action?.toLowerCase().includes('limit');

  const badgeClass = isDelay ? 'badge badge-low' : isUrgent ? 'badge badge-critical' : isLimit ? 'badge badge-moderate' : 'badge badge-info';

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ background: '#dbeafe', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Waves size={20} color="#2563eb" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Smart Irrigation Advisory</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Weather & soil moisture balanced schedule</p>
          </div>
        </div>

        <span className={badgeClass}>
          {advisory.action}
        </span>
      </div>

      <div style={{
        background: isDelay ? '#f0fdf4' : isUrgent ? '#fef2f2' : '#f0f9ff',
        border: `1px solid ${isDelay ? '#bbf7d0' : isUrgent ? '#fca5a5' : '#bae6fd'}`,
        padding: '14px',
        borderRadius: 'var(--radius-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '6px' }}>
          {isDelay ? <Clock size={16} color="#16a34a" /> : isUrgent ? <AlertTriangle size={16} color="#dc2626" /> : <Droplets size={16} color="#0284c7" />}
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: isDelay ? '#166534' : isUrgent ? '#991b1b' : '#0369a1' }}>
            {advisory.action}
          </span>
          {advisory.urgency && (
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
              Urgency: <strong>{advisory.urgency}</strong>
            </span>
          )}
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
          {advisory.reason}
        </p>
      </div>

      {(advisory.waterRequired || advisory.waterVolumeTotal) && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
          {advisory.waterRequired && (
            <div style={{ background: '#f9fafb', border: '1px solid var(--border-subtle)', padding: '10px 12px', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Application Rate</span>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: isDelay ? '#16a34a' : '#2563eb', marginTop: 2 }}>{advisory.waterRequired}</div>
            </div>
          )}
          {advisory.waterVolumeTotal && (
            <div style={{ background: '#f9fafb', border: '1px solid var(--border-subtle)', padding: '10px 12px', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Field Volume</span>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: isDelay ? '#16a34a' : '#0891b2', marginTop: 2 }}>{advisory.waterVolumeTotal}</div>
            </div>
          )}
        </div>
      )}

      {advisory.weather && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: '#f9fafb', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
          <span>Telemetric Context:</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Thermometer size={13} color="#dc2626" /> {advisory.weather.temperature}°C
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Droplets size={13} color="#2563eb" /> {advisory.weather.humidity}% RH
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <CloudRain size={13} color="#0891b2" /> {advisory.weather.rainProbability}% Rain
          </span>
        </div>
      )}

      {advisory.nextIrrigation && (
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', paddingTop: 4, borderTop: '1px solid var(--border-subtle)' }}>
          Next scheduled irrigation: <strong style={{ color: 'var(--text-main)' }}>{advisory.nextIrrigation}</strong>
        </div>
      )}
    </div>
  );
}

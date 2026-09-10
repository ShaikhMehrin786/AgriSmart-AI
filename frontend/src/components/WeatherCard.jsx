import React from 'react';
import { CloudRain, Thermometer, Droplets, Wind, AlertOctagon } from 'lucide-react';

export default function WeatherCard({ weather, risk }) {
  if (!weather) return null;

  const isHighRisk = risk?.riskLevel?.includes('CRITICAL') || risk?.riskLevel?.includes('HIGH');

  return (
    <div className="glass-panel">
      <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Location: {weather.location}</span>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Weather Intelligence & Risk</h3>
        </div>
        {risk && (
          <span className={isHighRisk ? 'badge badge-critical' : 'badge badge-low'}>
            {risk.riskLevel}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '14px', borderRadius: 'var(--radius-sm)' }}>
          <div className="flex items-center gap-4" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            <Thermometer size={16} color="#f59e0b" /> Temperature
          </div>
          <p style={{ fontSize: '1.3rem', fontWeight: 700, marginTop: '4px' }}>{weather.temperature}°C</p>
        </div>

        <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '14px', borderRadius: 'var(--radius-sm)' }}>
          <div className="flex items-center gap-4" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            <Droplets size={16} color="#3b82f6" /> Humidity
          </div>
          <p style={{ fontSize: '1.3rem', fontWeight: 700, marginTop: '4px' }}>{weather.humidity}%</p>
        </div>

        <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '14px', borderRadius: 'var(--radius-sm)' }}>
          <div className="flex items-center gap-4" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            <CloudRain size={16} color="#10b981" /> Rain Probability
          </div>
          <p style={{ fontSize: '1.3rem', fontWeight: 700, marginTop: '4px' }}>{weather.rainProbability}%</p>
        </div>
      </div>

      {risk?.alertMessage && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          borderRadius: 'var(--radius-sm)',
          background: isHighRisk ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.08)',
          border: `1px solid ${isHighRisk ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.2)'}`,
          display: 'flex',
          gap: '10px',
          alignItems: 'flex-start'
        }}>
          <AlertOctagon size={18} color={isHighRisk ? '#f87171' : '#34d399'} style={{ flexShrink: 0, marginTop: '2px' }} />
          <p style={{ fontSize: '0.85rem', color: isHighRisk ? '#fca5a5' : '#a7f3d0' }}>
            {risk.alertMessage}
          </p>
        </div>
      )}
    </div>
  );
}

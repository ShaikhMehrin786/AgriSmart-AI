import React from 'react';
import { CloudRain, Thermometer, Droplets, Wind, AlertOctagon } from 'lucide-react';

export default function WeatherCard({ weather, risk }) {
  if (!weather) return null;

  const effectiveRisk = risk || weather.pathogenRisk;
  const isHighRisk = effectiveRisk?.riskLevel?.includes('CRITICAL') || effectiveRisk?.riskLevel?.includes('HIGH');
  const isModerateRisk = effectiveRisk?.riskLevel?.includes('MODERATE');

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Location: {weather.location}</span>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Weather Intelligence & Pathogen Risk</h3>
        </div>
        {effectiveRisk && (
          <span className={isHighRisk ? 'badge badge-critical' : isModerateRisk ? 'badge badge-moderate' : 'badge badge-low'}>
            {effectiveRisk.riskLevel}
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
        <div style={{ background: '#f9fafb', border: '1px solid var(--border-subtle)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: '0.78rem' }}>
            <Thermometer size={15} color="#dc2626" /> Temperature
          </div>
          <p style={{ fontSize: '1.3rem', fontWeight: 800, color: '#dc2626', marginTop: '4px' }}>{weather.temperature}°C</p>
        </div>

        <div style={{ background: '#f9fafb', border: '1px solid var(--border-subtle)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: '0.78rem' }}>
            <Droplets size={15} color="#2563eb" /> Humidity
          </div>
          <p style={{ fontSize: '1.3rem', fontWeight: 800, color: '#2563eb', marginTop: '4px' }}>{weather.humidity}%</p>
        </div>

        <div style={{ background: '#f9fafb', border: '1px solid var(--border-subtle)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: '0.78rem' }}>
            <CloudRain size={15} color="#0891b2" /> Rain Prob.
          </div>
          <p style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0891b2', marginTop: '4px' }}>{weather.rainProbability}%</p>
        </div>

        {weather.windSpeed != null && (
          <div style={{ background: '#f9fafb', border: '1px solid var(--border-subtle)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: '0.78rem' }}>
              <Wind size={15} color="#7c3aed" /> Wind Speed
            </div>
            <p style={{ fontSize: '1.3rem', fontWeight: 800, color: '#7c3aed', marginTop: '4px' }}>{weather.windSpeed} km/h</p>
          </div>
        )}
      </div>

      {effectiveRisk?.alertMessage && (
        <div style={{
          padding: '12px 14px',
          borderRadius: 'var(--radius-sm)',
          background: isHighRisk ? '#fef2f2' : isModerateRisk ? '#fefce8' : '#f0fdf4',
          border: `1px solid ${isHighRisk ? '#fca5a5' : isModerateRisk ? '#fde047' : '#86efac'}`,
          display: 'flex',
          gap: '10px',
          alignItems: 'flex-start'
        }}>
          <AlertOctagon size={18} color={isHighRisk ? '#dc2626' : isModerateRisk ? '#ca8a04' : '#16a34a'} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: isHighRisk ? '#991b1b' : isModerateRisk ? '#854d0e' : '#166534', textTransform: 'uppercase' }}>
              Pathogen Alert · {effectiveRisk.riskLevel}
            </div>
            <p style={{ fontSize: '0.85rem', color: isHighRisk ? '#7f1d1d' : isModerateRisk ? '#713f12' : '#14532d', marginTop: 2, lineHeight: 1.5 }}>
              {effectiveRisk.alertMessage}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

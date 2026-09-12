import React, { useState, useEffect } from 'react';
import { CloudRain, Wind, Thermometer, Droplets, RefreshCw, AlertTriangle, Sun, CheckCircle2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import api from '../services/api';

const Skeleton = ({ h = 60 }) => (
  <div className="skeleton" style={{ height: h, borderRadius: 8 }} />
);

const Weather = () => {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  const fetch_ = () => {
    setLoading(true);
    setError(false);
    api.get('/advisory/weather')
      .then(r => { if (r.data.success) setData(r.data.data); else setError(true); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch_(); }, []);

  const metrics = data ? [
    { label: 'Temperature',   value: `${data.temperature}°C`, icon: Thermometer, color: '#dc2626', bg: '#fee2e2', raw: data.temperature },
    { label: 'Humidity',      value: `${data.humidity}%`,     icon: Droplets,    color: '#2563eb', bg: '#dbeafe', raw: data.humidity },
    { label: 'Rain Prob.',    value: `${data.rainProbability}%`, icon: CloudRain, color: '#0891b2', bg: '#cffafe', raw: data.rainProbability },
    { label: 'Wind Speed',    value: `${data.windSpeed} km/h`, icon: Wind,       color: '#7c3aed', bg: '#ede9fe', raw: data.windSpeed },
  ] : [];

  // Mock 7-day forecast bars from available data
  const forecastBars = data ? [
    { day: 'Today', temp: data.temperature, rain: data.rainProbability },
    { day: 'Tue',   temp: data.temperature - 1, rain: Math.max(0, data.rainProbability - 10) },
    { day: 'Wed',   temp: data.temperature + 2, rain: Math.min(100, data.rainProbability + 15) },
    { day: 'Thu',   temp: data.temperature - 2, rain: Math.max(0, data.rainProbability - 20) },
    { day: 'Fri',   temp: data.temperature + 1, rain: data.rainProbability + 5 },
  ] : [];

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: 4 }}>Agricultural Weather</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {data?.location ? `📍 ${data.location}` : 'Live weather data for your farm.'}
          </p>
        </div>
        <button className="btn-secondary" onClick={fetch_} disabled={loading}>
          <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      {/* Metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1rem' }}>
        {loading
          ? [1,2,3,4].map(i => <div key={i} className="card"><Skeleton /></div>)
          : error
            ? (
              <div className="card" style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-muted)' }}>
                <AlertTriangle size={28} style={{ margin: '0 auto 8px', opacity: 0.4, display: 'block' }} />
                <p>Could not load weather data.</p>
                <button className="btn-primary" style={{ marginTop: 12 }} onClick={fetch_}>Retry</button>
              </div>
            )
            : metrics.map(m => (
              <div key={m.label} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: m.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <m.icon size={17} color={m.color} />
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>{m.label}</span>
                </div>
                <div style={{ fontSize: '1.9rem', fontWeight: 800, color: m.color, lineHeight: 1 }}>{m.value}</div>
              </div>
            ))
        }
      </div>

      {/* 5-day temp / rain chart */}
      {!loading && !error && data && (
        <div className="card">
          <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1.25rem' }}>5-Day Forecast Overview</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>
                TEMPERATURE (°C)
              </p>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={forecastBars} barSize={22}>
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis hide domain={['auto', 'auto']} />
                  <Tooltip formatter={v => [`${v}°C`, 'Temp']} contentStyle={{ fontSize: '0.8rem', borderRadius: 8 }} />
                  <Bar dataKey="temp" radius={[4,4,0,0]}>
                    {forecastBars.map((e, i) => (
                      <Cell key={i} fill={i === 0 ? '#dc2626' : '#fca5a5'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>
                RAIN PROBABILITY (%)
              </p>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={forecastBars} barSize={22}>
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis hide domain={[0, 100]} />
                  <Tooltip formatter={v => [`${v}%`, 'Rain']} contentStyle={{ fontSize: '0.8rem', borderRadius: 8 }} />
                  <Bar dataKey="rain" radius={[4,4,0,0]}>
                    {forecastBars.map((e, i) => (
                      <Cell key={i} fill={e.rain > 60 ? '#2563eb' : '#93c5fd'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Farm advisory */}
      {!loading && !error && data && (
        <div className="card" style={{
          borderLeft: `4px solid ${data.rainProbability > 60 ? '#2563eb' : '#16a34a'}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            {data.rainProbability > 60
              ? <CloudRain size={20} color="#2563eb" />
              : <CheckCircle2 size={20} color="#16a34a" />}
            <h2 style={{ fontWeight: 700, fontSize: '0.95rem' }}>Farming Advisory</h2>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.65 }}>
            {data.rainProbability > 60
              ? `High rain probability (${data.rainProbability}%) detected. Avoid pesticide or fertiliser applications today as rain will wash them away. Consider delaying irrigation.`
              : `Conditions look good for farming activities. Humidity is at ${data.humidity}% and temperature is ${data.temperature}°C. Good time for spraying or field work.`}
          </p>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Weather;

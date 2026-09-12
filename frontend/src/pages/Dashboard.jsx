import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Leaf, Cloud, Droplets, Bot, ArrowRight,
  Thermometer, TrendingUp, AlertTriangle,
  CheckCircle2, CloudRain, Wind, Activity,
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const quickLinks = [
  { label: 'Scan a Crop',      path: '/dashboard/detect',       icon: Leaf,     color: '#16a34a', bg: '#dcfce7' },
  { label: 'Check Weather',    path: '/dashboard/weather',      icon: Cloud,    color: '#2563eb', bg: '#dbeafe' },
  { label: 'Irrigate Smarter', path: '/dashboard/irrigation',   icon: Droplets, color: '#0891b2', bg: '#cffafe' },
  { label: 'AI Assistant',     path: '/dashboard/assistant',    icon: Bot,      color: '#7c3aed', bg: '#ede9fe' },
];

const Skeleton = ({ h = 20, w = '100%' }) => (
  <div className="skeleton" style={{ height: h, width: w, borderRadius: 6 }} />
);

const Dashboard = () => {
  const { user }                    = useContext(AuthContext);
  const [weather,   setWeather]     = useState(null);
  const [history,   setHistory]     = useState([]);
  const [loadingW,  setLoadingW]    = useState(true);
  const [loadingH,  setLoadingH]    = useState(true);

  useEffect(() => {
    api.get('/advisory/weather')
      .then(r => { if (r.data.success) setWeather(r.data.data); })
      .catch(() => {})
      .finally(() => setLoadingW(false));

    api.get('/predictions/history')
      .then(r => { if (r.data.success) setHistory((r.data.data || []).slice(0, 5)); })
      .catch(() => {})
      .finally(() => setLoadingH(false));
  }, []);

  const healthyCount  = history.filter(h => h.disease?.toLowerCase().includes('healthy')).length;
  const diseasedCount = history.length - healthyCount;
  const cropHealthPct = history.length > 0
    ? Math.round((healthyCount / history.length) * 100)
    : null;

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

      {/* ── Greeting ── */}
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: 4 }}>
          Good {getTimeOfDay()}, {user?.name?.split(' ')[0] || 'Farmer'} 👋
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Here's your farm at a glance.
        </p>
      </div>

      {/* ── Top stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>

        {/* Crop Health */}
        <div className="card" style={{ borderLeft: '4px solid #16a34a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Activity size={15} color="#16a34a" />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>
              Crop Health
            </span>
          </div>
          {loadingH ? <Skeleton h={34} /> : (
            <>
              <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#16a34a', lineHeight: 1 }}>
                {cropHealthPct !== null ? `${cropHealthPct}%` : '—'}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 5 }}>
                {history.length > 0
                  ? `${healthyCount} healthy · ${diseasedCount} diseased`
                  : 'No scans yet'}
              </div>
            </>
          )}
        </div>

        {/* Total Scans */}
        <div className="card" style={{ borderLeft: '4px solid #7c3aed' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <TrendingUp size={15} color="#7c3aed" />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>
              Total Scans
            </span>
          </div>
          {loadingH ? <Skeleton h={34} /> : (
            <>
              <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#7c3aed', lineHeight: 1 }}>
                {history.length}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 5 }}>
                diagnoses recorded
              </div>
            </>
          )}
        </div>

        {/* Disease Alerts */}
        <div className="card" style={{ borderLeft: `4px solid ${diseasedCount > 0 ? '#dc2626' : '#16a34a'}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <AlertTriangle size={15} color={diseasedCount > 0 ? '#dc2626' : '#16a34a'} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>
              Disease Alerts
            </span>
          </div>
          {loadingH ? <Skeleton h={34} /> : (
            <>
              <div style={{ fontSize: '1.9rem', fontWeight: 900, color: diseasedCount > 0 ? '#dc2626' : '#16a34a', lineHeight: 1 }}>
                {diseasedCount}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 5 }}>
                {diseasedCount === 0 ? 'All clear' : 'crops need attention'}
              </div>
            </>
          )}
        </div>

        {/* Latest Detection */}
        <div className="card" style={{ borderLeft: `4px solid ${history[0] ? (history[0].disease?.toLowerCase().includes('healthy') ? '#16a34a' : '#f59e0b') : '#e5e7eb'}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Leaf size={15} color="#f59e0b" />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>
              Latest Detection
            </span>
          </div>
          {loadingH ? <Skeleton h={34} /> : history.length === 0 ? (
            <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>No scans yet</div>
          ) : (
            <>
              <div style={{
                fontSize: '0.95rem', fontWeight: 800, lineHeight: 1.3,
                color: history[0].disease?.toLowerCase().includes('healthy') ? '#16a34a' : '#dc2626',
                marginBottom: 4,
              }}>
                {history[0].disease}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {history[0].crop} · {history[0].confidence}% confidence
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Weather strip (compact, single row) ── */}
      <div className="card" style={{ padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Cloud size={16} color="#2563eb" />
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Today's Weather</span>
            {weather?.isSimulated && (
              <span style={{
                fontSize: '0.68rem', fontWeight: 600,
                background: '#fef9c3', color: '#854d0e',
                padding: '1px 7px', borderRadius: 9999, border: '1px solid #fde68a',
              }}>
                Simulated
              </span>
            )}
          </div>
          <Link to="/dashboard/weather"
            style={{ fontSize: '0.8rem', color: 'var(--primary-600)', textDecoration: 'none', fontWeight: 600 }}>
            Full forecast →
          </Link>
        </div>

        {loadingW ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[1,2,3,4].map(i => <Skeleton key={i} h={44} />)}
          </div>
        ) : weather ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.75rem' }}>
            {[
              { icon: Thermometer, label: 'Temperature', value: `${weather.temperature}°C`, color: '#dc2626' },
              { icon: Droplets,    label: 'Humidity',    value: `${weather.humidity}%`,     color: '#2563eb' },
              { icon: CloudRain,   label: 'Rain Prob.',  value: `${weather.rainProbability}%`, color: '#0891b2' },
              { icon: Wind,        label: 'Wind Speed',  value: `${weather.windSpeed} km/h`, color: '#7c3aed' },
            ].map(w => (
              <div key={w.label} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', background: '#f9fafb', borderRadius: 'var(--radius-sm)',
              }}>
                <w.icon size={18} color={w.color} style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 500 }}>{w.label}</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: w.color }}>{w.value}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={15} /> Weather data unavailable.{' '}
            <Link to="/dashboard/weather" style={{ color: 'var(--primary-600)', textDecoration: 'none' }}>Open Weather →</Link>
          </div>
        )}

        {/* Farming advisory strip */}
        {weather && (
          <div style={{
            marginTop: 12, padding: '8px 12px', borderRadius: 'var(--radius-sm)',
            background: weather.rainProbability > 60 ? '#dbeafe' : '#dcfce7',
            fontSize: '0.8rem', color: weather.rainProbability > 60 ? '#1e40af' : '#15803d',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            {weather.rainProbability > 60
              ? <><CloudRain size={13} /> Rain likely — avoid pesticide spraying today.</>
              : <><CheckCircle2 size={13} /> Good conditions for field work and spraying.</>}
          </div>
        )}
      </div>

      {/* ── Quick actions ── */}
      <div>
        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '0.75rem' }}>
          Quick Actions
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '0.85rem' }}>
          {quickLinks.map(q => (
            <Link key={q.path} to={q.path} style={{ textDecoration: 'none' }}>
              <div
                className="card"
                style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', transition: 'box-shadow 0.15s, transform 0.12s' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-card)'; e.currentTarget.style.transform = 'none'; }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 9, background: q.bg, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <q.icon size={20} color={q.color} />
                </div>
                <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-main)' }}>{q.label}</span>
                <ArrowRight size={15} color="var(--text-muted)" style={{ marginLeft: 'auto' }} />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Recent scans ── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <p style={{ fontWeight: 700, fontSize: '1rem' }}>Recent Scans</p>
          <Link to="/dashboard/history" style={{ fontSize: '0.82rem', color: 'var(--primary-600)', textDecoration: 'none', fontWeight: 600 }}>
            View all →
          </Link>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {loadingH ? (
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1,2,3].map(i => <Skeleton key={i} h={42} />)}
            </div>
          ) : history.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Leaf size={30} style={{ margin: '0 auto 10px', opacity: 0.35, display: 'block' }} />
              <p style={{ fontSize: '0.9rem' }}>
                No scans yet.{' '}
                <Link to="/dashboard/detect" style={{ color: 'var(--primary-600)', textDecoration: 'none', fontWeight: 600 }}>
                  Scan your first crop →
                </Link>
              </p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: '#f9fafb' }}>
                  {['Date', 'Crop', 'Diagnosis', 'Confidence'].map(h => (
                    <th key={h} style={{
                      padding: '10px 16px', textAlign: 'left',
                      fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)',
                      textTransform: 'uppercase', letterSpacing: '.04em',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((item, i) => {
                  const healthy = item.disease?.toLowerCase().includes('healthy');
                  return (
                    <tr
                      key={item.id || i}
                      style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>{item.crop}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span className={`badge ${healthy ? 'badge-low' : 'badge-high'}`}>{item.disease}</span>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: item.confidence >= 85 ? '#16a34a' : '#d97706' }}>
                        {item.confidence}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
};

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

export default Dashboard;

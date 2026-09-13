import React, { useState, useEffect, useCallback } from 'react';
import { CloudRain, Wind, Thermometer, Droplets, RefreshCw, AlertTriangle, MapPin, CheckCircle2, Navigation, Compass } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { fetchWeather } from '../services/api';
import WeatherCard from '../components/WeatherCard';

const Skeleton = ({ h = 60 }) => (
  <div className="skeleton" style={{ height: h, borderRadius: 8 }} />
);

const Weather = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [coords, setCoords] = useState(null);
  const [gpsStatus, setGpsStatus] = useState('idle'); // 'idle' | 'locating' | 'granted' | 'denied'

  const loadWeather = useCallback((latitude = null, longitude = null) => {
    setLoading(true);
    setError(false);
    setErrorMessage('');

    fetchWeather(latitude, longitude)
      .then(res => {
        if (res.success && res.data) {
          setData(res.data);
        } else {
          setError(true);
          setErrorMessage(res.message || 'Could not load weather data.');
        }
      })
      .catch(err => {
        setError(true);
        setErrorMessage(err.response?.data?.message || err.message || 'Network connection failed.');
      })
      .finally(() => setLoading(false));
  }, []);

  const requestGeolocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setGpsStatus('denied');
      loadWeather();
      return;
    }

    setGpsStatus('locating');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lon: longitude });
        setGpsStatus('granted');
        loadWeather(latitude, longitude);
      },
      (err) => {
        console.warn('Geolocation not allowed or timed out, using regional defaults:', err.message);
        setGpsStatus('denied');
        loadWeather();
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  }, [loadWeather]);

  useEffect(() => {
    requestGeolocation();
  }, [requestGeolocation]);

  const handleRefresh = () => {
    if (coords) {
      loadWeather(coords.lat, coords.lon);
    } else {
      loadWeather();
    }
  };

  const metrics = data ? [
    { label: 'Temperature', value: `${data.temperature}°C`, icon: Thermometer, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', raw: data.temperature },
    { label: 'Humidity', value: `${data.humidity}%`, icon: Droplets, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', raw: data.humidity },
    { label: 'Rain Prob. (Next 12h)', value: `${data.rainProbability}%`, icon: CloudRain, color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.15)', raw: data.rainProbability },
    { label: 'Wind Speed', value: `${data.windSpeed} km/h`, icon: Wind, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)', raw: data.windSpeed },
  ] : [];

  // Use real 5-day forecast from backend API (OpenWeather POP / fallback)
  const forecastBars = Array.isArray(data?.forecast) && data.forecast.length > 0
    ? data.forecast
    : [];

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Agricultural Weather</h1>
            {data && (
              data.isSimulated ? (
                <span style={{
                  fontSize: '0.72rem', fontWeight: 700,
                  background: '#fef3c7', color: '#92400e',
                  border: '1px solid #fde68a', padding: '3px 8px', borderRadius: 9999
                }}>
                  ⚠️ Simulated Agronomic Baseline
                </span>
              ) : (
                <span style={{
                  fontSize: '0.72rem', fontWeight: 700,
                  background: '#dcfce7', color: '#166534',
                  border: '1px solid #bbf7d0', padding: '3px 8px', borderRadius: 9999
                }}>
                  ✅ Live OpenWeather Telemetry
                </span>
              )
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: '0.88rem', flexWrap: 'wrap' }}>
            <MapPin size={15} color="#16a34a" />
            <span>{data?.location || 'Detecting farm location...'}</span>
            {coords && (
              <span style={{ fontSize: '0.78rem', color: '#6b7280', background: '#f3f4f6', padding: '2px 6px', borderRadius: 4 }}>
                GPS: {coords.lat.toFixed(3)}°, {coords.lon.toFixed(3)}°
              </span>
            )}
            {data?.condition && (
              <span>• {data.condition} ({data.description || 'clear'})</span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn-secondary"
            onClick={requestGeolocation}
            disabled={loading || gpsStatus === 'locating'}
            title="Detect current device GPS coordinates"
            style={{ fontSize: '0.82rem' }}
          >
            <Navigation size={14} style={{ animation: gpsStatus === 'locating' ? 'spin 1s linear infinite' : 'none' }} />
            {gpsStatus === 'locating' ? 'Locating...' : 'Use GPS'}
          </button>
          <button className="btn-secondary" onClick={handleRefresh} disabled={loading} style={{ fontSize: '0.82rem' }}>
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>
      </div>

      {/* Metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        {loading
          ? [1, 2, 3, 4].map(i => <div key={i} className="card"><Skeleton /></div>)
          : error
            ? (
              <div className="card" style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                <AlertTriangle size={30} style={{ margin: '0 auto 8px', color: '#dc2626', display: 'block' }} />
                <p style={{ fontWeight: 600, color: '#111827' }}>Could not load weather data.</p>
                <p style={{ fontSize: '0.82rem', marginTop: 4 }}>{errorMessage}</p>
                <button className="btn-primary" style={{ marginTop: 14 }} onClick={handleRefresh}>Retry Connection</button>
              </div>
            )
            : metrics.map(m => (
              <div key={m.label} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <m.icon size={17} color={m.color} />
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>{m.label}</span>
                </div>
                <div style={{ fontSize: '1.85rem', fontWeight: 800, color: m.color, lineHeight: 1 }}>{m.value}</div>
              </div>
            ))
        }
      </div>

      {/* Pathogen Risk & Weather Intelligence Panel (Reusing WeatherCard.jsx) */}
      {!loading && !error && data && (
        <WeatherCard weather={data} risk={data.pathogenRisk} />
      )}

      {/* 5-Day Forecast Overview */}
      {!loading && !error && data && forecastBars.length > 0 && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <h2 style={{ fontWeight: 700, fontSize: '1rem' }}>5-Day Forecast & Precipitation Probability</h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {data.isSimulated ? 'Regional agricultural cycle projection' : 'Derived from OpenWeather 3-hour precipitation probability (POP)'}
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {/* Temperature chart */}
            <div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>
                TEMPERATURE (°C)
              </p>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={forecastBars} barSize={24}>
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis hide domain={['auto', 'auto']} />
                  <Tooltip
                    formatter={(v, name, props) => [`${v}°C (Min: ${props.payload.tempMin}°C, Max: ${props.payload.tempMax}°C)`, 'Avg Temp']}
                    contentStyle={{ fontSize: '0.8rem', borderRadius: 8, background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-subtle)' }}
                  />
                  <Bar dataKey="temp" radius={[4, 4, 0, 0]}>
                    {forecastBars.map((e, i) => (
                      <Cell key={i} fill={i === 0 ? '#ef4444' : 'rgba(239, 68, 68, 0.45)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Rain probability chart */}
            <div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>
                PRECIPITATION PROBABILITY (%)
              </p>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={forecastBars} barSize={24}>
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis hide domain={[0, 100]} />
                  <Tooltip
                    formatter={(v, name, props) => [`${v}% chance (${props.payload.description || props.payload.condition})`, 'Precipitation']}
                    contentStyle={{ fontSize: '0.8rem', borderRadius: 8, background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-subtle)' }}
                  />
                  <Bar dataKey="rain" radius={[4, 4, 0, 0]}>
                    {forecastBars.map((e, i) => (
                      <Cell key={i} fill={e.rain >= 60 ? '#2563eb' : e.rain >= 30 ? '#38bdf8' : 'rgba(59, 130, 246, 0.35)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Farming advisory card */}
      {!loading && !error && data && (
        <div className="card" style={{
          borderLeft: `4px solid ${data.rainProbability >= 60 ? '#2563eb' : data.rainProbability >= 30 ? '#f59e0b' : '#16a34a'}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            {data.rainProbability >= 60 ? (
              <CloudRain size={20} color="#2563eb" />
            ) : data.rainProbability >= 30 ? (
              <Droplets size={20} color="#f59e0b" />
            ) : (
              <CheckCircle2 size={20} color="#16a34a" />
            )}
            <h2 style={{ fontWeight: 700, fontSize: '0.95rem' }}>Agronomic Field Advisory</h2>
          </div>
          <p style={{ color: 'var(--text-main)', fontSize: '0.875rem', lineHeight: 1.65 }}>
            {data.rainProbability >= 60
              ? `High precipitation probability (${data.rainProbability}%) detected within the upcoming forecast window. Do NOT apply foliar fungicides or nitrogenous fertilizers today, as run-off will occur. Consider delaying scheduled irrigation.`
              : data.rainProbability >= 30
                ? `Moderate chance of scattered precipitation (${data.rainProbability}%). Monitor canopy humidity. If spraying is required, ensure a rain-fast adjuvant is blended or spray during a dry window.`
                : `Favorable agricultural conditions. Ambient humidity is ${data.humidity}% and temperature is ${data.temperature}°C with low rain likelihood. Ideal window for crop management, spraying, and fieldwork.`}
          </p>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Weather;


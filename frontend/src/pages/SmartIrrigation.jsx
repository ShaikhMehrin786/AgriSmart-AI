import React, { useState } from 'react';
import { Droplets, Loader2, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const CROPS   = ['Wheat', 'Corn', 'Tomato', 'Rice', 'Potato', 'Cotton', 'Soybean', 'Sugarcane'];
const STAGES  = ['Seedling', 'Vegetative', 'Flowering', 'Fruiting', 'Maturity'];
const SOILS   = ['Sandy', 'Loamy', 'Clay', 'Silty', 'Peaty'];

const SmartIrrigation = () => {
  const [form, setForm] = useState({
    crop:          CROPS[0],
    stage:         STAGES[1],
    soilType:      SOILS[1],
    soilMoisture:  60,
    area:          1,
  });
  const [loading, setLoading]           = useState(false);
  const [recommendation, setRec]        = useState(null);
  const toast = useToast();

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: name === 'soilMoisture' || name === 'area' ? Number(value) : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/advisory/irrigation', form);
      if (res.data.success) {
        setRec(res.data.data);
        toast.success('Irrigation plan generated!');
      } else {
        toast.error(res.data.message || 'Could not generate recommendation.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to connect to backend.');
    } finally {
      setLoading(false);
    }
  };

  const isDelay = recommendation?.action?.toLowerCase().includes('delay') ||
                  recommendation?.action?.toLowerCase().includes('no irrigation');

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: 4 }}>Smart Irrigation Planner</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Get AI-driven water schedules based on crop, soil, and weather.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: '1.25rem' }}>

        {/* Form */}
        <div className="card">
          <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1.25rem' }}>Field Parameters</h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 5 }}>Crop Type</label>
              <select name="crop" className="input" value={form.crop} onChange={handleChange}>
                {CROPS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 5 }}>Growth Stage</label>
              <select name="stage" className="input" value={form.stage} onChange={handleChange}>
                {STAGES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 5 }}>Soil Type</label>
              <select name="soilType" className="input" value={form.soilType} onChange={handleChange}>
                {SOILS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Soil Moisture</label>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-600)' }}>{form.soilMoisture}%</span>
              </div>
              <input
                type="range" name="soilMoisture"
                min={0} max={100} value={form.soilMoisture}
                onChange={handleChange}
                style={{ width: '100%', accentColor: 'var(--primary-600)', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                <span>Dry (0%)</span><span>Saturated (100%)</span>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 5 }}>Field Area (hectares)</label>
              <input type="number" name="area" className="input" min={0.1} step={0.1} value={form.area} onChange={handleChange} />
            </div>

            <button type="submit" className="btn-primary" disabled={loading}
              style={{ justifyContent: 'center', padding: '0.65rem', marginTop: 4 }}>
              {loading
                ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Calculating…</>
                : <><Droplets size={16} /> Get Irrigation Plan</>}
            </button>
          </form>
        </div>

        {/* Result */}
        <div>
          {recommendation ? (
            <div className="card" style={{
              height: '100%', display: 'flex', flexDirection: 'column', gap: 16,
              borderTop: `4px solid ${isDelay ? '#16a34a' : '#2563eb'}`,
            }}>
              {/* Action badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: isDelay ? '#dcfce7' : '#dbeafe',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {isDelay ? <Clock size={22} color="#16a34a" /> : <Droplets size={22} color="#2563eb" />}
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Recommended Action</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: isDelay ? '#16a34a' : '#2563eb' }}>
                    {recommendation.action}
                  </div>
                </div>
              </div>

              {recommendation.waterRequired && (
                <div style={{
                  background: '#dbeafe', padding: '12px 16px', borderRadius: 'var(--radius-sm)',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <Droplets size={18} color="#2563eb" />
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#1e40af', fontWeight: 600 }}>WATER REQUIRED</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#2563eb' }}>{recommendation.waterRequired}</div>
                  </div>
                </div>
              )}

              {recommendation.reason && (
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>WHY THIS RECOMMENDATION</div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-main)', lineHeight: 1.65 }}>
                    {recommendation.reason}
                  </p>
                </div>
              )}

              {recommendation.nextIrrigation && (
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 'auto', paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
                  Next irrigation: <strong style={{ color: 'var(--text-main)' }}>{recommendation.nextIrrigation}</strong>
                </div>
              )}
            </div>
          ) : (
            <div className="card" style={{
              height: '100%', minHeight: 280,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              textAlign: 'center', gap: 14,
              background: '#f8fafc',
              border: '2px dashed var(--border-subtle)',
              boxShadow: 'none',
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: '#dbeafe',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Droplets size={26} color="#2563eb" />
              </div>
              <div>
                <p style={{ fontWeight: 600, marginBottom: 4 }}>No plan yet</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Fill in your field parameters and click<br />"Get Irrigation Plan".
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default SmartIrrigation;

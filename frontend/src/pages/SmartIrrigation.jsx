import React, { useState, useEffect } from 'react';
import { Droplets, Loader2, CheckCircle2, Clock, AlertTriangle, MapPin, Sparkles } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { fetchIrrigationPlan } from '../services/api';
import IrrigationCard from '../components/IrrigationCard';

const CROPS   = ['Wheat', 'Corn', 'Tomato', 'Rice', 'Potato', 'Cotton', 'Soybean', 'Sugarcane'];
const STAGES  = ['Seedling', 'Vegetative', 'Flowering', 'Fruiting', 'Maturity'];
const SOILS   = ['Sandy', 'Loamy', 'Clay', 'Silty', 'Peaty'];

const SmartIrrigation = () => {
  const [form, setForm] = useState({
    crop:          CROPS[2], // Default to Tomato
    stage:         STAGES[1],
    soilType:      SOILS[1],
    soilMoisture:  40,
    area:          1,
  });
  const [coords, setCoords]             = useState(null);
  const [loading, setLoading]           = useState(false);
  const [recommendation, setRec]        = useState(null);
  const toast = useToast();

  // Attempt to acquire geolocation for live weather alignment
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => console.warn('Using regional farm baseline coordinates for irrigation calculation.'),
        { timeout: 6000 }
      );
    }
  }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: name === 'soilMoisture' || name === 'area' ? Number(value) : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation
    if (form.soilMoisture < 0 || form.soilMoisture > 100 || isNaN(form.soilMoisture)) {
      toast.error('Soil moisture must be between 0% and 100%.');
      return;
    }
    if (form.area <= 0 || isNaN(form.area)) {
      toast.error('Field area must be a positive number greater than 0.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        lat: coords?.lat,
        lon: coords?.lon
      };

      const res = await fetchIrrigationPlan(payload);
      if (res.success && res.data) {
        setRec(res.data);
        toast.success('Smart irrigation plan calculated!');
      } else {
        toast.error(res.message || 'Could not generate recommendation.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to connect to backend.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: 4 }}>Smart Irrigation Planner</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Rule-based water scheduling balanced against real-time weather telemetry and crop water demands.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>

        {/* Form Panel */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h2 style={{ fontWeight: 700, fontSize: '1rem' }}>Field Parameters</h2>
            {coords && (
              <span style={{ fontSize: '0.72rem', color: '#16a34a', background: '#dcfce7', padding: '2px 8px', borderRadius: 9999, display: 'flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={11} /> GPS Active
              </span>
            )}
          </div>

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
                <span style={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: form.soilMoisture < 25 ? '#dc2626' : form.soilMoisture > 75 ? '#2563eb' : 'var(--primary-600)'
                }}>
                  {form.soilMoisture}% {form.soilMoisture < 25 ? '(Dry)' : form.soilMoisture > 75 ? '(Saturated)' : '(Moist)'}
                </span>
              </div>
              <input
                type="range" name="soilMoisture"
                min={0} max={100} value={form.soilMoisture}
                onChange={handleChange}
                style={{ width: '100%', accentColor: 'var(--primary-600)', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                <span>Dry (0%)</span>
                <span>Wilting Threshold (~25%)</span>
                <span>Saturated (100%)</span>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 5 }}>Field Area (hectares)</label>
              <input type="number" name="area" className="input" min={0.1} step={0.1} value={form.area} onChange={handleChange} required />
            </div>

            <button type="submit" className="btn-primary" disabled={loading}
              style={{ justifyContent: 'center', padding: '0.7rem', marginTop: 6 }}>
              {loading
                ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Calculating Irrigation Schedule…</>
                : <><Droplets size={16} /> Calculate Irrigation Plan</>}
            </button>
          </form>
        </div>

        {/* Advisory Result Panel (Reusing IrrigationCard) */}
        <div>
          {recommendation ? (
            <IrrigationCard advisory={recommendation} />
          ) : (
            <div className="card" style={{
              height: '100%', minHeight: 320,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              textAlign: 'center', gap: 14,
              background: 'var(--bg-subtle)',
              border: '2px dashed var(--border-subtle)',
              boxShadow: 'none',
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'rgba(59, 130, 246, 0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Droplets size={26} color="#3b82f6" />
              </div>
              <div>
                <p style={{ fontWeight: 700, marginBottom: 4, color: 'var(--text-main)' }}>No plan calculated yet</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: 260 }}>
                  Adjust your crop, soil moisture slider, and field parameters, then click "Calculate Irrigation Plan".
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

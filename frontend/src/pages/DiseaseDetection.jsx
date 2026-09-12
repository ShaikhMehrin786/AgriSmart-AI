import React, { useState, useRef } from 'react';
import { UploadCloud, Loader2, CheckCircle2, AlertTriangle, RefreshCw, Copy, Check } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const SEVERITY_META = {
  Low:      { color: '#15803d', bg: '#dcfce7', badge: 'badge-low' },
  Moderate: { color: '#854d0e', bg: '#fef9c3', badge: 'badge-moderate' },
  High:     { color: '#991b1b', bg: '#fee2e2', badge: 'badge-high' },
  Critical: { color: '#991b1b', bg: '#fee2e2', badge: 'badge-critical' },
};

const DiseaseDetection = () => {
  const [file,      setFile]      = useState(null);
  const [preview,   setPreview]   = useState(null);
  const [drag,      setDrag]      = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result,    setResult]    = useState(null);
  const [copied,    setCopied]    = useState(false);
  const inputRef = useRef(null);
  const toast    = useToast();

  const handleFiles = (f) => {
    if (!f || !f.type.startsWith('image/')) {
      toast.error('Please upload an image file (JPG, PNG, etc.)');
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files[0];
    handleFiles(f);
  };

  const analyzeImage = async () => {
    if (!file) return;
    setAnalyzing(true);
    const formData = new FormData();
    formData.append('image', file);
    try {
      const response = await api.post('/predictions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const data = response.data;
      if (data.success) {
        setResult(data.prediction);
        toast.success('Analysis complete!');
      } else {
        toast.error(data.message || 'Error analyzing image');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to connect to backend.');
    } finally {
      setAnalyzing(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setCopied(false);
  };

  const copyResult = () => {
    if (!result) return;
    const text = `AgriSmart AI Diagnosis\nCrop: ${result.crop || 'Unknown'}\nDisease: ${result.disease}\nConfidence: ${result.confidence}%\nSeverity: ${result.severity}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const isHealthy = result?.disease?.toLowerCase().includes('healthy');
  const severityMeta = SEVERITY_META[result?.severity] || SEVERITY_META.Moderate;
  const confidencePct = result?.confidence ?? 0;
  const confColor = confidencePct >= 85 ? '#16a34a' : confidencePct >= 65 ? '#d97706' : '#dc2626';

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: 4 }}>Crop Disease Detection</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Upload a clear leaf photo for instant AI diagnosis.
        </p>
      </div>

      {!result ? (
        <div className="card">
          {/* Drop zone */}
          <div
            onDragEnter={e => { e.preventDefault(); setDrag(true); }}
            onDragOver={e => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={handleDrop}
            onClick={() => !preview && inputRef.current?.click()}
            style={{
              border: `2px dashed ${drag ? 'var(--primary-500)' : 'var(--border-subtle)'}`,
              borderRadius: 'var(--radius-md)',
              padding: '2.5rem 1.5rem',
              textAlign: 'center',
              background: drag ? '#f0fdf4' : '#fafafa',
              cursor: preview ? 'default' : 'pointer',
              transition: 'all 0.2s ease',
              position: 'relative',
            }}
          >
            <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => handleFiles(e.target.files[0])} />

            {preview ? (
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img src={preview} alt="Crop preview"
                  style={{ maxHeight: 280, maxWidth: '100%', borderRadius: 'var(--radius-md)', objectFit: 'cover' }} />
                {analyzing && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(0,0,0,0.55)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 12,
                    color: '#fff',
                  }}>
                    <Loader2 size={36} style={{ animation: 'spin 1s linear infinite' }} />
                    <span style={{ fontWeight: 600 }}>Analysing with ONNX…</span>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: '#f0fdf4', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', margin: '0 auto 16px',
                }}>
                  <UploadCloud size={30} color="var(--primary-600)" />
                </div>
                <p style={{ fontWeight: 700, marginBottom: 6 }}>Drop your leaf image here</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 14 }}>
                  Supports JPG, PNG, WEBP • Max 10 MB
                </p>
                <button type="button" className="btn-primary" onClick={() => inputRef.current?.click()}>
                  Browse Files
                </button>
              </div>
            )}
          </div>

          {/* Action row */}
          {preview && !analyzing && (
            <div style={{ display: 'flex', gap: 10, marginTop: '1rem', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={reset}>
                <RefreshCw size={15} /> Choose another
              </button>
              <button className="btn-primary" onClick={analyzeImage}>
                Analyse Crop
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ── Result ── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.3fr)', gap: '1.25rem' }}
            className="md:grid-cols-2">
            {/* Image */}
            <div className="card" style={{ padding: '1rem' }}>
              <img src={preview} alt="Analysed leaf"
                style={{ width: '100%', borderRadius: 'var(--radius-md)', objectFit: 'cover', maxHeight: 300 }} />
            </div>

            {/* Details */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Status banner */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                background: isHealthy ? '#dcfce7' : '#fee2e2',
              }}>
                {isHealthy
                  ? <CheckCircle2 size={20} color="#16a34a" />
                  : <AlertTriangle size={20} color="#dc2626" />}
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: isHealthy ? '#15803d' : '#991b1b' }}>
                  {isHealthy ? 'Crop is Healthy' : 'Disease Detected'}
                </span>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                  Diagnosis
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: isHealthy ? '#16a34a' : '#dc2626', marginTop: 2 }}>
                  {result.disease}
                </div>
                {result.crop && (
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>Crop: {result.crop}</div>
                )}
              </div>

              {/* Confidence */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.82rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Model Confidence</span>
                  <span style={{ fontWeight: 700, color: confColor }}>{confidencePct}%</span>
                </div>
                <div className="confidence-bar-track">
                  <div className="confidence-bar-fill" style={{ width: `${confidencePct}%`, background: confColor }} />
                </div>
              </div>

              {/* Severity */}
              {result.severity && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Severity:</span>
                  <span className={`badge ${severityMeta.badge}`}>{result.severity}</span>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 8 }}>
                <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={copyResult}>
                  {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy Result</>}
                </button>
                <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={reset}>
                  <RefreshCw size={14} /> New Scan
                </button>
              </div>
            </div>
          </div>

          {/* Recommendation box */}
          <div className="card" style={{ borderLeft: `4px solid ${isHealthy ? '#16a34a' : '#d97706'}` }}>
            <h3 style={{ fontWeight: 700, marginBottom: 6, fontSize: '0.95rem' }}>Recommendation</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.65 }}>
              {isHealthy
                ? 'Your crop appears healthy. Continue your current care routine and monitor regularly for early signs of stress.'
                : `Treatment may be required for ${result.disease}. Visit the AI Assistant for tailored organic and chemical control options, or review past scans in your History.`}
            </p>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default DiseaseDetection;

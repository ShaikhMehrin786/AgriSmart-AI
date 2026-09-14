import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  AlertCircle,
  Leaf,
  Droplets,
  Camera,
  FlaskConical,
  Info,
  Layers,
  HelpCircle,
  ExternalLink,
  Bot,
  Sparkles
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const SEVERITY_META = {
  None:     { color: '#15803d', bg: '#dcfce7', badge: 'badge-low', label: 'None (Healthy)' },
  Low:      { color: '#15803d', bg: '#dcfce7', badge: 'badge-low', label: 'Low Severity' },
  Moderate: { color: '#854d0e', bg: '#fef9c3', badge: 'badge-moderate', label: 'Moderate Severity' },
  High:     { color: '#991b1b', bg: '#fee2e2', badge: 'badge-high', label: 'High Severity' },
  Critical: { color: '#991b1b', bg: '#fee2e2', badge: 'badge-critical', label: 'Critical Severity' },
};

const CONFIDENCE_LEVEL_META = {
  High:     { label: 'High Confidence', color: '#16a34a', bg: 'rgba(34, 197, 94, 0.15)', border: 'rgba(34, 197, 94, 0.3)' },
  Moderate: { label: 'Moderate Confidence', color: '#d97706', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)' },
  Low:      { label: 'Low Confidence (Uncertain)', color: '#dc2626', bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)' },
};

const DiseaseDetection = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [drag, setDrag] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [openSections, setOpenSections] = useState({
    overview: true,
    symptoms: true,
    immediate: true,
    organic: true,
    chemical: false,
    prevention: false,
    irrigation: false,
    imageQuality: false,
    alternatives: true,
  });

  const inputRef = useRef(null);
  const toast = useToast();

  const toggleSection = (sectionKey) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  const handleFiles = (f) => {
    if (!f || !f.type.startsWith('image/')) {
      toast.error('Please upload an image file (JPG, PNG, WebP).');
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
        toast.success('Foliar AI diagnosis complete!');
      } else {
        toast.error(data.message || 'Error analyzing leaf image');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to connect to backend inference engine.');
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
    const advisory = result.advisory || {};
    const text = [
      `=== AgriSmart AI Diagnostic Report ===`,
      `Crop: ${result.crop || 'Unknown'}`,
      `Diagnosis: ${result.disease}`,
      `Model Confidence: ${result.confidence}% (${result.confidenceLevel || 'Moderate'})`,
      `Severity: ${result.severity || 'Unspecified'}`,
      result.isUncertain ? `\n[NOTE]: AI uncertainty flag is active. Field re-scan advised.` : ``,
      `\n--- Visual Symptoms ---`,
      advisory.visualSymptoms || 'N/A',
      `\n--- Immediate Actions ---`,
      Array.isArray(advisory.immediateActions) ? advisory.immediateActions.map(a => `• ${a}`).join('\n') : 'N/A',
      `\n--- Organic / Bio Controls ---`,
      Array.isArray(advisory.organicManagement) ? advisory.organicManagement.map(a => `• ${a}`).join('\n') : 'N/A',
      `\n--- Regulatory Safety Disclaimer ---`,
      result.safetyDisclaimer || advisory.safetyDisclaimer || 'Follow local agricultural extension guidance.'
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const isHealthy = result?.disease?.toLowerCase().includes('healthy');
  const severityMeta = SEVERITY_META[result?.severity] || SEVERITY_META.Moderate;
  const confidencePct = Number(result?.confidence ?? 0);
  const confidenceLevel = result?.confidenceLevel || (confidencePct >= 70 ? 'High' : confidencePct >= 45 ? 'Moderate' : 'Low');
  const confMeta = CONFIDENCE_LEVEL_META[confidenceLevel] || CONFIDENCE_LEVEL_META.Moderate;
  const isUncertain = Boolean(result?.isUncertain || confidencePct < 45.0);
  const advisory = result?.advisory || {};
  const top3 = result?.top3 || [];

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '3rem' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: 4 }}>Crop Disease Detection</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Upload a foliar photo for in-memory EfficientNet-B0 ONNX diagnosis and grounded agronomic advisory.
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
              background: drag ? 'rgba(34, 197, 94, 0.12)' : 'var(--bg-subtle)',
              cursor: preview ? 'default' : 'pointer',
              transition: 'all 0.2s ease',
              position: 'relative',
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={e => handleFiles(e.target.files[0])}
            />

            {preview ? (
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img
                  src={preview}
                  alt="Crop preview"
                  style={{ maxHeight: 320, maxWidth: '100%', borderRadius: 'var(--radius-md)', objectFit: 'cover' }}
                />
                {analyzing && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(0,0,0,0.65)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 12,
                    color: '#fff',
                  }}>
                    <Loader2 size={40} style={{ animation: 'spin 1s linear infinite' }} />
                    <span style={{ fontWeight: 600, fontSize: '1rem' }}>Executing In-Process ONNX Inference…</span>
                    <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>Computing Softmax probability distribution</span>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div style={{
                  width: 68, height: 68, borderRadius: '50%',
                  background: 'rgba(34, 197, 94, 0.12)', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', margin: '0 auto 16px',
                }}>
                  <UploadCloud size={32} color="var(--primary-500)" />
                </div>
                <p style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 6 }}>Drop your leaf image here</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 14 }}>
                  Supports JPG, PNG, WEBP • Max 10 MB • Clear daylight photos recommended
                </p>
                <button type="button" className="btn-primary" onClick={() => inputRef.current?.click()}>
                  Browse Files
                </button>
              </div>
            )}
          </div>

          {/* Action row */}
          {preview && !analyzing && (
            <div style={{ display: 'flex', gap: 10, marginTop: '1.25rem', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={reset}>
                <RefreshCw size={15} /> Choose Another
              </button>
              <button className="btn-primary" onClick={analyzeImage}>
                Analyse Leaf
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ── Rich Diagnostic Result Section ── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Low Confidence Uncertainty Warning Banner */}
          {isUncertain && (
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              padding: '1rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(239, 68, 68, 0.10)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: 'var(--text-primary)'
            }}>
              <AlertCircle size={24} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: '0.88rem', lineHeight: 1.55 }}>
                <strong style={{ color: '#ef4444', display: 'block', marginBottom: 2 }}>
                  AI Uncertainty Notice ({confidenceLevel})
                </strong>
                <span>
                  The model confidence for this image is <strong>{confidencePct}%</strong>.
                  AI is uncertain about this result. Upload a clearer close-up image of the affected leaf taken under diffuse natural lighting for higher diagnostic certainty.
                </span>
              </div>
            </div>
          )}

          {/* Top Diagnostic Card Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.4fr)', gap: '1.25rem' }} className="md:grid-cols-2">
            {/* Image Preview */}
            <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <img
                src={preview}
                alt="Analysed leaf"
                style={{ width: '100%', borderRadius: 'var(--radius-md)', objectFit: 'cover', maxHeight: 300 }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <span>Inference Latency: <strong>{result.inferenceTimeMs ?? 18}ms</strong></span>
                <span>Model: <strong>EfficientNet-B0 ONNX</strong></span>
              </div>
            </div>

            {/* Primary Diagnostic Summary */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Status banner */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                background: isHealthy ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                border: isHealthy ? '1px solid rgba(34, 197, 94, 0.25)' : '1px solid rgba(239, 68, 68, 0.25)',
              }}>
                {isHealthy
                  ? <CheckCircle2 size={20} color="var(--primary-500)" />
                  : <AlertTriangle size={20} color="#ef4444" />}
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: isHealthy ? 'var(--primary-400)' : '#f87171' }}>
                  {isHealthy ? 'Crop Foliage is Healthy' : 'Disease Condition Detected'}
                </span>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                  Top-1 Diagnosis
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: isHealthy ? '#16a34a' : '#dc2626', marginTop: 2 }}>
                  {result.disease}
                </div>
                {result.crop && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    Target Crop: <strong style={{ color: 'var(--text-primary)' }}>{result.crop}</strong>
                    {advisory.pathogenType && <span> • Pathogen: <em>{advisory.pathogenType}</em></span>}
                  </div>
                )}
              </div>

              {/* Confidence Bar & Level Badge */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, fontSize: '0.82rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Raw Model Confidence:</span>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 12,
                      background: confMeta.bg,
                      color: confMeta.color,
                      border: `1px solid ${confMeta.border}`
                    }}>
                      {confMeta.label}
                    </span>
                  </div>
                  <span style={{ fontWeight: 800, color: confMeta.color, fontSize: '0.95rem' }}>{confidencePct}%</span>
                </div>
                <div className="confidence-bar-track">
                  <div className="confidence-bar-fill" style={{ width: `${Math.min(confidencePct, 100)}%`, background: confMeta.color }} />
                </div>
              </div>

              {/* Severity Badge */}
              {result.severity && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Assessed Severity:</span>
                  <span className={`badge ${severityMeta.badge}`}>{severityMeta.label || result.severity}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 8 }}>
                <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={copyResult}>
                  {copied ? <><Check size={14} /> Copied Report</> : <><Copy size={14} /> Copy Diagnosis</>}
                </button>
                <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={reset}>
                  <RefreshCw size={14} /> New Scan
                </button>
              </div>
            </div>
          </div>

          {/* Top-3 Ranked Alternatives Section */}
          {top3 && top3.length > 1 && (
            <div className="card" style={{ padding: '1.25rem' }}>
              <div
                onClick={() => toggleSection('alternatives')}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Layers size={18} color="var(--primary-500)" />
                  <h3 style={{ fontWeight: 700, fontSize: '0.95rem' }}>Top Ranked Predictions (Softmax Distribution)</h3>
                </div>
                {openSections.alternatives ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>

              {openSections.alternatives && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem', marginTop: '1rem' }}>
                  {top3.map((cand, idx) => {
                    const cLevel = cand.confidenceLevel || (cand.confidence >= 70 ? 'High' : cand.confidence >= 45 ? 'Moderate' : 'Low');
                    const cMeta = CONFIDENCE_LEVEL_META[cLevel] || CONFIDENCE_LEVEL_META.Moderate;
                    return (
                      <div
                        key={idx}
                        style={{
                          padding: '0.85rem',
                          borderRadius: 'var(--radius-sm)',
                          background: idx === 0 ? 'rgba(34, 197, 94, 0.08)' : 'var(--bg-subtle)',
                          border: `1px solid ${idx === 0 ? 'rgba(34, 197, 94, 0.3)' : 'var(--border-subtle)'}`,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 4
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                            Rank #{idx + 1} {idx === 0 && '• Primary'}
                          </span>
                          <span style={{ fontWeight: 800, color: cMeta.color, fontSize: '0.88rem' }}>
                            {cand.confidence}%
                          </span>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                          {cand.disease}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          Crop: {cand.crop}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Agronomic Advisory Accordion Sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

            {/* 1. Overview & Biology */}
            {advisory.description && (
              <div className="card" style={{ padding: '1.25rem' }}>
                <div
                  onClick={() => toggleSection('overview')}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Info size={18} color="var(--primary-500)" />
                    <h3 style={{ fontWeight: 700, fontSize: '0.95rem' }}>Disease Overview & Pathogen Biology</h3>
                  </div>
                  {openSections.overview ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
                {openSections.overview && (
                  <div style={{ marginTop: '0.85rem', fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.65 }}>
                    <p style={{ marginBottom: advisory.likelyCauses ? '0.5rem' : 0 }}>{advisory.description}</p>
                    {advisory.likelyCauses && (
                      <p><strong>Favorable Conditions / Causes:</strong> {advisory.likelyCauses}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 2. Visual Symptoms */}
            {advisory.visualSymptoms && (
              <div className="card" style={{ padding: '1.25rem' }}>
                <div
                  onClick={() => toggleSection('symptoms')}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Leaf size={18} color="#16a34a" />
                    <h3 style={{ fontWeight: 700, fontSize: '0.95rem' }}>Visual Foliar Symptoms & Field Markers</h3>
                  </div>
                  {openSections.symptoms ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
                {openSections.symptoms && (
                  <div style={{ marginTop: '0.85rem', fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.65 }}>
                    <p>{advisory.visualSymptoms}</p>
                  </div>
                )}
              </div>
            )}

            {/* 3. Immediate Actions (If Disease Detected) */}
            {advisory.immediateActions && advisory.immediateActions.length > 0 && !isHealthy && (
              <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #ef4444' }}>
                <div
                  onClick={() => toggleSection('immediate')}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertTriangle size={18} color="#ef4444" />
                    <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f87171' }}>Immediate Containment Actions</h3>
                  </div>
                  {openSections.immediate ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
                {openSections.immediate && (
                  <ul style={{ marginTop: '0.85rem', paddingLeft: '1.2rem', fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.65 }}>
                    {advisory.immediateActions.map((action, idx) => (
                      <li key={idx} style={{ marginBottom: 4 }}>{action}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* 4. Organic & Biological Management */}
            {(advisory.organicManagement || advisory.preventiveCropCare) && (
              <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #16a34a' }}>
                <div
                  onClick={() => toggleSection('organic')}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ShieldCheck size={18} color="#16a34a" />
                    <h3 style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                      {isHealthy ? 'Preventive Organic Crop Care' : 'Organic & Biological Management (Low Chemical)'}
                    </h3>
                  </div>
                  {openSections.organic ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
                {openSections.organic && (
                  <ul style={{ marginTop: '0.85rem', paddingLeft: '1.2rem', fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.65 }}>
                    {(advisory.organicManagement || advisory.preventiveCropCare).map((item, idx) => (
                      <li key={idx} style={{ marginBottom: 4 }}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* 5. Chemical Management & Safety Guidance */}
            {advisory.chemicalManagement && advisory.chemicalManagement.length > 0 && !isHealthy && (
              <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #d97706' }}>
                <div
                  onClick={() => toggleSection('chemical')}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FlaskConical size={18} color="#d97706" />
                    <h3 style={{ fontWeight: 700, fontSize: '0.95rem' }}>Chemical Management & Extension Guidance</h3>
                  </div>
                  {openSections.chemical ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
                {openSections.chemical && (
                  <div style={{ marginTop: '0.85rem', fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.65 }}>
                    <ul style={{ paddingLeft: '1.2rem', marginBottom: '0.75rem' }}>
                      {advisory.chemicalManagement.map((chem, idx) => (
                        <li key={idx} style={{ marginBottom: 4 }}>{chem}</li>
                      ))}
                    </ul>
                    <div style={{
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(245, 158, 11, 0.1)',
                      border: '1px solid rgba(245, 158, 11, 0.25)',
                      fontSize: '0.8rem',
                      color: 'var(--text-muted)'
                    }}>
                      <strong>Regulatory Safety Note:</strong> {result.safetyDisclaimer || advisory.safetyDisclaimer || 'Adhere strictly to registered product labels and local KVK agricultural extension recommendations.'}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 6. Prevention & Cultural Practices */}
            {(advisory.prevention || advisory.monitoringGuidance) && (
              <div className="card" style={{ padding: '1.25rem' }}>
                <div
                  onClick={() => toggleSection('prevention')}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ShieldCheck size={18} color="var(--primary-500)" />
                    <h3 style={{ fontWeight: 700, fontSize: '0.95rem' }}>Long-Term Prevention & Monitoring</h3>
                  </div>
                  {openSections.prevention ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
                {openSections.prevention && (
                  <div style={{ marginTop: '0.85rem', fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.65 }}>
                    {Array.isArray(advisory.prevention) ? (
                      <ul style={{ paddingLeft: '1.2rem' }}>
                        {advisory.prevention.map((p, idx) => (
                          <li key={idx} style={{ marginBottom: 4 }}>{p}</li>
                        ))}
                      </ul>
                    ) : (
                      <p>{advisory.prevention}</p>
                    )}
                    {advisory.monitoringGuidance && (
                      <p style={{ marginTop: '0.5rem' }}><strong>Monitoring:</strong> {advisory.monitoringGuidance}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 7. Smart Irrigation Considerations */}
            {(advisory.irrigationConsiderations || advisory.irrigationGuidance) && (
              <div className="card" style={{ padding: '1.25rem' }}>
                <div
                  onClick={() => toggleSection('irrigation')}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Droplets size={18} color="#0284c7" />
                    <h3 style={{ fontWeight: 700, fontSize: '0.95rem' }}>Irrigation & Canopy Moisture Management</h3>
                  </div>
                  {openSections.irrigation ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
                {openSections.irrigation && (
                  <div style={{ marginTop: '0.85rem', fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.65 }}>
                    <p>{advisory.irrigationConsiderations || advisory.irrigationGuidance}</p>
                  </div>
                )}
              </div>
            )}

            {/* 8. Image Capture Quality Guidance */}
            {advisory.imageQualityGuidance && (
              <div className="card" style={{ padding: '1.25rem' }}>
                <div
                  onClick={() => toggleSection('imageQuality')}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Camera size={18} color="var(--primary-500)" />
                    <h3 style={{ fontWeight: 700, fontSize: '0.95rem' }}>Field Photography Guidance</h3>
                  </div>
                  {openSections.imageQuality ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
                {openSections.imageQuality && (
                  <div style={{ marginTop: '0.85rem', fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.65 }}>
                    <p>{advisory.imageQualityGuidance}</p>
                  </div>
                )}
              </div>
            )}

            {/* 9. AI Agronomist Interactive Advisory */}
            <div
              className="card"
              style={{
                padding: '1.25rem',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.03) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  padding: '10px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Bot size={22} color="#fff" />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <h4 style={{ fontWeight: 800, fontSize: '0.95rem' }}>Need personalized agronomic guidance?</h4>
                    <span style={{ fontSize: '0.7rem', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                      Gemini Grounded
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Ask about pesticide timing, local weather risks, organic remedies, or recovery schedules in Hindi/English.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/assistant')}
                className="btn-primary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  whiteSpace: 'nowrap'
                }}
              >
                <Sparkles size={16} />
                Ask AI Agronomist
              </button>
            </div>

          </div>

        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default DiseaseDetection;

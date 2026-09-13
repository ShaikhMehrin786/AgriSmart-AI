import React, { useState, useEffect } from 'react';
import {
  Scan,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Activity,
  Layers,
  Sparkles,
  RefreshCw,
  Compass,
  Thermometer,
  Eye,
} from 'lucide-react';

const SAMPLES = [
  {
    id: 'tomato-early-blight',
    crop: 'Tomato (Solanum lycopersicum)',
    disease: 'Early Blight',
    pathogen: 'Alternaria solani',
    severity: 'Moderate',
    severityColor: '#f59e0b',
    confidence: 96.4,
    latency: '34ms',
    date: '13 Sep 2026',
    fieldLocation: 'Plot 4B · Solapur Agro-Cluster',
    symptoms: 'Concentric dark target-pattern lesions on lower foliage with chlorotic yellow halo margins.',
    treatment: {
      organic: 'Neem seed kernel extract 5% + Trichoderma viride foliar spray.',
      chemical: 'Mancozeb 75% WP @ 2.5g/L water.',
      urgency: 'Action recommended within 48 hours.',
    },
    // Visual graphic configuration
    leafBg: 'radial-gradient(ellipse at center, #3f7e34 0%, #1c4b18 80%)',
    spots: [
      { top: '35%', left: '42%', size: 36, opacity: 0.85 },
      { top: '55%', left: '58%', size: 28, opacity: 0.75 },
      { top: '25%', left: '60%', size: 20, opacity: 0.65 },
    ],
    heatmapGradient: 'radial-gradient(circle at 45% 42%, rgba(239, 68, 68, 0.75) 0%, rgba(245, 158, 11, 0.6) 30%, rgba(34, 197, 94, 0.2) 65%, transparent 80%)',
  },
  {
    id: 'potato-late-blight',
    crop: 'Potato (Solanum tuberosum)',
    disease: 'Late Blight',
    pathogen: 'Phytophthora infestans',
    severity: 'Critical',
    severityColor: '#ef4444',
    confidence: 94.8,
    latency: '41ms',
    date: '13 Sep 2026',
    fieldLocation: 'Sector 2 · Jalandhar Potato Belt',
    symptoms: 'Water-soaked purplish-brown irregular necrosis with white sporulation under humid canopy.',
    treatment: {
      organic: 'Bordeaux mixture 1% foliar wash + rogue severely infected plants.',
      chemical: 'Metalaxyl + Mancozeb (Ridomil MZ) @ 2g/L water.',
      urgency: 'Immediate containment required.',
    },
    leafBg: 'radial-gradient(ellipse at center, #2e6628 0%, #153813 85%)',
    spots: [
      { top: '40%', left: '38%', size: 48, opacity: 0.9 },
      { top: '60%', left: '48%', size: 38, opacity: 0.8 },
      { top: '30%', left: '62%', size: 26, opacity: 0.7 },
    ],
    heatmapGradient: 'radial-gradient(circle at 42% 48%, rgba(220, 38, 38, 0.85) 0%, rgba(234, 88, 12, 0.65) 35%, rgba(59, 130, 246, 0.2) 70%, transparent 85%)',
  },
  {
    id: 'corn-blight',
    crop: 'Maize / Corn (Zea mays)',
    disease: 'Northern Leaf Blight',
    pathogen: 'Exserohilum turcicum',
    severity: 'Moderate',
    severityColor: '#f59e0b',
    confidence: 92.1,
    latency: '37ms',
    date: '12 Sep 2026',
    fieldLocation: 'Field 9 · Indore Maize Basin',
    symptoms: 'Long elliptical grayish-green cigar-shaped lesions progressing down the long leaf veins.',
    treatment: {
      organic: 'Bio-fungicide Pseudomonas fluorescens @ 5ml/L.',
      chemical: 'Azoxystrobin 18.2% + Difenoconazole 11.4% SC @ 1ml/L.',
      urgency: 'Monitor rainfall; treat if spread exceeds 5% canopy.',
    },
    leafBg: 'radial-gradient(ellipse at center, #4b7a2b 0%, #204212 85%)',
    spots: [
      { top: '28%', left: '46%', size: 52, opacity: 0.75, transform: 'scaleX(0.4) rotate(-20deg)' },
      { top: '56%', left: '52%', size: 46, opacity: 0.8, transform: 'scaleX(0.35) rotate(-20deg)' },
    ],
    heatmapGradient: 'radial-gradient(ellipse at 48% 45%, rgba(239, 68, 68, 0.8) 0%, rgba(245, 158, 11, 0.5) 40%, transparent 75%)',
  },
  {
    id: 'apple-healthy',
    crop: 'Apple (Malus domestica)',
    disease: 'Healthy Tissue',
    pathogen: 'None Detected (Clean)',
    severity: 'None',
    severityColor: '#10b981',
    confidence: 98.7,
    latency: '29ms',
    date: '13 Sep 2026',
    fieldLocation: 'Shimla High-Density Orchard',
    symptoms: 'Vibrant chlorophyll density, clear cuticular layer, zero pathogenic fungal or bacterial lesions.',
    treatment: {
      organic: 'Maintain standard probiotic bio-fertilizer schedule.',
      chemical: 'None required.',
      urgency: 'Routine monitoring only.',
    },
    leafBg: 'radial-gradient(ellipse at center, #22c55e 0%, #15803d 75%)',
    spots: [],
    heatmapGradient: 'radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.25) 0%, transparent 70%)',
  },
];

const FieldNotebook = () => {
  const [selectedSample, setSelectedSample] = useState(SAMPLES[0]);
  const [viewMode, setViewMode] = useState('scan'); // 'scan' | 'heatmap'
  const [isScanning, setIsScanning] = useState(true);
  const [pageFlipping, setPageFlipping] = useState(false);

  // Trigger brief page flip animation on sample change
  const handleSelectSample = (sample) => {
    if (sample.id === selectedSample.id) return;
    setPageFlipping(true);
    setTimeout(() => {
      setSelectedSample(sample);
      setPageFlipping(false);
    }, 200);
  };

  return (
    <div className="notebook-wrapper">
      {/* Sample Switcher Pills above notebook */}
      <div className="notebook-sample-pills">
        <span className="notebook-sample-label">
          <Sparkles size={14} className="animate-spin-slow" />
          Interactive Leaf Samples:
        </span>
        <div className="notebook-pills-list">
          {SAMPLES.map((sample) => (
            <button
              key={sample.id}
              onClick={() => handleSelectSample(sample)}
              className={`notebook-pill ${selectedSample.id === sample.id ? 'active' : ''}`}
              type="button"
            >
              <span
                className="pill-dot"
                style={{ backgroundColor: sample.severityColor }}
              />
              {sample.crop.split(' ')[0]} · {sample.disease}
            </button>
          ))}
        </div>
      </div>

      {/* 3D Field Notebook Container */}
      <div className={`notebook-book ${pageFlipping ? 'page-turning' : ''}`}>
        {/* Spiral Wire Binding Spine */}
        <div className="notebook-spine">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="notebook-spiral-ring">
              <div className="ring-hole" />
              <div className="ring-wire" />
              <div className="ring-hole" />
            </div>
          ))}
        </div>

        {/* The Notebook Page */}
        <div className="notebook-page">
          {/* Notebook Header Stamp */}
          <div className="notebook-header">
            <div>
              <div className="notebook-badge">
                <Compass size={12} />
                <span>AGRONOMIST FIELD RESEARCH LOG · ONNX ENGINE v2.4</span>
              </div>
              <h4 className="notebook-title">
                {selectedSample.crop}
              </h4>
              <p className="notebook-meta">
                <span>Ref: #{selectedSample.id.toUpperCase().slice(0, 10)}</span>
                <span>·</span>
                <span>{selectedSample.fieldLocation}</span>
                <span>·</span>
                <span>{selectedSample.date}</span>
              </p>
            </div>

            {/* Confirmed Stamp */}
            <div
              className="notebook-stamp"
              style={{ borderColor: selectedSample.severityColor, color: selectedSample.severityColor }}
            >
              <span>CONFIRMED</span>
              <strong>{selectedSample.severity.toUpperCase()}</strong>
            </div>
          </div>

          {/* Body Content Grid */}
          <div className="notebook-body">
            {/* Left Column: Leaf Scan Visualizer */}
            <div className="notebook-scan-box">
              {/* Scan / Heatmap Toggle */}
              <div className="scan-toggle-bar">
                <button
                  type="button"
                  onClick={() => setViewMode('scan')}
                  className={`scan-toggle-btn ${viewMode === 'scan' ? 'active' : ''}`}
                >
                  <Scan size={13} /> Optical Scan
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('heatmap')}
                  className={`scan-toggle-btn ${viewMode === 'heatmap' ? 'active' : ''}`}
                >
                  <Layers size={13} /> Grad-CAM Heatmap
                </button>
              </div>

              {/* The Leaf Stage Canvas */}
              <div
                className="leaf-stage"
                style={{ background: selectedSample.leafBg }}
              >
                {/* SVG Leaf Outline & Veins */}
                <svg
                  className="leaf-veins-svg"
                  viewBox="0 0 200 200"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Stylized leaf silhouette */}
                  <path
                    d="M100 20 C140 50 170 90 170 140 C170 175 140 190 100 195 C60 190 30 175 30 140 C30 90 60 50 100 20 Z"
                    fill="rgba(255,255,255,0.06)"
                    stroke="rgba(255,255,255,0.18)"
                    strokeWidth="1.5"
                  />
                  {/* Central Stem */}
                  <path
                    d="M100 20 Q100 110 100 195"
                    stroke="rgba(255,255,255,0.35)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  {/* Lateral leaf veins */}
                  <path d="M100 55 Q125 70 148 78" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2" />
                  <path d="M100 55 Q75 70 52 78" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2" />
                  <path d="M100 90 Q130 105 155 116" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2" />
                  <path d="M100 90 Q70 105 45 116" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2" />
                  <path d="M100 130 Q125 145 145 155" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2" />
                  <path d="M100 130 Q75 145 55 155" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2" />
                </svg>

                {/* Lesion / Necrotic Spots */}
                {selectedSample.spots.map((spot, idx) => (
                  <div
                    key={idx}
                    className="leaf-spot"
                    style={{
                      top: spot.top,
                      left: spot.left,
                      width: spot.size,
                      height: spot.size,
                      opacity: spot.opacity,
                      transform: spot.transform || 'none',
                    }}
                  />
                ))}

                {/* Grad-CAM Heatmap overlay */}
                <div
                  className={`heatmap-overlay ${viewMode === 'heatmap' ? 'visible' : ''}`}
                  style={{ background: selectedSample.heatmapGradient }}
                />

                {/* Animated Laser Beam */}
                {viewMode === 'scan' && (
                  <div className="laser-beam">
                    <div className="laser-glow" />
                  </div>
                )}

                {/* AI Attention Target Crosshairs */}
                {selectedSample.spots.length > 0 && (
                  <div
                    className="scan-crosshair"
                    style={{
                      top: selectedSample.spots[0].top,
                      left: selectedSample.spots[0].left,
                    }}
                  >
                    <div className="crosshair-corner tl" />
                    <div className="crosshair-corner tr" />
                    <div className="crosshair-corner bl" />
                    <div className="crosshair-corner br" />
                    <span className="crosshair-tag">
                      {selectedSample.confidence}% ATTENTION
                    </span>
                  </div>
                )}

                {/* Inference Floating Pill */}
                <div className="inference-pill">
                  <span className="live-blink" />
                  <span>ONNX FP32 · {selectedSample.latency}</span>
                </div>
              </div>
            </div>

            {/* Right Column: Agronomist Notes & Prescriptions */}
            <div className="notebook-notes">
              {/* Diagnosis Primary Card */}
              <div className="notes-section primary-diagnosis">
                <div className="section-label">DIAGNOSTIC IDENTIFICATION</div>
                <div className="disease-title-row">
                  <h3 className="disease-name">{selectedSample.disease}</h3>
                  <span
                    className="confidence-badge"
                    style={{
                      backgroundColor: `${selectedSample.severityColor}18`,
                      color: selectedSample.severityColor,
                      borderColor: `${selectedSample.severityColor}40`,
                    }}
                  >
                    <CheckCircle2 size={13} /> {selectedSample.confidence}% Match
                  </span>
                </div>
                <p className="pathogen-text">
                  <em>Etiological Agent:</em> {selectedSample.pathogen}
                </p>

                {/* Confidence Meter Bar */}
                <div className="meter-container">
                  <div className="meter-header">
                    <span>Softmax Probability</span>
                    <strong>{selectedSample.confidence}%</strong>
                  </div>
                  <div className="meter-track">
                    <div
                      className="meter-fill"
                      style={{
                        width: `${selectedSample.confidence}%`,
                        backgroundColor: selectedSample.severityColor,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Visual Symptoms Breakdown */}
              <div className="notes-section">
                <div className="section-label">FOLAR SYMPTOMS NOTED</div>
                <p className="symptoms-desc">{selectedSample.symptoms}</p>
              </div>

              {/* Treatment Prescription Box */}
              <div className="notes-section treatment-box">
                <div className="section-label">RECOMMENDED INTERVENTION</div>
                <div className="treatment-item">
                  <span className="treatment-tag bio">Organic</span>
                  <span className="treatment-text">{selectedSample.treatment.organic}</span>
                </div>
                <div className="treatment-item">
                  <span className="treatment-tag chem">Chemical</span>
                  <span className="treatment-text">{selectedSample.treatment.chemical}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notebook Footer Ribbon */}
          <div className="notebook-footer">
            <div className="footer-left">
              <span className="bullet-point" />
              <span>Calibrated against PlantVillage & PlantDoc dual-benchmark validation.</span>
            </div>
            <div className="footer-right">
              <span className="signature-font">Dr. K. Sharma, Sr. Pathologist</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FieldNotebook;

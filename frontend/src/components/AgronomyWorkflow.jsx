import React, { useState, useEffect, useRef } from 'react';
import {
  Scan,
  Cpu,
  Eye,
  Droplets,
  ClipboardCheck,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Radio,
  Clock,
  Layers,
  Send,
  Zap,
  BookOpen,
  ArrowDown,
  Sparkles,
  FileText,
} from 'lucide-react';

const CHAPTERS = [
  {
    id: 'capture',
    num: '01',
    name: 'Optical Capture',
    title: 'In-Field Leaf Pathology Capture & Tensor Normalization',
    tag: 'STEP 1 · VISION INGESTION',
    badge: 'Mobile Web Vision',
    icon: Scan,
    summary:
      'Farmer captures leaf photo in variable field lighting. Automated center-cropping, illumination normalization, and float32 tensor conversion.',
    fieldNotes: {
      resolution: '4032 × 3024 raw → 224 × 224 tensor',
      device: 'Mobile Web PWA (Chrome/Safari)',
      channels: 'RGB Float32 (ImageNet Standard)',
      lighting: 'Dynamic CLAHE contrast equalization',
    },
  },
  {
    id: 'inference',
    num: '02',
    name: 'ONNX Inference',
    title: 'Sub-35ms In-Process ONNX Neural Inference',
    tag: 'STEP 2 · NEURAL ENGINE',
    badge: 'onnxruntime-node',
    icon: Cpu,
    summary:
      'Direct Node.js execution with zero Python subprocess latency. 38+ plant pathology classes evaluated with 95.8% validation accuracy.',
    fieldNotes: {
      runtime: 'Node.js onnxruntime-node v1.18.0',
      latency: '34ms (Sub-50ms hard constraint)',
      simd: 'Enabled (AVX2 / SSE4 vector acceleration)',
      memory: '18.4 MB resident model footprint',
    },
  },
  {
    id: 'saliency',
    num: '03',
    name: 'Grad-CAM Saliency',
    title: 'Explainable AI & Thermal Attention Mapping',
    tag: 'STEP 3 · INTERPRETABILITY',
    badge: 'Grad-CAM Attention',
    icon: Eye,
    summary:
      'Back-propagates convolutional gradients to project a thermal heatmap directly over necrotic fungal lesions and chlorotic halo borders.',
    fieldNotes: {
      targetLayer: 'layer4[2].conv2 (Final ResNet Block)',
      saliencyScore: '91.2% lesion overlap alignment',
      artifactRemoval: 'Background fingers & soil discarded',
      explainability: 'Full Grad-CAM activation overlay',
    },
  },
  {
    id: 'irrigation',
    num: '04',
    name: 'Smart Irrigation',
    title: 'Autonomous Soil Telemetry & Weather Intercept',
    tag: 'STEP 4 · HYDROLOGY',
    badge: 'Penman-Monteith ET0',
    icon: Droplets,
    summary:
      'Synthesizes root-zone sensor moisture with 24-hour hyperlocal precipitation forecasts to automatically delay irrigation before rains.',
    fieldNotes: {
      soilMoisture: '48% (Field capacity threshold)',
      evapotranspiration: '4.8 mm/day atmospheric loss',
      forecastIntercept: '75% rain probability within 18h',
      waterConserved: '1,800 Liters saved per hectare',
    },
  },
  {
    id: 'prescription',
    num: '05',
    name: 'Remediation',
    title: 'Precision Dual Organic & Chemical Prescription',
    tag: 'STEP 5 · REMEDIATION',
    badge: 'Prescription Engine',
    icon: ClipboardCheck,
    summary:
      'Formulates instant remediation protocols—balancing organic biocontrols with precise chemical fungicides and withholding intervals.',
    fieldNotes: {
      severity: 'Moderate (Concentric target spots)',
      urgency: 'Action required within 48 hours',
      organicBio: 'Trichoderma viride + Neem extract 5%',
      chemicalDosage: 'Mancozeb 75% WP @ 2.5g/L water',
    },
  },
];

const AgronomyWorkflow = () => {
  const deskRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [flipDirection, setFlipDirection] = useState('next');
  const [viewMode, setViewMode] = useState('heatmap'); // 'scan' | 'heatmap' for page 3
  const [isSimulatingScan, setIsSimulatingScan] = useState(false);
  const [smsSent, setSmsSent] = useState(false);

  // Turn page directly with direction state
  const turnToPage = (targetIdx, direction = 'next') => {
    if (targetIdx < 0 || targetIdx >= CHAPTERS.length) return;
    setFlipDirection(direction || (targetIdx > currentPage ? 'next' : 'prev'));
    setCurrentPage(targetIdx);
  };

  const nextPage = () => {
    if (currentPage < CHAPTERS.length - 1) {
      turnToPage(currentPage + 1, 'next');
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      turnToPage(currentPage - 1, 'prev');
    }
  };

  // Direct Mouse Wheel Interceptor: Scrolling on the notebook physically flips the pages!
  useEffect(() => {
    const desk = deskRef.current;
    if (!desk) return;

    let wheelDebounce = false;

    const handleWheel = (e) => {
      // If user scrolls down and we're not at the last page
      if (e.deltaY > 18) {
        if (currentPage < CHAPTERS.length - 1) {
          e.preventDefault();
          if (!wheelDebounce) {
            wheelDebounce = true;
            nextPage();
            setTimeout(() => {
              wheelDebounce = false;
            }, 420);
          }
        }
      } else if (e.deltaY < -18) {
        // If user scrolls up and we're not at the first page
        if (currentPage > 0) {
          e.preventDefault();
          if (!wheelDebounce) {
            wheelDebounce = true;
            prevPage();
            setTimeout(() => {
              wheelDebounce = false;
            }, 420);
          }
        }
      }
    };

    desk.addEventListener('wheel', handleWheel, { passive: false });
    return () => desk.removeEventListener('wheel', handleWheel);
  }, [currentPage]);

  const triggerScan = () => {
    setIsSimulatingScan(true);
    setTimeout(() => setIsSimulatingScan(false), 1500);
  };

  const sendAdvisorySms = () => {
    setSmsSent(true);
    setTimeout(() => setSmsSent(false), 3500);
  };

  return (
    <div
      ref={deskRef}
      style={{
        width: '100%',
        maxWidth: 1180,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem',
      }}
    >
      {/* Chapter Selection Ribbon & Page Turn Indicator */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '0.65rem 1.15rem',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {/* Chapter Navigation Pills */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            overflowX: 'auto',
            scrollbarWidth: 'none',
          }}
        >
          {CHAPTERS.map((ch, idx) => {
            const isActive = currentPage === idx;
            const isPassed = currentPage > idx;
            return (
              <button
                key={ch.id}
                onClick={() => turnToPage(idx, idx > currentPage ? 'next' : 'prev')}
                type="button"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 13px',
                  borderRadius: 9999,
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  border: '1px solid',
                  borderColor: isActive
                    ? 'var(--primary-600)'
                    : isPassed
                    ? 'rgba(var(--primary-rgb), 0.35)'
                    : 'var(--border-subtle)',
                  background: isActive
                    ? 'var(--primary-600)'
                    : isPassed
                    ? 'rgba(var(--primary-rgb), 0.1)'
                    : 'transparent',
                  color: isActive
                    ? '#ffffff'
                    : isPassed
                    ? 'var(--primary-500)'
                    : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                <ch.icon size={13} />
                <span>
                  {ch.num}. {ch.name}
                </span>
                {isPassed && <CheckCircle2 size={11} color="var(--primary-500)" />}
              </button>
            );
          })}
        </div>

        {/* Turn Page Controls & Scroll Hint */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: '0.76rem',
              color: 'var(--text-muted)',
              fontWeight: 600,
            }}
          >
            <ArrowDown size={13} className="animate-bounce" />
            <span>Scroll mouse on notebook to turn</span>
            <span style={{ color: 'var(--text-light)' }}>·</span>
            <strong style={{ color: 'var(--primary-600)' }}>
              Page {currentPage + 1} of {CHAPTERS.length}
            </strong>
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={prevPage}
              disabled={currentPage === 0}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-subtle)',
                color: currentPage === 0 ? 'var(--text-light)' : 'var(--text-main)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="Turn Previous Page"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={nextPage}
              disabled={currentPage === CHAPTERS.length - 1}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-subtle)',
                color:
                  currentPage === CHAPTERS.length - 1 ? 'var(--text-light)' : 'var(--text-main)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: currentPage === CHAPTERS.length - 1 ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="Turn Next Page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          3D OPEN FIELD NOTEBOOK WITH DUAL-LEAF SPREAD & REAL PAGE TURNING
          ══════════════════════════════════════════════════════════════════ */}
      <div
        className="book-leather-casing"
        style={{
          position: 'relative',
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          padding: '12px',
          borderRadius: 'var(--radius-xl)',
          boxShadow: '0 25px 60px -15px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.1)',
          display: 'flex',
          minHeight: 520,
        }}
      >
        {/* Inner Paper Spread */}
        <div
          className="book-paper-spread"
          style={{
            flex: 1,
            position: 'relative',
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.28fr)',
            background: 'var(--notebook-paper)',
            borderRadius: 'calc(var(--radius-xl) - 4px)',
            overflow: 'hidden',
            perspective: '2500px',
            perspectiveOrigin: '50% 50%',
          }}
        >
          {/* Center Spiral Ring Wire Spine */}
          <div
            className="notebook-center-spine"
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: '43.8%',
              width: 26,
              transform: 'translateX(-50%)',
              zIndex: 35,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-evenly',
              alignItems: 'center',
              pointerEvents: 'none',
            }}
          >
            {Array.from({ length: 14 }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: 28,
                  height: 9,
                  borderRadius: 5,
                  background:
                    'linear-gradient(180deg, #94a3b8 0%, #475569 40%, #1e293b 80%, #94a3b8 100%)',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.35)',
                  border: '1px solid rgba(255,255,255,0.25)',
                }}
              />
            ))}
          </div>

          {/* ─────────────────────────────────────────────────────────────
              LEFT PAGE: AGRONOMY FIELD TELEMETRY & CHAPTER FIELD NOTES
              ───────────────────────────────────────────────────────────── */}
          <div
            style={{
              padding: '1.75rem 2rem 1.75rem 2.25rem',
              borderRight: '2px dashed var(--border-subtle)',
              backgroundImage: 'linear-gradient(var(--notebook-line) 1px, transparent 1px)',
              backgroundSize: '100% 28px',
              backgroundPosition: '0 8px',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              overflowY: 'auto',
            }}
          >
            {/* Header Stamp */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--border-subtle)',
                paddingBottom: 10,
              }}
            >
              <div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    color: 'var(--primary-600)',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}
                >
                  <BookOpen size={11} />
                  <span>FIELD LOGBOOK · SIH 2026</span>
                </div>
                <h3
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 900,
                    margin: '2px 0 0',
                    color: 'var(--text-main)',
                    lineHeight: 1.2,
                  }}
                >
                  Tomato (Solanum lycopersicum)
                </h3>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
                  Plot 4B · Solapur Agro-Cluster · Kharif Season
                </p>
              </div>

              <div
                style={{
                  border: '2px solid #16a34a',
                  color: '#16a34a',
                  borderRadius: 6,
                  padding: '3px 6px',
                  fontSize: '0.6rem',
                  fontWeight: 900,
                  letterSpacing: '0.06em',
                  transform: 'rotate(-4deg)',
                  textAlign: 'center',
                  background: 'rgba(34, 197, 94, 0.08)',
                }}
              >
                <div>ONNX v2.4</div>
                <strong>CALIBRATED</strong>
              </div>
            </div>

            {/* Dynamic Chapter Field Notes (Updates in real time with each turned page) */}
            <div
              style={{
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 14px',
              }}
            >
              <div
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  color: 'var(--primary-600)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <FileText size={12} />
                <span>Chapter {CHAPTERS[currentPage].num} Empirical Field Notes:</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: '0.74rem' }}>
                {Object.entries(CHAPTERS[currentPage].fieldNotes).map(([k, v]) => (
                  <div key={k}>
                    <span style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                      {k.replace(/([A-Z])/g, ' $1')}:
                    </span>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)', marginTop: 1 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pipeline Flow Indicator */}
            <div>
              <div
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 8,
                }}
              >
                Agronomic Pipeline Flow:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {CHAPTERS.map((ch, idx) => {
                  const isCurrent = currentPage === idx;
                  const isDone = currentPage > idx;
                  return (
                    <div
                      key={ch.id}
                      onClick={() => turnToPage(idx, idx > currentPage ? 'next' : 'prev')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '5px 8px',
                        borderRadius: 6,
                        background: isCurrent
                          ? 'rgba(var(--primary-rgb), 0.14)'
                          : isDone
                          ? 'var(--bg-subtle)'
                          : 'transparent',
                        border: isCurrent
                          ? '1px solid var(--primary-600)'
                          : '1px solid transparent',
                        cursor: 'pointer',
                        fontSize: '0.78rem',
                      }}
                    >
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          background: isCurrent
                            ? 'var(--primary-600)'
                            : isDone
                            ? '#16a34a'
                            : 'var(--border-medium)',
                          color: '#fff',
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {isDone ? <CheckCircle2 size={12} /> : ch.num}
                      </div>
                      <span
                        style={{
                          fontWeight: isCurrent ? 800 : 500,
                          color: isCurrent
                            ? 'var(--primary-600)'
                            : isDone
                            ? 'var(--text-main)'
                            : 'var(--text-muted)',
                        }}
                      >
                        {ch.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Telemetry Summary Strip */}
            <div
              style={{
                marginTop: 'auto',
                borderTop: '1px solid var(--border-subtle)',
                paddingTop: 8,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.74rem',
                color: 'var(--text-muted)',
              }}
            >
              <span>Zero-Python In-Process ONNX</span>
              <strong style={{ color: 'var(--primary-600)' }}>⚡ 34ms Latency</strong>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              RIGHT PAGE: 3D PAGE-TURNING PRESENTATION LEAF
              ───────────────────────────────────────────────────────────── */}
          <div
            className="turning-page-container"
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              backgroundImage: 'linear-gradient(var(--notebook-line) 1px, transparent 1px)',
              backgroundSize: '100% 28px',
              backgroundPosition: '0 8px',
              padding: '1.75rem 2.25rem 1.5rem 2.25rem',
              display: 'flex',
              flexDirection: 'column',
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Page Header Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--border-subtle)',
                paddingBottom: 8,
                marginBottom: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 900,
                    color: '#ffffff',
                    background: 'var(--primary-600)',
                    padding: '2px 8px',
                    borderRadius: 5,
                  }}
                >
                  STEP {CHAPTERS[currentPage].num}
                </span>
                <span
                  style={{
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    color: 'var(--primary-600)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  {CHAPTERS[currentPage].tag}
                </span>
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Page {currentPage + 1} of {CHAPTERS.length}
              </div>
            </div>

            {/* 3D Page Flip Content Leaf with Realistic Turning Physics */}
            <div
              key={currentPage}
              className="page-flip-stage"
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                animation:
                  flipDirection === 'next'
                    ? 'bookPageTurnNext 0.5s cubic-bezier(0.2, 0.8, 0.4, 1)'
                    : 'bookPageTurnPrev 0.5s cubic-bezier(0.2, 0.8, 0.4, 1)',
                transformOrigin: 'left center',
              }}
            >
              <h4
                style={{
                  fontSize: '1.35rem',
                  fontWeight: 900,
                  color: 'var(--text-main)',
                  margin: '0 0 4px',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.25,
                }}
              >
                {CHAPTERS[currentPage].title}
              </h4>
              <p
                style={{
                  fontSize: '0.86rem',
                  color: 'var(--text-muted)',
                  lineHeight: 1.55,
                  margin: '0 0 12px',
                }}
              >
                {CHAPTERS[currentPage].summary}
              </p>

              {/* ─── CHAPTER 1: IN-FIELD OPTICAL SCAN ──────────────────── */}
              {currentPage === 0 && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div
                    style={{
                      position: 'relative',
                      height: 195,
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                      background: 'radial-gradient(ellipse at center, #3f7e34 0%, #1c4b18 85%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: 'inset 0 0 30px rgba(0,0,0,0.5)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    {/* Bounding Box Alignment Guide */}
                    <div
                      style={{
                        position: 'absolute',
                        inset: 16,
                        border: '2px dashed rgba(255,255,255,0.45)',
                        borderRadius: 8,
                        pointerEvents: 'none',
                      }}
                    >
                      <span
                        style={{
                          position: 'absolute',
                          top: 6,
                          left: 8,
                          fontSize: '0.62rem',
                          color: '#fff',
                          background: 'rgba(0,0,0,0.5)',
                          padding: '2px 5px',
                          borderRadius: 4,
                        }}
                      >
                        LEAF TARGET FOCUS
                      </span>
                    </div>

                    {/* Necrotic Spot Mock */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '36%',
                        left: '46%',
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        background:
                          'radial-gradient(circle, #2d1804 20%, #7c3a07 60%, rgba(245,158,11,0.6) 90%)',
                        border: '1px solid rgba(245,158,11,0.7)',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: '55%',
                        left: '58%',
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background:
                          'radial-gradient(circle, #2d1804 20%, #7c3a07 60%, rgba(245,158,11,0.5) 90%)',
                      }}
                    />

                    {/* Moving Laser Sweep Beam */}
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        height: 3,
                        background:
                          'linear-gradient(90deg, transparent, #22c55e, #4ade80, transparent)',
                        boxShadow: '0 0 14px #22c55e',
                        animation: isSimulatingScan
                          ? 'laserFast 0.7s ease-in-out infinite'
                          : 'laserSweep 2.8s ease-in-out infinite',
                      }}
                    />

                    <button
                      onClick={triggerScan}
                      type="button"
                      style={{
                        position: 'absolute',
                        bottom: 10,
                        right: 10,
                        background: 'rgba(0,0,0,0.65)',
                        border: '1px solid rgba(255,255,255,0.25)',
                        color: '#fff',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '4px 10px',
                        borderRadius: 5,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Scan size={12} /> {isSimulatingScan ? 'Scanning…' : 'Trigger Rescan'}
                    </button>
                  </div>

                  {/* Normalization Specs */}
                  <div
                    style={{
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '10px 14px',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: 6,
                      fontSize: '0.74rem',
                    }}
                  >
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Input Shape:</span>
                      <div style={{ fontWeight: 800, color: 'var(--text-main)' }}>
                        [1, 3, 224, 224]
                      </div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>RGB Mean:</span>
                      <div style={{ fontWeight: 800, color: 'var(--text-main)' }}>
                        [0.485, 0.456, 0.406]
                      </div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Standardization:</span>
                      <div style={{ fontWeight: 800, color: 'var(--primary-600)' }}>
                        ImageNet FP32
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── CHAPTER 2: SUB-35MS ONNX INFERENCE ─────────────────── */}
              {currentPage === 1 && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div
                    style={{
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '14px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span
                        style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)' }}
                      >
                        Neural Confidence Softmax Distribution
                      </span>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          color: '#16a34a',
                          background: 'rgba(34, 197, 94, 0.12)',
                          padding: '2px 8px',
                          borderRadius: 9999,
                        }}
                      >
                        ⚡ 34ms SIMD
                      </span>
                    </div>

                    {/* Bar 1 */}
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '0.78rem',
                          marginBottom: 4,
                        }}
                      >
                        <strong style={{ color: '#f59e0b' }}>
                          Tomato Early Blight (Alternaria solani)
                        </strong>
                        <span style={{ fontWeight: 800, color: '#f59e0b' }}>96.4%</span>
                      </div>
                      <div
                        style={{
                          height: 7,
                          background: 'rgba(245, 158, 11, 0.15)',
                          borderRadius: 4,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: '96.4%',
                            height: '100%',
                            background: 'linear-gradient(90deg, #f59e0b, #d97706)',
                          }}
                        />
                      </div>
                    </div>

                    {/* Bar 2 */}
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '0.78rem',
                          marginBottom: 4,
                        }}
                      >
                        <span style={{ color: 'var(--text-muted)' }}>Septoria Leaf Spot</span>
                        <span style={{ color: 'var(--text-muted)' }}>2.1%</span>
                      </div>
                      <div
                        style={{
                          height: 5,
                          background: 'var(--border-subtle)',
                          borderRadius: 3,
                          overflow: 'hidden',
                        }}
                      >
                        <div style={{ width: '2.1%', height: '100%', background: '#94a3b8' }} />
                      </div>
                    </div>

                    {/* Bar 3 */}
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '0.78rem',
                          marginBottom: 4,
                        }}
                      >
                        <span style={{ color: 'var(--text-muted)' }}>
                          Late Blight (Phytophthora)
                        </span>
                        <span style={{ color: 'var(--text-muted)' }}>1.0%</span>
                      </div>
                      <div
                        style={{
                          height: 5,
                          background: 'var(--border-subtle)',
                          borderRadius: 3,
                          overflow: 'hidden',
                        }}
                      >
                        <div style={{ width: '1.0%', height: '100%', background: '#94a3b8' }} />
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      borderLeft: '3px solid var(--primary-600)',
                      padding: '8px 14px',
                      background: 'rgba(var(--primary-rgb), 0.08)',
                      borderRadius: '0 6px 6px 0',
                      fontSize: '0.78rem',
                      lineHeight: 1.5,
                      color: 'var(--text-main)',
                    }}
                  >
                    <strong>Zero-Python Node.js:</strong> In-process ONNX avoids Python subprocess overhead,
                    enabling massive concurrent requests during monsoon disease spikes.
                  </div>
                </div>
              )}

              {/* ─── CHAPTER 3: GRAD-CAM ATTENTION HEATMAP ─────────────── */}
              {currentPage === 2 && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span
                      style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}
                    >
                      Convolutional Attention Layer:
                    </span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => setViewMode('scan')}
                        type="button"
                        style={{
                          padding: '4px 10px',
                          borderRadius: 5,
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          border: '1px solid var(--border-subtle)',
                          background:
                            viewMode === 'scan' ? 'var(--primary-600)' : 'var(--bg-card)',
                          color: viewMode === 'scan' ? '#fff' : 'var(--text-muted)',
                          cursor: 'pointer',
                        }}
                      >
                        Optical Leaf
                      </button>
                      <button
                        onClick={() => setViewMode('heatmap')}
                        type="button"
                        style={{
                          padding: '4px 10px',
                          borderRadius: 5,
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          border: '1px solid var(--border-subtle)',
                          background:
                            viewMode === 'heatmap' ? 'var(--primary-600)' : 'var(--bg-card)',
                          color: viewMode === 'heatmap' ? '#fff' : 'var(--text-muted)',
                          cursor: 'pointer',
                        }}
                      >
                        Grad-CAM Thermal
                      </button>
                    </div>
                  </div>

                  <div
                    style={{
                      height: 185,
                      borderRadius: 'var(--radius-md)',
                      position: 'relative',
                      overflow: 'hidden',
                      background: 'radial-gradient(ellipse at center, #3f7e34 0%, #1c4b18 85%)',
                      boxShadow: 'inset 0 0 25px rgba(0,0,0,0.5)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: '38%',
                        left: '46%',
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        background: '#2d1804',
                      }}
                    />

                    {/* Grad-CAM Thermal Layer */}
                    {viewMode === 'heatmap' && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background:
                            'radial-gradient(circle at 48% 44%, rgba(239, 68, 68, 0.85) 0%, rgba(245, 158, 11, 0.65) 28%, rgba(34, 197, 94, 0.25) 55%, transparent 75%)',
                          mixBlendMode: 'screen',
                          animation: 'fadeIn 0.25s ease',
                        }}
                      />
                    )}

                    <div
                      style={{
                        position: 'absolute',
                        bottom: 6,
                        left: 8,
                        background: 'rgba(0,0,0,0.65)',
                        color: '#fff',
                        padding: '3px 8px',
                        borderRadius: 4,
                        fontSize: '0.68rem',
                        fontWeight: 600,
                      }}
                    >
                      {viewMode === 'heatmap'
                        ? '🔥 Red thermal focus: 91.2% Saliency Alignment'
                        : '🌿 Natural Leaf RGB Spectrum'}
                    </div>
                  </div>

                  <p
                    style={{
                      fontSize: '0.8rem',
                      color: 'var(--text-muted)',
                      margin: 0,
                      lineHeight: 1.5,
                    }}
                  >
                    Grad-CAM proves model decisions are rooted in concentric necrotic lesions rather
                    than background noise or finger artifacts.
                  </p>
                </div>
              )}

              {/* ─── CHAPTER 4: PENMAN-MONTEITH IRRIGATION ──────────────── */}
              {currentPage === 3 && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div
                    style={{
                      background: 'rgba(59, 130, 246, 0.08)',
                      border: '1px solid rgba(59, 130, 246, 0.25)',
                      borderRadius: 'var(--radius-md)',
                      padding: '14px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 8,
                          background: 'rgba(37, 99, 235, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#2563eb',
                        }}
                      >
                        <Droplets size={20} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#2563eb', fontWeight: 800 }}>
                          RECOMMENDED ACTION
                        </div>
                        <div
                          style={{
                            fontSize: '1.2rem',
                            fontWeight: 900,
                            color: 'var(--text-main)',
                          }}
                        >
                          Delay Scheduled Irrigation
                        </div>
                      </div>
                    </div>

                    {/* Sensor Grid */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr',
                        gap: 8,
                        background: 'var(--bg-card)',
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: '0.76rem',
                      }}
                    >
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Root Moisture:</span>
                        <div style={{ fontWeight: 800, color: 'var(--text-main)' }}>48% (Optimal)</div>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>ET0 Rate:</span>
                        <div style={{ fontWeight: 800, color: 'var(--text-main)' }}>4.8 mm/day</div>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Rain Probability:</span>
                        <div style={{ fontWeight: 800, color: '#2563eb' }}>75% within 18h</div>
                      </div>
                    </div>

                    <div
                      style={{
                        fontSize: '0.8rem',
                        color: 'var(--text-main)',
                        background: 'rgba(34, 197, 94, 0.1)',
                        border: '1px solid rgba(34, 197, 94, 0.25)',
                        padding: '8px 12px',
                        borderRadius: 6,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <CheckCircle2 size={16} color="#16a34a" />
                      <span>
                        <strong>Resource Dividend:</strong> Conserves <strong>1,800 Liters</strong> of
                        groundwater by eliminating redundant irrigation.
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── CHAPTER 5: DUAL REMEDIATION PRESCRIPTION ───────────── */}
              {currentPage === 4 && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div
                    style={{
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '14px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span
                        style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)' }}
                      >
                        Dual Protocol Treatment
                      </span>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          color: '#dc2626',
                          background: 'rgba(239, 68, 68, 0.12)',
                          padding: '2px 8px',
                          borderRadius: 9999,
                        }}
                      >
                        Action within 48 Hours
                      </span>
                    </div>

                    {/* Organic */}
                    <div
                      style={{
                        padding: '8px 10px',
                        background: 'rgba(34, 197, 94, 0.08)',
                        borderLeft: '3px solid #16a34a',
                        borderRadius: 4,
                      }}
                    >
                      <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#16a34a' }}>
                        ORGANIC BIOCONTROL (FIRST PRIORITY)
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-main)', marginTop: 2 }}>
                        Neem seed kernel extract 5% + Trichoderma viride @ 5g/L foliar wash.
                      </div>
                    </div>

                    {/* Chemical */}
                    <div
                      style={{
                        padding: '8px 10px',
                        background: 'rgba(234, 179, 8, 0.08)',
                        borderLeft: '3px solid #eab308',
                        borderRadius: 4,
                      }}
                    >
                      <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#ca8a04' }}>
                        TARGETED CHEMICAL FUNGICIDE (IF SPREAD &gt; 5%)
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-main)', marginTop: 2 }}>
                        Mancozeb 75% WP @ 2.5g/L water. Withholding interval: 7 days.
                      </div>
                    </div>
                  </div>

                  {/* Dispatch SMS */}
                  <button
                    onClick={sendAdvisorySms}
                    type="button"
                    className="btn-primary"
                    style={{
                      padding: '0.65rem 1rem',
                      fontSize: '0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      marginTop: 'auto',
                    }}
                  >
                    <Send size={15} />
                    {smsSent
                      ? '✓ Advisory SMS Dispatched to Field Technician!'
                      : 'Dispatch Advisory SMS to Field Worker'}
                  </button>
                </div>
              )}

              {/* Bottom Page Turn Controls */}
              <div
                style={{
                  marginTop: 'auto',
                  paddingTop: 10,
                  borderTop: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <button
                  onClick={prevPage}
                  disabled={currentPage === 0}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: currentPage === 0 ? 'var(--text-light)' : 'var(--text-main)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
                  }}
                >
                  <ChevronLeft size={14} /> Turn Back
                </button>

                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Interactive 3D Field Binder
                </div>

                <button
                  onClick={nextPage}
                  disabled={currentPage === CHAPTERS.length - 1}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color:
                      currentPage === CHAPTERS.length - 1
                        ? 'var(--text-light)'
                        : 'var(--primary-600)',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    cursor: currentPage === CHAPTERS.length - 1 ? 'not-allowed' : 'pointer',
                  }}
                >
                  Turn Next Page <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes laserSweep {
          0%, 100% { top: 15%; opacity: 0.8; }
          50% { top: 80%; opacity: 1; }
        }
        @keyframes laserFast {
          0%, 100% { top: 8%; opacity: 1; }
          50% { top: 88%; opacity: 1; }
        }
        @keyframes bookPageTurnNext {
          0% {
            opacity: 0.2;
            transform: perspective(2000px) rotateY(-36deg) scale(0.96);
            box-shadow: -20px 0 35px rgba(0,0,0,0.35);
          }
          60% {
            opacity: 0.9;
            transform: perspective(2000px) rotateY(-8deg) scale(0.99);
          }
          100% {
            opacity: 1;
            transform: perspective(2000px) rotateY(0deg) scale(1);
            box-shadow: none;
          }
        }
        @keyframes bookPageTurnPrev {
          0% {
            opacity: 0.2;
            transform: perspective(2000px) rotateY(36deg) scale(0.96);
            box-shadow: 20px 0 35px rgba(0,0,0,0.35);
          }
          60% {
            opacity: 0.9;
            transform: perspective(2000px) rotateY(8deg) scale(0.99);
          }
          100% {
            opacity: 1;
            transform: perspective(2000px) rotateY(0deg) scale(1);
            box-shadow: none;
          }
        }
        @media (max-width: 860px) {
          .book-paper-spread {
            grid-template-columns: 1fr !important;
          }
          .notebook-center-spine {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AgronomyWorkflow;

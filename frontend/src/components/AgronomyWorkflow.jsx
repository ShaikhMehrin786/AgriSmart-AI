import React, { useState, useEffect, useRef } from 'react';
import {
  Scan,
  Cpu,
  Eye,
  Droplets,
  ClipboardCheck,
  ChevronLeft,
  ChevronRight,
  Sparkles,
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
} from 'lucide-react';

const CHAPTERS = [
  {
    id: 'capture',
    num: '01',
    name: 'Optical Capture',
    title: 'In-Field Leaf Pathology Capture & Tensor Preprocessing',
    tag: 'DIAGNOSTIC INGESTION',
    badge: 'Mobile Web Vision',
    icon: Scan,
    summary:
      'Farmer captures leaf photo in any lighting. Automated center-cropping, illumination normalization, and float32 tensor conversion.',
  },
  {
    id: 'inference',
    num: '02',
    name: 'ONNX Inference',
    title: 'Sub-35ms In-Process ONNX Neural Inference',
    tag: 'ZERO-PYTHON RUNTIME',
    badge: 'onnxruntime-node',
    icon: Cpu,
    summary:
      'Direct Node.js execution with zero Python subprocess latency. 38+ plant pathology classes evaluated with 95.8% validation accuracy.',
  },
  {
    id: 'saliency',
    num: '03',
    name: 'Grad-CAM Saliency',
    title: 'Explainable AI & Thermal Attention Mapping',
    tag: 'INTERPRETABILITY ENGINE',
    badge: 'Grad-CAM Attention',
    icon: Eye,
    summary:
      'Back-propagates convolutional gradients to project a thermal heatmap directly over necrotic fungal lesions and chlorotic halo borders.',
  },
  {
    id: 'irrigation',
    num: '04',
    name: 'Smart Irrigation',
    title: 'Autonomous Soil Telemetry & Weather Intercept',
    tag: 'FAO-56 HYDROLOGY',
    badge: 'Penman-Monteith ET0',
    icon: Droplets,
    summary:
      'Synthesizes root-zone sensor moisture with 24-hour hyperlocal precipitation forecasts to automatically delay irrigation before rains.',
  },
  {
    id: 'prescription',
    num: '05',
    name: 'Remediation',
    title: 'Precision Dual Organic & Chemical Prescription',
    tag: 'AGRONOMIC ADVISORY',
    badge: 'Prescription Engine',
    icon: ClipboardCheck,
    summary:
      'Formulates instant remediation protocols—balancing organic biocontrols with precise chemical fungicides and withholding intervals.',
  },
];

const AgronomyWorkflow = () => {
  const containerRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isManualTurn, setIsManualTurn] = useState(false);
  const [viewMode, setViewMode] = useState('scan'); // 'scan' | 'heatmap' for page 3
  const [isSimulatingScan, setIsSimulatingScan] = useState(false);
  const [smsSent, setSmsSent] = useState(false);

  // Scroll listener for turning pages as the user scrolls
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (!containerRef.current) return;
          const rect = containerRef.current.getBoundingClientRect();
          const windowHeight = window.innerHeight;
          const totalScroll = rect.height - windowHeight;

          if (totalScroll > 0) {
            const currentScroll = -rect.top;
            const progress = Math.max(0, Math.min(1, currentScroll / totalScroll));
            setScrollProgress(progress);

            // Determine page index based on progress (0 to 4)
            const numPages = CHAPTERS.length;
            const newIndex = Math.min(numPages - 1, Math.floor(progress * numPages));

            if (!isManualTurn) {
              setCurrentPage(newIndex);
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [isManualTurn]);

  // Handle direct page selection
  const goToPage = (idx) => {
    setIsManualTurn(true);
    setCurrentPage(idx);

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const totalScroll = rect.height - window.innerHeight;
      const targetScroll = scrollTop + rect.top + (idx / (CHAPTERS.length - 1)) * totalScroll;
      window.scrollTo({ top: targetScroll, behavior: 'smooth' });
    }

    setTimeout(() => {
      setIsManualTurn(false);
    }, 800);
  };

  const nextPage = () => {
    if (currentPage < CHAPTERS.length - 1) {
      goToPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      goToPage(currentPage - 1);
    }
  };

  // Re-trigger scan simulation on page 1
  const triggerScan = () => {
    setIsSimulatingScan(true);
    setTimeout(() => setIsSimulatingScan(false), 1600);
  };

  // Simulated SMS advisory send on page 5
  const sendAdvisorySms = () => {
    setSmsSent(true);
    setTimeout(() => setSmsSent(false), 4000);
  };

  return (
    <div
      ref={containerRef}
      style={{
        minHeight: '320vh',
        position: 'relative',
      }}
    >
      {/* Sticky Presentation Desk */}
      <div
        style={{
          position: 'sticky',
          top: '78px',
          height: 'calc(100vh - 95px)',
          minHeight: 620,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: '1rem',
          padding: '0.5rem 0',
        }}
      >
        {/* Top Control Ribbon: Chapter Navigation & Scroll Progress Indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '0.65rem 1.25rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {/* Chapter Selector Tabs */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              overflowX: 'auto',
              scrollbarWidth: 'none',
              maxWidth: '100%',
            }}
          >
            {CHAPTERS.map((ch, idx) => {
              const isActive = currentPage === idx;
              const isPassed = currentPage > idx;
              return (
                <button
                  key={ch.id}
                  onClick={() => goToPage(idx)}
                  type="button"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 12px',
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
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
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

          {/* Scroll Progress & Page Turn Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <ArrowDown size={12} className="animate-bounce" />
                Scroll to flip
              </span>
              <span style={{ color: 'var(--text-light)' }}>·</span>
              <strong style={{ color: 'var(--primary-600)' }}>
                Page {currentPage + 1} / {CHAPTERS.length}
              </strong>
            </div>

            {/* Previous / Next Arrow Buttons */}
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                onClick={prevPage}
                disabled={currentPage === 0}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-subtle)',
                  color: currentPage === 0 ? 'var(--text-light)' : 'var(--text-main)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
                }}
                title="Previous Page"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={nextPage}
                disabled={currentPage === CHAPTERS.length - 1}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-subtle)',
                  color:
                    currentPage === CHAPTERS.length - 1 ? 'var(--text-light)' : 'var(--text-main)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: currentPage === CHAPTERS.length - 1 ? 'not-allowed' : 'pointer',
                }}
                title="Next Page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            THE 3D OPEN FIELD NOTEBOOK (DUAL SPREAD WITH PAGE TURN EFFECT)
            ══════════════════════════════════════════════════════════════════ */}
        <div
          className="field-notebook-desk"
          style={{
            flex: 1,
            position: 'relative',
            perspective: 2600,
            perspectiveOrigin: '50% 50%',
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.2fr)',
            gap: 0,
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--notebook-shadow)',
            background: 'var(--notebook-paper)',
            border: '1px solid var(--border-subtle)',
            overflow: 'hidden',
          }}
        >
          {/* Central Ring Binder Spiral Wire */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: '45.45%',
              width: 24,
              transform: 'translateX(-50%)',
              zIndex: 30,
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
                  width: 26,
                  height: 10,
                  borderRadius: 6,
                  background:
                    'linear-gradient(180deg, #94a3b8 0%, #475569 40%, #1e293b 80%, #94a3b8 100%)',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.2)',
                }}
              />
            ))}
          </div>

          {/* ─────────────────────────────────────────────────────────────
              LEFT SPREAD: FIXED LOGBOOK FIELD HEADER & RUNTIME SPECS
              ───────────────────────────────────────────────────────────── */}
          <div
            style={{
              padding: '2rem 2.25rem 2rem 2.5rem',
              borderRight: '2px dashed var(--border-subtle)',
              backgroundImage: 'linear-gradient(var(--notebook-line) 1px, transparent 1px)',
              backgroundSize: '100% 28px',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              backgroundPosition: '0 10px',
              overflowY: 'auto',
            }}
          >
            {/* Header Field Stamp */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--border-subtle)',
                paddingBottom: 14,
              }}
            >
              <div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    color: 'var(--primary-600)',
                    textTransform: 'uppercase',
                  }}
                >
                  <BookOpen size={12} />
                  <span>AGRONOMIST FIELD RESEARCH LOG</span>
                </div>
                <h3
                  style={{
                    fontSize: '1.45rem',
                    fontWeight: 900,
                    margin: '4px 0 2px',
                    color: 'var(--text-main)',
                  }}
                >
                  Tomato (Solanum lycopersicum)
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                  Plot 4B · Solapur Agro-Cluster · Kharif Season 2026
                </p>
              </div>

              {/* Verified Stamp */}
              <div
                style={{
                  border: '2px solid #16a34a',
                  color: '#16a34a',
                  borderRadius: 6,
                  padding: '4px 8px',
                  fontSize: '0.65rem',
                  fontWeight: 900,
                  letterSpacing: '0.08em',
                  transform: 'rotate(-4deg)',
                  textAlign: 'center',
                  background: 'rgba(34, 197, 94, 0.08)',
                }}
              >
                <div>ONNX v2.4</div>
                <strong style={{ fontSize: '0.75rem' }}>CALIBRATED</strong>
              </div>
            </div>

            {/* Active Workflow Progression Tracker */}
            <div>
              <div
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  marginBottom: 10,
                }}
              >
                Diagnostic Pipeline State:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {CHAPTERS.map((ch, idx) => {
                  const isCurrent = currentPage === idx;
                  const isDone = currentPage > idx;
                  return (
                    <div
                      key={ch.id}
                      onClick={() => goToPage(idx)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '6px 10px',
                        borderRadius: 'var(--radius-sm)',
                        background: isCurrent
                          ? 'rgba(var(--primary-rgb), 0.14)'
                          : isDone
                          ? 'var(--bg-subtle)'
                          : 'transparent',
                        border: isCurrent
                          ? '1px solid var(--primary-600)'
                          : '1px solid transparent',
                        cursor: 'pointer',
                        transition: 'all 0.18s ease',
                      }}
                    >
                      <div
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          background: isCurrent
                            ? 'var(--primary-600)'
                            : isDone
                            ? '#16a34a'
                            : 'var(--border-medium)',
                          color: '#fff',
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {isDone ? <CheckCircle2 size={12} /> : ch.num}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: '0.82rem',
                            fontWeight: isCurrent ? 800 : 600,
                            color: isCurrent
                              ? 'var(--primary-600)'
                              : isDone
                              ? 'var(--text-main)'
                              : 'var(--text-muted)',
                          }}
                        >
                          {ch.title}
                        </div>
                      </div>
                      {isCurrent && (
                        <span
                          style={{
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            color: 'var(--primary-600)',
                            background: '#ffffff',
                            padding: '2px 6px',
                            borderRadius: 9999,
                            boxShadow: 'var(--shadow-sm)',
                          }}
                        >
                          ACTIVE
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Telemetry Summary Strip */}
            <div
              style={{
                marginTop: 'auto',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
              }}
            >
              <div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  PATHOLOGY MATCH
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f59e0b' }}>
                  Alternaria solani
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Early Blight</div>
              </div>
              <div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  INFERENCE LATENCY
                </div>
                <div
                  style={{
                    fontSize: '0.95rem',
                    fontWeight: 800,
                    color: 'var(--primary-600)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Zap size={14} /> 34ms
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Sub-50ms hard limit</div>
              </div>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              RIGHT SPREAD: DYNAMIC FLIPPING PAGE CONTENT
              ───────────────────────────────────────────────────────────── */}
          <div
            style={{
              position: 'relative',
              overflow: 'hidden',
              backgroundImage: 'linear-gradient(var(--notebook-line) 1px, transparent 1px)',
              backgroundSize: '100% 28px',
              backgroundPosition: '0 10px',
              padding: '2.25rem 2.5rem 2.25rem 2.5rem',
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--notebook-paper)',
            }}
          >
            {/* Page Header Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--border-subtle)',
                paddingBottom: 12,
                marginBottom: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 900,
                    color: '#ffffff',
                    background: 'var(--primary-600)',
                    padding: '3px 9px',
                    borderRadius: 6,
                  }}
                >
                  STEP {CHAPTERS[currentPage].num}
                </span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    color: 'var(--primary-600)',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}
                >
                  {CHAPTERS[currentPage].tag}
                </span>
              </div>
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  fontStyle: 'italic',
                }}
              >
                Page {currentPage + 1} of {CHAPTERS.length}
              </div>
            </div>

            {/* Dynamic Page Content Container with Fade/Flip Transition */}
            <div
              key={currentPage}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                animation: 'pageCurlIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <h2
                style={{
                  fontSize: '1.45rem',
                  fontWeight: 900,
                  color: 'var(--text-main)',
                  margin: '0 0 6px',
                  letterSpacing: '-0.02em',
                }}
              >
                {CHAPTERS[currentPage].title}
              </h2>
              <p
                style={{
                  fontSize: '0.88rem',
                  color: 'var(--text-muted)',
                  lineHeight: 1.6,
                  margin: '0 0 16px',
                }}
              >
                {CHAPTERS[currentPage].summary}
              </p>

              {/* ─── CHAPTER 1: OPTICAL SCAN STAGE ─────────────────────── */}
              {currentPage === 0 && (
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14,
                  }}
                >
                  <div
                    style={{
                      position: 'relative',
                      height: 220,
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
                    {/* Bounding box guide corners */}
                    <div
                      style={{
                        position: 'absolute',
                        inset: 20,
                        border: '2px dashed rgba(255,255,255,0.4)',
                        borderRadius: 8,
                        pointerEvents: 'none',
                      }}
                    >
                      <span
                        style={{
                          position: 'absolute',
                          top: 8,
                          left: 8,
                          fontSize: '0.65rem',
                          color: '#fff',
                          background: 'rgba(0,0,0,0.5)',
                          padding: '2px 6px',
                          borderRadius: 4,
                        }}
                      >
                        LEAF TARGET AREA
                      </span>
                    </div>

                    {/* Concentric Lesion Spots */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '38%',
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
                        width: 30,
                        height: 30,
                        borderRadius: '50%',
                        background:
                          'radial-gradient(circle, #2d1804 20%, #7c3a07 60%, rgba(245,158,11,0.5) 90%)',
                      }}
                    />

                    {/* Moving Laser Scanner Line */}
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        height: 3,
                        background: 'linear-gradient(90deg, transparent, #22c55e, #4ade80, transparent)',
                        boxShadow: '0 0 15px #22c55e',
                        animation: isSimulatingScan
                          ? 'laserFast 0.8s ease-in-out infinite'
                          : 'laserSweep 3s ease-in-out infinite',
                      }}
                    />

                    <button
                      onClick={triggerScan}
                      type="button"
                      style={{
                        position: 'absolute',
                        bottom: 12,
                        right: 12,
                        background: 'rgba(0,0,0,0.65)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        color: '#fff',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '5px 10px',
                        borderRadius: 6,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                      }}
                    >
                      <Scan size={12} /> {isSimulatingScan ? 'Scanning…' : 'Trigger Rescan'}
                    </button>
                  </div>

                  {/* Tensor Specifications */}
                  <div
                    style={{
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '10px 14px',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: 8,
                      fontSize: '0.75rem',
                    }}
                  >
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Input Shape:</span>
                      <div style={{ fontWeight: 800, color: 'var(--text-main)' }}>[1, 3, 224, 224]</div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>RGB Mean:</span>
                      <div style={{ fontWeight: 800, color: 'var(--text-main)' }}>[0.485, 0.456, 0.406]</div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Standardization:</span>
                      <div style={{ fontWeight: 800, color: 'var(--primary-600)' }}>ImageNet FP32</div>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── CHAPTER 2: ONNX RUNTIME INFERENCE ──────────────────── */}
              {currentPage === 1 && (
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14,
                  }}
                >
                  <div
                    style={{
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)' }}>
                        Top-3 Pathogen Confidence Softmax
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
                        ⚡ 34ms Execution
                      </span>
                    </div>

                    {/* Progress Bar 1 */}
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '0.78rem',
                          marginBottom: 4,
                        }}
                      >
                        <strong style={{ color: '#f59e0b' }}>Tomato Early Blight (Alternaria solani)</strong>
                        <span style={{ fontWeight: 800, color: '#f59e0b' }}>96.4%</span>
                      </div>
                      <div
                        style={{
                          height: 8,
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
                            borderRadius: 4,
                          }}
                        />
                      </div>
                    </div>

                    {/* Progress Bar 2 */}
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
                          height: 6,
                          background: 'var(--border-subtle)',
                          borderRadius: 3,
                          overflow: 'hidden',
                        }}
                      >
                        <div style={{ width: '2.1%', height: '100%', background: '#94a3b8' }} />
                      </div>
                    </div>

                    {/* Progress Bar 3 */}
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '0.78rem',
                          marginBottom: 4,
                        }}
                      >
                        <span style={{ color: 'var(--text-muted)' }}>Late Blight (Phytophthora)</span>
                        <span style={{ color: 'var(--text-muted)' }}>1.0%</span>
                      </div>
                      <div
                        style={{
                          height: 6,
                          background: 'var(--border-subtle)',
                          borderRadius: 3,
                          overflow: 'hidden',
                        }}
                      >
                        <div style={{ width: '1.0%', height: '100%', background: '#94a3b8' }} />
                      </div>
                    </div>
                  </div>

                  {/* Architecture Callout */}
                  <div
                    style={{
                      borderLeft: '3px solid var(--primary-600)',
                      padding: '8px 14px',
                      background: 'rgba(var(--primary-rgb), 0.08)',
                      borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                      fontSize: '0.8rem',
                      lineHeight: 1.5,
                      color: 'var(--text-main)',
                    }}
                  >
                    <strong>SIH Compliance:</strong> In-process ONNX engine requires <strong>no Python</strong> at
                    runtime—executing asynchronously in native C++ bindings for enterprise scale.
                  </div>
                </div>
              )}

              {/* ─── CHAPTER 3: GRAD-CAM ATTENTION SALIENCY ────────────── */}
              {currentPage === 2 && (
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                      Visual Attention Layer:
                    </span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => setViewMode('scan')}
                        type="button"
                        style={{
                          padding: '4px 10px',
                          borderRadius: 6,
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          border: '1px solid var(--border-subtle)',
                          background: viewMode === 'scan' ? 'var(--primary-600)' : 'var(--bg-card)',
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
                          borderRadius: 6,
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          border: '1px solid var(--border-subtle)',
                          background: viewMode === 'heatmap' ? 'var(--primary-600)' : 'var(--bg-card)',
                          color: viewMode === 'heatmap' ? '#fff' : 'var(--text-muted)',
                          cursor: 'pointer',
                        }}
                      >
                        Grad-CAM Thermal
                      </button>
                    </div>
                  </div>

                  {/* Visualizer Frame */}
                  <div
                    style={{
                      height: 200,
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
                    {/* Lesion Spots */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '40%',
                        left: '46%',
                        width: 48,
                        height: 48,
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
                          animation: 'fadeIn 0.3s ease',
                        }}
                      />
                    )}

                    <div
                      style={{
                        position: 'absolute',
                        bottom: 8,
                        left: 10,
                        background: 'rgba(0,0,0,0.6)',
                        color: '#fff',
                        padding: '3px 8px',
                        borderRadius: 4,
                        fontSize: '0.68rem',
                        fontWeight: 600,
                      }}
                    >
                      {viewMode === 'heatmap'
                        ? '🔥 Red focal region: 91.2% Saliency Alignment'
                        : '🌿 Natural Leaf RGB Spectrum'}
                    </div>
                  </div>

                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                    Grad-CAM extracts gradients flowing into the final convolutional feature layer, confirming
                    the model targets biological fungal concentric rings rather than background fingers or soil.
                  </p>
                </div>
              )}

              {/* ─── CHAPTER 4: PENMAN-MONTEITH IRRIGATION ──────────────── */}
              {currentPage === 3 && (
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14,
                  }}
                >
                  <div
                    style={{
                      background: 'rgba(59, 130, 246, 0.08)',
                      border: '1px solid rgba(59, 130, 246, 0.25)',
                      borderRadius: 'var(--radius-md)',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
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
                        <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-main)' }}>
                          Delay Irrigation Schedule
                        </div>
                      </div>
                    </div>

                    {/* Sensor Telemetry Grid */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr',
                        gap: 8,
                        background: 'var(--bg-card)',
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: '0.75rem',
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
                        <strong>Preservation Dividend:</strong> Conserves <strong>1,800 Liters</strong> of groundwater
                        by avoiding pre-rain pumping.
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── CHAPTER 5: DUAL REMEDIATION PRESCRIPTION ───────────── */}
              {currentPage === 4 && (
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                  }}
                >
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-main)' }}>
                        Dual Protocol Prescription
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

                    {/* Organic remediation */}
                    <div
                      style={{
                        padding: '8px 10px',
                        background: 'rgba(34, 197, 94, 0.08)',
                        borderLeft: '3px solid #16a34a',
                        borderRadius: 4,
                      }}
                    >
                      <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#16a34a' }}>
                        ORGANIC BIOCONTROL (RECOMMENDED FIRST)
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-main)', marginTop: 2 }}>
                        Neem seed kernel extract 5% + Trichoderma viride @ 5g/L foliar spray.
                      </div>
                    </div>

                    {/* Chemical remediation */}
                    <div
                      style={{
                        padding: '8px 10px',
                        background: 'rgba(234, 179, 8, 0.08)',
                        borderLeft: '3px solid #eab308',
                        borderRadius: 4,
                      }}
                    >
                      <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#ca8a04' }}>
                        TARGETED CHEMICAL CONTROL (IF SPREAD &gt; 5%)
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-main)', marginTop: 2 }}>
                        Mancozeb 75% WP @ 2.5g/L water. Withholding interval: 7 days.
                      </div>
                    </div>
                  </div>

                  {/* SMS Share Action */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 'auto' }}>
                    <button
                      onClick={sendAdvisorySms}
                      type="button"
                      className="btn-primary"
                      style={{
                        flex: 1,
                        padding: '0.65rem 1rem',
                        fontSize: '0.85rem',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                      }}
                    >
                      <Send size={15} />
                      {smsSent ? '✓ SMS Dispatched to Field Technician!' : 'Dispatch Advisory SMS to Grower'}
                    </button>
                  </div>
                </div>
              )}

              {/* Bottom Page Turn Controls */}
              <div
                style={{
                  marginTop: 'auto',
                  paddingTop: 12,
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
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
                  }}
                >
                  <ChevronLeft size={14} /> Previous Chapter
                </button>

                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Interactive Leaf Binder
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
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: currentPage === CHAPTERS.length - 1 ? 'not-allowed' : 'pointer',
                  }}
                >
                  Next Chapter <ChevronRight size={14} />
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
          0%, 100% { top: 10%; opacity: 1; }
          50% { top: 88%; opacity: 1; }
        }
        @keyframes pageCurlIn {
          0% {
            opacity: 0;
            transform: translateX(12px) rotateY(-4deg);
          }
          100% {
            opacity: 1;
            transform: translateX(0) rotateY(0);
          }
        }
        @media (max-width: 900px) {
          .field-notebook-desk {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AgronomyWorkflow;

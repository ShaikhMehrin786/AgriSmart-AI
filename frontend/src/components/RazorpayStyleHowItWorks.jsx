import React, { useState } from 'react';
import {
  Leaf,
  Droplets,
  Cloud,
  Bot,
  BarChart2,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Zap,
  ShieldCheck,
  Cpu,
  Layers,
  Activity,
  Check,
  Smartphone,
  Flame,
  FileText,
  Clock,
  Compass,
} from 'lucide-react';

const CATEGORIES = [
  {
    id: 'detection',
    name: 'AI Disease Detection',
    shortName: 'Disease Detection',
    icon: Leaf,
    badge: 'In-Process ONNX',
    title: 'Autonomous Foliage Pathology & Diagnosis',
    subtitle: 'From a single smartphone snapshot to verified pathogen identification with Grad-CAM explainability.',
    subTabs: ['Top Highlights', 'Field Diagnostic Scan', 'Grad-CAM Heatmaps', 'Treatment Dosages', 'No-Code Mobile Web'],
    cards: [
      {
        type: 'ui_preview',
        tag: 'LIVE INFERENCE',
        title: 'Instant Foliage Scan',
        desc: 'Sub-35ms ONNX model execution with zero cloud latency.',
        uiState: {
          step1: 'RGB Normalization (ImageNet std)',
          step2: 'Tensor shape [1, 3, 224, 224]',
          step3: 'In-Process onnxruntime-node',
          result: 'Tomato Early Blight · 96.4% Match',
        },
      },
      {
        type: 'field_photo',
        image: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb22510?auto=format&fit=crop&w=700&q=80',
        badge: 'AUTOMATED DETECTION',
        bubble: {
          tag: 'AI DIAGNOSIS',
          text: 'Alternaria solani detected in Plot 4B',
          time: '34ms latency',
        },
        title: 'Real-Time Field Pathology',
        desc: 'Detects foliar diseases before visible symptoms spread across the canopy.',
      },
      {
        type: 'farmer_photo',
        image: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=700&q=80',
        badge: 'NO CODE',
        bubble: {
          tag: 'PRESCRIPTION',
          text: 'Spray Mancozeb 75% WP @ 2.5g/L',
          time: 'Verified Dosage',
        },
        title: 'Actionable Agronomy Advice',
        desc: 'Instant certified organic & chemical prescriptions tailored to severity level.',
      },
      {
        type: 'checklist',
        badge: 'EXPLAINABLE AI',
        title: 'Dual-Benchmark Audited',
        desc: 'Eliminates black-box ambiguity so extension officers trust model reasoning.',
        items: [
          'PlantVillage Laboratory Benchmark (99.2%)',
          'PlantDoc In-The-Wild Field Benchmark (89.6%)',
          'Grad-CAM Heatmap Thermal Attention Map',
          'Zero-Python Server Deployment (ONNX Native)',
        ],
        actionText: 'Explore Validation Card →',
      },
    ],
  },
  {
    id: 'irrigation',
    name: 'Smart Irrigation',
    shortName: 'Smart Irrigation',
    icon: Droplets,
    badge: 'Penman-Monteith ET0',
    title: 'Autonomous Crop-Stage Water Scheduling',
    subtitle: 'Calculates dynamic water requirements based on soil moisture depletion and 24-hour precipitation forecasts.',
    subTabs: ['Top Highlights', 'Soil Moisture Triggers', 'Weather-Rain Intercept', 'Water Conservation Metrics'],
    cards: [
      {
        type: 'ui_preview',
        tag: 'ET0 CALCULATOR',
        title: 'Dynamic Soil Telemetry',
        desc: 'Synthesizes moisture sensors with atmospheric evaporation rates.',
        uiState: {
          step1: 'Root-Zone Moisture: 48% (Optimal)',
          step2: 'Atmospheric ET0: 4.8 mm/day',
          step3: 'Precipitation Prob: 75% within 18 hrs',
          result: 'Decision: Delay Irrigation (Save 1800 L)',
        },
      },
      {
        type: 'field_photo',
        image: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=700&q=80',
        badge: 'WATER AUDITING',
        bubble: {
          tag: 'DELAY ACTION',
          text: 'Rainfall expected; delayed 24h',
          time: 'Saved 35% water',
        },
        title: 'Smart Rainfall Intercept',
        desc: 'Prevents root rot and unnecessary pumping costs before predicted rain.',
      },
      {
        type: 'farmer_photo',
        image: 'https://images.unsplash.com/photo-1560493676-04071c5f467b?auto=format&fit=crop&w=700&q=80',
        badge: 'NO CODE',
        bubble: {
          tag: 'SCHEDULE',
          text: 'Next window: Tomorrow 06:00 AM',
          time: 'Drip System',
        },
        title: 'Precision Micro-Irrigation',
        desc: 'Customized timing for drip and sprinkler lines to minimize evaporation loss.',
      },
      {
        type: 'checklist',
        badge: 'RESOURCE IMPACT',
        title: 'Conservation Outcomes',
        desc: 'Designed for groundwater conservation in critical agricultural zones.',
        items: [
          'Up to 38% reduction in agricultural water use',
          'Root-zone disease prevention from waterlogging',
          'Automated pump scheduling logs',
          'Energy & diesel cost savings for farmers',
        ],
        actionText: 'View Irrigation Calculator →',
      },
    ],
  },
  {
    id: 'weather',
    name: 'Weather Spore Radar',
    shortName: 'Weather Intelligence',
    icon: Cloud,
    badge: 'Microclimate Alert',
    title: 'Hyperlocal Weather & Pathogen Outbreak Warning',
    subtitle: 'Correlates humidity spikes, ambient temperature, and wind vectors to forecast spore germination risks.',
    subTabs: ['Top Highlights', 'Spore Germination Index', '24h Safe Spray Window', 'Fungal Risk Matrix'],
    cards: [
      {
        type: 'ui_preview',
        tag: 'EPIDEMIOLOGY ENGINE',
        title: 'Pathogen Outbreak Risk',
        desc: 'Predicts fungal spread windows before lesions manifest.',
        uiState: {
          step1: 'Relative Humidity: 86% (Critical)',
          step2: 'Night Temperature: 21.5°C (Warm)',
          step3: 'Pathogen Biology: Phytophthora infestans',
          result: 'Alert: High Outbreak Risk within 48h',
        },
      },
      {
        type: 'field_photo',
        image: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&w=700&q=80',
        badge: 'WEATHER RADAR',
        bubble: {
          tag: 'OUTBREAK ALERT',
          text: 'Humidity >85%: Spray window active',
          time: 'Act within 24h',
        },
        title: 'Early Warning Spore System',
        desc: 'Flags microclimate conditions that favor rapid fungal spore germination.',
      },
      {
        type: 'farmer_photo',
        image: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=700&q=80',
        badge: 'NO CODE',
        bubble: {
          tag: 'SAFE SPRAY',
          text: 'Wind speed 4 km/h · Optimal spray',
          time: 'No drift loss',
        },
        title: 'Spray Drift Window Planner',
        desc: 'Tells farmers the exact time of day when wind speed and rain conditions allow spraying.',
      },
      {
        type: 'checklist',
        badge: 'ACCURACY & DATA',
        title: 'Weather Integration Specs',
        desc: 'Grounded in biological epidemiological thresholds for solanaceous crops.',
        items: [
          'Hourly temperature, humidity & dew point logs',
          'Precipitation probability & storm alerts',
          'Automated weather logging to PostgreSQL',
          'Offline simulated fallbacks for remote fields',
        ],
        actionText: 'View Outbreak Warning Map →',
      },
    ],
  },
  {
    id: 'assistant',
    name: 'AI Agronomist Chat',
    shortName: 'AI Agronomist',
    icon: Bot,
    badge: 'Bilingual LLM',
    title: 'Interactive Multilingual Agricultural Advisory',
    subtitle: 'Conversational specialist providing tailored recommendations in English and Hindi grounded in your scan history.',
    subTabs: ['Top Highlights', 'Bilingual Dialogue (EN/HI)', 'Grounded Scan RAG', 'Pesticide Reduction Advisory'],
    cards: [
      {
        type: 'ui_preview',
        tag: 'RAG DIALOGUE',
        title: 'Grounded Agronomist Bot',
        desc: 'Retrieves user scan records and local weather before formulating advice.',
        uiState: {
          step1: 'Farmer: "How much neem oil for Plot 4B?"',
          step2: 'Retrieved: Tomato Early Blight (96.4%)',
          step3: 'Weather: Clear for next 36 hours',
          result: 'Prescription: 5ml/L water in morning',
        },
      },
      {
        type: 'field_photo',
        image: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=700&q=80',
        badge: 'VOICE & TEXT',
        bubble: {
          tag: 'AGRONOMY BOT',
          text: 'Bilingual support in Hindi and English',
          time: 'Zero jargon',
        },
        title: 'Farmer-Friendly Interaction',
        desc: 'Provides plain-language answers without confusing biochemical jargon.',
      },
      {
        type: 'farmer_photo',
        image: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=700&q=80',
        badge: 'NO CODE',
        bubble: {
          tag: 'ORGANIC FIRST',
          text: 'Bio-control prioritised over chemicals',
          time: 'Certified Organic',
        },
        title: 'Integrated Pest Management (IPM)',
        desc: 'Promotes bio-fungicides and Trichoderma solutions before synthetic chemical sprays.',
      },
      {
        type: 'checklist',
        badge: 'LLM ARCHITECTURE',
        title: 'Grounded Agronomic RAG',
        desc: 'Built to prevent hallucinations by anchoring prompts to database entities.',
        items: [
          'Grounded in verified ICAR / TNAU crop monographs',
          'Contextual awareness of past field scans',
          'Automatic weather correlation in prompt context',
          'Zero medical/biological hallucination guardrails',
        ],
        actionText: 'Start Agronomist Chat →',
      },
    ],
  },
  {
    id: 'sustainability',
    name: 'Eco-Yield Sustainability',
    shortName: 'Sustainability',
    icon: BarChart2,
    badge: 'ESG & Ecology',
    title: 'Farm Ecological Footprint & Yield Indexing',
    subtitle: 'Quantify resource savings, chemical runoff mitigation, and carbon sequestration scorecards.',
    subTabs: ['Top Highlights', 'Water Conservation Audit', 'Chemical Footprint', 'Yield Optimization'],
    cards: [
      {
        type: 'ui_preview',
        tag: 'ECO INDEX',
        title: 'Farm Ecological Scorecard',
        desc: 'Aggregates irrigation efficiency, spray precision, and crop health.',
        uiState: {
          step1: 'Water Conservation: 92/100 (Superior)',
          step2: 'Chemical Mitigation: 84/100 (Low Runoff)',
          step3: 'Soil Biostimulant Use: High',
          result: 'Overall Sustainability Rating: 88% (A+)',
        },
      },
      {
        type: 'field_photo',
        image: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=700&q=80',
        badge: 'CARBON & SOIL',
        bubble: {
          tag: 'SOIL HEALTH',
          text: 'Optimal microbial biodiversity',
          time: 'Grade A',
        },
        title: 'Regenerative Agriculture',
        desc: 'Helps farmers qualify for carbon credits and organic produce premium pricing.',
      },
      {
        type: 'farmer_photo',
        image: 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&w=700&q=80',
        badge: 'NO CODE',
        bubble: {
          tag: 'SAVINGS',
          text: 'Reduced pesticide expense by 32%',
          time: 'This Season',
        },
        title: 'Economic & Environmental Win',
        desc: 'Targeted spraying cuts chemical input costs while boosting long-term soil vitality.',
      },
      {
        type: 'checklist',
        badge: 'METRICS & AUDIT',
        title: 'Farm Sustainability Metrics',
        desc: 'Actionable indicators for farm cooperatives and sustainability audits.',
        items: [
          'Evaporation loss reduction indices',
          'Pesticide active ingredient volume reduction tracking',
          'Crop rotation diversity quotient',
          'Downloadable seasonal audit certificates',
        ],
        actionText: 'View Sustainability Dashboard →',
      },
    ],
  },
];

const RazorpayStyleHowItWorks = () => {
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);
  const [activeSubTab, setActiveSubTab] = useState(0);
  const [interactiveScanActive, setInteractiveScanActive] = useState(false);

  const category = CATEGORIES[activeCategoryIndex];

  const handleCategoryChange = (index) => {
    setActiveCategoryIndex(index);
    setActiveSubTab(0);
    setInteractiveScanActive(false);
  };

  return (
    <div className="razorpay-showcase-container">
      {/* ── Top Level Horizontal Tabs (Razorpay Nav Style) ── */}
      <div className="razorpay-top-nav-wrap">
        <div className="razorpay-top-nav">
          {CATEGORIES.map((cat, idx) => {
            const Icon = cat.icon;
            const isActive = activeCategoryIndex === idx;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryChange(idx)}
                className={`razorpay-nav-tab ${isActive ? 'active' : ''}`}
              >
                <Icon size={16} className="tab-icon" />
                <span className="tab-text">{cat.name}</span>
                {isActive && <div className="active-tab-indicator" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main Showcase Content Box ── */}
      <div className="razorpay-content-box">
        {/* Section Header */}
        <div className="razorpay-content-header">
          <div>
            <div className="category-meta-badge">
              <Zap size={13} />
              <span>{category.badge}</span>
            </div>
            <h2 className="category-title">{category.title}</h2>
            <p className="category-subtitle">{category.subtitle}</p>
          </div>
        </div>

        {/* Sub-Tabs / Filter Pills (Matching Razorpay sub-navigation) */}
        <div className="razorpay-sub-tabs-bar">
          {category.subTabs.map((subTab, idx) => (
            <button
              key={subTab}
              type="button"
              onClick={() => setActiveSubTab(idx)}
              className={`razorpay-sub-tab-btn ${activeSubTab === idx ? 'active' : ''}`}
            >
              {subTab}
              {activeSubTab === idx && <div className="sub-tab-active-bar" />}
            </button>
          ))}
        </div>

        {/* ── 4-Card Responsive Grid (Razorpay Style Card Showcase) ── */}
        <div className="razorpay-cards-grid">
          {category.cards.map((card, idx) => {
            // Card 1: Interactive UI Component Mockup
            if (card.type === 'ui_preview') {
              return (
                <div key={idx} className="razorpay-card ui-mock-card">
                  <div className="card-top-tag">{card.tag}</div>
                  <h4 className="card-headline">{card.title}</h4>
                  <p className="card-subtext">{card.desc}</p>

                  {/* Interactive UI Box */}
                  <div className="ui-inner-box">
                    <div className="ui-line">
                      <CheckCircle2 size={13} className="text-emerald" />
                      <span>{card.uiState.step1}</span>
                    </div>
                    <div className="ui-line">
                      <CheckCircle2 size={13} className="text-emerald" />
                      <span>{card.uiState.step2}</span>
                    </div>
                    <div className="ui-line">
                      <CheckCircle2 size={13} className="text-emerald" />
                      <span>{card.uiState.step3}</span>
                    </div>

                    <div className="ui-result-pill">
                      <span className="live-blink" />
                      <span>{card.uiState.result}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setInteractiveScanActive(!interactiveScanActive)}
                      className="btn-interactive-mock"
                    >
                      <Zap size={14} />
                      {interactiveScanActive ? 'Inference Verified (<35ms)' : 'Simulate Diagnostic Pipeline'}
                    </button>
                  </div>
                </div>
              );
            }

            // Card 2: Field Photo with Floating Glass Notification Tag
            if (card.type === 'field_photo') {
              return (
                <div key={idx} className="razorpay-card media-card">
                  <div className="card-media-wrapper">
                    <img src={card.image} alt={card.title} className="card-image" loading="lazy" />
                    <div className="card-image-overlay" />

                    {/* Floating Glass Notification Bubble (Razorpay SMS Style) */}
                    <div className="floating-notification-bubble">
                      <div className="bubble-header">
                        <span className="bubble-tag">{card.bubble.tag}</span>
                        <span className="bubble-time">{card.bubble.time}</span>
                      </div>
                      <div className="bubble-body">
                        <Check size={13} className="text-emerald" />
                        <span>{card.bubble.text}</span>
                      </div>
                    </div>
                  </div>

                  <div className="card-text-wrapper">
                    <h4 className="card-headline">{card.title}</h4>
                    <p className="card-subtext">{card.desc}</p>
                  </div>
                </div>
              );
            }

            // Card 3: Real Farmer / Agronomist Photo with "NO CODE" Badge
            if (card.type === 'farmer_photo') {
              return (
                <div key={idx} className="razorpay-card media-card">
                  <div className="card-media-wrapper">
                    <img src={card.image} alt={card.title} className="card-image" loading="lazy" />
                    <div className="card-image-overlay" />

                    {/* Top Right NO CODE Badge */}
                    <div className="no-code-corner-badge">NO CODE</div>

                    {/* Floating Pill on Farmer Image */}
                    <div className="floating-notification-bubble farmer-bubble">
                      <div className="bubble-header">
                        <span className="bubble-tag farmer-tag">{card.bubble.tag}</span>
                        <span className="bubble-time">{card.bubble.time}</span>
                      </div>
                      <div className="bubble-body">
                        <span>{card.bubble.text}</span>
                      </div>
                    </div>
                  </div>

                  <div className="card-text-wrapper">
                    <h4 className="card-headline">{card.title}</h4>
                    <p className="card-subtext">{card.desc}</p>
                  </div>
                </div>
              );
            }

            // Card 4: Specification Checklist Card
            if (card.type === 'checklist') {
              return (
                <div key={idx} className="razorpay-card checklist-card">
                  <div className="card-top-tag">{card.badge}</div>
                  <h4 className="card-headline">{card.title}</h4>
                  <p className="card-subtext">{card.desc}</p>

                  <div className="checklist-items-wrap">
                    {card.items.map((item, itemIdx) => (
                      <div key={itemIdx} className="checklist-row">
                        <CheckCircle2 size={15} className="checklist-check-icon" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>

                  <div className="card-action-footer">
                    <a href="#benchmarks" className="card-link-action">
                      {card.actionText}
                    </a>
                  </div>
                </div>
              );
            }

            return null;
          })}
        </div>
      </div>
    </div>
  );
};

export default RazorpayStyleHowItWorks;

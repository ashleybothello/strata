import { Link } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { ArrowRight, Radio, ShieldAlert, Cpu, Wifi, MapPin, BarChart3, Bell, CheckCircle, Layers } from 'lucide-react';
import { useAppState } from '../state/AppState';
import TopNav from '../components/TopNav';
import Footer from '../components/Footer';

// ── Smoke canvas background ────────────────────────────────────────────────
function SmokeCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    let t = 0;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // smoke particles
    const particles = Array.from({ length: 55 }, () => ({
      x:     Math.random() * canvas.width,
      y:     canvas.height + Math.random() * 200,
      r:     80 + Math.random() * 160,
      dx:    (Math.random() - 0.5) * 0.3,
      dy:    -(0.18 + Math.random() * 0.35),
      alpha: 0.04 + Math.random() * 0.10,
      phase: Math.random() * Math.PI * 2,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // dark coal gradient base
      const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bg.addColorStop(0,   '#0a0a0a');
      bg.addColorStop(0.5, '#111111');
      bg.addColorStop(1,   '#0d0d0d');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // subtle amber glow center-left
      const glow = ctx.createRadialGradient(canvas.width * 0.25, canvas.height * 0.55, 0, canvas.width * 0.25, canvas.height * 0.55, canvas.width * 0.45);
      glow.addColorStop(0,   'rgba(180,80,10,0.07)');
      glow.addColorStop(0.5, 'rgba(120,50,5,0.03)');
      glow.addColorStop(1,   'transparent');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // smoke particles
      particles.forEach(p => {
        p.x   += p.dx + Math.sin(t * 0.008 + p.phase) * 0.4;
        p.y   += p.dy;
        p.alpha = Math.max(0, p.alpha - 0.00015);

        if (p.y < -p.r || p.alpha <= 0) {
          p.x     = Math.random() * canvas.width;
          p.y     = canvas.height + p.r;
          p.alpha = 0.04 + Math.random() * 0.10;
        }

        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        grad.addColorStop(0,   `rgba(50,50,50,${p.alpha})`);
        grad.addColorStop(0.5, `rgba(30,30,30,${p.alpha * 0.5})`);
        grad.addColorStop(1,   'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });

      t++;
      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        display: 'block',
      }}
    />
  );
}

// ── Crosshair dots (like the + marks in the reference) ───────────────────
function CrossDots({ count = 4 }) {
  const positions = [
    { left: '15%', bottom: '38%' },
    { left: '38%', bottom: '38%' },
    { left: '60%', bottom: '38%' },
    { left: '80%', bottom: '38%' },
  ].slice(0, count);

  return (
    <>
      {positions.map((pos, i) => (
        <span key={i} style={{
          position: 'absolute',
          ...pos,
          color: 'rgba(255,255,255,0.2)',
          fontSize: 18,
          lineHeight: 1,
          fontWeight: 300,
          userSelect: 'none',
          pointerEvents: 'none',
        }}>+</span>
      ))}
    </>
  );
}

const features = [
  { icon: <Wifi size={18} />, title: 'LoRa Wireless Mesh',       desc: 'Low-power 433 MHz mesh topology. No cellular infrastructure required.' },
  { icon: <Layers size={18} />, title: 'Multi-Sensor Grid',      desc: 'Tilt, strain, vibration & crack continuity per node — 500 ms sampling.' },
  { icon: <Cpu size={18} />, title: 'XGBoost AI Detection',      desc: 'Trained on Indian coalfield patterns. Flags subsidence precursors early.' },
  { icon: <MapPin size={18} />, title: 'GIS Risk Zone Mapping',  desc: 'Live deformation contour overlays on schematic panel maps.' },
  { icon: <Bell size={18} />, title: 'Automated Early Warning',  desc: 'NORMAL → WATCH → WARNING → CRITICAL per DGMS/CMR 2017 thresholds.' },
  { icon: <BarChart3 size={18} />, title: 'Historical Analytics', desc: 'Baseline tracking, seasonal trend analysis, export-ready reports.' },
];

const stats = [
  { num: '₹800',  label: 'Per-Node Cost',        sub: 'vs ₹50,000+ conventional' },
  { num: '3',     label: 'Active Field Nodes',   sub: 'ESP32 + LoRa + Multi-Sensor' },
  { num: '24/7',  label: 'Continuous Monitoring', sub: 'Solar-assisted low-power' },
  { num: '96%',   label: 'Network Health',        sub: 'LoRa mesh RF quality' },
];

const compliance = [
  'DGMS Circular 2 of 2016',
  'Coal Mines Regulations 2017 (CMR Rule 113)',
  'IS 15752:2007 (Ground Movement Monitoring)',
  'MoEF Environmental Guidelines',
  'Smart Mining Safety Compliance Standard',
];

export default function Home() {
  const { riskIndex, groundCondition, telemetry, activeAlerts } = useAppState();
  const n02 = telemetry[1];

  return (
    <div className="site-wrapper home-dark">
      <TopNav transparent />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="home-hero">
        <SmokeCanvas />
        <CrossDots count={4} />

        {/* Top-right tag list (like the reference's service list) */}
        <div className="home-hero-tags-right">
          <span>ESP32 · LoRa Mesh</span>
          <span>MPU6050 Tilt Sensor</span>
          <span>HX711 Extensometer</span>
          <span>XGBoost AI Engine</span>
        </div>

        {/* Center content */}
        <div className="home-hero-center">
          <div className="home-hero-eyebrow">
            <Radio size={11} />
            Industrial Safety · IoT-Enabled Early Warning Platform
          </div>

          <h1 className="home-hero-title">
            STRATA<sup style={{ fontSize: '0.35em', verticalAlign: 'super', opacity: 0.5 }}>®</sup>
            <br />
            <span className="home-hero-title-sub">Subsidence Monitoring</span>
          </h1>

          <p className="home-hero-desc">
            AI-enabled low-cost wireless sensor network for continuous deformation<br />
            monitoring above underground coal panels. Indigenous. Scalable. Made in India.
          </p>

          <div className="home-hero-actions">
            <Link to="/login" className="home-btn-primary">
              Login to Dashboard <ArrowRight size={14} />
            </Link>
            <a href="/dashboard/dashboard/index.html" className="home-btn-primary" style={{ background: '#c2ab8f', color: '#1a1510', border: 'none' }}>
              STRATA Beta
            </a>
            <Link to="/map" className="home-btn-ghost">
              3D Mine Map
            </Link>
            <Link to="/about" className="home-btn-ghost">
              About Platform
            </Link>
          </div>
        </div>



        {/* Bottom copyright line */}
        <div className="home-hero-footer-line">
          © 2026 STRATA · West Bokaro Coalfield, Jharkhand
        </div>
      </section>

      {/* ── STATS ──────────────────────────────────────────────────────────── */}
      <section className="home-section home-section-mid">
        <div className="home-container">
          <div className="home-stats-grid">
            {stats.map(s => (
              <div key={s.label} className="home-stat-card">
                <div className="home-stat-num">{s.num}</div>
                <div className="home-stat-label">{s.label}</div>
                <div className="home-stat-sub">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────────────────────────────── */}
      <section className="home-section">
        <div className="home-container">
          <div className="home-section-header">
            <span className="home-section-label">Core Capabilities</span>
            <h2 className="home-section-title">What the System Monitors</h2>
            <p className="home-section-desc">
              A multi-layer geotechnical sensing platform integrating low-cost hardware, wireless mesh communications,
              and AI-driven anomaly detection for underground coal mine safety.
            </p>
          </div>
          <div className="home-feature-grid">
            {features.map(f => (
              <div key={f.title} className="home-feature-card">
                <div className="home-feature-icon">{f.icon}</div>
                <div className="home-feature-title">{f.title}</div>
                <div className="home-feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPLIANCE & CTA ───────────────────────────────────────────────── */}
      <section className="home-section home-section-dark">
        <div className="home-container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
          <div>
            <span className="home-section-label">Regulatory Compliance</span>
            <h2 className="home-section-title" style={{ marginBottom: 24 }}>Built for Indian Mining Standards</h2>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {compliance.map(c => (
                <li key={c} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: 'rgba(200,200,200,0.75)' }}>
                  <CheckCircle size={14} style={{ color: '#c2ab8f', flexShrink: 0, marginTop: 2 }} />
                  {c}
                </li>
              ))}
            </ul>
          </div>

          <div style={{ textAlign: 'center' }}>
            <span className="home-section-label">Interactive Demo</span>
            <h2 className="home-section-title" style={{ marginBottom: 14 }}>Explore the Live Interface</h2>
            <p className="home-section-desc" style={{ marginBottom: 32 }}>
              Simulated telemetry demonstrating all system capabilities — real-time deformation to AI-assisted early warning.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/dashboard" className="home-btn-primary">Open Dashboard <ArrowRight size={14} /></Link>
              <Link to="/assessment" className="home-btn-ghost">AI Assessment</Link>
              <Link to="/map" className="home-btn-ghost">Mine Map</Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

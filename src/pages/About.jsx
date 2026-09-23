import TopNav from '../components/TopNav';
import Footer from '../components/Footer';
import { CheckCircle, AlertTriangle, Cpu, Wifi, Server, Monitor } from 'lucide-react';

const timeline = [
  { date:'2024', event:'Company founded & initial R&D on geotechnical telemetry' },
  { date:'2025', event:'Hardware Version 1.0 assembled: ESP32 + MPU6050 + HX711 + LoRa mesh integration' },
  { date:'2025', event:'Field testing across multiple nodes with gateway aggregation completed' },
  { date:'2026', event:'XGBoost anomaly detection model v2.0 trained on real coalfield deformation patterns' },
  { date:'2026', event:'STRATA Enterprise Dashboard launched with real-time telemetry' },
  { date:'2026', event:'Commercial deployments and DGMS compliance validation' },
];

const team = [
  { role:'Hardware Lead', resp:'ESP32 firmware, LoRa mesh protocol, sensor integration' },
  { role:'AI/ML Engineer', resp:'XGBoost model, feature engineering, anomaly detection pipeline' },
  { role:'Frontend Dev', resp:'React dashboard, real-time charts, GIS map visualization' },
  { role:'Backend Dev', resp:'FastAPI server, InfluxDB, MQTT broker, REST API' },
  { role:'Domain Expert', resp:'DGMS compliance, geotechnical baseline calibration, coal mine context' },
];

export default function About() {
  return (
    <div className="site-wrapper">
      <TopNav />

      {/* Header */}
      <section style={{ background:'var(--charcoal)', padding:'52px 0 44px', position:'relative' }}>
        <div style={{position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize:'40px 40px'}}/>
        <div className="container" style={{position:'relative'}}>
          <span className="section-label" style={{color:'#7dd3fc'}}>STRATA TECHNOLOGIES</span>
          <h1 style={{fontSize:36, fontWeight:800, color:'white', letterSpacing:'-0.02em', lineHeight:1.2, margin:'8px 0 12px'}}>
            About STRATA
          </h1>
          <p style={{fontSize:15, color:'#94a3b8', maxWidth:620, lineHeight:1.7}}>
            Enterprise-grade Real Time Mine Subsidence Monitoring, Prediction and Early Warning System for Underground Coal Mines.
          </p>
          <div style={{marginTop:20, display:'flex', gap:20, flexWrap:'wrap', fontSize:12, fontFamily:'var(--mono)', color:'#64748b'}}>
            <span>Company: <strong style={{color:'#94a3b8'}}>STRATA Technologies</strong></span>
            <span>Focus: <strong style={{color:'#94a3b8'}}>Geotechnical Safety & Automation</strong></span>
            <span>Compliance: <strong style={{color:'#94a3b8'}}>DGMS & CMR 2017 Standards</strong></span>
            <span>Target: <strong style={{color:'#94a3b8'}}>Underground Mining Safety</strong></span>
          </div>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="section section-alt">
        <div className="container">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:48 }}>
            <div>
              <span className="section-label">Problem Context</span>
              <h2 className="section-title">Why Mine Subsidence Monitoring Matters</h2>
              <p style={{fontSize:14, color:'var(--text-muted)', lineHeight:1.8, marginBottom:16}}>
                Surface subsidence caused by underground coal mining poses significant risks to nearby communities, public infrastructure, agricultural land, forest areas, and the surrounding environment.
              </p>
              <p style={{fontSize:14, color:'var(--text-muted)', lineHeight:1.8, marginBottom:16}}>
                In India, subsidence monitoring is still largely dependent on conventional field observations, periodic surveys, and post facto damage assessments, which often fail to provide timely warning before critical ground failure occurs.
              </p>
              <p style={{fontSize:14, color:'var(--text-muted)', lineHeight:1.8}}>
                There is a strong need for an <strong>indigenous, low cost, intelligent, and real time monitoring solution</strong> capable of detecting early signs of ground movement and enabling proactive risk mitigation.
              </p>
            </div>

            <div>
              <div className="card" style={{marginBottom:16}}>
                <div style={{fontWeight:700, fontSize:13, color:'var(--text-dark)', marginBottom:14}}>STRATA Innovation Hook</div>
                <div style={{padding:'12px 16px', background:'var(--bg)', border:'1px solid var(--gray-border)', borderRadius:'var(--radius)', fontFamily:'var(--mono)', fontSize:13, fontWeight:700, color:'var(--accent)', lineHeight:1.5, marginBottom:14}}>
                  "Wireless Surface Mesh Network for Real-Time Subsidence Detection"
                </div>
                <p style={{fontSize:13, color:'var(--text-muted)', lineHeight:1.7}}>
                  Unlike generic IoT proposals, STRATA deploys a localized wireless surface mesh over underground mine panels — creating a spatial sensor fabric that detects differential ground movement with sub-millimetre sensitivity.
                </p>
              </div>

              <div className="card">
                <div style={{fontWeight:700, fontSize:13, color:'var(--text-dark)', marginBottom:12}}>Expected Solution Components</div>
                {[
                  'Low-cost smart sensor nodes (ESP32/Arduino platform)',
                  'Wireless mesh network over underground panel surface',
                  'Real-time tilt, displacement, vibration, crack monitoring',
                  'AI/ML anomaly detection and subsidence prediction',
                  'GIS-based deformation map visualization',
                  'Automated early warning alerts',
                  'Offline capability with cloud synchronization',
                ].map(item => (
                  <div key={item} style={{display:'flex', gap:8, alignItems:'flex-start', marginBottom:8, fontSize:13, color:'var(--text-muted)'}}>
                    <CheckCircle size={14} style={{color:'var(--green)', flexShrink:0, marginTop:2}}/>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Deployment */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <span className="section-label">Platform Deployment</span>
            <h2 className="section-title">Platform Capabilities & Requirements</h2>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:24 }}>
            <div className="card" style={{borderLeft:'4px solid var(--green)'}}>
              <div style={{fontWeight:700, fontSize:14, color:'var(--text-dark)', marginBottom:12, display:'flex', alignItems:'center', gap:8}}>
                <CheckCircle size={16} style={{color:'var(--green)'}}/>
                Core Capabilities
              </div>
              {[
                'Real-time LoRa mesh telemetry from multiple field nodes',
                'Full alert escalation system (NORMAL → CRITICAL)',
                'XGBoost machine learning for risk scoring and prediction',
                'Interactive GIS mine panel map with risk overlays',
                'DGMS-aligned threshold warning logic (CMR 2017)',
                'Comprehensive sensor hardware suite with cost optimization',
              ].map(i => <div key={i} style={{fontSize:13, color:'var(--text-muted)', marginBottom:7, display:'flex', gap:8}}><span style={{color:'var(--green)'}}>✓</span>{i}</div>)}
            </div>

            <div className="card" style={{borderLeft:'4px solid var(--ember)'}}>
              <div style={{fontWeight:700, fontSize:14, color:'var(--text-dark)', marginBottom:12, display:'flex', alignItems:'center', gap:8}}>
                <AlertTriangle size={16} style={{color:'var(--ember)'}}/>
                Deployment Requirements
              </div>
              {[
                'Requires gateway integration for live physical telemetry',
                'Requires geospatial coordinates for local mine panel mapping',
                'Requires local baseline training for site-specific calibration',
                'Integrates with enterprise SMS/Email APIs for alert routing',
                'Offline caching for local server fallback operations',
                'Custom sensor calibration based on local geology and seam depth',
              ].map(i => <div key={i} style={{fontSize:13, color:'var(--text-muted)', marginBottom:7, display:'flex', gap:8}}><span style={{color:'var(--ember)'}}>!</span>{i}</div>)}
            </div>
          </div>

          <div className="card" style={{background:'var(--charcoal)', border:'1px solid rgba(255,255,255,0.1)'}}>
            <div style={{fontFamily:'var(--mono)', fontSize:10, color:'#64748b', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:8}}>HARDWARE STACK</div>
            <div style={{display:'flex', gap:12, flexWrap:'wrap'}}>
              {['ESP32 WROOM-32', 'MPU6050 IMU', 'HX711 + Strain Gauge', 'SX1278 LoRa 433 MHz', 'ADXL345 Vibration', 'Continuity Loop', '3.7V LiPo + Solar'].map(h => (
                <span key={h} style={{padding:'5px 12px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:20, fontSize:12, color:'#cbd5e1', fontFamily:'var(--mono)'}}>
                  {h}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="section section-alt">
        <div className="container">
          <div className="section-header">
            <span className="section-label">Company Timeline</span>
            <h2 className="section-title">Development Milestones</h2>
          </div>
          <div className="steps">
            {timeline.map((t, i) => (
              <div key={i} className="step">
                <div>
                  <div style={{fontFamily:'var(--mono)', fontSize:11, color:'var(--accent)', fontWeight:700}}>{t.date}</div>
                </div>
                <div>
                  <div className="step-desc">{t.event}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <span className="section-label">Core Team</span>
            <h2 className="section-title">Core Team & Leadership</h2>
          </div>
          <div className="arch-grid">
            {team.map(t => (
              <div key={t.role} className="arch-card">
                <div className="arch-title">{t.role}</div>
                <div style={{fontSize:13, color:'var(--text-muted)', lineHeight:1.6}}>{t.resp}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* System Architecture */}
      <section className="section section-alt">
        <div className="container">
          <div className="section-header">
            <span className="section-label">Platform Architecture</span>
            <h2 className="section-title">System Architecture</h2>
            <p style={{fontSize:14, color:'var(--text-muted)', maxWidth:600, marginTop:8}}>End-to-end hardware-to-dashboard telemetry pipeline powering STRATA deployments.</p>
          </div>

          {/* Pipeline Flow Diagram */}
          <div style={{overflowX:'auto', marginBottom:32, borderRadius:'var(--radius)', border:'1px solid rgba(255,255,255,0.08)', background:'var(--charcoal)', padding:'24px 16px'}}>
            <svg viewBox="0 0 780 180" style={{width:'100%', minWidth:600}}>
              {[
                { x:20,  label:'SENSOR\nNODE',      sub:'ESP32 + MPU6050\n+ HX711 + LoRa',     color:'#0f4c75' },
                { x:180, label:'LoRa\nMESH',        sub:'433 MHz\n~2.5 km range',               color:'#374151' },
                { x:340, label:'GATEWAY\nNODE',     sub:'ESP32 + SX1278\nJSON Decode',          color:'#1c2333' },
                { x:500, label:'AI\nENGINE',        sub:'XGBoost v2.1\nRisk Index',             color:'#374151' },
                { x:640, label:'OPERATOR\nDASHBOARD', sub:'React + Charts\nGIS Map + Alerts', color:'#16a34a' },
              ].map((b, i) => (
                <g key={i} transform={`translate(${b.x}, 40)`}>
                  <rect width="120" height="70" rx="4" fill={b.color}/>
                  {b.label.split('\n').map((l, j) => (
                    <text key={j} x="60" y={22 + j*16} textAnchor="middle" style={{fontSize:11, fill:'white', fontFamily:'var(--mono)', fontWeight:'bold'}}>{l}</text>
                  ))}
                  {b.sub.split('\n').map((l, j) => (
                    <text key={j} x="60" y={50 + j*12} textAnchor="middle" style={{fontSize:9, fill:'rgba(255,255,255,0.6)', fontFamily:'var(--mono)'}}>{l}</text>
                  ))}
                  {i < 4 && <polygon points="120,35 138,35 138,40 148,35 138,30 138,35" fill="rgba(255,255,255,0.3)"/>}
                </g>
              ))}
              <text x="390" y="168" textAnchor="middle" style={{fontSize:9, fill:'rgba(255,255,255,0.35)', fontFamily:'var(--mono)'}}>STRATA Platform — End-to-End Telemetry Pipeline</text>
            </svg>
          </div>

          {/* Hardware Layer Cards */}
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:16, marginBottom:32}}>
            {[
              {
                icon: <Cpu size={18} style={{color:'#38bdf8'}}/>,
                title: 'Layer 1 — Sensor Nodes',
                accent: '#0f4c75',
                items: [
                  ['Microcontroller','ESP32 Dual-Core 240 MHz'],
                  ['Tilt / IMU','MPU6050 6-axis ±2g / ±250°/s'],
                  ['Strain','HX711 24-bit ADC + foil gauge'],
                  ['Vibration','ADXL345 or SW-420 module'],
                  ['RF','SX1278 LoRa 433 MHz +20 dBm'],
                  ['Power','3.7V LiPo + 5V solar + TP4056'],
                ]
              },
              {
                icon: <Wifi size={18} style={{color:'#34d399'}}/>,
                title: 'Layer 2 — Gateway Hub',
                accent: '#1c2333',
                items: [
                  ['Processor','ESP32 (dedicated gateway role)'],
                  ['LoRa RX','SX1278 433 MHz receiver'],
                  ['Uplink','USB-UART → Edge Server / Wi-Fi'],
                  ['Parsing','JSON decode + timestamp inject'],
                  ['Display','OLED 128×64 px live status'],
                  ['Power','5V mains — control room mount'],
                ]
              },
              {
                icon: <Server size={18} style={{color:'#a78bfa'}}/>,
                title: 'Layer 3 — AI Engine',
                accent: '#374151',
                items: [
                  ['Platform','Raspberry Pi 4 / cloud VM'],
                  ['AI Stack','Python · scikit-learn · XGBoost'],
                  ['Model','XGBoost-Deform-v2.1 (47 features)'],
                  ['Database','InfluxDB time-series + SQLite'],
                  ['API','FastAPI REST → React dashboard'],
                  ['Alerts','MQTT / SMS / email webhook'],
                ]
              },
              {
                icon: <Monitor size={18} style={{color:'#c2ab8f'}}/>,
                title: 'Layer 4 — Operator Interface',
                accent: '#16a34a',
                items: [
                  ['Frontend','React.js + Recharts + Lucide'],
                  ['Routing','React Router v7 (SPA)'],
                  ['Maps','SVG schematic + GIS overlay'],
                  ['Hosting','Edge server or cloud deploy'],
                  ['Offline','Service Worker PWA (planned)'],
                  ['Roles','Operator · Planner · DGMS regulator'],
                ]
              },
            ].map(layer => (
              <div key={layer.title} className="card" style={{borderTop:`3px solid ${layer.accent}`}}>
                <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:14}}>
                  {layer.icon}
                  <div style={{fontWeight:700, fontSize:13, color:'var(--text-dark)'}}>{layer.title}</div>
                </div>
                {layer.items.map(([k,v]) => (
                  <div key={k} style={{display:'flex', justifyContent:'space-between', gap:12, marginBottom:7, fontSize:12}}>
                    <span style={{color:'#64748b', fontFamily:'var(--mono)', flexShrink:0}}>{k}</span>
                    <span style={{color:'var(--text-muted)', textAlign:'right'}}>{v}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* ── Sensor Network Topology Section ── */}
          <div className="section-header">
            <span className="section-label">Mesh Network</span>
            <h2 className="section-title">LoRa Wireless Surface Mesh Topology</h2>
            <p style={{fontSize:14, color:'var(--text-muted)', maxWidth:600, marginTop:8}}>433 MHz sub-GHz band · Spread Factor SF10 · ~2.5 km range for low power telemetry mesh.</p>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:16, marginTop:20 }}>
            <div className="card" style={{ padding: 16 }}>
              <svg viewBox="0 0 680 300" style={{background:'#f8fafc', width:'100%', borderRadius:8, border:'1px solid var(--gray-border)'}}>
                <rect width="680" height="300" fill="white"/>
                {/* N01 → N02 connection */}
                <line x1="130" y1="100" x2="310" y2="100" stroke="#e2e8f0" strokeWidth="2"/>
                <line x1="130" y1="100" x2="310" y2="100" stroke="var(--green)" strokeWidth="1.5" strokeDasharray="8,5" opacity="0.7"/>
                <text x="220" y="88" textAnchor="middle" style={{fontSize:9, fontFamily:'var(--mono)', fill:'#94a3b8'}}>LoRa · -82 dBm · SF10</text>

                {/* N02 → N03 connection */}
                <line x1="350" y1="100" x2="520" y2="100" stroke="#e2e8f0" strokeWidth="2"/>
                <line x1="350" y1="100" x2="520" y2="100" stroke="var(--green)" strokeWidth="1.5" strokeDasharray="8,5" opacity="0.7"/>
                <text x="435" y="88" textAnchor="middle" style={{fontSize:9, fontFamily:'var(--mono)', fill:'#94a3b8'}}>LoRa · -79 dBm · SF10</text>

                {/* N02 → Gateway (uplink) */}
                <line x1="330" y1="118" x2="330" y2="195" stroke="#0f4c75" strokeWidth="2" strokeDasharray="5,4"/>
                <text x="270" y="162" style={{fontSize:9, fontFamily:'var(--mono)', fill:'#0f4c75'}}>UPLINK · USB</text>

                {/* Gateway → Cloud */}
                <line x1="330" y1="232" x2="580" y2="232" stroke="#374151" strokeWidth="1.5" strokeDasharray="4,4"/>
                <text x="455" y="250" textAnchor="middle" style={{fontSize:9, fontFamily:'var(--mono)', fill:'#64748b'}}>Wi-Fi / UART → Edge Server</text>

                {/* Nodes */}
                {[
                  { x:130, y:100, label:'N01', sub:'North Face', col: 'var(--green)' },
                  { x:330, y:100, label:'N02', sub:'West Panel', col: 'var(--green)' },
                  { x:520, y:100, label:'N03', sub:'South Shaft', col:'var(--green)' },
                ].map(n => (
                  <g key={n.label} transform={`translate(${n.x},${n.y})`}>
                    <circle r="18" fill="#1c2333" stroke={n.col} strokeWidth="2.5"/>
                    <text y="4" textAnchor="middle" style={{fontSize:10, fill:'white', fontFamily:'var(--mono)', fontWeight:'bold'}}>{n.label}</text>
                    <text y="30" textAnchor="middle" style={{fontSize:9, fill:'#374151', fontFamily:'var(--mono)', fontWeight:'bold'}}>{n.label}</text>
                    <text y="42" textAnchor="middle" style={{fontSize:8, fill:'#64748b', fontFamily:'var(--mono)'}}>{n.sub}</text>
                  </g>
                ))}

                {/* Gateway Box */}
                <g transform="translate(330,212)">
                  <rect x="-32" y="-14" width="64" height="28" rx="3" fill="#1c2333" stroke="#374151" strokeWidth="1.5"/>
                  <text y="4" textAnchor="middle" style={{fontSize:10, fill:'white', fontFamily:'var(--mono)', fontWeight:'bold'}}>GATEWAY</text>
                  <text y="42" textAnchor="middle" style={{fontSize:8, fill:'#64748b', fontFamily:'var(--mono)'}}>ESP32 · LoRa SX1278</text>
                </g>

                {/* Cloud */}
                <rect x="550" y="216" width="100" height="28" rx="4" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="1.5"/>
                <text x="600" y="234" textAnchor="middle" style={{fontSize:10, fill:'#374151', fontFamily:'var(--mono)'}}>EDGE SERVER</text>
              </svg>
            </div>

            <div className="card" style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <div style={{fontWeight:700, fontSize:13, color:'var(--text-dark)', marginBottom:4}}>Network Parameters</div>
              {[
                { label:'Protocol', value:'LoRa 433 MHz' },
                { label:'Spread Factor', value:'SF10' },
                { label:'Bandwidth', value:'125 kHz' },
                { label:'Coding Rate', value:'4/5' },
                { label:'TX Power', value:'+20 dBm' },
                { label:'Range (open)', value:'~2.5 km' },
                { label:'Data Rate', value:'0.98 kbps' },
                { label:'Packet Interval', value:'500 ms' },
              ].map(r => (
                <div key={r.label} style={{display:'flex', justifyContent:'space-between', fontSize:12, paddingBottom:6, borderBottom:'1px solid var(--gray-border)'}}>
                  <span style={{color:'var(--text-muted)', fontFamily:'var(--mono)'}}>{r.label}</span>
                  <span style={{fontFamily:'var(--mono)', fontWeight:700, color:'var(--text-dark)'}}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

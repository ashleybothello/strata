export default function SystemArch() {
  const layers = [
    {
      title: 'Layer 1 — Sensor Nodes (Field)',
      color: '#0f4c75',
      items: [
        { label:'Microcontroller', value:'ESP32 (Dual-Core 240 MHz, 4 MB Flash)' },
        { label:'Tilt / Inclination', value:'MPU6050 (6-axis IMU, ±2g/±250°/s, I²C)' },
        { label:'Strain Gauge', value:'Metallic foil gauge + HX711 24-bit ADC' },
        { label:'Vibration', value:'ADXL345 or SW-420 module' },
        { label:'Crack Detection', value:'Continuity loop wire + GPIO interrupt' },
        { label:'RF Transceiver', value:'SX1278 LoRa (433 MHz, +20 dBm)' },
        { label:'Power', value:'3.7V LiPo + 5V solar panel + TP4056 charger' },
        { label:'Enclosure', value:'IP65 weatherproof ABS box' },
      ]
    },
    {
      title: 'Layer 2 — Gateway Node (Local Hub)',
      color: '#1c2333',
      items: [
        { label:'Processor', value:'ESP32 (dedicated gateway role)' },
        { label:'LoRa Module', value:'SX1278 (433 MHz receiver)' },
        { label:'Uplink', value:'USB-UART → Edge Server or Wi-Fi MQTT' },
        { label:'Parsing', value:'JSON telemetry decode + timestamp injection' },
        { label:'Power', value:'5V mains adapter (control room mounted)' },
        { label:'Display', value:'OLED 128×64 px live status (optional)' },
      ]
    },
    {
      title: 'Layer 3 — Edge Server / AI Engine',
      color: '#374151',
      items: [
        { label:'Platform', value:'Raspberry Pi 4 / cloud VM' },
        { label:'AI Framework', value:'Python · scikit-learn · XGBoost · NumPy' },
        { label:'Model', value:'XGBoost-Deform-v2.1 (47 feature inputs)' },
        { label:'Database', value:'InfluxDB time-series + SQLite log store' },
        { label:'API', value:'FastAPI REST → React dashboard' },
        { label:'Alerting', value:'Threshold rules → MQTT / SMS / email webhook' },
      ]
    },
    {
      title: 'Layer 4 — Operator Interface',
      color: '#16a34a',
      items: [
        { label:'Frontend', value:'React.js + Recharts + Lucide Icons' },
        { label:'Routing', value:'React Router v7 (SPA multi-page)' },
        { label:'Maps', value:'SVG schematic + GIS overlay (future: Leaflet.js)' },
        { label:'Hosting', value:'Local edge server or cloud deployment' },
        { label:'Offline', value:'Service Worker PWA offline mode (planned)' },
        { label:'Access', value:'Mine operator, planner, DGMS regulator roles' },
      ]
    },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

      {/* Architecture diagram */}
      <div className="panel">
        <div className="panel-hd">
          <div className="panel-title">End-to-End System Architecture</div>
          <div className="panel-desc">Hardware-to-dashboard telemetry pipeline — STRATA Platform Architecture</div>
        </div>

        <div style={{ overflowX:'auto', marginTop:16 }}>
          <svg viewBox="0 0 780 180" style={{width:'100%', minWidth:600}}>
            {/* Pipeline boxes */}
            {[
              { x:20, label:'SENSOR\nNODE', sub:'ESP32 + MPU6050\n+ HX711 + LoRa', color:'#0f4c75' },
              { x:180, label:'LoRa\nMESH', sub:'433 MHz\n~2.5 km range', color:'#374151' },
              { x:340, label:'GATEWAY\nNODE', sub:'ESP32 + SX1278\nJSON Decode', color:'#1c2333' },
              { x:500, label:'AI\nENGINE', sub:'XGBoost v2.1\nRisk Index', color:'#374151' },
              { x:640, label:'OPERATOR\nDASHBOARD', sub:'React + Charts\nGIS Map + Alerts', color:'#16a34a' },
            ].map((b, i) => (
              <g key={i} transform={`translate(${b.x}, 40)`}>
                <rect width="120" height="70" rx="4" fill={b.color} stroke="none"/>
                {b.label.split('\n').map((l, j) => (
                  <text key={j} x="60" y={22 + j*16} textAnchor="middle" style={{fontSize:11, fill:'white', fontFamily:'var(--mono)', fontWeight:'bold'}}>{l}</text>
                ))}
                {b.sub.split('\n').map((l, j) => (
                  <text key={j} x="60" y={58 + j*11} textAnchor="middle" style={{fontSize:8.5, fill:'rgba(255,255,255,0.65)', fontFamily:'var(--mono)'}}>{l}</text>
                ))}
                {i < 4 && (
                  <>
                    <line x1="122" y1="35" x2="158" y2="35" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arr)"/>
                  </>
                )}
              </g>
            ))}
            <defs>
              <marker id="arr" markerWidth="6" markerHeight="5" refX="6" refY="2.5" orient="auto">
                <polygon points="0 0,6 2.5,0 5" fill="#94a3b8"/>
              </marker>
            </defs>
          </svg>
        </div>
      </div>

      {/* Layer detail cards */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        {layers.map(layer => (
          <div key={layer.title} className="panel" style={{borderLeft:`4px solid ${layer.color}`}}>
            <div style={{fontWeight:700, fontSize:13, color:'var(--text-dark)', marginBottom:14}}>{layer.title}</div>
            {layer.items.map(item => (
              <div key={item.label} style={{display:'flex', justifyContent:'space-between', fontSize:12, paddingBottom:8, marginBottom:8, borderBottom:'1px solid var(--gray-border)'}}>
                <span style={{color:'var(--text-muted)', fontFamily:'var(--mono)', flexShrink:0}}>{item.label}</span>
                <span style={{fontFamily:'var(--mono)', fontWeight:600, color:'var(--text-dark)', textAlign:'right', marginLeft:12}}>{item.value}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Cost estimate */}
      <div className="panel">
        <div className="panel-title" style={{marginBottom:14}}>Bill of Materials — Per Sensor Node (Estimated)</div>
        <table className="data-table">
          <thead><tr><th>COMPONENT</th><th>MODEL</th><th>QTY</th><th>UNIT COST (INR)</th><th>TOTAL (INR)</th></tr></thead>
          <tbody>
            {[
              { comp:'ESP32 Dev Board', model:'ESP32-WROOM-32', qty:1, unit:280 },
              { comp:'LoRa Module', model:'SX1278 Ra-02', qty:1, unit:180 },
              { comp:'IMU Sensor', model:'MPU6050', qty:1, unit:60 },
              { comp:'Strain Gauge', model:'Full-bridge 120Ω', qty:1, unit:40 },
              { comp:'HX711 ADC', model:'HX711 Module', qty:1, unit:30 },
              { comp:'Solar Panel', model:'5V 1W Mini', qty:1, unit:90 },
              { comp:'LiPo Battery', model:'3.7V 2000mAh', qty:1, unit:70 },
              { comp:'Enclosure', model:'IP65 ABS 100×68mm', qty:1, unit:60 },
            ].map(r => (
              <tr key={r.comp}>
                <td style={{fontWeight:600}}>{r.comp}</td>
                <td style={{color:'var(--text-muted)'}}>{r.model}</td>
                <td>{r.qty}</td>
                <td>₹{r.unit}</td>
                <td style={{fontWeight:700}}>₹{r.unit * r.qty}</td>
              </tr>
            ))}
            <tr style={{background:'var(--bg)'}}>
              <td colSpan={4} style={{fontWeight:700, color:'var(--text-dark)'}}>TOTAL PER NODE (approx.)</td>
              <td style={{fontWeight:800, fontSize:14, color:'var(--green)'}}>₹810</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useAppState } from '../../state/AppState';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { ArrowRight, ExternalLink } from 'lucide-react';

const NODE_LOCATIONS = [
  'West Panel', 'West Panel', 'Mid Section', 'Mid Section',
  'East Panel', 'East Panel', 'North Gallery', 'North Gallery',
  'South Drift', 'South Drift', 'Deep East', 'Deep East',
  'Shaft Entry', 'Shaft Entry', 'Central Pillar', 'Central Pillar',
  'Ventilation', 'Ventilation', 'Boundary A', 'Boundary B',
];

export default function DashboardHome({ setActiveTab }) {
  const { telemetry, riskIndex, groundCondition, activeAlerts, acknowledgedAlerts, isAnomaly, history, t } = useAppState();

  // Selected node index (default = N02)
  const [selectedIdx, setSelectedIdx] = useState(1);

  const node   = telemetry[selectedIdx];
  const nodeId = node?.id ?? `N${String(selectedIdx + 1).padStart(2, '0')}`;
  const zone   = node?.zone ?? NODE_LOCATIONS[selectedIdx];

  const metricColor = isAnomaly ? 'var(--red)' : 'var(--green)';

  // Build multi-line chart data: tilt + strain + vibration for selected node
  const chartData = history.map(h => ({
    time:              h.time,
    'Tilt (°)':        h[`${nodeId}_tilt`]   ?? h['N02 Tilt (°)'] ?? 0,
    'Strain (%)':      h[`${nodeId}_strain`] ?? 0,
    'Vibration (g)':   h[`${nodeId}_vib`]   ?? 0,
    Baseline:          h.Baseline ?? 0.40,
  }));

  // Status dot color for a node
  const statusColor = (n) =>
    n.status === 'CRITICAL' ? 'var(--red)'
    : n.status === 'WARNING'  ? '#c2ab8f'
    : n.status === 'WATCH'    ? 'var(--yellow)'
    : 'var(--green)';

  const nodeColor = statusColor(node ?? { status: 'NORMAL' });

  // Navigate to Live Monitoring, pre-selecting this node
  const handleViewMore = () => {
    // Store the chosen nodeId so LiveMonitoring can pick it up
    sessionStorage.setItem('focusNodeId', nodeId);
    setActiveTab('live');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── TOP METRICS ROW ── */}
      <div className="metric-grid">
        <div className="metric-card left-accent" style={{ borderLeftColor: groundCondition.color }}>
          <div className="m-label">{t('ground_condition')}</div>
          <div className="m-value" style={{ color: groundCondition.color, fontSize: 24 }}>{groundCondition.status}</div>
          <div className="m-sub">{isAnomaly ? 'Multi-sensor threshold breach' : 'All sectors within safe limits'}</div>
        </div>
        <div className="metric-card">
          <div className="m-label">{t('risk_index')}</div>
          <div className="flex-center gap-8">
            <span className="m-value">{riskIndex}</span>
            <span className="m-unit">/ 100</span>
          </div>
          <div className="m-bar">
            <div className="m-bar-fill" style={{ width: `${riskIndex}%`, backgroundColor: groundCondition.color }} />
          </div>
        </div>
        <div className="metric-card">
          <div className="m-label">{t('affected_zone')}</div>
          <div className="m-value" style={{ fontSize: 18, marginTop: 6 }}>
            {isAnomaly ? 'WEST PANEL — N02' : 'NONE'}
          </div>
          <div className="m-sub">{isAnomaly ? 'Coordinate displacement detected' : 'All sectors stable'}</div>
        </div>
        <div className="metric-card">
          <div className="m-label">{t('active_alerts')}</div>
          <div className="m-value" style={{ color: activeAlerts.length > 0 ? 'var(--red)' : 'var(--text-dark)' }}>
            {activeAlerts.length}
          </div>
          <div className="m-sub">{acknowledgedAlerts.size} acknowledged</div>
        </div>
      </div>

      {/* ── NODE SELECTOR (dropdown) ── */}
      <div className="panel" style={{ padding: '10px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
            Focus Node:
          </span>

          {/* Dropdown */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span style={{
              position: 'absolute', left: 10,
              width: 8, height: 8, borderRadius: '50%',
              background: nodeColor, flexShrink: 0,
              boxShadow: `0 0 6px ${nodeColor}`,
            }} />
            <select
              value={selectedIdx}
              onChange={e => setSelectedIdx(Number(e.target.value))}
              style={{
                paddingLeft: 26, paddingRight: 32, paddingTop: 6, paddingBottom: 6,
                borderRadius: 7,
                border: `1px solid ${nodeColor}44`,
                background: 'var(--bg-secondary)',
                color: nodeColor,
                fontFamily: 'var(--mono)',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                outline: 'none',
                appearance: 'none',
                minWidth: 200,
              }}
            >
              {telemetry.map((n, idx) => {
                const sc = statusColor(n);
                return (
                  <option key={n.id} value={idx}>
                    {n.id} — {n.zone} [{n.status}]
                  </option>
                );
              })}
            </select>
            <span style={{ position: 'absolute', right: 10, pointerEvents: 'none', color: nodeColor, fontSize: 10 }}>▼</span>
          </div>

          {/* Zone label */}
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-muted)' }}>
            · {zone}
          </span>

          {/* View More button */}
          <button
            onClick={handleViewMore}
            style={{
              marginLeft: 'auto',
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 14px',
              borderRadius: 6,
              border: `1px solid ${nodeColor}55`,
              background: `${nodeColor}15`,
              color: nodeColor,
              fontFamily: 'var(--mono)',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = `${nodeColor}30`; }}
            onMouseLeave={e => { e.currentTarget.style.background = `${nodeColor}15`; }}
          >
            <ExternalLink size={11} />
            VIEW LIVE — {nodeId}
          </button>
        </div>
      </div>

      {/* ── SENSOR READINGS (dynamic) ── */}
      <div className="metric-grid">
        <div className="metric-card">
          <div className="m-label">{t('tilt')} — {nodeId}</div>
          <div className="flex-center gap-8" style={{ marginTop: 6 }}>
            <span className="m-value">{node?.tilt.toFixed(2)}<span className="m-unit">°</span></span>
            <span className={`m-delta ${isAnomaly ? 'up' : 'stable'}`}>{isAnomaly ? 'Δ +0.92°' : 'Δ +0.03°'}</span>
          </div>
          <div className="m-bar">
            <div className="m-bar-fill" style={{ width: `${Math.min(100, (node?.tilt / 2) * 100)}%`, backgroundColor: metricColor }} />
          </div>
        </div>
        <div className="metric-card">
          <div className="m-label">{t('strain')} — {nodeId}</div>
          <div className="flex-center gap-8" style={{ marginTop: 6 }}>
            <span className="m-value">{node?.strain.toFixed(2)}<span className="m-unit">%</span></span>
            <span className={`m-delta ${isAnomaly ? 'up' : 'stable'}`}>{isAnomaly ? 'Δ +0.50%' : 'Δ +0.01%'}</span>
          </div>
          <div className="m-bar">
            <div className="m-bar-fill" style={{ width: `${Math.min(100, (node?.strain) * 100)}%`, backgroundColor: metricColor }} />
          </div>
        </div>
        <div className="metric-card">
          <div className="m-label">{t('vibration')} — {nodeId}</div>
          <div className="flex-center gap-8" style={{ marginTop: 6 }}>
            <span className="m-value">{node?.vib.toFixed(2)}<span className="m-unit"> g</span></span>
            <span style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text-muted)' }}>PEAK ACCEL</span>
          </div>
          <div className="m-bar">
            <div className="m-bar-fill" style={{ width: `${Math.min(100, (node?.vib) * 100)}%`, backgroundColor: metricColor }} />
          </div>
        </div>
        <div className="metric-card">
          <div className="m-label">{t('crack_status')} — {nodeId}</div>
          <div style={{ marginTop: 6, fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 14, color: isAnomaly ? 'var(--red)' : 'var(--green)' }}>
            {node?.crack}
          </div>
          <div className="m-sub" style={{ fontFamily: 'var(--mono)' }}>Continuity loop monitoring</div>
        </div>
      </div>

      {/* ── CHART + AI PANEL ── */}
      <div className="content-grid">
        <div className="panel">
          <div className="panel-hd flex-between">
            <div>
              <div className="panel-title">Overall Condition — {zone} ({nodeId})</div>
              <div className="panel-desc">Live tilt · strain · vibration vs DGMS threshold</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '3px 8px', borderRadius: 3, border: '1px solid var(--gray-border)' }}>
                LAST 60s · 2s INTERVAL
              </span>
              <button
                onClick={handleViewMore}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '3px 10px',
                  borderRadius: 4,
                  border: '1px solid var(--gray-border)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--mono)',
                  fontSize: 10,
                  cursor: 'pointer',
                }}
              >
                <ExternalLink size={10} /> VIEW MORE
              </button>
            </div>
          </div>
          <div style={{ height: 240 }}>
            {history.length === 0 ? (
              <div className="empty-state" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                AWAITING FIRST TELEMETRY TICK...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="time" stroke="#94a3b8" tick={{ fontSize: 9, fontFamily: 'var(--mono)' }} interval="preserveStartEnd" />
                  <YAxis domain={[0, 2]} stroke="#94a3b8" tick={{ fontSize: 9, fontFamily: 'var(--mono)' }} />
                  <Tooltip contentStyle={{ fontFamily: 'var(--mono)', fontSize: 11, border: '1px solid var(--gray-border)', background: '#1a1f2e' }} />
                  <Legend wrapperStyle={{ fontSize: 10, fontFamily: 'var(--mono)' }} />
                  <ReferenceLine y={1.0} stroke="#ef4444" strokeDasharray="4 3" label={{ value: 'THRESHOLD', position: 'right', fontSize: 9, fill: '#ef4444' }} />
                  <Line type="monotone" dataKey="Tilt (°)"      stroke={isAnomaly ? '#ef4444' : '#16a34a'} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                  <Line type="monotone" dataKey="Strain (%)"    stroke="#8a765d" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                  <Line type="monotone" dataKey="Vibration (g)" stroke="#7c3aed" strokeWidth={1.5} dot={false} strokeDasharray="2 2" />
                  <Line type="monotone" dataKey="Baseline"      stroke="#94a3b8" strokeDasharray="4 4" strokeWidth={1} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="panel-hd">
              <div className="panel-title">AI Risk Assessment Summary</div>
              <div className="panel-desc">XGBoost deformation model output</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
              {[
                { label: 'Deformation Persistence',              val: isAnomaly ? 'HIGH (18 min)' : 'STEADY',  hi: isAnomaly },
                { label: `Spatial Correlation (${nodeId}→prev)`, val: isAnomaly ? '34%' : '0.00%',            hi: isAnomaly },
                { label: 'Subsidence Probability',               val: isAnomaly ? '87.4%' : '0.12%',          hi: isAnomaly },
                { label: 'Model Confidence',                     val: '94.2%',                                hi: false },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, paddingBottom: 8, borderBottom: '1px solid var(--gray-border)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{r.label}</span>
                  <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: r.hi ? 'var(--red)' : 'var(--text-dark)' }}>{r.val}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--gray-border)', borderRadius: 'var(--radius)', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              {isAnomaly
                ? `Persistent tilt-strain coupling at ${nodeId} indicates shear displacement above the active face. Cross-node correlation confirms partial propagation.`
                : `All deformation indicators within site-calibrated tolerance. Next model evaluation cycle in 120 seconds.`}
            </div>
          </div>
          <button
            className="btn btn-sm btn-ghost"
            style={{ marginTop: 12, width: '100%', justifyContent: 'center', fontFamily: 'var(--mono)', fontSize: 11 }}
            onClick={() => setActiveTab('ai')}
          >
            FULL ASSESSMENT <ArrowRight size={11} />
          </button>
        </div>
      </div>

      {/* ── ALL NODES SUMMARY ── */}
      <div className="panel">
        <div className="panel-hd flex-between">
          <div>
            <div className="panel-title">Node Status Overview</div>
            <div className="panel-desc">All field telemetry nodes · West Bokaro Coalfield</div>
          </div>
          <button className="btn btn-sm btn-ghost" style={{ fontFamily: 'var(--mono)', fontSize: 11 }} onClick={() => setActiveTab('live')}>
            FULL TABLE <ArrowRight size={11} />
          </button>
        </div>
        <table className="data-table">
          <thead><tr>
            <th>Node</th><th>Location</th><th>Tilt</th><th>Strain</th>
            <th>Vibration</th><th>Battery</th><th>RSSI</th><th>Status</th>
          </tr></thead>
          <tbody>
            {telemetry.map((n, idx) => (
              <tr
                key={n.id}
                style={{ cursor: 'pointer', background: idx === selectedIdx ? 'rgba(255,255,255,0.03)' : 'transparent' }}
                onClick={() => setSelectedIdx(idx)}
                title={`Click to focus ${n.id}`}
              >
                <td style={{ fontWeight: 700, color: idx === selectedIdx ? 'var(--ember)' : 'inherit' }}>{n.id}</td>
                <td style={{ fontFamily: 'var(--font)', color: 'var(--text-muted)', fontSize: 11 }}>{n.zone}</td>
                <td>{n.tilt.toFixed(2)}°</td>
                <td>{n.strain.toFixed(2)}%</td>
                <td>{n.vib.toFixed(2)} g</td>
                <td>{n.bat}%</td>
                <td>{n.rssi} dBm</td>
                <td><span className={`chip ${n.status.toLowerCase()}`}>{n.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppState } from '../../state/AppState';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend, ReferenceLine
} from 'recharts';

// ── Fallback: generate deterministic data when DB has no data yet ─────────────
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
function genFallbackData(nodeIdx) {
  const seed = nodeIdx === 0 ? 3 : nodeIdx;
  return MONTHS.map((month, mi) => {
    const wave = Math.sin((mi + seed) * 0.6);
    return {
      bucket: month,
      tilt:   parseFloat(Math.max(0.05, 0.20 + (seed % 7) * 0.03 + wave * 0.06).toFixed(3)),
      strain: parseFloat(Math.max(0.02, 0.08 + (seed % 6) * 0.015 + wave * 0.02).toFixed(3)),
      vib:    parseFloat(Math.max(0.01, 0.05 + (seed % 5) * 0.02 + wave * 0.01).toFixed(3)),
      critical_count: Math.max(0, Math.round((seed % 4) + wave * 2.5 + (mi === 4 ? 2 : 0))),
    };
  });
}

// Determine condition from data array
function getCondition(data) {
  if (!data || data.length === 0) return { label: 'NORMAL', color: 'var(--green)' };
  const last = data[data.length - 1];
  const risk = (last.tilt || 0) * 100 + (last.strain || 0) * 80 + (last.critical_count || 0) * 5;
  if (risk > 65) return { label: 'CRITICAL', color: 'var(--red)' };
  if (risk > 45) return { label: 'ELEVATED', color: '#c2ab8f' };
  if (risk > 30) return { label: 'WATCH',    color: 'var(--yellow)' };
  return             { label: 'NORMAL',   color: 'var(--green)' };
}

// Format bucket timestamp for display
function fmtBucket(b) {
  if (!b) return '';
  // If it's an ISO timestamp, format as HH:MM
  if (b.includes && b.includes('T')) {
    const d = new Date(b);
    return `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  }
  return b; // fallback month label
}

// Build CSV from data
function buildCSV(label, data) {
  const header = 'Node,Time,Avg Tilt (°),Avg Strain (%),Avg Vibration (g),Critical Events';
  const rows = data.map(r => `${label},${r.bucket},${r.tilt},${r.strain},${r.vib},${r.critical_count || 0}`);
  return [header, ...rows].join('\n');
}

export default function Analytics() {
  const { telemetry } = useAppState();

  const [selectedNode, setSelectedNode] = useState(0);    // 0 = ALL
  const [timeRange,    setTimeRange]    = useState(24);   // hours
  const [dbData,       setDbData]       = useState(null); // rows from DB
  const [loading,      setLoading]      = useState(false);
  const [dbOnline,     setDbOnline]     = useState(true);
  const [lastFetch,    setLastFetch]    = useState(null);

  // ── Fetch from /api/telemetry/history ──────────────────────────────────────
  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const nodeParam = selectedNode === 0 ? 'ALL' : `N${String(selectedNode).padStart(2,'0')}`;
      const url = `/api/telemetry/history?hours=${timeRange}&node=${nodeParam}`;
      const r   = await fetch(url);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const json = await r.json();

      if (json.rows && json.rows.length > 0) {
        setDbData(json.rows.map(row => ({
          bucket:         row.bucket,
          tilt:           parseFloat(row.tilt || 0),
          strain:         parseFloat(row.strain || 0),
          vib:            parseFloat(row.vib || 0),
          critical_count: parseInt(row.critical_count || 0),
          risk_index:     parseInt(row.risk_index || 0),
        })));
        setDbOnline(true);
        setLastFetch(new Date());
      } else {
        // DB reachable but no data yet
        setDbData([]);
        setDbOnline(true);
        setLastFetch(new Date());
      }
    } catch {
      setDbOnline(false);
      setDbData(null);
    } finally {
      setLoading(false);
    }
  }, [selectedNode, timeRange]);

  // Fetch on mount + when node/timeRange changes, then auto-refresh every 30 s
  useEffect(() => {
    fetchHistory();
    const timer = setInterval(fetchHistory, 30_000);
    return () => clearInterval(timer);
  }, [fetchHistory]);

  // ── Choose data source: DB or fallback ───────────────────────────────────
  const isUsingDB  = dbOnline && dbData && dbData.length > 0;
  const data = isUsingDB
    ? dbData
    : genFallbackData(selectedNode);

  const condition   = useMemo(() => getCondition(data), [data]);
  const avgTilt     = data.length ? (data.reduce((s,r)=>s+r.tilt,   0)/data.length).toFixed(3) : '—';
  const avgStrain   = data.length ? (data.reduce((s,r)=>s+r.strain, 0)/data.length).toFixed(3) : '—';
  const maxTilt     = data.length ? Math.max(...data.map(r=>r.tilt)).toFixed(3) : '—';
  const totalEvents = data.reduce((s,r)=>s+(r.critical_count||0), 0);
  const nodeLabel   = selectedNode === 0 ? 'All Nodes' : `N${String(selectedNode).padStart(2,'0')}`;

  // Node condition pills — use latest telemetry for dots
  const nodeConditions = useMemo(() => {
    const map = {};
    telemetry.forEach(n => {
      const num = parseInt(n.id.slice(1));
      map[num] = n.status;
    });
    return map;
  }, [telemetry]);

  const statusColor = (s) =>
    s === 'CRITICAL' ? 'var(--red)' : s === 'WATCH' ? 'var(--yellow)' : 'var(--green)';

  // ── CSV Export (uses real DB data if available) ───────────────────────────
  function handleExportCSV() {
    const sections = [];
    if (isUsingDB) {
      sections.push(buildCSV(nodeLabel, data));
    } else {
      sections.push(buildCSV('Overall (simulated)', genFallbackData(0)));
      for (let n = 1; n <= 20; n++) {
        sections.push(buildCSV(`N${String(n).padStart(2,'0')} (simulated)`, genFallbackData(n)));
      }
    }
    const blob = new Blob([sections.join('\n\n')], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `STRATA_Telemetry_${nodeLabel}_${timeRange}h.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Shared chart styles ───────────────────────────────────────────────────
  const tooltipStyle = { fontFamily: 'var(--mono)', fontSize: 11, background: '#1a1f2e', border: '1px solid #2a3045' };
  const axisProps    = { stroke: '#94a3b8', tick: { fontSize: 10, fontFamily: 'var(--mono)' } };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── DB Status Banner ── */}
      <div style={{
        padding: '8px 14px',
        borderRadius: 8,
        background: isUsingDB
          ? 'rgba(34,197,94,0.08)' : dbOnline
          ? 'rgba(234,179,8,0.08)' : 'rgba(239,68,68,0.08)',
        border: `1px solid ${isUsingDB ? 'rgba(34,197,94,0.25)' : dbOnline ? 'rgba(234,179,8,0.25)' : 'rgba(239,68,68,0.25)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
      }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: isUsingDB ? '#4ade80' : dbOnline ? '#facc15' : '#f87171' }}>
          {isUsingDB
            ? `✅ LIVE DB DATA · ${data.length} buckets · Last updated: ${lastFetch?.toLocaleTimeString('en-IN') || '—'}`
            : dbOnline && dbData?.length === 0
            ? '⏳ DB connected — waiting for data (auto-saves every 10s, showing simulated fallback)'
            : '⚠️ DB OFFLINE — showing simulated data · check DATABASE_URL in .env'}
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          {[6, 24, 72, 168].map(h => (
            <button
              key={h}
              onClick={() => setTimeRange(h)}
              style={{
                padding: '3px 10px', borderRadius: 4, border: '1px solid',
                borderColor: timeRange === h ? 'var(--ember)' : 'var(--gray-border)',
                background:  timeRange === h ? 'rgba(234,88,12,0.15)' : 'transparent',
                color:       timeRange === h ? 'var(--ember)' : 'var(--text-muted)',
                fontFamily: 'var(--mono)', fontSize: 10, cursor: 'pointer',
              }}
            >{h === 168 ? '7D' : h === 72 ? '3D' : h === 24 ? '24H' : '6H'}</button>
          ))}
          <button
            onClick={fetchHistory}
            disabled={loading}
            style={{
              padding: '3px 10px', borderRadius: 4, border: '1px solid var(--gray-border)',
              background: 'transparent', color: 'var(--text-muted)',
              fontFamily: 'var(--mono)', fontSize: 10, cursor: 'pointer', opacity: loading ? 0.5 : 1,
            }}
          >{loading ? '...' : '↻ REFRESH'}</button>
        </div>
      </div>

      {/* ── Node Selector Bar ── */}
      <div className="panel" style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
            Select Node:
          </span>

          <button
            onClick={() => setSelectedNode(0)}
            style={{
              padding: '5px 14px', borderRadius: 6, border: '1px solid',
              borderColor: selectedNode === 0 ? 'var(--ember)' : 'var(--gray-border)',
              background:  selectedNode === 0 ? 'rgba(234,88,12,0.15)' : 'transparent',
              color:       selectedNode === 0 ? 'var(--ember)' : 'var(--text-muted)',
              fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
            }}
          >OVERALL</button>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {Array.from({ length: 20 }, (_, i) => i + 1).map(n => {
              const active  = selectedNode === n;
              const st      = nodeConditions[n] || 'NORMAL';
              const col     = statusColor(st);
              return (
                <button
                  key={n}
                  onClick={() => setSelectedNode(n)}
                  title={`Node N${String(n).padStart(2,'0')} — ${st}`}
                  style={{
                    padding: '4px 10px', borderRadius: 5, border: '1px solid',
                    borderColor: active ? col : 'var(--gray-border)',
                    background:  active ? `${col}22` : 'transparent',
                    color:       active ? col : 'var(--text-muted)',
                    fontFamily: 'var(--mono)', fontSize: 10, fontWeight: active ? 800 : 400,
                    cursor: 'pointer', transition: 'all 0.2s', position: 'relative',
                  }}
                >
                  N{String(n).padStart(2,'0')}
                  <span style={{ position: 'absolute', top: 2, right: 2, width: 4, height: 4, borderRadius: '50%', background: col }} />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Summary Metric Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
        <div className="metric-card" style={{ borderLeft: `3px solid ${condition.color}` }}>
          <div className="m-label">NODE CONDITION</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 800, color: condition.color, marginTop: 6 }}>
            {condition.label}
          </div>
          <div className="m-sub">{nodeLabel}</div>
        </div>
        <div className="metric-card">
          <div className="m-label">{isUsingDB ? 'AVG TILT (LIVE)' : 'AVG MONTHLY TILT'}</div>
          <div className="m-value">{avgTilt}°</div>
          <div className="m-sub">{isUsingDB ? `${timeRange}h mean` : '8-month sim'}</div>
        </div>
        <div className="metric-card">
          <div className="m-label">{isUsingDB ? 'AVG STRAIN (LIVE)' : 'AVG MONTHLY STRAIN'}</div>
          <div className="m-value">{avgStrain}%</div>
          <div className="m-sub">{isUsingDB ? `${timeRange}h mean` : '8-month sim'}</div>
        </div>
        <div className="metric-card">
          <div className="m-label">PEAK TILT</div>
          <div className="m-value">{maxTilt}°</div>
          <div className="m-sub">{isUsingDB ? 'DB peak' : 'Session peak'}</div>
        </div>
        <div className="metric-card">
          <div className="m-label">CRITICAL EVENTS</div>
          <div className="m-value">{totalEvents}</div>
          <div className="m-sub">Threshold exceedances</div>
        </div>
      </div>

      {/* ── Charts Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="panel">
          <div className="panel-hd">
            <div className="panel-title">
              {isUsingDB ? `Live Tilt & Strain — ${nodeLabel} (${timeRange}h)` : `Monthly Avg Tilt & Strain — ${nodeLabel} (Simulated)`}
            </div>
            <div className="panel-desc">
              {isUsingDB ? 'PostgreSQL time-bucketed averages · auto-refreshes every 30s' : 'Fallback simulated data — DB will populate within 10s'}
            </div>
          </div>
          <div style={{ height: 230, marginTop: 12 }}>
            {loading ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontFamily: 'var(--mono)', fontSize: 12 }}>
                ⏳ Loading from database...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="bucket" stroke="#94a3b8" tick={{ fontSize: 9, fontFamily: 'var(--mono)' }} tickFormatter={fmtBucket} interval="preserveStartEnd" />
                  <YAxis {...axisProps} />
                  <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#94a3b8' }} labelFormatter={fmtBucket} />
                  <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'var(--mono)' }} />
                  <ReferenceLine y={1.00} stroke="rgba(239,68,68,0.4)" strokeDasharray="4 2" label={{ value: 'THRESHOLD', fontSize: 9, fill: '#f87171', fontFamily: 'var(--mono)' }} />
                  <Line type="monotone" dataKey="tilt"   stroke="#0f4c75" strokeWidth={2} name="Avg Tilt (°)"   dot={false} activeDot={{ r: 4 }} />
                  <Line type="monotone" dataKey="strain" stroke="#8a765d" strokeWidth={2} name="Avg Strain (%)  " dot={false} activeDot={{ r: 4 }} />
                  <Line type="monotone" dataKey="vib"    stroke="#7c3aed" strokeWidth={1.5} name="Avg Vib (g)" dot={false} strokeDasharray="4 2" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="panel">
          <div className="panel-hd">
            <div className="panel-title">
              {isUsingDB ? `Critical Events — ${nodeLabel} (${timeRange}h)` : `Monthly Alert Events — ${nodeLabel}`}
            </div>
            <div className="panel-desc">Threshold exceedances per time bucket</div>
          </div>
          <div style={{ height: 230, marginTop: 12 }}>
            {loading ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontFamily: 'var(--mono)', fontSize: 12 }}>
                ⏳ Loading...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="bucket" stroke="#94a3b8" tick={{ fontSize: 9, fontFamily: 'var(--mono)' }} tickFormatter={fmtBucket} interval="preserveStartEnd" />
                  <YAxis {...axisProps} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#94a3b8' }} labelFormatter={fmtBucket} />
                  <Bar dataKey="critical_count" fill="#1c2c4a" name="Critical Events" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ── Data Table ── */}
      <div className="panel">
        <div className="panel-hd">
          <div className="panel-title">
            {isUsingDB ? `DB Telemetry Log — ${nodeLabel} (last ${data.length} buckets)` : `Simulated Data — ${nodeLabel}`}
          </div>
          <div className="panel-desc">
            {isUsingDB
              ? 'Real readings from PostgreSQL · telemetry_logs table · 5-minute bucket averages'
              : 'Simulated fallback data — PostgreSQL will populate after ~10 seconds of runtime'}
          </div>
        </div>
        <table className="data-table" style={{ marginTop: 12 }}>
          <thead>
            <tr>
              <th>TIMESTAMP / BUCKET</th>
              <th>AVG TILT (°)</th>
              <th>AVG STRAIN (%)</th>
              <th>AVG VIBRATION (g)</th>
              <th>CRITICAL EVENTS</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {data.slice(-20).map((row, i) => {
              const risk = row.tilt * 100 + row.strain * 80 + (row.critical_count || 0) * 5;
              const s = risk > 65 ? { label: 'CRITICAL', color: 'var(--red)' }
                      : risk > 45 ? { label: 'ELEVATED', color: '#c2ab8f' }
                      : risk > 30 ? { label: 'WATCH',    color: 'var(--yellow)' }
                      :             { label: 'NORMAL',   color: 'var(--green)' };
              return (
                <tr key={i}>
                  <td style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 10 }}>{fmtBucket(row.bucket)}</td>
                  <td style={{ fontFamily: 'var(--mono)' }}>{Number(row.tilt).toFixed(3)}°</td>
                  <td style={{ fontFamily: 'var(--mono)' }}>{Number(row.strain).toFixed(3)}%</td>
                  <td style={{ fontFamily: 'var(--mono)' }}>{Number(row.vib).toFixed(3)}g</td>
                  <td style={{ fontFamily: 'var(--mono)', color: (row.critical_count||0) > 0 ? 'var(--red)' : 'inherit' }}>{row.critical_count || 0}</td>
                  <td><span style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 11, color: s.color }}>{s.label}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Export ── */}
      <div className="panel" style={{ paddingBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="panel-title">Deformation Log Export</div>
            <div className="panel-desc">
              {isUsingDB
                ? `Export ${data.length} real DB records for DGMS / Coal India compliance submissions`
                : 'Generates simulated data — connect DB for real records'}
            </div>
          </div>
          <button
            className="btn btn-sm btn-dark"
            onClick={handleExportCSV}
            style={{ fontFamily: 'var(--mono)', fontSize: 11, cursor: 'pointer' }}
          >
            EXPORT CSV {isUsingDB ? '(LIVE)' : '(SIMULATED)'}
          </button>
        </div>
        <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--bg)', border: '1px solid var(--gray-border)', borderRadius: 8 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
            PREVIEW — {nodeLabel} · {isUsingDB ? `${timeRange}h Live DB` : 'Simulated'}
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, fontFamily: 'var(--mono)' }}>
              <thead>
                <tr>
                  {['Node', 'Bucket', 'Avg Tilt (°)', 'Avg Strain (%)', 'Avg Vib (g)', 'Critical Events'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '4px 8px', color: 'var(--text-muted)', borderBottom: '1px solid var(--gray-border)', fontSize: 9, letterSpacing: '0.04em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.slice(-4).map((row, i) => (
                  <tr key={i}>
                    <td style={{ padding: '3px 8px', color: 'var(--ember)' }}>{nodeLabel}</td>
                    <td style={{ padding: '3px 8px' }}>{fmtBucket(row.bucket)}</td>
                    <td style={{ padding: '3px 8px' }}>{Number(row.tilt).toFixed(3)}</td>
                    <td style={{ padding: '3px 8px' }}>{Number(row.strain).toFixed(3)}</td>
                    <td style={{ padding: '3px 8px' }}>{Number(row.vib).toFixed(3)}</td>
                    <td style={{ padding: '3px 8px', color: (row.critical_count||0) > 0 ? 'var(--red)' : 'var(--text-muted)' }}>{row.critical_count || 0}</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={6} style={{ padding: '4px 8px', color: 'var(--text-muted)', fontSize: 10, fontStyle: 'italic' }}>
                    … {Math.max(0, data.length - 4)} more rows · Full export in CSV
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}

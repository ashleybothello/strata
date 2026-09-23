import { useState, useEffect } from 'react';
import { useAppState } from '../../state/AppState';
import { Search, Info, HelpCircle } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function LiveMonitoring() {
  const { telemetry, isAnomaly, history } = useAppState();
  const [searchQuery, setSearchQuery] = useState('');

  // Auto-select a node if navigated here from Dashboard's "VIEW LIVE" button
  const [selectedNodeId, setSelectedNodeId] = useState(() => {
    const focus = sessionStorage.getItem('focusNodeId');
    if (focus) { sessionStorage.removeItem('focusNodeId'); return focus; }
    return null;
  });

  // Filter nodes matching search
  const filteredNodes = searchQuery.trim()
    ? telemetry.filter(n => n.id.toLowerCase().includes(searchQuery.toLowerCase()) || n.zone.toLowerCase().includes(searchQuery.toLowerCase()))
    : telemetry;

  const selectedNode = telemetry.find(n => n.id === selectedNodeId);

  const [isExpanded, setIsExpanded] = useState(false);

  // Simulated node history details for selected node
  const getSelectedNodeHistory = () => {
    if (!selectedNodeId) return [];
    
    // Map history points from AppState history logs for the active node
    return history.map(item => {
      const keyTilt = `${selectedNodeId}_tilt`;
      const keyStrain = `${selectedNodeId}_strain`;
      const keyVib = `${selectedNodeId}_vib`;
      const keyCond = `${selectedNodeId}_condition`;
      
      return {
        time: item.time,
        'Tilt (°)': item[keyTilt] !== undefined ? item[keyTilt] : 0.0,
        'Strain (%)': item[keyStrain] !== undefined ? item[keyStrain] : 0.0,
        'Vibration (g)': item[keyVib] !== undefined ? item[keyVib] : 0.0,
        'Overall Condition (%)': item[keyCond] !== undefined ? item[keyCond] : 0.0,
        'Baseline': 0.40,
        'Threshold': 1.00
      };
    });
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      
      {/* ── TOP SEARCH SECTION ── */}
      <div className="panel" style={{ padding: '16px' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={18} style={{ position: 'absolute', left: 12, color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="oars-input"
            placeholder="Search telemetry nodes (e.g. N02, Deep Seam, Central Surface)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              paddingLeft: '38px',
              fontSize: '14px',
              width: '100%',
              borderRadius: 'var(--radius)',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--gray-border)',
              height: '42px'
            }}
          />
        </div>
      </div>

      {/* ── NODE DETAIL PAGE / MODAL OR INLINE VIEW ── */}
      {selectedNode && (
        <div className="panel" style={{ borderLeft: `4px solid ${selectedNode.status === 'CRITICAL' ? 'var(--red)' : selectedNode.status === 'WATCH' ? 'var(--yellow)' : 'var(--green)'}`, animation: 'fadeIn 0.2s ease-out' }}>
          <div className="flex-between" style={{ borderBottom: '1px solid var(--gray-border)', paddingBottom: '12px', marginBottom: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ fontSize: '20px', fontWeight: '800', fontFamily: 'var(--mono)', margin: 0 }}>NODE {selectedNode.id}</h3>
                <span className={`chip ${selectedNode.status.toLowerCase()}`}>{selectedNode.status}</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0' }}>{selectedNode.zone} · Section {selectedNode.section} · Depth: {selectedNode.depth}</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-sm btn-ghost" onClick={() => setIsExpanded(!isExpanded)}>
                {isExpanded ? 'HIDE ALL METRICS' : 'EXPAND DETAILS'}
              </button>
              <button className="btn btn-sm btn-red" onClick={() => { setSelectedNodeId(null); setIsExpanded(false); }}>CLOSE DETAIL</button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }}>
            {/* Left side: Overall condition of the node graph */}
            <div>
              <div className="panel-title" style={{ fontSize: '13px', marginBottom: '8px' }}>Overall Node Geotechnical Condition (Risk Index Trend)</div>
              <div style={{ height: 240, background: 'var(--bg)', border: '1px solid var(--gray-border)', borderRadius: 'var(--radius)', padding: '12px 8px 4px 0' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={getSelectedNodeHistory()} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="selectedGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={selectedNode.status === 'CRITICAL' ? '#ef4444' : '#16a34a'} stopOpacity={0.2}/>
                        <stop offset="95%" stopColor={selectedNode.status === 'CRITICAL' ? '#ef4444' : '#16a34a'} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-border)" opacity={0.4}/>
                    <XAxis dataKey="time" stroke="#94a3b8" tick={{ fontSize: 9, fontFamily: 'var(--mono)' }} />
                    <YAxis domain={[0, 100]} stroke="#94a3b8" tick={{ fontSize: 9, fontFamily: 'var(--mono)' }} />
                    <Tooltip contentStyle={{ fontFamily: 'var(--mono)', fontSize: 11, background: '#100e0b', borderColor: 'var(--gray-border)' }}/>
                    <ReferenceLine y={50} stroke="var(--ember)" strokeDasharray="3 3" label={{ value: 'WATCH', fill: 'var(--ember)', fontSize: 8, position: 'right' }}/>
                    <ReferenceLine y={75} stroke="var(--red)" strokeDasharray="3 3" label={{ value: 'CRITICAL', fill: 'var(--red)', fontSize: 8, position: 'right' }}/>
                    <Area type="monotone" dataKey="Overall Condition (%)" stroke={selectedNode.status === 'CRITICAL' ? '#ef4444' : '#16a34a'} fill="url(#selectedGrad)" strokeWidth={2} dot={false} isAnimationActive={false}/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right side: Detailed telemetry parameters */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ background: 'var(--bg)', border: '1px solid var(--gray-border)', borderRadius: 'var(--radius)', padding: '12px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>TILT ANGLE</div>
                  <div style={{ fontSize: '18px', fontWeight: '800', fontFamily: 'var(--mono)', color: selectedNode.tilt > 1.0 ? 'var(--red)' : 'var(--text-dark)', marginTop: '4px' }}>{selectedNode.tilt.toFixed(3)} °</div>
                </div>
                <div style={{ background: 'var(--bg)', border: '1px solid var(--gray-border)', borderRadius: 'var(--radius)', padding: '12px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>EXTENSION STRAIN</div>
                  <div style={{ fontSize: '18px', fontWeight: '800', fontFamily: 'var(--mono)', color: selectedNode.strain > 0.5 ? 'var(--red)' : 'var(--text-dark)', marginTop: '4px' }}>{selectedNode.strain.toFixed(3)} %</div>
                </div>
                <div style={{ background: 'var(--bg)', border: '1px solid var(--gray-border)', borderRadius: 'var(--radius)', padding: '12px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>VIBRATION SPEED</div>
                  <div style={{ fontSize: '18px', fontWeight: '800', fontFamily: 'var(--mono)', color: selectedNode.vib > 0.4 ? 'var(--ember)' : 'var(--text-dark)', marginTop: '4px' }}>{selectedNode.vib.toFixed(3)} g</div>
                </div>
                <div style={{ background: 'var(--bg)', border: '1px solid var(--gray-border)', borderRadius: 'var(--radius)', padding: '12px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>CRACK INTEGRITY</div>
                  <div style={{ fontSize: '13px', fontWeight: '800', fontFamily: 'var(--mono)', color: selectedNode.crack !== 'NO DETECTION' ? 'var(--red)' : 'var(--green)', marginTop: '8px' }}>{selectedNode.crack}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ background: 'var(--bg)', border: '1px solid var(--gray-border)', borderRadius: 'var(--radius)', padding: '12px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>LoRa RSSI</div>
                  <div style={{ fontSize: '14px', fontWeight: '700', fontFamily: 'var(--mono)', color: 'var(--text-dark)', marginTop: '4px' }}>{selectedNode.rssi} dBm</div>
                </div>
                <div style={{ background: 'var(--bg)', border: '1px solid var(--gray-border)', borderRadius: 'var(--radius)', padding: '12px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>RF SNR</div>
                  <div style={{ fontSize: '14px', fontWeight: '700', fontFamily: 'var(--mono)', color: 'var(--text-dark)', marginTop: '4px' }}>{selectedNode.snr} dB</div>
                </div>
              </div>

              <div style={{ background: 'rgba(251,146,60,0.06)', border: '1px solid rgba(251,146,60,0.15)', borderRadius: 'var(--radius)', padding: '10px 12px', fontSize: '11px', display: 'flex', gap: 8, color: 'var(--text-muted)', marginTop: 'auto' }}>
                <HelpCircle size={14} style={{ color: '#c2ab8f', flexShrink: 0, marginTop: 1 }} />
                <div>
                  Live RF mesh network status aggregated from Gateway unit. Hardware payload is verified as active.
                </div>
              </div>
            </div>
          </div>

          {/* ── EXPANDED DETAILS: GRAPHS FOR ALL THE DATA ── */}
          {isExpanded && (
            <div style={{ marginTop: '24px', borderTop: '1px solid var(--gray-border)', paddingTop: '20px', animation: 'fadeIn 0.25s ease-out' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-dark)', marginBottom: '16px' }}>Detailed Sensor Stream Parameter History</h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                {/* Graph 1: Tilt */}
                <div className="panel" style={{ background: 'var(--bg)', padding: '12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-muted)' }}>TILT ANGLE TELEMETRY</div>
                  <div style={{ height: 160 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={getSelectedNodeHistory()} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-border)" opacity={0.3}/>
                        <XAxis dataKey="time" stroke="#94a3b8" tick={{ fontSize: 8, fontFamily: 'var(--mono)' }} />
                        <YAxis stroke="#94a3b8" tick={{ fontSize: 8, fontFamily: 'var(--mono)' }} />
                        <Tooltip contentStyle={{ fontFamily: 'var(--mono)', fontSize: 10 }} />
                        <ReferenceLine y={1.00} stroke="var(--red)" strokeDasharray="3 3" />
                        <Line type="monotone" dataKey="Tilt (°)" stroke="#c2ab8f" strokeWidth={2} dot={false} isAnimationActive={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Graph 2: Strain */}
                <div className="panel" style={{ background: 'var(--bg)', padding: '12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-muted)' }}>GEOTECHNICAL EXTENSION STRAIN</div>
                  <div style={{ height: 160 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={getSelectedNodeHistory()} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-border)" opacity={0.3}/>
                        <XAxis dataKey="time" stroke="#94a3b8" tick={{ fontSize: 8, fontFamily: 'var(--mono)' }} />
                        <YAxis stroke="#94a3b8" tick={{ fontSize: 8, fontFamily: 'var(--mono)' }} />
                        <Tooltip contentStyle={{ fontFamily: 'var(--mono)', fontSize: 10 }} />
                        <ReferenceLine y={0.50} stroke="var(--ember)" strokeDasharray="3 3" />
                        <Line type="monotone" dataKey="Strain (%)" stroke="#38bdf8" strokeWidth={2} dot={false} isAnimationActive={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Graph 3: Vibration */}
                <div className="panel" style={{ background: 'var(--bg)', padding: '12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-muted)' }}>MICRO-SEISMIC PEAK VIBRATION (g)</div>
                  <div style={{ height: 160 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={getSelectedNodeHistory()} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-border)" opacity={0.3}/>
                        <XAxis dataKey="time" stroke="#94a3b8" tick={{ fontSize: 8, fontFamily: 'var(--mono)' }} />
                        <YAxis stroke="#94a3b8" tick={{ fontSize: 8, fontFamily: 'var(--mono)' }} />
                        <Tooltip contentStyle={{ fontFamily: 'var(--mono)', fontSize: 10 }} />
                        <ReferenceLine y={0.40} stroke="var(--red)" strokeDasharray="3 3" />
                        <Line type="monotone" dataKey="Vibration (g)" stroke="#34d399" strokeWidth={2} dot={false} isAnimationActive={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── NODE SQUARES GRID (Default boxes of data) ── */}
      <div>
        <div style={{ marginBottom: '8px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Telemetry Mesh Nodes ({filteredNodes.length})
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:14 }}>
          {filteredNodes.map(n => (
            <div 
              key={n.id} 
              className="panel" 
              onClick={() => setSelectedNodeId(n.id)}
              style={{ 
                borderLeft:`4px solid ${n.status==='CRITICAL'?'var(--red)':n.status==='WATCH'?'var(--yellow)':'var(--green)'}`,
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div className="flex-between mb-16">
                <div>
                  <div style={{fontWeight:700, fontSize:15, fontFamily:'var(--mono)'}}>{n.id}</div>
                  <div style={{fontSize:11, color:'var(--text-muted)', marginTop:2}}>{n.zone}</div>
                </div>
                <span className={`chip ${n.status.toLowerCase()}`}>{n.status}</span>
              </div>

              {[
                { label:'Tilt', value:`${n.tilt.toFixed(3)} °`, warn: n.tilt > 1.0 },
                { label:'Strain', value:`${n.strain.toFixed(3)} %`, warn: n.strain > 0.5 },
                { label:'Vibration', value:`${n.vib.toFixed(3)} g`, warn: n.vib > 0.4 },
                { label:'Crack', value: n.crack, warn: n.crack !== 'NO DETECTION' },
                { label:'Battery', value:`${n.bat}%`, warn: false },
                { label:'RSSI', value:`${n.rssi} dBm`, warn: false },
              ].map(r => (
                <div key={r.label} style={{display:'flex', justifyContent:'space-between', fontSize:12, paddingBottom:6, marginBottom:6, borderBottom:'1px solid var(--gray-border)'}}>
                  <span style={{color:'var(--text-muted)', fontFamily:'var(--mono)'}}>{r.label}</span>
                  <span style={{fontFamily:'var(--mono)', fontWeight:600, color: r.warn ? 'var(--red)' : 'var(--text-dark)'}}>{r.value}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import { useAppState } from '../../state/AppState';

export default function Alerts({ setActiveTab }) {
  const { activeAlerts, acknowledgedAlerts, toggleAcknowledge, isAnomaly } = useAppState();

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

      {/* Summary bar */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
        {[
          { label:'Active Alarms', value: activeAlerts.length, color: activeAlerts.length > 0 ? 'var(--red)' : 'var(--text-dark)' },
          { label:'Critical', value: activeAlerts.filter(a=>a.type==='CRITICAL').length, color:'var(--red)' },
          { label:'Warning', value: activeAlerts.filter(a=>a.type==='WARNING').length, color:'var(--ember)' },
          { label:'Acknowledged', value: acknowledgedAlerts.size, color:'var(--green)' },
        ].map(s => (
          <div key={s.label} className="metric-card">
            <div className="m-label">{s.label}</div>
            <div className="m-value" style={{color:s.color}}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="panel">
        <div className="flex-between mb-20">
          <div>
            <div className="panel-title">Safety Alert Log — Active Notifications</div>
            <div className="panel-desc">DGMS threshold-based multi-level geotechnical warning system</div>
          </div>
          <span style={{ fontSize:11, fontFamily:'var(--mono)', background:'var(--bg)', padding:'4px 10px', borderRadius:3, border:'1px solid var(--gray-border)' }}>
            {activeAlerts.length} alarm(s) active · {acknowledgedAlerts.size} acknowledged
          </span>
        </div>

        {activeAlerts.length === 0 ? (
          <div className="empty-state">
            ✓ NO ACTIVE ALARMS — ALL NODES WITHIN DGMS SAFETY BASELINES
          </div>
        ) : (
          <div>
            {activeAlerts.map(alert => {
              const isAck = acknowledgedAlerts.has(alert.id);
              return (
                <div key={alert.id} className={`alert-card ${isAck ? '' : 'unresolved'}`}>
                  <div style={{flex:1}}>
                    <div className="alert-meta">
                      <span className={`chip ${alert.type === 'CRITICAL' ? 'critical' : 'warning'}`}>{alert.type}</span>
                      <span>ID: {alert.id}</span>
                      <span>Node: {alert.node}</span>
                      <span>Detected: {alert.time}</span>
                      <span>Duration: {alert.duration}</span>
                    </div>
                    <div className="alert-title">{alert.title}</div>
                    <div className="alert-desc">{alert.desc}</div>

                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:10 }}>
                      {[
                        { label:'Current Reading', value:alert.current },
                        { label:'Calibrated Baseline', value:alert.baseline },
                      ].map(r => (
                        <div key={r.label} style={{padding:'8px 12px', background:'var(--bg)', border:'1px solid var(--gray-border)', borderRadius:'var(--radius)'}}>
                          <div style={{fontSize:9, fontFamily:'var(--mono)', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4}}>{r.label}</div>
                          <div style={{fontSize:14, fontWeight:700, fontFamily:'var(--mono)', color: r.label.includes('Current') && isAnomaly ? 'var(--red)' : 'var(--text-dark)'}}>{r.value}</div>
                        </div>
                      ))}
                    </div>

                    <div className="alert-recomm">
                      <div className="alert-recomm-label">Recommended Operations Response</div>
                      <div style={{fontSize:12, color:'var(--text-body)', lineHeight:1.5}}>{alert.recomm}</div>
                    </div>
                  </div>

                  <div className="alert-actions">
                    <button
                      onClick={() => toggleAcknowledge(alert.id)}
                      className={`btn btn-sm ${isAck ? 'btn-ghost' : 'btn-red'}`}
                      style={{fontFamily:'var(--mono)', fontSize:10, letterSpacing:'0.04em', whiteSpace:'nowrap'}}
                    >
                      {isAck ? '✓ ACKNOWLEDGED' : 'ACKNOWLEDGE'}
                    </button>
                    <button
                      onClick={() => setActiveTab('map')}
                      className="btn btn-sm btn-ghost"
                      style={{fontFamily:'var(--mono)', fontSize:10, whiteSpace:'nowrap'}}
                    >
                      VIEW ON MAP
                    </button>
                    <button
                      onClick={() => setActiveTab('live')}
                      className="btn btn-sm btn-ghost"
                      style={{fontFamily:'var(--mono)', fontSize:10, whiteSpace:'nowrap'}}
                    >
                      VIEW NODE
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Alert level reference */}
      <div className="panel">
        <div className="panel-title" style={{marginBottom:14}}>Alert Level Reference — DGMS Thresholds</div>
        <table className="data-table">
          <thead><tr><th>LEVEL</th><th>TILT THRESHOLD</th><th>STRAIN THRESHOLD</th><th>RESPONSE</th><th>DGMS RULE</th></tr></thead>
          <tbody>
            {[
              { level:'NORMAL', chip:'normal', tilt:'< 0.60°', strain:'< 0.25%', resp:'Continue monitoring. Log readings.', rule:'Routine' },
              { level:'WATCH', chip:'watch', tilt:'0.60 – 0.80°', strain:'0.25 – 0.40%', resp:'Alert site engineer. Increase scan frequency.', rule:'CMR Rule 113(2)' },
              { level:'WARNING', chip:'warning', tilt:'0.80 – 1.00°', strain:'0.40 – 0.55%', resp:'Restrict heavy machinery. Initiate survey.', rule:'DGMS Circ. 2/2016' },
              { level:'CRITICAL', chip:'critical', tilt:'> 1.00°', strain:'> 0.55%', resp:'Evacuate panel. Emergency inspection. Report to DGMS.', rule:'CMR Rule 113(4)' },
            ].map(r => (
              <tr key={r.level}>
                <td><span className={`chip ${r.chip}`}>{r.level}</span></td>
                <td>{r.tilt}</td>
                <td>{r.strain}</td>
                <td style={{fontFamily:'var(--font)', color:'var(--text-muted)', maxWidth:220}}>{r.resp}</td>
                <td style={{color:'var(--text-muted)'}}>{r.rule}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

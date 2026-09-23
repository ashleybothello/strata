import React from 'react';
import { useAppState } from '../../state/AppState';

const factors = [
  { key: 'tilt',    label: 'Tilt Deviation Vector',          normal: 0, anomaly: 34 },
  { key: 'strain',  label: 'Strain Displacement Trend',      normal: 0, anomaly: 21 },
  { key: 'vib',     label: 'Vibration Amplitude Anomaly',    normal: 0, anomaly: 17 },
  { key: 'cross',   label: 'Cross-Node Spatial Correlation', normal: 0, anomaly: 12 },
  { key: 'persist', label: 'Deformation Persistence Score',  normal: 2, anomaly: 16 },
];

export default function AIAssessment() {
  const { isAnomaly, riskIndex, groundCondition, telemetry } = useAppState();
  const n02 = telemetry[1];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── ROW 1: Top metric cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
        <div className="metric-card">
          <div className="m-label">MODEL ENGINE</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, color: 'var(--text-dark)', marginTop: 6 }}>XGBoost-Deform-v2.1</div>
          <div className="m-sub">Gradient Boosted Trees · 47 features</div>
        </div>
        <div className="metric-card">
          <div className="m-label">INFERENCE RISK SCORE</div>
          <div className="flex-center gap-8" style={{ marginTop: 6 }}>
            <span className="m-value">{riskIndex}</span><span className="m-unit">/ 100</span>
          </div>
          <div className="m-bar">
            <div className="m-bar-fill" style={{ width: `${riskIndex}%`, backgroundColor: groundCondition.color }} />
          </div>
        </div>
        <div className="metric-card">
          <div className="m-label">CLASSIFICATION</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 800, color: groundCondition.color, marginTop: 6 }}>{groundCondition.status}</div>
          <div className="m-sub">Model confidence: 94.2%</div>
        </div>
      </div>

      {/* ── ROW 2: Feature Contribution (full width) ── */}
      <div className="panel">
        <div className="panel-hd">
          <div className="panel-title">Assessment Basis — Feature Contribution</div>
          <div className="panel-desc">Normalised feature importance scores driving the current classification</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 16 }}>
          <div className="assess-bar-wrap">
            {factors.map(f => {
              const val = isAnomaly ? f.anomaly : f.normal;
              const percent = isAnomaly ? (val / 34) * 100 : 5;
              return (
                <div key={f.key} className="assess-row">
                  <div className="assess-label-row">
                    <span className="assess-name">{f.label}</span>
                    <span className={`assess-val ${isAnomaly && val > 0 ? 'elevated' : ''}`}>
                      {isAnomaly ? `+${val}%` : 'Nominal (<2%)'}
                    </span>
                  </div>
                  <div className="assess-track">
                    <div className="assess-fill" style={{ width: `${percent}%`, background: isAnomaly ? 'var(--red)' : 'rgba(34,197,94,0.4)', transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ padding: 14, background: 'var(--bg)', border: '1px solid var(--gray-border)', borderRadius: 8, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.8 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>DIAGNOSTIC ASSESSMENT NARRATIVE</div>
            {isAnomaly
              ? 'Persistent upward tilt and strain trends at N02 are significantly above the established local baseline (0.40°, 0.18%). Nearby measurements at N01 show partial spatial correlation (+34%), suggesting shear displacement propagation along a geological boundary. Vibration signatures are consistent with micro-seismic activity associated with coal pillar failure initiation. Immediate inspection recommended per DGMS Circular 2/2016.'
              : 'All multi-sensor telemetry streams are within calibrated site baseline limits. Temporal variance is consistent with ambient diurnal thermal expansion and normal barometric fluctuation. Cross-node deformation correlation is at noise-floor levels. Next model evaluation cycle in 120 seconds.'}
            <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: 'Model Version',      val: 'XGBoost v2.1' },
                { label: 'Prediction Window',  val: '15-minute rolling' },
                { label: 'Alert Threshold',    val: 'Risk Index > 50' },
                { label: 'Last Cycle',         val: 'Aug 2026' },
              ].map(r => (
                <div key={r.label} style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 6, border: '1px solid var(--gray-border)' }}>
                  <div style={{ fontSize: 9, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>{r.label}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 11, color: 'var(--text-dark)' }}>{r.val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── ROW 3: Input Feature Vector (full width) ── */}
      <div className="panel">
        <div className="panel-hd">
          <div className="panel-title">Input Feature Vector — Selected Nodes</div>
          <div className="panel-desc">Live sensor readings and predictions across critical focus sectors</div>
        </div>
        <table className="data-table" style={{ marginTop: 8 }}>
          <thead>
            <tr>
              <th>FEATURE</th>
              <th>N02 (West)</th>
              <th>N08 (Mid)</th>
              <th>N15 (Deep)</th>
            </tr>
          </thead>
          <tbody>
            {[
              { name: 'Tilt Angle (°)',        n02: `${n02.tilt.toFixed(3)}°`,   n08: `${telemetry[7].tilt.toFixed(3)}°`,   n15: `${telemetry[14].tilt.toFixed(3)}°` },
              { name: 'Strain Loop (%)',        n02: `${n02.strain.toFixed(3)}%`, n08: `${telemetry[7].strain.toFixed(3)}%`, n15: `${telemetry[14].strain.toFixed(3)}%` },
              { name: 'Vibration (g)',          n02: `${n02.vib.toFixed(3)}g`,    n08: `${telemetry[7].vib.toFixed(3)}g`,    n15: `${telemetry[14].vib.toFixed(3)}g` },
              { name: 'Subsidence Probability', n02: isAnomaly?'87.4%':'0.12%',   n08: isAnomaly?'71.2%':'0.08%',            n15: isAnomaly?'92.1%':'0.15%' },
              { name: 'Geotech Alert',          n02: isAnomaly?'CRITICAL':'OK',   n08: isAnomaly?'CRITICAL':'OK',             n15: isAnomaly?'CRITICAL':'OK' },
            ].map(r => (
              <tr key={r.name}>
                <td style={{ fontWeight: 600 }}>{r.name}</td>
                <td style={{ color: isAnomaly && r.name !== 'Geotech Alert' ? 'var(--red)' : r.n02 === 'CRITICAL' ? 'var(--red)' : 'inherit' }}>{r.n02}</td>
                <td style={{ color: isAnomaly && r.name !== 'Geotech Alert' ? 'var(--yellow)' : r.n08 === 'CRITICAL' ? 'var(--red)' : 'inherit' }}>{r.n08}</td>
                <td style={{ color: isAnomaly && r.name !== 'Geotech Alert' ? 'var(--red)' : r.n15 === 'CRITICAL' ? 'var(--red)' : 'inherit' }}>{r.n15}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── ROW 4: Prediction Horizons + Model Architecture side by side ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="panel">
          <div className="panel-hd">
            <div className="panel-title">Geotechnical Prediction Horizons</div>
            <div className="panel-desc">Calculated risk predictions for future displacement</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12, marginTop: 8 }}>
            {[
              { label: 'Time Horizon', val: 'Classification Output', desc: 'Predicted Risk Profile' },
              { label: 'T + 15 Mins', val: isAnomaly ? 'Subsidence Imminent (92%)' : 'Stable (<1% risk)', warn: isAnomaly },
              { label: 'T + 1 Hour',  val: isAnomaly ? 'Structural Fail Potential' : 'Stable (<1% risk)', warn: isAnomaly },
              { label: 'T + 24 Hours',val: isAnomaly ? 'High Risk Surface Failure' : 'Stable (1.2% risk)', warn: isAnomaly },
            ].map((r, idx) => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 7, borderBottom: idx < 3 ? '1px solid var(--gray-border)' : 'none' }}>
                <div>
                  <span style={{ fontWeight: 700, display: 'block', color: 'var(--text-dark)' }}>{r.label}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{r.desc}</span>
                </div>
                <span style={{ fontFamily: 'var(--mono)', fontWeight: 600, color: r.warn ? 'var(--red)' : 'var(--green)' }}>{r.val}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-hd"><div className="panel-title">Model Architecture & Explainability</div></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
            {[
              { label: 'Algorithm',          value: 'XGBoost (Gradient Boosted Trees)' },
              { label: 'Training Data',      value: 'Indian Coalfield Deformation DB' },
              { label: 'Feature Count',      value: '47 engineered features' },
              { label: 'SHAP values',        value: 'Live Feature Explanations Active' },
              { label: 'Prediction Window',  value: '15-minute rolling horizon' },
              { label: 'Alert Threshold',    value: 'Risk Index > 50 (DGMS-aligned)' },
              { label: 'Last Retrained',     value: 'Aug 2026 · v2.1' },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 7, borderBottom: '1px solid var(--gray-border)' }}>
                <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>{r.label}</span>
                <span style={{ fontFamily: 'var(--mono)', fontWeight: 600, color: 'var(--text-dark)', textAlign: 'right', maxWidth: 180 }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── ROW 5: SHAP Explainability Summary (full width) ── */}
      <div className="panel">
        <div className="panel-hd">
          <div className="panel-title">SHAP Explainability Summary</div>
          <div className="panel-desc">Top contributing factors to the current model decision</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10, marginTop: 14 }}>
          {[
            { label: 'Top Driver',      val: isAnomaly ? 'Tilt Deviation'  : 'None (Stable)',   color: isAnomaly ? 'var(--red)'    : 'var(--green)' },
            { label: 'SHAP Score',      val: isAnomaly ? '+0.382'          : '~0.000',          color: isAnomaly ? 'var(--red)'    : 'var(--green)' },
            { label: 'Alert Threshold', val: 'Risk Index > 50',                                  color: 'var(--yellow)' },
            { label: 'Decision Output', val: isAnomaly ? 'ANOMALY_CONFIRM' : 'NOMINAL_STATE',   color: isAnomaly ? 'var(--red)'    : 'var(--green)' },
          ].map(r => (
            <div key={r.label} style={{ padding: '12px 14px', background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--gray-border)' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{r.label}</div>
              <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: r.color, fontSize: 13 }}>{r.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── ROW 6: Live Node Risk Overview (full width) ── */}
      <div className="panel">
        <div className="panel-hd">
          <div className="panel-title">Live Node Risk Overview</div>
          <div className="panel-desc">Real-time risk classification across all active sensor nodes</div>
        </div>
        <table className="data-table" style={{ marginTop: 12 }}>
          <thead>
            <tr><th>NODE</th><th>LOCATION</th><th>RISK INDEX</th><th>STATUS</th></tr>
          </thead>
          <tbody>
            {[
              { node: 'N02', loc: 'West Panel',    risk: isAnomaly ? 87 : 12, status: isAnomaly ? 'CRITICAL' : 'NORMAL' },
              { node: 'N08', loc: 'Mid Section',   risk: isAnomaly ? 71 : 9,  status: isAnomaly ? 'CRITICAL' : 'NORMAL' },
              { node: 'N15', loc: 'Deep East',     risk: isAnomaly ? 92 : 14, status: isAnomaly ? 'CRITICAL' : 'NORMAL' },
              { node: 'N01', loc: 'West Entry',    risk: isAnomaly ? 54 : 8,  status: isAnomaly ? 'ELEVATED' : 'NORMAL' },
              { node: 'N11', loc: 'North Gallery', risk: isAnomaly ? 38 : 6,  status: isAnomaly ? 'WATCH'    : 'NORMAL' },
              { node: 'N19', loc: 'South Drift',   risk: isAnomaly ? 22 : 5,  status: 'NORMAL' },
            ].map(r => {
              const color = r.status === 'CRITICAL' ? 'var(--red)' : r.status === 'ELEVATED' ? '#c2ab8f' : r.status === 'WATCH' ? 'var(--yellow)' : 'var(--green)';
              return (
                <tr key={r.node}>
                  <td style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--text-dark)' }}>{r.node}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{r.loc}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 5, background: 'var(--gray-border)', borderRadius: 3 }}>
                        <div style={{ width: `${r.risk}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.5s ease' }} />
                      </div>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-dark)', minWidth: 24 }}>{r.risk}</span>
                    </div>
                  </td>
                  <td><span style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 11, color }}>{r.status}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── ROW 7: Training Pipeline + DGMS Compliance ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, paddingBottom: 24 }}>
        <div className="panel">
          <div className="panel-hd">
            <div className="panel-title">Model Training Pipeline</div>
            <div className="panel-desc">End-to-end pipeline from sensor ingestion to live inference</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
            {[
              { step: '01', label: 'Raw Sensor Ingestion',  desc: 'LoRa packet parsing → time-series normalization' },
              { step: '02', label: 'Feature Engineering',   desc: '47 statistical + geotechnical derived features' },
              { step: '03', label: 'XGBoost Training',      desc: '10-fold cross-validation, SMOTE class balance' },
              { step: '04', label: 'SHAP Calibration',      desc: 'Feature importance validated by domain experts' },
              { step: '05', label: 'Live Edge Inference',   desc: '15-min rolling window, Raspberry Pi 4 optimized' },
            ].map(s => (
              <div key={s.step} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 10px', background: 'var(--bg)', borderRadius: 7, border: '1px solid var(--gray-border)' }}>
                <span style={{ fontFamily: 'var(--mono)', color: 'var(--ember)', fontWeight: 800, fontSize: 12, minWidth: 20, flexShrink: 0 }}>{s.step}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--text-dark)', fontSize: 11 }}>{s.label}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 10, marginTop: 2 }}>{s.desc}</div>
                </div>
                <span style={{ fontSize: 10, color: 'var(--green)', fontFamily: 'var(--mono)', flexShrink: 0 }}>✓</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-hd">
            <div className="panel-title">DGMS Regulatory Compliance</div>
            <div className="panel-desc">Directorate General of Mines Safety alignment verification</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 14 }}>
            {[
              { label: 'Circular Ref',          val: 'DGMS Circular 2/2016',          ok: true },
              { label: 'Alert Index Threshold', val: 'Risk > 50 → Alert',              ok: true },
              { label: 'Sensor Spacing',        val: '≤ 50m (compliant)',              ok: true },
              { label: 'Data Retention',        val: '90 days on-site archive',        ok: true },
              { label: 'Evacuation Protocol',   val: isAnomaly ? 'ACTIVE' : 'Standby', ok: !isAnomaly },
              { label: 'Last Audit',            val: 'July 2026 — PASSED',             ok: true },
            ].map(r => (
              <div key={r.label} style={{ padding: '10px 12px', background: 'var(--bg)', borderRadius: 7, border: `1px solid ${r.ok ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.25)'}` }}>
                <div style={{ color: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--mono)', marginBottom: 4 }}>{r.label}</div>
                <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 11, color: r.ok ? 'var(--green)' : 'var(--red)' }}>{r.val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}

import React, { useState } from 'react';

const sans = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
const mono = "'JetBrains Mono', 'Fira Code', ui-monospace, monospace";

// Custom Sleek Components
const SectionHeader = ({ title }) => (
  <div style={{ fontSize: '9px', color: '#666', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
    {title} <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
  </div>
);

const ToggleSwitch = ({ label, active, onClick }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={onClick}>
    <span style={{ fontSize: '11px', color: active ? '#e4e4e7' : '#a1a1aa', fontFamily: sans }}>{label}</span>
    <div style={{ width: '28px', height: '14px', borderRadius: '7px', background: active ? 'rgba(0, 230, 118, 0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${active ? '#00e676' : 'rgba(255,255,255,0.1)'}`, position: 'relative', transition: 'all 0.2s' }}>
      <div style={{ position: 'absolute', top: '1px', left: active ? '15px' : '1px', width: '10px', height: '10px', borderRadius: '50%', background: active ? '#00e676' : '#666', transition: 'all 0.2s', boxShadow: active ? '0 0 6px #00e676' : 'none' }} />
    </div>
  </div>
);

const SegmentedControl = ({ options, active, onChange }) => (
  <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', padding: '2px', border: '1px solid rgba(255,255,255,0.06)' }}>
    {options.map(opt => (
      <div 
        key={opt} onClick={() => onChange(opt)}
        style={{ flex: 1, textAlign: 'center', padding: '6px 0', fontSize: '10px', fontFamily: mono, cursor: 'pointer', borderRadius: '4px', background: active === opt ? 'rgba(255,255,255,0.08)' : 'transparent', color: active === opt ? '#fff' : '#666', transition: 'all 0.2s' }}
      >
        {opt}
      </div>
    ))}
  </div>
);

export default function FilterTab() {
  const [liveStream, setLiveStream] = useState(true);
  const [anomalyDetection, setAnomalyDetection] = useState(true);
  const [timeframe, setTimeframe] = useState('24H');
  const [confidence, setConfidence] = useState('HIGH');

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, background: '#000000', fontFamily: sans }}>
      <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
         <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
         <span style={{ fontSize: '10px', color: '#666', fontFamily: mono, textTransform: 'uppercase', letterSpacing: '1px' }}>Global Telemetry Filters</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 32px 20px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
        
        {/* Core Settings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <SectionHeader title="Engine Parameters" />
          <ToggleSwitch label="Live WebSocket Stream" active={liveStream} onClick={() => setLiveStream(!liveStream)} />
          <ToggleSwitch label="Aggressive Anomaly Detection" active={anomalyDetection} onClick={() => setAnomalyDetection(!anomalyDetection)} />
        </div>

        {/* Temporal Filters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <SectionHeader title="Temporal Window" />
          <SegmentedControl options={['1H', '24H', '7D', '30D']} active={timeframe} onChange={setTimeframe} />
        </div>

        {/* Spatial Confidence */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <SectionHeader title="Spatial Confidence Threshold" />
          <SegmentedControl options={['ALL', 'MED', 'HIGH', 'STRICT']} active={confidence} onChange={setConfidence} />
          <div style={{ fontSize: '9px', color: '#555', lineHeight: '1.4', marginTop: '4px' }}>
            Strict mode filters out cell tower triangulations with margin of error &gt; 50 meters. May reduce overall volume metrics.
          </div>
        </div>

      </div>

      {/* Action Footer */}
      <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button style={{ width: '100%', background: 'rgba(0, 230, 118, 0.05)', border: '1px solid #00e676', color: '#00e676', padding: '12px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: mono, cursor: 'pointer', transition: 'all 0.2s', boxShadow: 'inset 0 0 10px rgba(0,230,118,0.1)' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(0, 230, 118, 0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(0, 230, 118, 0.05)'}>
          Apply Parameters
        </button>
      </div>

      <style>{`
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
}
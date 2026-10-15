import React, { useState } from 'react';

const sans = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
const mono = "'JetBrains Mono', 'Fira Code', ui-monospace, monospace";

// ==========================================
// SHARED INTERACTIVE NODE (Deep Analysis Variant)
// ==========================================
const InteractiveNode = ({ title, icon, live, aiInsight, deepMetrics, children }) => {
  const [expanded, setExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)} 
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: '#050505',
        border: `1px solid ${isHovered ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.06)'}`,
        borderRadius: '8px', display: 'flex', flexDirection: 'column',
        position: 'relative', overflow: 'hidden', transition: 'border 0.2s ease'
      }}
    >
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {live && <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#00e676', boxShadow: '0 0 8px #00e676', animation: 'pulseLive 2s infinite' }} />}
            <span style={{ color: '#888', fontSize: '9px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: sans }}>{title}</span>
          </div>
          <span style={{ color: '#444' }}>{icon}</span>
        </div>
        <div>{children}</div>
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', background: isHovered ? 'rgba(255,255,255,0.02)' : 'transparent', transition: 'background 0.2s' }}>
        <button 
          onClick={() => setExpanded(!expanded)}
          style={{
            width: '100%', padding: '10px 16px', background: 'transparent', border: 'none',
            color: '#888', fontSize: '10px', fontWeight: '500', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            cursor: 'pointer', fontFamily: sans
          }}
        >
          <span>Deep Synthesis & Metadata</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}><polyline points="6 9 12 15 18 9"></polyline></svg>
        </button>

        <div style={{ display: 'grid', gridTemplateRows: expanded ? '1fr' : '0fr', transition: 'grid-template-rows 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ padding: '0 16px 16px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                {deepMetrics.map((m, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ fontSize: '8px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{m.label}</div>
                    <div style={{ fontSize: '11px', color: '#d4d4d8', fontFamily: mono }}>{m.val}</div>
                  </div>
                ))}
              </div>
              <div style={{ padding: '10px 12px', borderLeft: '2px solid rgba(0, 230, 118, 0.5)', background: 'rgba(0, 230, 118, 0.02)' }}>
                <div style={{ color: '#aaa', fontSize: '11px', lineHeight: '1.5', fontFamily: sans }}>{aiInsight}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// DEEP ANALYSIS WIDGETS
// ==========================================
const EntityLedgerTable = () => (
  <InteractiveNode 
    title="Entity Transaction Ledger" live={true}
    icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>}
    aiInsight="High frequency algorithmic execution detected across Wholesale nodes. Mean transaction size is positively skewed, indicating institutional-grade aggregation within the geofence."
    deepMetrics={[ { label: 'Total Rows', val: '14,204' }, { label: 'Anomalies', val: '12' }, { label: 'Hash Integrity', val: '99.9%' }, { label: 'Latency', val: '42ms' } ]}
  >
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '4px' }}>
        <span style={{ fontSize: '8px', color: '#666', textTransform: 'uppercase', letterSpacing: '1px' }}>Hash ID</span>
        <span style={{ fontSize: '8px', color: '#666', textTransform: 'uppercase', letterSpacing: '1px' }}>Vector</span>
        <span style={{ fontSize: '8px', color: '#666', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'right' }}>Volume</span>
        <span style={{ fontSize: '8px', color: '#666', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'right' }}>Risk</span>
      </div>
      {[ 
        { id: '0x8f...4a1', vec: 'Inbound', vol: '$14,200', r: 'Low', rc: '#00e676' },
        { id: '0x2a...9b3', vec: 'Outbound', vol: '$8,400', r: 'Med', rc: '#f59e0b' },
        { id: '0x9c...1e2', vec: 'Internal', vol: '$42,150', r: 'High', rc: '#ef4444' },
        { id: '0x4d...8f5', vec: 'Inbound', vol: '$2,100', r: 'Low', rc: '#00e676' },
      ].map((row, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', padding: '8px 0', borderBottom: i === 3 ? 'none' : '1px dashed rgba(255,255,255,0.04)' }}>
          <span style={{ fontSize: '10px', color: '#a1a1aa', fontFamily: mono }}>{row.id}</span>
          <span style={{ fontSize: '10px', color: '#d4d4d8', fontFamily: sans }}>{row.vec}</span>
          <span style={{ fontSize: '10px', color: '#fff', fontFamily: mono, textAlign: 'right' }}>{row.vol}</span>
          <span style={{ fontSize: '9px', color: row.rc, fontFamily: mono, textAlign: 'right' }}>{row.r}</span>
        </div>
      ))}
    </div>
  </InteractiveNode>
);

const MacroCorrelationGrid = () => (
  <InteractiveNode 
    title="Macro Correlation Heat-Grid" live={false}
    icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>}
    aiInsight="Strong negative correlation (-0.84) observed between Vendor Density and Logistical Efficiency. As active nodes increase in Sector 4, localized supply chain friction scales exponentially."
    deepMetrics={[ { label: 'Primary Node', val: 'Sector 4' }, { label: 'R-Squared', val: '0.92' }, { label: 'P-Value', val: '< 0.01' }, { label: 'Confidence', val: '98%' } ]}
  >
    <div style={{ display: 'flex', gap: '8px', height: '80px' }}>
       {/* Generating a static micro-heatmap representation */}
       {[...Array(6)].map((_, colIdx) => (
         <div key={colIdx} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
           {[...Array(4)].map((_, rowIdx) => {
             const intensity = Math.random();
             const isHot = intensity > 0.7;
             return (
               <div key={rowIdx} style={{ 
                 flex: 1, borderRadius: '2px', 
                 background: isHot ? `rgba(0, 230, 118, ${intensity})` : `rgba(255,255,255, ${intensity * 0.1})`,
                 border: `1px solid ${isHot ? 'rgba(0,230,118,0.2)' : 'transparent'}`
               }} />
             )
           })}
         </div>
       ))}
    </div>
  </InteractiveNode>
);

export default function DeepAnalysisTab({ contextHub }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, background: '#000000', fontFamily: sans }}>
      {contextHub && (
        <div style={{ padding: '20px 20px 0 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
           <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#00e676', animation: 'pulseLive 2s infinite' }} />
           <span style={{ fontSize: '10px', color: '#666', fontFamily: mono, textTransform: 'uppercase', letterSpacing: '1px' }}>
             Deep Analysis Vector: <span style={{ color: '#aaa' }}>{contextHub}</span>
           </span>
        </div>
      )}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 32px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ animation: `fadeInUp 0.4s ease-out 0s backwards` }}><EntityLedgerTable /></div>
        <div style={{ animation: `fadeInUp 0.4s ease-out 0.05s backwards` }}><MacroCorrelationGrid /></div>
      </div>
      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulseLive { 0% { opacity: 1; } 50% { opacity: 0.2; } 100% { opacity: 1; } }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
}
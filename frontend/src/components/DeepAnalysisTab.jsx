import React, { useState, useEffect, useRef } from 'react';

const sans = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
const mono = "'JetBrains Mono', 'Fira Code', ui-monospace, monospace";

// ==========================================
// 1. REAL-TIME UTILITIES & MICRO-COMPONENTS
// ==========================================

// Simulates a live, fluctuating number for the terminal aesthetic
const LiveNumber = ({ base, variance = 0.05, format = 'number', prefix = '', suffix = '' }) => {
  const [val, setVal] = useState(base);
  useEffect(() => {
    const int = setInterval(() => {
      const change = base * variance * (Math.random() - 0.5);
      setVal(base + change);
    }, 1500 + Math.random() * 1000);
    return () => clearInterval(int);
  }, [base, variance]);

  const display = format === 'currency' 
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 1 }).format(val)
    : format === 'percent'
    ? val.toFixed(2) + '%'
    : val.toFixed(1);

  return <span style={{ transition: 'color 0.2s', color: val > base ? '#00e676' : val < base ? '#ef4444' : '#fff' }}>{prefix}{display}{suffix}</span>;
};

// Sleek Hover Tooltip for Explainability
const InfoTooltip = ({ text }) => {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }} onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" style={{ cursor: 'help', transition: 'stroke 0.2s' }} onMouseEnter={e => e.currentTarget.style.stroke = '#fff'} onMouseLeave={e => e.currentTarget.style.stroke = '#666'}>
        <circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line>
      </svg>
      {show && (
        <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '8px', width: '220px', background: 'rgba(20,20,22,0.95)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '6px', fontSize: '10px', color: '#ccc', fontFamily: sans, zIndex: 100, boxShadow: '0 10px 30px rgba(0,0,0,0.8)', textTransform: 'none', letterSpacing: 'normal', lineHeight: '1.5' }}>
          {text}
        </div>
      )}
    </div>
  );
};

// Internal Widget Segmented Control
const FilterToggle = ({ options }) => {
  const [active, setActive] = useState(options[0]);
  return (
    <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: '4px', padding: '2px', border: '1px solid rgba(255,255,255,0.05)' }}>
      {options.map(opt => (
        <div key={opt} onClick={() => setActive(opt)} style={{ padding: '2px 8px', fontSize: '8px', fontFamily: mono, cursor: 'pointer', borderRadius: '2px', background: active === opt ? '#333' : 'transparent', color: active === opt ? '#fff' : '#666', transition: 'all 0.2s' }}>
          {opt}
        </div>
      ))}
    </div>
  );
};

// ==========================================
// 2. HYPER-DENSE INTERACTIVE NODE
// ==========================================
const InteractiveNode = ({ title, icon, live, explanation, deepMetrics, filters, children }) => {
  const [expanded, setExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}
      style={{ background: '#050505', border: `1px solid ${isHovered ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.06)'}`, borderRadius: '8px', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', transition: 'border 0.2s ease', height: '100%', boxShadow: isHovered ? '0 8px 32px rgba(0,0,0,0.4)' : 'none' }}
    >
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {live && <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#00e676', boxShadow: '0 0 8px #00e676', animation: 'pulseLive 1.5s infinite' }} />}
            <span style={{ color: '#888', fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: sans }}>{title}</span>
            {explanation && <InfoTooltip text={explanation} />}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {filters && <FilterToggle options={filters} />}
            <span style={{ color: '#444' }}>{icon}</span>
          </div>
        </div>
        <div style={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}>{children}</div>
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', background: isHovered ? 'rgba(255,255,255,0.02)' : 'transparent', transition: 'background 0.2s' }}>
        <button onClick={() => setExpanded(!expanded)} style={{ width: '100%', padding: '10px 16px', background: 'transparent', border: 'none', color: '#888', fontSize: '9px', fontWeight: '600', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontFamily: sans, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          <span>Deep Synthesis & Metadata</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}><polyline points="6 9 12 15 18 9"></polyline></svg>
        </button>
        <div style={{ display: 'grid', gridTemplateRows: expanded ? '1fr' : '0fr', transition: 'grid-template-rows 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ padding: '0 16px 16px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
                {deepMetrics.map((m, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ fontSize: '8px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{m.label}</div>
                    <div style={{ fontSize: '10px', color: '#d4d4d8', fontFamily: mono }}>{m.val}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button style={{ background: 'rgba(0,230,118,0.1)', color: '#00e676', border: '1px solid rgba(0,230,118,0.2)', padding: '6px 12px', borderRadius: '4px', fontSize: '9px', fontFamily: mono, cursor: 'pointer' }}>Extract Node Data</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 3. FULLY INTERACTIVE WIDGETS
// ==========================================

const MacroVolatilityChart = () => {
  const [candles, setCandles] = useState([]);
  const [hoverIdx, setHoverIdx] = useState(null);
  
  useEffect(() => {
    const gen = () => Array.from({length: 24}).reduce((acc, _, i) => {
      const prev = i === 0 ? 100 : acc[i-1].close;
      const c = prev + (Math.random() - 0.5) * 12;
      acc.push({ open: prev, close: c, high: Math.max(prev, c) + Math.random()*5, low: Math.min(prev, c) - Math.random()*5, vol: Math.random()*100, bullish: c >= prev });
      return acc;
    }, []);
    setCandles(gen());
    const int = setInterval(() => setCandles(gen()), 3000);
    return () => clearInterval(int);
  }, []);

  if (!candles.length) return null;
  const maxH = Math.max(...candles.map(c => c.high));
  const minL = Math.min(...candles.map(c => c.low));
  const range = maxH - minL;

  return (
    <InteractiveNode 
      title="Liquidity Volatility" live={true} 
      explanation="Tracks the variance in high-frequency liquidity injections over the selected time horizon. Candlesticks represent open/close volume deltas."
      filters={['LIVE', '1H', '24H']}
      icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 3v18h18"/><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/></svg>} 
      deepMetrics={[ {label: 'RSI(14)', val: <LiveNumber base={64.2}/>}, {label: 'MACD', val: '+0.04'}, {label: 'Skew', val: '+1.42'}, {label: 'Spread', val: '1.2%'} ]}
    >
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '140px', position: 'relative', paddingTop: '10px' }} onMouseLeave={() => setHoverIdx(null)}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', opacity: 0.1, zIndex: 0 }}>
          {[...Array(4)].map((_,i) => <div key={i} style={{ borderBottom: '1px dashed #fff' }} />)}
        </div>
        {candles.map((c, i) => {
          const h = ((c.high - minL) / range) * 80; const l = ((c.low - minL) / range) * 80;
          const o = ((c.open - minL) / range) * 80; const cl = ((c.close - minL) / range) * 80;
          const color = c.bullish ? '#00e5ff' : '#ef4444';
          return (
            <div key={i} onMouseEnter={() => setHoverIdx(i)} style={{ position: 'relative', width: '100%', height: '100%', zIndex: 1, display: 'flex', justifyContent: 'center', cursor: 'crosshair' }}>
              {/* Interactive Hover Crosshair */}
              {hoverIdx === i && <div style={{ position: 'absolute', top: 0, bottom: 0, width: '1px', background: 'rgba(255,255,255,0.2)', zIndex: 0 }} />}
              <div style={{ position: 'absolute', bottom: `${l}%`, height: `${h - l}%`, width: '1px', background: color, opacity: 0.6 }} />
              <div style={{ position: 'absolute', bottom: `${Math.min(o, cl)}%`, height: `${Math.max(1, Math.abs(o - cl))}%`, width: '4px', background: color }} />
              <div style={{ position: 'absolute', bottom: 0, height: `${c.vol/100 * 15}%`, width: '2px', background: color, opacity: 0.3 }} />
            </div>
          );
        })}
      </div>
    </InteractiveNode>
  );
};

const EntityLedgerTable = () => (
  <InteractiveNode 
    title="Entity Ledger" live={false} 
    explanation="Real-time decrypt of hashed entity wallets interacting within the geofence. Risk profiles are assigned via AI anomaly detection."
    filters={['ALL', 'HIGH RISK']}
    icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line></svg>} 
    deepMetrics={[ {label: 'Rows', val: '14.2k'}, {label: 'Latency', val: <LiveNumber base={42} suffix="ms"/>}, {label: 'Mean Tx', val: '$8.4k'}, {label: 'Outliers', val: '0.4%'} ]}
  >
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span style={{ fontSize: '8px', color: '#666', fontFamily: mono }}>HASH ID</span><span style={{ fontSize: '8px', color: '#666', fontFamily: mono }}>VECTOR</span><span style={{ fontSize: '8px', color: '#666', fontFamily: mono, textAlign: 'right' }}>VOLUME</span>
      </div>
      {[ { id: '0x8f7...4a1b', vec: 'Inbound', vol: 14200, rc: '#00e676' }, { id: '0x2a9...9b3f', vec: 'Outbound', vol: 8400, rc: '#f59e0b' }, { id: '0x9c4...1e2a', vec: 'Internal', vol: 42150, rc: '#ef4444' }, { id: '0x4d1...8f5c', vec: 'Inbound', vol: 2100, rc: '#00e676' } ].map((row, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', padding: '10px 0', borderBottom: i === 3 ? 'none' : '1px dashed rgba(255,255,255,0.04)', transition: 'background 0.2s', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <span style={{ fontSize: '10px', color: '#a1a1aa', fontFamily: mono }}>{row.id}</span>
          <span style={{ fontSize: '10px', color: '#888', fontFamily: sans }}>{row.vec}</span>
          <span style={{ fontSize: '10px', color: row.rc, fontFamily: mono, textAlign: 'right' }}><LiveNumber base={row.vol} format="currency" /></span>
        </div>
      ))}
    </div>
  </InteractiveNode>
);

const MacroCorrelationGrid = () => (
  <InteractiveNode 
    title="Correlation Matrix" live={false} 
    explanation="A heat-map showing the Pearson correlation coefficient between macro variables. Brighter green indicates a stronger positive correlation."
    icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>} 
    deepMetrics={[ {label: 'R-Sq', val: '0.92'}, {label: 'P-Val', val: '<0.01'}, {label: 'Cov', val: <LiveNumber base={14.2}/>}, {label: 'Conf', val: '98%'} ]}
  >
    <div style={{ display: 'flex', gap: '4px', height: '120px' }}>
      {[...Array(10)].map((_, col) => (
        <div key={col} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {[...Array(6)].map((_, row) => {
            const hot = Math.random() > 0.8;
            return <div key={row} style={{ flex: 1, background: hot ? '#00e676' : 'rgba(255,255,255,0.05)', opacity: hot ? Math.random() : 1, borderRadius: '1px', cursor: 'crosshair', transition: 'transform 0.1s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'} />
          })}
        </div>
      ))}
    </div>
  </InteractiveNode>
);

const ExtendedConversionFunnel = () => (
  <InteractiveNode 
    title="Lifecycle Funnel" live={false} 
    explanation="Tracks entity retention through the transaction lifecycle. Highlights severe drop-offs at critical spatial junctions."
    icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"></path></svg>} 
    deepMetrics={[ {label: 'Discovery', val: '12k'}, {label: 'Intent', val: '3.6k'}, {label: 'Settlement', val: '1.8k'}, {label: 'LTV', val: '$420'} ]}
  >
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '140px' }}>
      {[ { h: '100%', l: 'DISC' }, { h: '75%', l: 'ENG' }, { h: '60%', l: 'VAL' }, { h: '45%', l: 'INT' }, { h: '38%', l: 'CHK' }, { h: '22%', l: 'SET', c: '#00e676' }, { h: '15%', l: 'RET', c: '#00e5ff' } ].map((f, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', opacity: 0.8, transition: 'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0.8}>
          <div style={{ position: 'relative', width: '4px', height: f.h, background: f.c || '#333', borderRadius: '2px' }}>
             <div style={{ position: 'absolute', top: 0, left: '-2px', width: '8px', height: '8px', borderRadius: '50%', background: f.c || '#555', boxShadow: f.c ? `0 0 10px ${f.c}` : 'none' }} />
          </div>
          <span style={{ fontSize: '8px', color: '#666', fontFamily: mono }}>{f.l}</span>
        </div>
      ))}
    </div>
  </InteractiveNode>
);

const WidgetRegistry = {
  MacroVolatility: MacroVolatilityChart,
  EntityLedger: EntityLedgerTable,
  MacroCorrelation: MacroCorrelationGrid,
  ExtendedFunnel: ExtendedConversionFunnel
};

// ==========================================
// 4. MAIN EXPORT & LAYOUT COMPOSITOR
// ==========================================
export default function DeepAnalysisTab({ canvasMode, scanData, contextHub, setCanvasMode }) {
  const [showExport, setShowExport] = useState(false);

  // Intent Logic
  const determineRelevantWidgets = (query) => {
    return ['MacroVolatility', 'EntityLedger', 'MacroCorrelation', 'ExtendedFunnel', 'MacroVolatility', 'EntityLedger']; // Duplicated for dense 2-col demo
  };
  const activeWidgets = determineRelevantWidgets(contextHub);

  return (
    <div style={{ 
      position: 'absolute', inset: 0, opacity: canvasMode === 'analysis' ? 1 : 0, pointerEvents: canvasMode === 'analysis' ? 'auto' : 'none', 
      background: '#000000', padding: '40px 60px', overflowY: 'auto', overflowX: 'hidden', zIndex: 100, transition: 'opacity 0.4s ease', fontFamily: sans
    }}>
       <div style={{ width: '100%', maxWidth: '1800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Top Control Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '20px' }}>
             <div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                 <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00e676', animation: 'pulseLive 2s infinite' }} />
                 <span style={{ fontSize: '10px', color: '#00e676', fontFamily: mono, textTransform: 'uppercase', letterSpacing: '1px' }}>System Telemetry Active</span>
               </div>
               <div style={{ fontSize: '40px', color: '#fff', fontWeight: '700', letterSpacing: '-1px', marginBottom: '12px' }}>{contextHub || "Macro Topology Synthesis"}</div>
               <div style={{ display: 'flex', gap: '24px' }}>
                 {[ { label: 'S2 Cell ID', val: '89c25c7' }, { label: 'Signal Dwell', val: '42m 18s' }, { label: 'Confidence', val: '96.4%', c: '#00e676' }, { label: 'Live Nodes', val: '14,204' } ].map((t, i) => (
                   <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                     <span style={{ fontSize: '8px', color: '#666', fontFamily: mono, textTransform: 'uppercase' }}>{t.label}</span>
                     <span style={{ fontSize: '13px', color: t.c || '#d4d4d8', fontFamily: mono, fontWeight: '600' }}>{t.val}</span>
                   </div>
                 ))}
               </div>
             </div>
             
             <div style={{ display: 'flex', gap: '12px', position: 'relative' }}>
               {/* Export Dropdown Engine */}
               <button onClick={() => setShowExport(!showExport)} style={{ padding: '10px 16px', background: showExport ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: '#fff', fontSize: '11px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}>
                 <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Export Deep Data
               </button>
               {showExport && (
                 <div style={{ position: 'absolute', top: '100%', right: '110px', marginTop: '8px', background: '#0a0a0c', border: '1px solid #333', borderRadius: '6px', padding: '6px', zIndex: 200, width: '160px', boxShadow: '0 10px 30px rgba(0,0,0,0.8)' }}>
                   {['Export as CSV', 'Generate PDF Report', 'Raw JSON Stream'].map(opt => (
                     <div key={opt} onClick={() => setShowExport(false)} style={{ padding: '8px 10px', fontSize: '10px', color: '#aaa', cursor: 'pointer', borderRadius: '4px', transition: 'background 0.2s' }} onMouseEnter={e => {e.currentTarget.style.background = '#1a1a1c'; e.currentTarget.style.color = '#fff'}} onMouseLeave={e => {e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#aaa'}}>
                       {opt}
                     </div>
                   ))}
                 </div>
               )}
               <button onClick={() => setCanvasMode('map')} style={{ padding: '10px 16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', fontSize: '11px', fontWeight: '600', transition: 'all 0.2s' }} onMouseEnter={(e)=>e.currentTarget.style.background='rgba(239, 68, 68, 0.2)'} onMouseLeave={(e)=>e.currentTarget.style.background='rgba(239, 68, 68, 0.1)'}>
                 Terminate Connection
               </button>
             </div>
          </div>

          {/* MASSIVE SPLIT: 1fr Grid (Left) | 380px Sticky Report (Right) */}
          <div style={{ display: 'flex', gap: '48px', alignItems: 'flex-start' }}>
             
             {/* LEFT: Strict 2-Column Grid for Side-by-Side Widgets */}
             <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                {activeWidgets.map((widgetName, index) => {
                  const WidgetComponent = WidgetRegistry[widgetName];
                  if (!WidgetComponent) return null;
                  return (
                    <div key={`${widgetName}-${index}`} style={{ animation: `fadeInUp 0.5s ease-out ${index * 0.05}s backwards` }}>
                      <WidgetComponent />
                    </div>
                  );
                })}
             </div>

             {/* RIGHT: NARROW, STICKY, EXPANDED PROFESSIONAL REPORT */}
             <div style={{ width: '380px', position: 'sticky', top: '20px', display: 'flex', flexDirection: 'column', gap: '24px', animation: `fadeInUp 0.5s ease-out 0.2s backwards` }}>
                <div style={{ background: '#050505', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '8px', padding: '32px', display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 140px)', overflowY: 'auto' }}>
                   <div style={{ fontSize: '10px', color: '#888', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> 
                     Comprehensive Analysis Report
                   </div>
                   
                   <div style={{ color: '#aaa', fontSize: '12px', lineHeight: '1.7', fontWeight: '400', display: 'flex', flexDirection: 'column', gap: '28px' }}>
                      
                      {/* Section 1 */}
                      <div>
                        <div style={{ fontSize: '10px', color: '#fff', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>1. Macro-Level Thesis</div>
                        <p style={{ margin: 0 }}>The spatial telemetry for <strong style={{ color: '#fff' }}>{contextHub}</strong> reveals a highly concentrated liquidity vortex operating outside formal financial corridors. Unrecorded cash velocity is currently outperforming formal baselines by 3.2x.</p>
                      </div>

                      {/* Section 2 */}
                      <div>
                        <div style={{ fontSize: '10px', color: '#fff', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>2. High-Frequency Indicators</div>
                        <ul style={{ paddingLeft: '16px', margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <li><strong style={{ color: '#d4d4d8' }}>Volatility:</strong> AI detected a <span style={{ color: '#00e676', fontFamily: mono }}>+14.2%</span> acceleration vector in macro liquidity, overriding diurnal decay.</li>
                          <li><strong style={{ color: '#d4d4d8' }}>Arbitrage:</strong> Cross-border delta holding at a <span style={{ color: '#00e5ff', fontFamily: mono }}>4.8% premium</span>, actively incentivizing flight.</li>
                        </ul>
                      </div>

                      {/* Section 3 */}
                      <div>
                        <div style={{ fontSize: '10px', color: '#fff', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>3. Predictive Forecasting</div>
                        <p style={{ margin: 0 }}>Stochastic models indicate a 94% probability of critical liquidity drain in Sector South within 48 hours. If the current transaction skew persists, the central routing node will face an irreversible congestion state.</p>
                      </div>

                      {/* Section 4 */}
                      <div>
                        <div style={{ fontSize: '10px', color: '#fff', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>4. Structural Risk Matrix</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                           <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)', borderRadius: '4px' }}>
                             <div style={{ fontSize: '9px', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: mono, marginBottom: '4px' }}>Critical Vector</div>
                             <div style={{ fontSize: '11px', color: '#fff' }}>Supply Bottleneck (North)</div>
                           </div>
                           <div style={{ padding: '12px', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.1)', borderRadius: '4px' }}>
                             <div style={{ fontSize: '9px', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: mono, marginBottom: '4px' }}>Secondary Friction</div>
                             <div style={{ fontSize: '11px', color: '#fff' }}>Settlement Attrition (40%)</div>
                           </div>
                        </div>
                      </div>
                      
                      {/* CTA */}
                      <div style={{ padding: '20px', background: 'rgba(0, 230, 118, 0.03)', borderLeft: '2px solid #00e676', borderRadius: '4px' }}>
                        <div style={{ fontSize: '9px', color: '#00e676', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontFamily: mono }}>Automated Strategic Imperative</div>
                        <div style={{ fontSize: '11px', color: '#ccc', lineHeight: '1.6' }}>
                          Scale infrastructural nodes by 18% in Sector 4 immediately to absorb excess liquidity overflow. Implement dynamic geo-pricing.
                        </div>
                      </div>

                   </div>
                </div>
             </div>

          </div>
       </div>

       <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulseLive { 0% { opacity: 1; } 50% { opacity: 0.2; } 100% { opacity: 1; } }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
}
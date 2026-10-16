import React, { useState, useEffect } from 'react';

const sans = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
const mono = "'JetBrains Mono', 'Fira Code', ui-monospace, monospace";

// ==========================================
// 1. CORE UTILITIES & MICRO-COMPONENTS
// ==========================================

const LiveNumber = ({ base, variance = 0.05, format = 'number', prefix = '', suffix = '' }) => {
  const [val, setVal] = useState(base);
  useEffect(() => {
    const int = setInterval(() => {
      setVal(base + (base * variance * (Math.random() - 0.5)));
    }, 1500 + Math.random() * 1000);
    return () => clearInterval(int);
  }, [base, variance]);

  const display = format === 'currency' 
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 1 }).format(val)
    : format === 'percent' ? val.toFixed(2) + '%' : val.toFixed(1);

  return <span style={{ transition: 'color 0.2s', color: val > base ? '#00e676' : val < base ? '#ef4444' : '#fff' }}>{prefix}{display}{suffix}</span>;
};

// ==========================================
// 2. EXPORT TERMINAL MODAL
// ==========================================
const ExportModal = ({ onClose }) => {
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState(['Initializing secure export tunnel...']);

  useEffect(() => {
    if (progress < 100) {
      const timer = setTimeout(() => {
        setProgress(p => Math.min(p + Math.floor(Math.random() * 15) + 5, 100));
        const newLogs = [
          'Compiling spatial telemetry...',
          'Decrypting Hash IDs...',
          'Structuring macro correlation matrices...',
          'Generating PDF Synthesis...',
          'Finalizing cryptographic signature...'
        ];
        setLogs(prev => [...prev, newLogs[Math.floor(progress / 20)] || 'Processing...']);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [progress]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ width: '500px', background: '#050505', border: '1px solid rgba(0, 230, 118, 0.4)', borderRadius: '8px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
        <div style={{ background: 'rgba(0, 230, 118, 0.1)', padding: '12px 20px', borderBottom: '1px solid rgba(0, 230, 118, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#00e676', fontFamily: mono, fontSize: '11px', letterSpacing: '1px' }}>SYSTEM.DATA_EXPORT</span>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ fontFamily: mono, fontSize: '10px', color: '#888', display: 'flex', flexDirection: 'column', gap: '6px', height: '80px', overflow: 'hidden' }}>
            {logs.map((l, i) => <span key={i}>{'>'} {l}</span>)}
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '10px', color: '#fff', fontFamily: mono }}>
              <span>{progress === 100 ? 'COMPLETE' : 'PROCESSING'}</span>
              <span style={{ color: '#00e676' }}>{progress}%</span>
            </div>
            <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: '#00e676', transition: 'width 0.3s ease' }} />
            </div>
          </div>
          {progress === 100 && (
            <button onClick={onClose} style={{ padding: '12px', background: '#00e676', color: '#000', border: 'none', borderRadius: '4px', fontFamily: mono, fontSize: '12px', fontWeight: '700', cursor: 'pointer', marginTop: '12px' }}>
              DOWNLOAD SECURE ARCHIVE
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 3. INTERACTIVE WIDGETS & PANELS
// ==========================================

const InteractiveNode = ({ title, icon, live, children }) => (
  <div style={{ background: '#050505', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', height: '100%' }}>
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {live && <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#00e676', boxShadow: '0 0 8px #00e676', animation: 'pulseLive 1.5s infinite' }} />}
          <span style={{ color: '#aaa', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: sans }}>{title}</span>
        </div>
        <span style={{ color: '#444' }}>{icon}</span>
      </div>
      <div style={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}>{children}</div>
    </div>
  </div>
);

// Full-width AI Panel interleaved between widgets
const AIPanel = ({ title, content, actionable }) => (
  <div style={{ gridColumn: '1 / -1', background: 'linear-gradient(90deg, rgba(0, 230, 118, 0.05) 0%, rgba(0, 0, 0, 0) 100%)', border: '1px solid rgba(0, 230, 118, 0.15)', borderLeft: '3px solid #00e676', borderRadius: '6px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
     <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#00e676', fontFamily: mono, textTransform: 'uppercase', letterSpacing: '1px' }}>
       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
       {title}
     </div>
     <div style={{ color: '#d4d4d8', fontSize: '13px', lineHeight: '1.7', fontFamily: sans }}>{content}</div>
     <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
       <button style={{ padding: '8px 16px', background: 'rgba(0, 230, 118, 0.1)', border: '1px solid rgba(0, 230, 118, 0.3)', color: '#00e676', fontSize: '10px', fontFamily: mono, cursor: 'pointer', borderRadius: '4px' }}>Run Diagnostic</button>
       <button style={{ padding: '8px 16px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#ccc', fontSize: '10px', fontFamily: mono, cursor: 'pointer', borderRadius: '4px' }}>Trace Vectors</button>
     </div>
  </div>
);

const MacroVolatilityChart = () => {
  const [candles, setCandles] = useState([]);
  const [hoverData, setHoverData] = useState(null);
  
  useEffect(() => {
    const gen = () => Array.from({length: 30}).reduce((acc, _, i) => {
      const prev = i === 0 ? 100 : acc[i-1].close;
      const c = prev + (Math.random() - 0.5) * 12;
      acc.push({ open: prev, close: c, high: Math.max(prev, c) + Math.random()*5, low: Math.min(prev, c) - Math.random()*5, vol: Math.floor(Math.random()*1000), bullish: c >= prev });
      return acc;
    }, []);
    setCandles(gen());
    const int = setInterval(() => setCandles(gen()), 4000);
    return () => clearInterval(int);
  }, []);

  if (!candles.length) return null;
  const maxH = Math.max(...candles.map(c => c.high));
  const minL = Math.min(...candles.map(c => c.low));
  const range = maxH - minL;

  return (
    <InteractiveNode title="Liquidity Volatility" live={true} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 3v18h18"/><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/></svg>}>
      {/* Interactive Tooltip Header */}
      <div style={{ display: 'flex', gap: '16px', fontSize: '9px', fontFamily: mono, color: '#888', height: '14px', marginBottom: '8px' }}>
        {hoverData ? (
          <>
            <span>O: <strong style={{ color: '#fff' }}>{hoverData.open.toFixed(2)}</strong></span>
            <span>H: <strong style={{ color: '#fff' }}>{hoverData.high.toFixed(2)}</strong></span>
            <span>L: <strong style={{ color: '#fff' }}>{hoverData.low.toFixed(2)}</strong></span>
            <span>C: <strong style={{ color: hoverData.bullish ? '#00e5ff' : '#ef4444' }}>{hoverData.close.toFixed(2)}</strong></span>
            <span>V: <strong style={{ color: '#fff' }}>{hoverData.vol}</strong></span>
          </>
        ) : (
          <span>Hover over chart to view high-frequency block data.</span>
        )}
      </div>

      <div 
        style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '140px', position: 'relative' }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const index = Math.floor((x / rect.width) * candles.length);
          if (candles[index]) setHoverData(candles[index]);
        }}
        onMouseLeave={() => setHoverData(null)}
      >
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', opacity: 0.15, zIndex: 0, pointerEvents: 'none' }}>
          {[...Array(4)].map((_,i) => <div key={i} style={{ borderBottom: '1px dashed #fff' }} />)}
        </div>
        {candles.map((c, i) => {
          const h = ((c.high - minL) / range) * 80; const l = ((c.low - minL) / range) * 80;
          const o = ((c.open - minL) / range) * 80; const cl = ((c.close - minL) / range) * 80;
          const color = c.bullish ? '#00e5ff' : '#ef4444';
          const isHovered = hoverData === c;
          
          return (
            <div key={i} style={{ position: 'relative', width: '100%', height: '100%', zIndex: 1, display: 'flex', justifyContent: 'center' }}>
              {isHovered && <div style={{ position: 'absolute', top: 0, bottom: 0, width: '1px', background: 'rgba(255,255,255,0.2)' }} />}
              <div style={{ position: 'absolute', bottom: `${l}%`, height: `${h - l}%`, width: '1px', background: color, opacity: isHovered ? 1 : 0.6 }} />
              <div style={{ position: 'absolute', bottom: `${Math.min(o, cl)}%`, height: `${Math.max(1, Math.abs(o - cl))}%`, width: '4px', background: color, boxShadow: isHovered ? `0 0 6px ${color}` : 'none' }} />
              <div style={{ position: 'absolute', bottom: 0, height: `${(c.vol/1000) * 20}%`, width: '2px', background: color, opacity: isHovered ? 0.6 : 0.3 }} />
            </div>
          );
        })}
      </div>
    </InteractiveNode>
  );
};

const EntityLedgerTable = () => (
  <InteractiveNode title="Entity Ledger" live={false} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line></svg>}>
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <span style={{ fontSize: '9px', color: '#666', fontFamily: mono }}>HASH ID</span><span style={{ fontSize: '9px', color: '#666', fontFamily: mono }}>VECTOR</span><span style={{ fontSize: '9px', color: '#666', fontFamily: mono, textAlign: 'right' }}>VOLUME</span>
      </div>
      {[ { id: '0x8f7...4a1b', vec: 'Inbound', vol: 14200, rc: '#00e676' }, { id: '0x2a9...9b3f', vec: 'Outbound', vol: 8400, rc: '#f59e0b' }, { id: '0x9c4...1e2a', vec: 'Internal', vol: 42150, rc: '#ef4444' }, { id: '0x4d1...8f5c', vec: 'Inbound', vol: 2100, rc: '#00e676' }, { id: '0x1a8...b22d', vec: 'Internal', vol: 9300, rc: '#f59e0b' } ].map((row, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', padding: '12px 0', borderBottom: i === 4 ? 'none' : '1px dashed rgba(255,255,255,0.05)', transition: 'all 0.2s', cursor: 'pointer' }} onMouseEnter={e => {e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.paddingLeft = '8px'}} onMouseLeave={e => {e.currentTarget.style.background = 'transparent'; e.currentTarget.style.paddingLeft = '0'}}>
          <span style={{ fontSize: '11px', color: '#a1a1aa', fontFamily: mono }}>{row.id}</span>
          <span style={{ fontSize: '11px', color: '#888', fontFamily: sans }}>{row.vec}</span>
          <span style={{ fontSize: '11px', color: row.rc, fontFamily: mono, textAlign: 'right' }}><LiveNumber base={row.vol} format="currency" /></span>
        </div>
      ))}
    </div>
  </InteractiveNode>
);

const MacroCorrelationGrid = () => {
  const [hoverNode, setHoverNode] = useState(null);
  const labels = ['Density', 'Friction', 'Volume', 'Velocity', 'Risk', 'Arbitrage'];
  return (
    <InteractiveNode title="Correlation Matrix" live={false} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>}>
      <div style={{ height: '14px', fontSize: '9px', fontFamily: mono, color: '#888', marginBottom: '8px' }}>
        {hoverNode ? `Correlation [${hoverNode.x} × ${hoverNode.y}]: ` : 'Hover cell for Pearson coefficient.'}
        {hoverNode && <strong style={{ color: hoverNode.val > 0 ? '#00e676' : '#ef4444' }}>{(hoverNode.val).toFixed(2)}</strong>}
      </div>
      <div style={{ display: 'flex', gap: '4px', height: '120px' }}>
        {[...Array(6)].map((_, col) => (
          <div key={col} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {[...Array(5)].map((_, row) => {
              const val = (Math.random() * 2) - 1; 
              const intensity = Math.abs(val);
              const color = val > 0 ? `rgba(0, 230, 118, ${intensity})` : `rgba(239, 68, 68, ${intensity})`;
              return <div key={row} 
                onMouseEnter={() => setHoverNode({x: labels[col], y: `Var ${row}`, val})} 
                onMouseLeave={() => setHoverNode(null)}
                style={{ flex: 1, background: color, border: '1px solid rgba(255,255,255,0.05)', borderRadius: '2px', cursor: 'crosshair', transition: 'transform 0.1s' }} 
                onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'} 
                onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'} 
              />
            })}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#666', fontFamily: mono, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px', marginTop: '12px' }}>
        {labels.map(l => <span key={l}>{l}</span>)}
      </div>
    </InteractiveNode>
  );
};

const ExtendedConversionFunnel = () => (
  <InteractiveNode title="Lifecycle Funnel" live={false} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"></path></svg>}>
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '160px', paddingTop: '10px' }}>
      {[ 
        { h: '100%', l: 'DISC', v: 12000, c: '#333' }, { h: '75%', l: 'ENG', v: 7800, c: '#333' }, 
        { h: '60%', l: 'VAL', v: 6100, c: '#333' }, { h: '45%', l: 'INT', v: 3600, c: '#333' }, 
        { h: '38%', l: 'CHK', v: 3000, c: '#333' }, { h: '22%', l: 'SET', v: 1800, c: '#00e676' }, 
        { h: '15%', l: 'RET', v: 1200, c: '#00e5ff' } 
      ].map((f, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'transform 0.2s', opacity: 0.8 }} onMouseEnter={e => {e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.opacity = 1}} onMouseLeave={e => {e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.opacity = 0.8}}>
          <span style={{ fontSize: '10px', color: '#aaa', fontFamily: mono }}><LiveNumber base={f.v} /></span>
          <div style={{ position: 'relative', width: '6px', height: f.h, background: f.c || '#333', borderRadius: '3px' }}>
             <div style={{ position: 'absolute', top: 0, left: '-3px', width: '12px', height: '12px', borderRadius: '50%', background: f.c || '#555', boxShadow: f.c !== '#333' ? `0 0 12px ${f.c}` : 'none' }} />
          </div>
          <span style={{ fontSize: '9px', color: '#666', fontFamily: mono }}>{f.l}</span>
        </div>
      ))}
    </div>
  </InteractiveNode>
);

// ==========================================
// 4. MAIN COMPOSITOR
// ==========================================
export default function DeepAnalysisTab({ canvasMode, scanData, contextHub, setCanvasMode }) {
  const [exportModal, setExportModal] = useState(false);

  return (
    <div style={{ 
      position: 'fixed', top: 0, right: 0, bottom: 0, left: '72px', // Clears the standard nav bar
      opacity: canvasMode === 'analysis' ? 1 : 0, 
      pointerEvents: canvasMode === 'analysis' ? 'auto' : 'none', 
      background: '#000000', padding: '48px 64px', overflowY: 'auto', overflowX: 'hidden', 
      zIndex: 5000, transition: 'opacity 0.4s ease-in-out', fontFamily: sans
    }}>
       {exportModal && <ExportModal onClose={() => setExportModal(false)} />}
       
       <div style={{ width: '100%', maxWidth: '1800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '40px' }}>
          
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '24px' }}>
             <div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                 <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00e676', animation: 'pulseLive 2s infinite' }} />
                 <span style={{ fontSize: '11px', color: '#00e676', fontFamily: mono, textTransform: 'uppercase', letterSpacing: '1px' }}>Deep Spatial Telemetry Active</span>
               </div>
               <div style={{ fontSize: '42px', color: '#fff', fontWeight: '700', letterSpacing: '-1.5px', marginBottom: '16px' }}>{contextHub || "Macro Topology Synthesis"}</div>
               <div style={{ display: 'flex', gap: '32px' }}>
                 {[ { label: 'S2 Cell ID', val: '89c25c7' }, { label: 'Signal Dwell', val: '42m 18s' }, { label: 'Confidence', val: <LiveNumber base={96.4} format="percent"/>, c: '#00e676' }, { label: 'Live Nodes', val: <LiveNumber base={14204}/> } ].map((t, i) => (
                   <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                     <span style={{ fontSize: '9px', color: '#666', fontFamily: mono, textTransform: 'uppercase' }}>{t.label}</span>
                     <span style={{ fontSize: '14px', color: t.c || '#d4d4d8', fontFamily: mono, fontWeight: '600' }}>{t.val}</span>
                   </div>
                 ))}
               </div>
             </div>
             
             <div style={{ display: 'flex', gap: '16px' }}>
               <button onClick={() => setExportModal(true)} style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: '#e4e4e7', fontSize: '12px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }} onMouseEnter={(e)=>e.currentTarget.style.background='rgba(255,255,255,0.08)'} onMouseLeave={(e)=>e.currentTarget.style.background='rgba(255,255,255,0.03)'}>
                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Export Deep Data
               </button>
               <button onClick={() => setCanvasMode('map')} style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: '600', transition: 'background 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }} onMouseEnter={(e)=>e.currentTarget.style.background='rgba(255,255,255,0.15)'} onMouseLeave={(e)=>e.currentTarget.style.background='rgba(255,255,255,0.1)'}>
                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg> Return to Map
               </button>
             </div>
          </div>

          <div style={{ display: 'flex', gap: '48px', alignItems: 'flex-start' }}>
             
             {/* LEFT GRID: WIDGETS + INTERLEAVED AI PANELS */}
             <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                
                {/* Row 1 */}
                <MacroVolatilityChart />
                <EntityLedgerTable />
                
                {/* AI Block 1 */}
                <AIPanel 
                  title="Algorithmic Volatility Synthesis" 
                  content="The cross-referenced data between macro liquidity volatility and entity ledger transactions reveals a coordinated accumulation pattern. High-frequency algorithmic bots (identified via Hash IDs 0x8f7... and 0x9c4...) are executing micro-transactions to obfuscate aggregate volume. This behavior is symptomatic of institutional liquidity routing bypassing standard monitoring protocols. Expect continued baseline deviation over the next 4-6 hours." 
                />

                {/* Row 2 */}
                <MacroCorrelationGrid />
                <ExtendedConversionFunnel />

                {/* AI Block 2 */}
                <AIPanel 
                  title="Attrition & Friction Correlation" 
                  content="Analysis of the expanded lifecycle funnel against the macro correlation matrix isolates the primary point of failure. While top-of-funnel discovery remains robust at 12k entities, the 40% attrition rate at the 'Settlement' phase directly correlates (Pearson: -0.84) with localized physical cash scarcity. Infrastructural friction is acting as a hard cap on conversion, necessitating immediate injection of digital alternative gateways." 
                />

             </div>

             {/* RIGHT: ADVANCED FULL ANALYSIS REPORT */}
             <div style={{ width: '420px', position: 'sticky', top: '20px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ background: '#050505', border: '1px solid rgba(0, 230, 118, 0.1)', borderRadius: '8px', padding: '36px', display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 120px)', overflowY: 'auto', boxShadow: '0 10px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)' }}>
                   
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                     <div style={{ fontSize: '11px', color: '#00e676', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1.5px', fontFamily: mono }}>[ SYSTEM REPORT ]</div>
                     <div style={{ fontSize: '10px', color: '#666', fontFamily: mono }}>CONFIDENTIAL</div>
                   </div>

                   <div style={{ fontSize: '24px', color: '#fff', fontWeight: '700', letterSpacing: '-0.5px', marginBottom: '24px', lineHeight: '1.2' }}>Full Analysis Report:<br/>{contextHub}</div>
                   
                   <div style={{ color: '#d4d4d8', fontSize: '13px', lineHeight: '1.8', fontWeight: '400', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                      
                      <div>
                        <div style={{ fontSize: '10px', color: '#fff', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontFamily: mono }}>1. Macro-Level Thesis</div>
                        <p style={{ margin: 0, color: '#aaa' }}>The spatial telemetry for <strong style={{ color: '#fff' }}>{contextHub}</strong> reveals a highly concentrated liquidity vortex operating outside formal financial corridors. Unrecorded cash velocity is currently outperforming formal baselines by a mathematically verified factor of 3.2x, driven entirely by dark routing mechanisms.</p>
                      </div>

                      <div>
                        <div style={{ fontSize: '10px', color: '#fff', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px', fontFamily: mono }}>2. High-Frequency Indicators</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderLeft: '2px solid #00e5ff' }}>
                            <div style={{ fontSize: '10px', color: '#00e5ff', marginBottom: '4px', fontFamily: mono }}>Volatility Injection</div>
                            <div style={{ color: '#aaa', fontSize: '12px' }}>AI detected a +14.2% acceleration vector overriding standard diurnal decay.</div>
                          </div>
                          <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderLeft: '2px solid #ef4444' }}>
                            <div style={{ fontSize: '10px', color: '#ef4444', marginBottom: '4px', fontFamily: mono }}>Arbitrage Delta</div>
                            <div style={{ color: '#aaa', fontSize: '12px' }}>Cross-border gap holding at 4.8%, actively incentivizing rapid capital flight.</div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '10px', color: '#fff', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', fontFamily: mono }}>3. Structural Forecasting</div>
                        <p style={{ margin: 0, color: '#aaa' }}>Stochastic models indicate a <span style={{ color: '#ef4444' }}>94% probability</span> of critical liquidity drain in Sector South within 48 hours. If the current transaction skew persists, the central routing node will face an irreversible congestion state resulting in absolute supply chain failure.</p>
                      </div>

                      <div style={{ padding: '24px', background: 'linear-gradient(180deg, rgba(0, 230, 118, 0.05) 0%, transparent 100%)', border: '1px solid rgba(0, 230, 118, 0.2)', borderRadius: '6px' }}>
                        <div style={{ fontSize: '10px', color: '#00e676', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', fontFamily: mono, display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                          Strategic Imperatives
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '16px', color: '#ccc', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                           <li>Scale infrastructural nodes by 18% in Sector 4 immediately.</li>
                           <li>Deploy digital liquidity pathways to bridge the 40% settlement gap.</li>
                           <li>Implement dynamic geo-pricing to collapse the arbitrage delta.</li>
                        </ul>
                      </div>

                   </div>
                </div>
             </div>

          </div>
       </div>

       <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulseLive { 0% { opacity: 1; } 50% { opacity: 0.2; } 100% { opacity: 1; } }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
}
import React, { useState, useEffect, useRef } from 'react';

const sans = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
const mono = "'JetBrains Mono', 'Fira Code', ui-monospace, monospace";

// ==========================================
// 1. REAL-TIME UTILITIES & MICRO-COMPONENTS
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

  return <span style={{ transition: 'color 0.2s', color: 'inherit' }}>{prefix}{display}{suffix}</span>;
};

// Fully Functional Action Button for AI Panels
const SmartButton = ({ label }) => {
  const [state, setState] = useState('idle'); // idle | running | done

  const handleClick = () => {
    if (state !== 'idle') return;
    setState('running');
    setTimeout(() => setState('done'), 2500);
    setTimeout(() => setState('idle'), 6000);
  };

  return (
    <button 
      onClick={handleClick} 
      style={{ 
        padding: '8px 16px', 
        background: state === 'running' ? 'rgba(0, 230, 118, 0.1)' : state === 'done' ? 'rgba(0, 230, 118, 0.2)' : 'rgba(255,255,255,0.03)', 
        border: `1px solid ${state === 'idle' ? 'rgba(255,255,255,0.1)' : 'rgba(0, 230, 118, 0.4)'}`, 
        color: state === 'idle' ? '#ccc' : '#00e676', 
        fontSize: '10px', fontFamily: mono, cursor: state === 'idle' ? 'pointer' : 'default', 
        borderRadius: '4px', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px',
        textTransform: 'uppercase'
      }}
    >
      {state === 'running' && <div style={{ width: '10px', height: '10px', border: '1.5px solid #00e676', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />}
      {state === 'done' && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>}
      {state === 'idle' ? label : state === 'running' ? 'PROCESSING VECTOR...' : 'EXECUTION LOGGED'}
    </button>
  );
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
        const newLogs = ['Compiling spatial telemetry...', 'Decrypting Hash IDs...', 'Structuring macro correlation matrices...', 'Generating PDF Synthesis...', 'Finalizing cryptographic signature...'];
        setLogs(prev => [...prev, newLogs[Math.floor(progress / 20)] || 'Processing...']);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [progress]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ width: '500px', background: '#050505', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', boxShadow: '0 20px 50px rgba(0,0,0,0.8)', overflow: 'hidden' }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#fff', fontFamily: mono, fontSize: '11px', letterSpacing: '1px' }}>SYSTEM.DATA_EXPORT</span>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ fontFamily: mono, fontSize: '10px', color: '#888', display: 'flex', flexDirection: 'column', gap: '6px', height: '80px', overflow: 'hidden' }}>
            {logs.map((l, i) => <span key={i}>{'>'} {l}</span>)}
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '10px', color: '#aaa', fontFamily: mono }}>
              <span>{progress === 100 ? 'COMPLETE' : 'PROCESSING'}</span>
              <span style={{ color: '#fff' }}>{progress}%</span>
            </div>
            <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: '#fff', transition: 'width 0.3s ease' }} />
            </div>
          </div>
          {progress === 100 && (
            <button onClick={onClose} style={{ padding: '12px', background: '#fff', color: '#000', border: 'none', borderRadius: '4px', fontFamily: mono, fontSize: '12px', fontWeight: '700', cursor: 'pointer', marginTop: '12px' }}>
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
  <div style={{ background: '#08080a', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '8px', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', height: '100%' }}>
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {live && <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#fff', boxShadow: '0 0 8px rgba(255,255,255,0.8)', animation: 'pulseLive 1.5s infinite' }} />}
          <span style={{ color: '#888', fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: sans }}>{title}</span>
        </div>
        <span style={{ color: '#444' }}>{icon}</span>
      </div>
      <div style={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>{children}</div>
    </div>
  </div>
);

// Full-width AI Panel interleaved between widgets
const AIPanel = ({ title, content }) => (
  <div style={{ gridColumn: '1 / -1', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderLeft: '2px solid #555', borderRadius: '6px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
     <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px', color: '#fff', fontFamily: mono, textTransform: 'uppercase', letterSpacing: '1.5px' }}>
       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 22 22 22"></polygon></svg>
       {title}
     </div>
     <div style={{ color: '#aaa', fontSize: '13px', lineHeight: '1.8', fontFamily: sans }}>{content}</div>
     <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
       <SmartButton label="Run Diagnostic" />
       <SmartButton label="Trace Vectors" />
     </div>
  </div>
);

const MacroVolatilityChart = () => {
  const [candles, setCandles] = useState([]);
  const [hoverData, setHoverData] = useState(null);
  const chartRef = useRef(null);
  
  useEffect(() => {
    const gen = () => Array.from({length: 32}).reduce((acc, _, i) => {
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

  const handleMouseMove = (e) => {
    if (!chartRef.current) return;
    const rect = chartRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const index = Math.floor((x / rect.width) * candles.length);
    if (candles[index]) {
      setHoverData({ data: candles[index], x, y: e.clientY - rect.top });
    }
  };

  return (
    <InteractiveNode title="Liquidity Volatility" live={true} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 3v18h18"/><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/></svg>}>
      <div 
        ref={chartRef}
        style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '160px', position: 'relative', cursor: 'crosshair' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverData(null)}
      >
        {/* Dynamic Tooltip */}
        {hoverData && (
          <div style={{ position: 'absolute', top: '-10px', left: hoverData.x + 15, background: 'rgba(0,0,0,0.9)', border: '1px solid #333', padding: '10px', borderRadius: '6px', zIndex: 100, display: 'flex', flexDirection: 'column', gap: '6px', pointerEvents: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.5)' }}>
            <div style={{ fontSize: '9px', color: '#fff', fontFamily: mono }}>O: {(hoverData.data.open).toFixed(2)}</div>
            <div style={{ fontSize: '9px', color: '#fff', fontFamily: mono }}>H: {(hoverData.data.high).toFixed(2)}</div>
            <div style={{ fontSize: '9px', color: '#fff', fontFamily: mono }}>L: {(hoverData.data.low).toFixed(2)}</div>
            <div style={{ fontSize: '9px', color: hoverData.data.bullish ? '#00e5ff' : '#ef4444', fontFamily: mono }}>C: {(hoverData.data.close).toFixed(2)}</div>
            <div style={{ fontSize: '9px', color: '#888', fontFamily: mono, marginTop: '4px', borderTop: '1px solid #333', paddingTop: '4px' }}>VOL: {hoverData.data.vol}</div>
          </div>
        )}

        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', opacity: 0.1, zIndex: 0, pointerEvents: 'none' }}>
          {[...Array(5)].map((_,i) => <div key={i} style={{ borderBottom: '1px dashed #fff' }} />)}
        </div>

        {candles.map((c, i) => {
          const h = ((c.high - minL) / range) * 80; const l = ((c.low - minL) / range) * 80;
          const o = ((c.open - minL) / range) * 80; const cl = ((c.close - minL) / range) * 80;
          const color = c.bullish ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.3)';
          const isHovered = hoverData?.data === c;
          
          return (
            <div key={i} style={{ position: 'relative', width: '100%', height: '100%', zIndex: 1, display: 'flex', justifyContent: 'center' }}>
              {isHovered && <div style={{ position: 'absolute', top: 0, bottom: 0, width: '1px', background: 'rgba(255,255,255,0.3)' }} />}
              <div style={{ position: 'absolute', bottom: `${l}%`, height: `${h - l}%`, width: '1px', background: color, opacity: isHovered ? 1 : 0.6 }} />
              <div style={{ position: 'absolute', bottom: `${Math.min(o, cl)}%`, height: `${Math.max(1, Math.abs(o - cl))}%`, width: '4px', background: color, borderRadius: '1px', boxShadow: isHovered ? `0 0 8px ${color}` : 'none' }} />
              <div style={{ position: 'absolute', bottom: 0, height: `${(c.vol/1000) * 20}%`, width: '2px', background: color, opacity: isHovered ? 0.6 : 0.2 }} />
            </div>
          );
        })}
      </div>
    </InteractiveNode>
  );
};

const EntityLedgerTable = () => {
  const rows = [
    { id: '0x8f7...4a1b', vec: 'Inbound', vol: 14200, rc: '#fff' },
    { id: '0x2a9...9b3f', vec: 'Outbound', vol: 8400, rc: '#888' },
    { id: '0x9c4...1e2a', vec: 'Internal', vol: 42150, rc: '#ef4444' }, 
    { id: '0x4d1...8f5c', vec: 'Inbound', vol: 2100, rc: '#fff' },
    { id: '0x1a8...b22d', vec: 'Internal', vol: 9300, rc: '#888' },
    { id: '0x7e0...c99f', vec: 'Outbound', vol: 1400, rc: '#fff' }
  ];

  return (
    <InteractiveNode title="Entity Ledger" live={false} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line></svg>}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <span style={{ fontSize: '9px', color: '#555', fontFamily: mono }}>HASH ID</span><span style={{ fontSize: '9px', color: '#555', fontFamily: mono }}>VECTOR</span><span style={{ fontSize: '9px', color: '#555', fontFamily: mono, textAlign: 'right' }}>VOLUME</span>
        </div>
        {rows.map((row, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', padding: '12px 0', borderBottom: i === 5 ? 'none' : '1px dashed rgba(255,255,255,0.03)', transition: 'all 0.2s', cursor: 'pointer' }} onMouseEnter={e => {e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.paddingLeft = '8px'}} onMouseLeave={e => {e.currentTarget.style.background = 'transparent'; e.currentTarget.style.paddingLeft = '0'}}>
            <span style={{ fontSize: '11px', color: '#a1a1aa', fontFamily: mono }}>{row.id}</span>
            <span style={{ fontSize: '11px', color: '#666', fontFamily: sans }}>{row.vec}</span>
            <span style={{ fontSize: '11px', color: row.rc, fontFamily: mono, textAlign: 'right' }}><LiveNumber base={row.vol} format="currency" /></span>
          </div>
        ))}
      </div>
    </InteractiveNode>
  );
};

const MacroCorrelationGrid = () => {
  const [hoverNode, setHoverNode] = useState(null);
  const chartRef = useRef(null);
  const labels = ['Density', 'Friction', 'Volume', 'Velocity', 'Risk', 'Arbitrage'];
  
  const handleHover = (col, row, val, e) => {
    if (!chartRef.current) return;
    const rect = chartRef.current.getBoundingClientRect();
    setHoverNode({ x: labels[col], y: `Var ${row}`, val, posX: e.clientX - rect.left, posY: e.clientY - rect.top });
  };

  return (
    <InteractiveNode title="Correlation Matrix" live={false} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>}>
      <div ref={chartRef} style={{ display: 'flex', gap: '4px', height: '140px', position: 'relative' }}>
        
        {hoverNode && (
          <div style={{ position: 'absolute', top: hoverNode.posY - 40, left: hoverNode.posX + 15, background: 'rgba(0,0,0,0.9)', border: '1px solid #333', padding: '8px 12px', borderRadius: '4px', zIndex: 100, pointerEvents: 'none', display: 'flex', flexDirection: 'column', gap: '4px', boxShadow: '0 10px 20px rgba(0,0,0,0.5)' }}>
            <span style={{ fontSize: '9px', color: '#888', fontFamily: mono }}>{hoverNode.x} × {hoverNode.y}</span>
            <span style={{ fontSize: '11px', color: hoverNode.val > 0 ? '#00e676' : '#ef4444', fontFamily: mono, fontWeight: '700' }}>Pearson: {(hoverNode.val).toFixed(3)}</span>
          </div>
        )}

        {[...Array(6)].map((_, col) => (
          <div key={col} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {[...Array(5)].map((_, row) => {
              const val = (Math.random() * 2) - 1; 
              const intensity = Math.max(0.1, Math.abs(val));
              const color = `rgba(255, 255, 255, ${intensity})`; 
              return <div key={row} 
                onMouseMove={(e) => handleHover(col, row, val, e)} 
                onMouseLeave={() => setHoverNode(null)}
                style={{ flex: 1, background: color, borderRadius: '2px', cursor: 'crosshair', transition: 'transform 0.1s' }} 
                onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'} 
                onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'} 
              />
            })}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#555', fontFamily: mono, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px', marginTop: '16px' }}>
        {labels.map(l => <span key={l}>{l}</span>)}
      </div>
    </InteractiveNode>
  );
};

const ExtendedConversionFunnel = () => {
  const [hoverVal, setHoverVal] = useState(null);
  const chartRef = useRef(null);
  const stages = [ { h: '100%', l: 'DISC', v: 12000 }, { h: '75%', l: 'ENG', v: 7800 }, { h: '60%', l: 'VAL', v: 6100 }, { h: '45%', l: 'INT', v: 3600 }, { h: '38%', l: 'CHK', v: 3000 }, { h: '22%', l: 'SET', v: 1800 }, { h: '15%', l: 'RET', v: 1200 } ];
  
  const handleHover = (val, l, e) => {
    if (!chartRef.current) return;
    const rect = chartRef.current.getBoundingClientRect();
    setHoverVal({ val, l, posX: e.clientX - rect.left, posY: e.clientY - rect.top });
  };

  return (
    <InteractiveNode title="Lifecycle Funnel" live={false} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"></path></svg>}>
      <div ref={chartRef} style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '160px', position: 'relative' }}>
        
        {hoverVal && (
          <div style={{ position: 'absolute', top: hoverVal.posY - 40, left: hoverVal.posX + 15, background: 'rgba(0,0,0,0.9)', border: '1px solid #333', padding: '8px 12px', borderRadius: '4px', zIndex: 100, pointerEvents: 'none', display: 'flex', flexDirection: 'column', gap: '4px', boxShadow: '0 10px 20px rgba(0,0,0,0.5)' }}>
            <span style={{ fontSize: '9px', color: '#888', fontFamily: mono }}>Stage: {hoverVal.l}</span>
            <span style={{ fontSize: '11px', color: '#fff', fontFamily: mono, fontWeight: '700' }}>Volume: {hoverVal.val.toLocaleString()} Nodes</span>
          </div>
        )}

        {stages.map((f, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', cursor: 'crosshair', transition: 'transform 0.2s', opacity: 0.8 }} onMouseMove={(e) => handleHover(f.v, f.l, e)} onMouseEnter={e => {e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.opacity = 1; }} onMouseLeave={e => {e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.opacity = 0.8; setHoverVal(null)}}>
            <div style={{ position: 'relative', width: '2px', height: f.h, background: '#333', borderRadius: '1px' }}>
               <div style={{ position: 'absolute', top: 0, left: '-3px', width: '8px', height: '8px', borderRadius: '50%', background: '#fff', boxShadow: '0 0 12px rgba(255,255,255,0.4)' }} />
            </div>
            <span style={{ fontSize: '9px', color: '#666', fontFamily: mono }}>{f.l}</span>
          </div>
        ))}
      </div>
    </InteractiveNode>
  );
}

const ArbitrageTracker = () => (
  <InteractiveNode title="Spatial Arbitrage" live={true} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingTop: '8px' }}>
      {[ { n: 'Sector North vs Core', v: 8.2, c: '#fff' }, { n: 'East Node vs Hub', v: 4.1, c: '#fff' }, { n: 'West Periphery vs Core', v: -2.4, c: '#888' }, { n: 'South Hub vs Index', v: -0.8, c: '#888' } ].map((r, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: i === 3 ? 'none' : '1px dashed rgba(255,255,255,0.05)' }}>
          <span style={{ fontSize: '11px', color: '#aaa', fontFamily: sans }}>{r.n}</span>
          <span style={{ fontSize: '13px', color: r.c, fontFamily: mono, fontWeight: '600' }}><LiveNumber base={r.v} format="percent" prefix={r.v > 0 ? '+' : ''}/></span>
        </div>
      ))}
    </div>
  </InteractiveNode>
);

const InfraLoadCard = () => (
  <InteractiveNode title="Infrastructure Stress" live={true} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect></svg>}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingTop: '12px' }}>
      {[ { l: 'Node Alpha (Core)', v: 94, c: '#ef4444' }, { l: 'Node Beta (East)', v: 72, c: '#fff' }, { l: 'Node Gamma (West)', v: 45, c: '#666' } ].map((n, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#888', fontFamily: mono }}><span>{n.l}</span><span style={{color: n.c}}><LiveNumber base={n.v} format="percent"/></span></div>
          <div style={{ width: '100%', height: '2px', background: 'rgba(255,255,255,0.05)', borderRadius: '1px', overflow: 'hidden' }}>
            <div style={{ width: `${n.v}%`, height: '100%', background: n.c }} />
          </div>
        </div>
      ))}
    </div>
  </InteractiveNode>
);

const AnomalyFeed = () => (
  <InteractiveNode title="Anomaly Logs" live={true} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {[ { t: '14:22:01', msg: 'Sudden outflow spike > 4 Sigma', level: 'CRITICAL' }, { t: '14:18:44', msg: 'Price mismatch across adjacent cell', level: 'WARN' }, { t: '13:54:12', msg: 'Routing bottleneck at primary hub', level: 'INFO' } ].map((a, i) => (
        <div key={i} style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderLeft: `2px solid ${a.level === 'CRITICAL' ? '#ef4444' : a.level === 'WARN' ? '#fff' : '#444'}`, borderRadius: '4px' }}>
          <div style={{ fontSize: '9px', color: '#666', fontFamily: mono, marginBottom: '8px' }}>{a.t}</div>
          <div style={{ fontSize: '12px', color: '#ccc', fontFamily: sans }}>{a.msg}</div>
        </div>
      ))}
    </div>
  </InteractiveNode>
);

const CapitalFlowCard = () => (
  <InteractiveNode title="Inflow/Outflow Disparity" live={false} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingTop: '16px' }}>
      {[ { s: 'Sector N', in: 80, out: 20 }, { s: 'Sector S', in: 30, out: 90 }, { s: 'Sector E', in: 60, out: 50 } ].map((f, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '10px', color: '#888', fontFamily: mono }}>{f.s}</div>
          <div style={{ display: 'flex', height: '4px', gap: '2px' }}>
            <div style={{ width: `${f.in}%`, background: '#fff', borderRadius: '1px' }} />
            <div style={{ width: `${f.out}%`, background: '#333', borderRadius: '1px' }} />
          </div>
        </div>
      ))}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#555', fontFamily: mono, marginTop: '12px' }}>
        <span style={{ color: '#fff' }}>INFLOW</span> <span style={{ color: '#555' }}>OUTFLOW</span>
      </div>
    </div>
  </InteractiveNode>
);


// ==========================================
// 4. MAIN COMPOSITOR (FINAL LAYOUT)
// ==========================================
export default function DeepAnalysisTab({ canvasMode, scanData, contextHub, setCanvasMode }) {
  const [exportModal, setExportModal] = useState(false);

  return (
    <div style={{ 
      position: 'absolute', inset: 0, // <-- FIXED HERE
      opacity: canvasMode === 'analysis' ? 1 : 0, 
      pointerEvents: canvasMode === 'analysis' ? 'auto' : 'none', 
      background: '#050505', padding: '48px 64px', overflowY: 'auto', overflowX: 'hidden', 
      zIndex: 5000, transition: 'opacity 0.4s ease-in-out', fontFamily: sans,
      boxShadow: '-20px 0 50px rgba(0,0,0,0.9)'
    }}>
       {exportModal && <ExportModal onClose={() => setExportModal(false)} />}
       
       <div style={{ width: '100%', maxWidth: '2000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '48px' }}>
          
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '24px' }}>
             <div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                 <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00e676', animation: 'pulseLive 2s infinite', boxShadow: '0 0 10px #00e676' }} />
                 <span style={{ fontSize: '11px', color: '#00e676', fontFamily: mono, textTransform: 'uppercase', letterSpacing: '2px' }}>System Telemetry Active</span>
               </div>
               <div style={{ fontSize: '48px', color: '#fff', fontWeight: '700', letterSpacing: '-1.5px', marginBottom: '24px' }}>{contextHub || "Macro Topology Synthesis"}</div>
               <div style={{ display: 'flex', gap: '32px' }}>
                 {[ { label: 'S2 Cell ID', val: '89c25c7' }, { label: 'Signal Dwell', val: '42m 18s' }, { label: 'Confidence', val: <LiveNumber base={96.4} format="percent"/>, c: '#00e676' }, { label: 'Live Nodes', val: <LiveNumber base={14204}/> } ].map((t, i) => (
                   <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                     <span style={{ fontSize: '9px', color: '#555', fontFamily: mono, textTransform: 'uppercase', letterSpacing: '1px' }}>{t.label}</span>
                     <span style={{ fontSize: '15px', color: t.c || '#d4d4d8', fontFamily: mono, fontWeight: '600' }}>{t.val}</span>
                   </div>
                 ))}
               </div>
             </div>
             
             <div style={{ display: 'flex', gap: '16px' }}>
               <button onClick={() => setExportModal(true)} style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: '#e4e4e7', fontSize: '11px', fontFamily: mono, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }} onMouseEnter={(e)=>e.currentTarget.style.background='rgba(255,255,255,0.08)'} onMouseLeave={(e)=>e.currentTarget.style.background='rgba(255,255,255,0.03)'}>
                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Export Deep Data
               </button>
               <button onClick={() => setCanvasMode('map')} style={{ padding: '12px 20px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontSize: '11px', fontFamily: mono, transition: 'background 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }} onMouseEnter={(e)=>e.currentTarget.style.background='rgba(255,255,255,0.1)'} onMouseLeave={(e)=>e.currentTarget.style.background='transparent'}>
                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg> Return to Map
               </button>
             </div>
          </div>

          <div style={{ display: 'flex', gap: '48px', alignItems: 'flex-start' }}>
             
             {/* LEFT GRID: 8 WIDGETS + 4 INTERLEAVED AI PANELS */}
             <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
                
                {/* Block 1 */}
                <MacroVolatilityChart />
                <EntityLedgerTable />
                <AIPanel 
                  title="Algorithmic Volatility Synthesis" 
                  content="The cross-referenced data between macro liquidity volatility and entity ledger transactions reveals a highly coordinated accumulation pattern operating sub-surface. High-frequency algorithmic bots (identified via encrypted Hash IDs 0x8f7... and 0x9c4...) are actively executing staggered micro-transactions to purposefully obfuscate aggregate volume from standard monitoring nodes. This anomalous behavior is deeply symptomatic of institutional-grade liquidity routing designed to bypass conventional oversight protocols. We are observing a sustained deviation from the expected 24-hour moving average, indicating a persistent capital influx. Expect this baseline deviation to compound over the next 4 to 6 hours if intervention vectors are not deployed." 
                />

                {/* Block 2 */}
                <MacroCorrelationGrid />
                <ExtendedConversionFunnel />
                <AIPanel 
                  title="Attrition & Friction Correlation" 
                  content="Deep analysis of the expanded lifecycle funnel plotted against the macro correlation matrix successfully isolates the primary structural point of failure. While top-of-funnel spatial discovery remains highly robust at over 12,000 active entities, the devastating 40% attrition rate at the 'Settlement' phase directly correlates with localized physical cash scarcity. The Pearson coefficient of -0.84 confirms that as vendor density increases, settlement efficiency inversely collapses. This infrastructural friction is currently acting as a hard mathematical cap on conversion velocity. Immediate injection of digital alternative payment gateways is required to salvage the decaying transaction pipeline." 
                />

                {/* Block 3 */}
                <ArbitrageTracker />
                <InfraLoadCard />
                <AIPanel 
                  title="Arbitrage & Infrastructure Limits" 
                  content="Spatial arbitrage deltas are widening symmetrically in direct proportion to the infrastructure stress detected at Node Alpha, indicating forced, unnatural capital routing. The severe 8.2% premium isolated in Sector North is driving unprecedented load balancing failures across the network's peripheral pathways. As capital forcefully migrates to capture this arbitrage spread, it cascades onto secondary nodes unequipped for high-density throughput. This bottleneck is generating cascading latency spikes across the entire regional grid. Dynamic geo-fenced pricing must be implemented to collapse this arbitrage delta before systemic network failure occurs." 
                />

                {/* Block 4 */}
                <AnomalyFeed />
                <CapitalFlowCard />
                <AIPanel 
                  title="Anomaly Feed Synthesis" 
                  content="Real-time anomaly detection feeds correlate perfectly with the massive inbound and outflow disparities, effectively flagging the presence of synthetic liquidity generation. The disproportionate capital drain recorded in Sector South aligns precisely with the 'Critical' level supply bottlenecks reported at timestamp 14:22:01. Furthermore, the outflow velocity is currently outpacing localized retention by a margin of 3 to 1, signaling an organized capital flight vector. If this synthetic routing pattern is not intercepted, Sector South will reach absolute depletion within the current operational window. Recommend immediate activation of spatial liquidity dampeners." 
                />

             </div>

             {/* RIGHT: ADVANCED FULL ANALYSIS REPORT */}
             <div style={{ width: '420px', position: 'sticky', top: '20px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ background: '#030303', border: '1px solid #1a1a1a', borderRadius: '8px', padding: '40px 32px', display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}>
                   
                   <div style={{ fontSize: '11px', color: '#fff', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '2px', fontFamily: mono, marginBottom: '32px' }}>
                     [ FULL ANALYSIS REPORT ]
                   </div>

                   <div style={{ fontSize: '24px', color: '#fff', fontWeight: '600', letterSpacing: '-0.5px', marginBottom: '40px', lineHeight: '1.3' }}>
                     Macro-Topology:<br/><span style={{ color: '#888' }}>{contextHub}</span>
                   </div>
                   
                   <div style={{ color: '#aaa', fontSize: '13px', lineHeight: '1.8', fontWeight: '400', display: 'flex', flexDirection: 'column', gap: '40px' }}>
                      
                      <div>
                        <div style={{ fontSize: '10px', color: '#fff', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', fontFamily: mono }}>1. Macro-Level Thesis</div>
                        <p style={{ margin: 0 }}>The spatial telemetry for <strong style={{ color: '#fff' }}>{contextHub}</strong> reveals a highly concentrated liquidity vortex operating outside formal financial corridors. Unrecorded cash velocity is currently outperforming formal baselines by a mathematically verified factor of 3.2x, driven entirely by dark routing mechanisms and algorithmic aggregation protocols.</p>
                      </div>

                      <div>
                        <div style={{ fontSize: '10px', color: '#fff', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px', fontFamily: mono }}>2. High-Frequency Indicators</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <div style={{ paddingLeft: '12px', borderLeft: '2px solid #fff' }}>
                            <div style={{ fontSize: '10px', color: '#fff', marginBottom: '6px', fontFamily: mono }}>Volatility Injection</div>
                            <div style={{ color: '#888', fontSize: '12px' }}>AI detected a <LiveNumber base={14.2} format="percent" prefix="+"/> acceleration vector overriding standard diurnal decay models.</div>
                          </div>
                          <div style={{ paddingLeft: '12px', borderLeft: '2px solid #555' }}>
                            <div style={{ fontSize: '10px', color: '#ccc', marginBottom: '6px', fontFamily: mono }}>Arbitrage Delta</div>
                            <div style={{ color: '#888', fontSize: '12px' }}>Cross-border gap holding at <LiveNumber base={4.8} format="percent"/>, actively incentivizing rapid capital flight across adjacent geospatial cells.</div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '10px', color: '#fff', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', fontFamily: mono }}>3. Structural Forecasting</div>
                        <p style={{ margin: 0 }}>Stochastic predictive models indicate a <span style={{ color: '#fff', fontWeight: '600' }}>94% probability</span> of critical liquidity drain in Sector South within 48 hours. If the current transaction skew and volume accumulation persist, the central routing node will face an irreversible congestion state resulting in absolute localized supply chain failure.</p>
                      </div>

                      <div style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                        <div style={{ fontSize: '10px', color: '#fff', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px', fontFamily: mono, display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                          Strategic Imperatives
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '16px', color: '#888', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px' }}>
                           <li>Scale infrastructural routing nodes by 18% in Sector 4 immediately to mitigate overflow.</li>
                           <li>Deploy emergency digital liquidity pathways to bridge the 40% settlement attrition gap.</li>
                           <li>Implement dynamic geo-fenced pricing models to collapse the 4.8% arbitrage delta.</li>
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
        @keyframes spin { 100% { transform: rotate(360deg); } }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
}
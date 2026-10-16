import React, { useState, useEffect } from 'react';

const sans = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
const mono = "'JetBrains Mono', 'Fira Code', ui-monospace, monospace";

// ==========================================
// 1. HYPER-DENSE INTERACTIVE NODE (Compact for 3-Col Grid)
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
        border: `1px solid ${isHovered ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.06)'}`,
        borderRadius: '8px', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', transition: 'border 0.2s ease', height: '100%'
      }}
    >
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {live && <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#00e676', boxShadow: '0 0 8px #00e676', animation: 'pulseLive 1.5s infinite' }} />}
            <span style={{ color: '#888', fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: sans }}>{title}</span>
          </div>
          <span style={{ color: '#444' }}>{icon}</span>
        </div>
        <div style={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}>{children}</div>
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', background: isHovered ? 'rgba(255,255,255,0.02)' : 'transparent', transition: 'background 0.2s' }}>
        <button 
          onClick={() => setExpanded(!expanded)}
          style={{ width: '100%', padding: '10px 16px', background: 'transparent', border: 'none', color: '#888', fontSize: '9px', fontWeight: '600', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontFamily: sans, textTransform: 'uppercase', letterSpacing: '0.5px' }}
        >
          <span>AI Synthesis & Metadata</span>
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
              <div style={{ padding: '10px', borderLeft: '2px solid rgba(0, 230, 118, 0.5)', background: 'rgba(0, 230, 118, 0.02)' }}>
                <div style={{ color: '#aaa', fontSize: '10px', lineHeight: '1.5', fontFamily: sans }}>{aiInsight}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 2. 12x HIGH-DENSITY MACRO WIDGETS
// ==========================================

const MacroVolatilityChart = () => {
  const [candles, setCandles] = useState([]);
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
    <InteractiveNode title="Liquidity Volatility" live={true} icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 3v18h18"/><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/></svg>} aiInsight="Extreme volatility clustering correlates with unrecorded wholesale offloading." deepMetrics={[ {label: 'RSI(14)', val: '64.2'}, {label: 'MACD', val: '+0.04'}, {label: 'Skew', val: '+1.42'}, {label: 'Spread', val: '1.2%'} ]}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '140px', position: 'relative', paddingTop: '10px' }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', opacity: 0.1, zIndex: 0 }}>
          {[...Array(4)].map((_,i) => <div key={i} style={{ borderBottom: '1px dashed #fff' }} />)}
        </div>
        {candles.map((c, i) => {
          const h = ((c.high - minL) / range) * 80; const l = ((c.low - minL) / range) * 80;
          const o = ((c.open - minL) / range) * 80; const cl = ((c.close - minL) / range) * 80;
          const color = c.bullish ? '#00e5ff' : '#ef4444';
          return (
            <div key={i} style={{ position: 'relative', width: '3px', height: '100%', zIndex: 1 }}>
              <div style={{ position: 'absolute', bottom: `${l}%`, height: `${h - l}%`, width: '1px', background: color, left: '1px', opacity: 0.6 }} />
              <div style={{ position: 'absolute', bottom: `${Math.min(o, cl)}%`, height: `${Math.max(1, Math.abs(o - cl))}%`, width: '3px', background: color }} />
              <div style={{ position: 'absolute', bottom: 0, height: `${c.vol/100 * 15}%`, width: '2px', background: color, opacity: 0.3 }} />
            </div>
          );
        })}
      </div>
    </InteractiveNode>
  );
};

const EntityLedgerTable = () => (
  <InteractiveNode title="Entity Ledger" live={false} icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line></svg>} aiInsight="High frequency execution detected across Wholesale nodes. Positive skew indicates institutional-grade aggregation." deepMetrics={[ {label: 'Rows', val: '14.2k'}, {label: 'Latency', val: '42ms'}, {label: 'Mean Tx', val: '$8.4k'}, {label: 'Outliers', val: '0.4%'} ]}>
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span style={{ fontSize: '8px', color: '#666', fontFamily: mono }}>HASH ID</span><span style={{ fontSize: '8px', color: '#666', fontFamily: mono }}>VECTOR</span><span style={{ fontSize: '8px', color: '#666', fontFamily: mono, textAlign: 'right' }}>VOLUME</span>
      </div>
      {[ { id: '0x8f7...4a1b', vec: 'Inbound', vol: '$14,200', rc: '#00e676' }, { id: '0x2a9...9b3f', vec: 'Outbound', vol: '$8,400', rc: '#f59e0b' }, { id: '0x9c4...1e2a', vec: 'Internal', vol: '$42,150', rc: '#ef4444' }, { id: '0x4d1...8f5c', vec: 'Inbound', vol: '$2,100', rc: '#00e676' }, { id: '0x1a8...b22d', vec: 'Internal', vol: '$9,300', rc: '#f59e0b' } ].map((row, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', padding: '10px 0', borderBottom: i === 4 ? 'none' : '1px dashed rgba(255,255,255,0.04)' }}>
          <span style={{ fontSize: '10px', color: '#a1a1aa', fontFamily: mono }}>{row.id}</span><span style={{ fontSize: '10px', color: '#888', fontFamily: sans }}>{row.vec}</span><span style={{ fontSize: '10px', color: row.rc, fontFamily: mono, textAlign: 'right' }}>{row.vol}</span>
        </div>
      ))}
    </div>
  </InteractiveNode>
);

const LiquidityDepthChart = () => (
  <InteractiveNode title="Order Book Depth" live={true} icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>} aiInsight="Massive buy wall detected at $14k threshold, acting as structural support against formal market arbitrage." deepMetrics={[ {label: 'Bid Size', val: '$4.2M'}, {label: 'Ask Size', val: '$1.8M'}, {label: 'Imbalance', val: '2.3x'}, {label: 'Slippage', val: '0.4%'} ]}>
    <div style={{ position: 'relative', height: '140px', display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
      <svg width="100%" height="100%" viewBox="0 0 200 100" preserveAspectRatio="none">
        <path d="M0,100 L0,40 L30,45 L50,60 L70,50 L90,80 L100,100 Z" fill="rgba(0, 230, 118, 0.2)" stroke="#00e676" strokeWidth="1.5" />
        <path d="M100,100 L110,80 L130,30 L150,25 L170,15 L200,10 L200,100 Z" fill="rgba(239, 68, 68, 0.2)" stroke="#ef4444" strokeWidth="1.5" />
      </svg>
      <div style={{ position: 'absolute', top: 0, left: '50%', width: '1px', height: '100%', background: 'rgba(255,255,255,0.2)', borderLeft: '1px dashed #fff' }} />
    </div>
  </InteractiveNode>
);

const MacroCorrelationGrid = () => (
  <InteractiveNode title="Correlation Matrix" live={false} icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>} aiInsight="Negative correlation (-0.84) between Vendor Density and Logistical Efficiency." deepMetrics={[ {label: 'R-Sq', val: '0.92'}, {label: 'P-Val', val: '<0.01'}, {label: 'Cov', val: '14.2'}, {label: 'Conf', val: '98%'} ]}>
    <div style={{ display: 'flex', gap: '4px', height: '120px' }}>
      {[...Array(10)].map((_, col) => (
        <div key={col} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {[...Array(6)].map((_, row) => {
            const hot = Math.random() > 0.75;
            return <div key={row} style={{ flex: 1, background: hot ? '#00e676' : 'rgba(255,255,255,0.05)', opacity: hot ? Math.random() : 1, borderRadius: '1px' }} />
          })}
        </div>
      ))}
    </div>
  </InteractiveNode>
);

const NetworkTopology = () => {
  const [pulse, setPulse] = useState(false);
  useEffect(() => { const i = setInterval(() => setPulse(p => !p), 2000); return () => clearInterval(i); }, []);
  return (
    <InteractiveNode title="Spatial Node Network" live={true} icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>} aiInsight="Central routing node bearing 64% of total telemetry traffic, indicating high structural dependency." deepMetrics={[ {label: 'Nodes', val: '412'}, {label: 'Edges', val: '1,048'}, {label: 'Density', val: '0.14'}, {label: 'Cent.', val: '0.88'} ]}>
      <div style={{ position: 'relative', height: '140px', background: 'radial-gradient(circle at center, rgba(255,255,255,0.05) 0%, transparent 70%)' }}>
        <svg width="100%" height="100%" viewBox="0 0 100 100">
          <path d="M50,50 L20,20 M50,50 L80,30 M50,50 L70,80 M50,50 L30,70 M80,30 L70,80 M20,20 L30,70" stroke="rgba(255,255,255,0.1)" strokeWidth="1" style={{ strokeDasharray: 4, animation: 'radarSweep 10s linear infinite' }} />
          <path d="M50,50 L80,30" stroke="#00e5ff" strokeWidth="1.5" opacity={pulse ? 1 : 0.2} style={{ transition: 'opacity 1s' }} />
          <path d="M50,50 L30,70" stroke="#00e676" strokeWidth="1.5" opacity={pulse ? 0.2 : 1} style={{ transition: 'opacity 1s' }} />
          <circle cx="50" cy="50" r="5" fill="#fff" />
          <circle cx="20" cy="20" r="3" fill="#666" /><circle cx="80" cy="30" r="4" fill="#00e5ff" />
          <circle cx="70" cy="80" r="3" fill="#666" /><circle cx="30" cy="70" r="4" fill="#00e676" />
        </svg>
      </div>
    </InteractiveNode>
  );
};

const PredictiveCone = () => (
  <InteractiveNode title="Predictive Trajectory" live={false} icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 20h.01M7 20v-4M12 20v-8M17 20V8M22 4v16"></path></svg>} aiInsight="Bayesian forecasting projects a 22% volume expansion within 72 hours, expanding the cone of uncertainty." deepMetrics={[ {label: 'Forecast', val: '+22%'}, {label: 'Conf Int', val: '95%'}, {label: 'Sigma', val: '2.4'}, {label: 'Drift', val: '0.02'} ]}>
    <div style={{ position: 'relative', height: '140px', display: 'flex', alignItems: 'flex-end' }}>
      <svg width="100%" height="100%" viewBox="0 0 200 100" preserveAspectRatio="none">
        {/* Historical Line */}
        <path d="M0,80 L40,75 L80,50 L100,60" fill="none" stroke="#fff" strokeWidth="2" />
        <line x1="100" y1="0" x2="100" y2="100" stroke="rgba(255,255,255,0.2)" strokeDasharray="4" />
        {/* Cone of Uncertainty */}
        <path d="M100,60 L200,10 L200,90 Z" fill="rgba(0, 230, 118, 0.1)" />
        {/* Predictive Median Line */}
        <path d="M100,60 L200,40" fill="none" stroke="#00e676" strokeWidth="2" strokeDasharray="4" />
      </svg>
    </div>
  </InteractiveNode>
);

const ExtendedConversionFunnel = () => (
  <InteractiveNode title="Lifecycle Funnel" live={false} icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"></path></svg>} aiInsight="Strong retention up to 'Validation', but 'Settlement' experiences a sharp 40% failure rate." deepMetrics={[ {label: 'Discovery', val: '12k'}, {label: 'Intent', val: '3.6k'}, {label: 'Settlement', val: '1.8k'}, {label: 'LTV', val: '$420'} ]}>
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '140px' }}>
      {[ { h: '100%', l: 'DISC' }, { h: '75%', l: 'ENG' }, { h: '60%', l: 'VAL' }, { h: '45%', l: 'INT' }, { h: '38%', l: 'CHK' }, { h: '22%', l: 'SET', c: '#00e676' }, { h: '15%', l: 'RET', c: '#00e5ff' } ].map((f, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div style={{ position: 'relative', width: '2px', height: f.h, background: f.c || '#333', borderRadius: '1px' }}>
             <div style={{ position: 'absolute', top: 0, left: '-2px', width: '6px', height: '6px', borderRadius: '50%', background: f.c || '#444' }} />
          </div>
          <span style={{ fontSize: '8px', color: '#666', fontFamily: mono }}>{f.l}</span>
        </div>
      ))}
    </div>
  </InteractiveNode>
);

const ArbitrageTracker = () => (
  <InteractiveNode title="Spatial Arbitrage Delta" live={true} icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>} aiInsight="Price gaps between adjacent cells are widening, creating an 8.2% arbitrage opportunity for capital flight." deepMetrics={[ {label: 'Max Gap', val: '8.2%'}, {label: 'Mean Var', val: '2.1%'}, {label: 'Flight Vol', val: '$1.2M'}, {label: 'Status', val: 'Active'} ]}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '8px' }}>
      {[ { n: 'Sector North vs Core', v: '+8.2%', c: '#00e676' }, { n: 'East Node vs Hub', v: '+4.1%', c: '#00e676' }, { n: 'West Periphery vs Core', v: '-2.4%', c: '#ef4444' }, { n: 'South Hub vs Index', v: '-0.8%', c: '#f59e0b' } ].map((r, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '10px', color: '#aaa', fontFamily: sans }}>{r.n}</span>
          <div style={{ padding: '4px 8px', background: `${r.c}15`, border: `1px solid ${r.c}40`, borderRadius: '4px', fontSize: '10px', color: r.c, fontFamily: mono }}>{r.v}</div>
        </div>
      ))}
    </div>
  </InteractiveNode>
);

const InfraLoadCard = () => (
  <InteractiveNode title="Infrastructure Stress" live={true} icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>} aiInsight="Logistical throughput is failing at Node Alpha. Load is exceeding structural limits by 14%." deepMetrics={[ {label: 'Max Load', val: '94%'}, {label: 'Q-Depth', val: '412'}, {label: 'Drop Rate', val: '2.4%'}, {label: 'Status', val: 'Critical'} ]}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '8px' }}>
      {[ { l: 'Node Alpha (Core)', v: 94, c: '#ef4444' }, { l: 'Node Beta (East)', v: 72, c: '#f59e0b' }, { l: 'Node Gamma (West)', v: 45, c: '#00e676' } ].map((n, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#888', fontFamily: mono }}><span>{n.l}</span><span>{n.v}%</span></div>
          <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: `${n.v}%`, height: '100%', background: n.c, boxShadow: `0 0 8px ${n.c}` }} />
          </div>
        </div>
      ))}
    </div>
  </InteractiveNode>
);

const AnomalyFeed = () => (
  <InteractiveNode title="Anomaly Detection Feed" live={true} icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>} aiInsight="Pattern recognition flagged 3 cascading liquidity failures tracing back to a single macro-buyer." deepMetrics={[ {label: 'Anomalies', val: '3'}, {label: 'Severity', val: 'Tier 1'}, {label: 'Vector', val: 'Inbound'}, {label: 'Res.', val: 'Pending'} ]}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {[ { t: '14:22:01', msg: 'Sudden outflow spike > 4 Sigma', level: 'CRITICAL' }, { t: '14:18:44', msg: 'Price mismatch across adjacent cell', level: 'WARN' }, { t: '13:54:12', msg: 'Routing bottleneck at primary hub', level: 'INFO' } ].map((a, i) => (
        <div key={i} style={{ padding: '8px', background: 'rgba(255,255,255,0.02)', borderLeft: `2px solid ${a.level === 'CRITICAL' ? '#ef4444' : a.level === 'WARN' ? '#f59e0b' : '#00e5ff'}`, borderRadius: '4px' }}>
          <div style={{ fontSize: '8px', color: '#666', fontFamily: mono, marginBottom: '4px' }}>{a.t}</div>
          <div style={{ fontSize: '10px', color: '#ccc', fontFamily: sans }}>{a.msg}</div>
        </div>
      ))}
    </div>
  </InteractiveNode>
);

const CapitalFlowCard = () => (
  <InteractiveNode title="Inflow/Outflow Disparity" live={false} icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>} aiInsight="Inflow dominance in Sector North suggests localized hoarding, while South is draining liquidity." deepMetrics={[ {label: 'Net Flow', val: '+$1.4M'}, {label: 'Velocity', val: 'High'}, {label: 'Retent.', val: '84%'}, {label: 'Drain', val: 'Sector S'} ]}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '10px' }}>
      {[ { s: 'Sector N', in: 80, out: 20 }, { s: 'Sector S', in: 30, out: 90 }, { s: 'Sector E', in: 60, out: 50 } ].map((f, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ fontSize: '9px', color: '#888', fontFamily: mono }}>{f.s}</div>
          <div style={{ display: 'flex', height: '6px', gap: '2px' }}>
            <div style={{ width: `${f.in}%`, background: '#00e676', borderRadius: '1px' }} />
            <div style={{ width: `${f.out}%`, background: '#ef4444', borderRadius: '1px' }} />
          </div>
        </div>
      ))}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: '#555', fontFamily: mono, marginTop: '4px' }}>
        <span style={{ color: '#00e676' }}>INFLOW</span> <span style={{ color: '#ef4444' }}>OUTFLOW</span>
      </div>
    </div>
  </InteractiveNode>
);

const InstitutionalSentiment = () => (
  <InteractiveNode title="Market Sentiment Index" live={true} icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>} aiInsight="Institutional sentiment remains heavily bullish, contrary to retail panic, indicating potential accumulation." deepMetrics={[ {label: 'Index Score', val: '78/100'}, {label: 'Inst. Bias', val: 'Bullish'}, {label: 'Retail Bias', val: 'Bearish'}, {label: 'Trend', val: 'Diverging'} ]}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '140px', position: 'relative' }}>
      <svg viewBox="0 0 100 100" width="120" height="120">
        <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
        <circle cx="50" cy="50" r="40" fill="none" stroke="#00e676" strokeWidth="8" strokeDasharray="251" strokeDashoffset="55" strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s' }} />
        <circle cx="50" cy="50" r="28" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
        <circle cx="50" cy="50" r="28" fill="none" stroke="#00e5ff" strokeWidth="6" strokeDasharray="175" strokeDashoffset="90" strokeLinecap="round" />
      </svg>
      <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <span style={{ fontSize: '24px', fontWeight: '700', color: '#fff', fontFamily: mono }}>78</span>
        <span style={{ fontSize: '8px', color: '#00e676', letterSpacing: '1px' }}>BULLISH</span>
      </div>
    </div>
  </InteractiveNode>
);


const WidgetRegistry = {
  MacroVolatility: MacroVolatilityChart,
  LiquidityDepth: LiquidityDepthChart,
  EntityLedger: EntityLedgerTable,
  PredictiveCone: PredictiveCone,
  NetworkTopology: NetworkTopology,
  MacroCorrelation: MacroCorrelationGrid,
  CapitalFlow: CapitalFlowCard,
  ExtendedFunnel: ExtendedConversionFunnel,
  ArbitrageTracker: ArbitrageTracker,
  InfraLoad: InfraLoadCard,
  AnomalyFeed: AnomalyFeed,
  SentimentIndex: InstitutionalSentiment
};

// ==========================================
// 3. MAIN COMPOSITOR (ULTRA-WIDE)
// ==========================================
export default function DeepAnalysisTab({ canvasMode, scanData, contextHub, setCanvasMode }) {
  
  // Renders all 12 widgets for maximum data density
  const activeWidgets = Object.keys(WidgetRegistry);

  return (
    <div style={{ 
      position: 'absolute', inset: 0, 
      opacity: canvasMode === 'analysis' ? 1 : 0, 
      pointerEvents: canvasMode === 'analysis' ? 'auto' : 'none', 
      background: '#000000', 
      padding: '48px 64px', 
      overflowY: 'auto', overflowX: 'hidden', zIndex: 100, 
      transition: 'opacity 0.4s ease-in-out',
      fontFamily: sans
    }}>
       {/* 100% Width to consume ultra-wide monitors completely */}
       <div style={{ width: '100%', maxWidth: '2400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '40px' }}>
          
          {/* Header Section */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '24px' }}>
             <div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                 <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00e676', animation: 'pulseLive 2s infinite' }} />
                 <span style={{ fontSize: '11px', color: '#00e676', fontFamily: mono, textTransform: 'uppercase', letterSpacing: '1px' }}>Deep Spatial Telemetry Active</span>
               </div>
               <div style={{ fontSize: '42px', color: '#fff', fontWeight: '700', letterSpacing: '-1.5px', marginBottom: '16px' }}>{contextHub || "Macro Topology Synthesis"}</div>
               
               <div style={{ display: 'flex', gap: '32px' }}>
                 {[ { label: 'S2 Cell ID', val: '89c25c7' }, { label: 'Signal Dwell', val: '42m 18s' }, { label: 'Confidence', val: '96.4%', c: '#00e676' }, { label: 'Live Nodes', val: '14,204' } ].map((t, i) => (
                   <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                     <span style={{ fontSize: '9px', color: '#666', fontFamily: mono, textTransform: 'uppercase', letterSpacing: '1px' }}>{t.label}</span>
                     <span style={{ fontSize: '14px', color: t.c || '#d4d4d8', fontFamily: mono, fontWeight: '600' }}>{t.val}</span>
                   </div>
                 ))}
               </div>
             </div>
             
             <div style={{ display: 'flex', gap: '16px' }}>
               <button style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: '#e4e4e7', fontSize: '12px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Export Deep Data
               </button>
               <button onClick={() => setCanvasMode('map')} style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                 Close Analysis
               </button>
             </div>
          </div>

          {/* MASSIVE SPLIT: 1fr (Widgets) | 500px (Text Report) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 500px', gap: '48px' }}>
             
             {/* LEFT: 3-Column Dense Widget Grid (12 Widgets) */}
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', alignContent: 'start' }}>
                {activeWidgets.map((widgetName, index) => {
                  const WidgetComponent = WidgetRegistry[widgetName];
                  if (!WidgetComponent) return null;
                  return (
                    <div key={`${widgetName}-${index}`} style={{ animation: `fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.05}s backwards` }}>
                      <WidgetComponent />
                    </div>
                  );
                })}
             </div>

             {/* RIGHT: Comprehensive Analysis Report */}
             <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: `fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.2s backwards` }}>
                <div style={{ background: '#050505', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '8px', padding: '36px', display: 'flex', flexDirection: 'column' }}>
                   <div style={{ fontSize: '12px', color: '#888', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> 
                     Comprehensive Spatial & Financial Analysis Report
                   </div>
                   
                   <div style={{ color: '#d4d4d8', fontSize: '13px', lineHeight: '1.8', fontWeight: '400', display: 'flex', flexDirection: 'column', gap: '28px' }}>
                      
                      {/* Section 1 */}
                      <div>
                        <div style={{ fontSize: '11px', color: '#fff', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>1. Macro-Level Overview & Thesis</div>
                        <p style={{ margin: 0, color: '#aaa' }}>The spatial telemetry for <strong style={{ color: '#fff' }}>{contextHub}</strong> reveals a highly concentrated liquidity vortex operating outside formal financial corridors. Unrecorded cash velocity is currently outperforming formal sector baselines by a factor of 3.2x, driven primarily by dark cash routing and algorithmic wholesale aggregation. This indicates a deeply entrenched shadow economy infrastructure that is highly resilient to standard economic dampening.</p>
                      </div>

                      {/* Section 2 */}
                      <div>
                        <div style={{ fontSize: '11px', color: '#fff', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>2. Key Telemetry Indicators</div>
                        <ul style={{ paddingLeft: '16px', margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', color: '#aaa' }}>
                          <li><strong style={{ color: '#d4d4d8' }}>Volatility & Accumulation:</strong> Secondary analysis algorithms detected a <span style={{ color: '#00e676', fontFamily: mono }}>+14.2%</span> acceleration vector in macro liquidity between 14:00 and 16:00, overriding diurnal decay.</li>
                          <li><strong style={{ color: '#d4d4d8' }}>Logistical Attrition:</strong> Infrastructure stress at Node Alpha has resulted in an 8.4% YoY drop in routing efficiency, creating localized supply bottlenecks.</li>
                          <li><strong style={{ color: '#d4d4d8' }}>Cross-Border Arbitrage:</strong> The delta between adjacent geospatial cells is holding at a <span style={{ color: '#00e5ff', fontFamily: mono }}>4.8% premium</span>, actively incentivizing capital flight from the core.</li>
                        </ul>
                      </div>

                      {/* Section 3 */}
                      <div>
                        <div style={{ fontSize: '11px', color: '#fff', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>3. Structural Risk Matrix</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                           <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)', borderRadius: '6px' }}>
                             <div style={{ fontSize: '9px', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: mono, marginBottom: '6px' }}>Primary Risk Vector</div>
                             <div style={{ fontSize: '12px', color: '#fff', marginBottom: '4px' }}>Supply Bottleneck (North)</div>
                             <div style={{ fontSize: '11px', color: '#aaa', lineHeight: '1.4' }}>Physical capacity exceeded by 14%. Imminent routing failure.</div>
                           </div>
                           <div style={{ padding: '16px', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.1)', borderRadius: '6px' }}>
                             <div style={{ fontSize: '9px', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: mono, marginBottom: '6px' }}>Secondary Friction</div>
                             <div style={{ fontSize: '12px', color: '#fff', marginBottom: '4px' }}>Settlement Attrition</div>
                             <div style={{ fontSize: '11px', color: '#aaa', lineHeight: '1.4' }}>40% cart abandonment due to localized physical cash shortages.</div>
                           </div>
                        </div>
                      </div>
                      
                      {/* Section 4 */}
                      <div style={{ padding: '24px', background: 'rgba(0, 230, 118, 0.03)', borderLeft: '2px solid #00e676', borderRadius: '4px' }}>
                        <div style={{ fontSize: '10px', color: '#00e676', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', fontFamily: mono }}>Automated Strategic Imperative</div>
                        <div style={{ fontSize: '13px', color: '#ccc', lineHeight: '1.6' }}>
                          Immediate spatial reconfiguration is mandatory to prevent cascade failure. 
                          <br/><br/>
                          <strong>Directive A:</strong> Scale infrastructural nodes by 18% in Sector 4 to absorb excess liquidity overflow. <br/>
                          <strong>Directive B:</strong> Inject digital liquidity pathways to bridge the 40% settlement attrition gap. <br/>
                          <strong>Directive C:</strong> Implement geo-fenced dynamic pricing to collapse the 4.8% arbitrage delta and retain capital.
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
        @keyframes radarSweep { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
}
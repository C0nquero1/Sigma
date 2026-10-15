import React, { useState, useEffect } from 'react';

const sans = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
const mono = "'JetBrains Mono', 'Fira Code', ui-monospace, monospace";

// ==========================================
// 1. HIGH-DENSITY INTERACTIVE NODE
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
        borderRadius: '8px',
        display: 'flex', flexDirection: 'column',
        position: 'relative', overflow: 'hidden',
        transition: 'border 0.2s ease'
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
          <span>Data Breakdown & AI Synthesis</span>
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
// 2. ULTRA-MINIMALIST WIDGETS
// ==========================================

const generateSmoothCurve = (points, width, height, volatility) => {
  let pts = [{ x: 0, y: height / 2 }];
  const step = width / (points - 1);
  for (let i = 1; i < points; i++) {
    let newY = pts[i - 1].y + (Math.random() - 0.5) * volatility;
    newY = Math.max(2, Math.min(height - 2, newY));
    pts.push({ x: i * step, y: newY });
  }
  let path = `M ${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const xMid = (pts[i].x + pts[i + 1].x) / 2;
    const yMid = (pts[i].y + pts[i + 1].y) / 2;
    path += ` Q ${(xMid + pts[i].x) / 2},${pts[i].y} ${xMid},${yMid} T ${pts[i + 1].x},${pts[i + 1].y}`;
  }
  return { path, lastPoint: pts[pts.length - 1] };
};

const VelocitySparklineCard = ({ displayVolume, formatCurrency }) => {
  const [curve, setCurve] = useState({ path: '', lastPoint: { x: 0, y: 0 } });
  useEffect(() => {
    setCurve(generateSmoothCurve(20, 140, 30, 8));
    const int = setInterval(() => setCurve(generateSmoothCurve(20, 140, 30, 8)), 2000);
    return () => clearInterval(int);
  }, []);

  return (
    <InteractiveNode 
      title="Capital Velocity" live={true} 
      icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>}
      aiInsight="Liquidity mapping detects a sustained +14.2% spike above the 24-hour moving average. Capital inflow resists standard diurnal drop-offs."
      deepMetrics={[ { label: 'Peak Tx', val: '1,442/s' }, { label: 'Block Avg', val: '$4.2k' }, { label: 'Delta', val: '+4.8%' }, { label: 'Drain', val: '-1.2%' } ]}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ color: '#fff', fontSize: '20px', fontWeight: '500', fontFamily: mono, letterSpacing: '-0.5px' }}>
            {formatCurrency(displayVolume)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
             <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#00e676" strokeWidth="3"><polyline points="18 15 12 9 6 15"></polyline></svg>
             <span style={{ color: '#00e676', fontSize: '10px', fontWeight: '500', fontFamily: mono }}>14.2%</span>
             <span style={{ color: '#666', fontSize: '9px' }}>/ trailing hr</span>
          </div>
        </div>
        <div style={{ position: 'relative', width: '140px', height: '30px' }}>
          <svg width="100%" height="100%" viewBox="0 0 140 30" style={{ overflow: 'visible' }}>
            <path d={curve.path} fill="none" stroke="#00e676" strokeWidth="1" strokeLinejoin="round" style={{ transition: 'd 1s linear' }} />
            <path d={`${curve.path} L 140 30 L 0 30 Z`} fill="url(#velocityGrad)" opacity="0.1" style={{ transition: 'd 1s linear' }} />
            <circle cx={curve.lastPoint.x} cy={curve.lastPoint.y} r="2" fill="#fff" style={{ transition: 'cx 1s linear, cy 1s linear' }} />
            <defs>
              <linearGradient id="velocityGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#00e676"/><stop offset="100%" stopColor="transparent"/></linearGradient>
            </defs>
          </svg>
        </div>
      </div>
    </InteractiveNode>
  );
};

const SegmentedMarketShare = () => (
  <InteractiveNode
    title="Flow Channels" live={false}
    icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>}
    aiInsight="Wholesale nodes are routing 45% of total volume, maintaining dominance over retail. Digital flows are beginning to marginalize dark cash utility."
    deepMetrics={[ { label: 'Wholesale', val: '45%' }, { label: 'Retail', val: '30%' }, { label: 'Logistics', val: '15%' }, { label: 'Dark Cash', val: '10%' } ]}
  >
    <div style={{ display: 'flex', width: '100%', height: '2px', borderRadius: '1px', overflow: 'hidden', gap: '2px', marginTop: '2px' }}>
      <div style={{ flex: 45, background: '#f59e0b' }} />
      <div style={{ flex: 30, background: '#00e676' }} />
      <div style={{ flex: 15, background: '#0ea5e9' }} />
      <div style={{ flex: 10, background: '#8b5cf6' }} />
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
      {[ { label: 'Wholesale', c: '#f59e0b' }, { label: 'Retail', c: '#00e676' }, { label: 'Logistics', c: '#0ea5e9' }, { label: 'Dark Cash', c: '#8b5cf6' } ].map(i => (
        <span key={i.label} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: '#888', fontFamily: mono }}>
          <div style={{ width:'4px', height:'4px', borderRadius:'1px', background: i.c }}/>{i.label}
        </span>
      ))}
    </div>
  </InteractiveNode>
);

const RadarSaturationCard = () => (
  <InteractiveNode 
    title="Zone Saturation Vector" live={false}
    icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon></svg>}
    aiInsight="Spatial capacity at 94% threshold. Vendor clustering out-scales local logistics, resulting in a poor friction score. Rerouting recommended."
    deepMetrics={[ { label: 'Density', val: '142/km²' }, { label: 'Friction', val: '8.4/10' }, { label: 'Capacity', val: 'Exceeded' }, { label: 'Risk', val: 'High' } ]}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
      <div style={{ position: 'relative', width: '64px', height: '64px' }}>
        <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ overflow: 'visible' }}>
          <polygon points="50,5 89,27 89,72 50,95 11,72 11,27" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
          <polygon points="50,20 76,35 76,65 50,80 24,65 24,35" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
          <polygon points="50,35 63,42 63,57 50,65 37,57 37,42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
          <line x1="50" y1="50" x2="50" y2="5" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
          <line x1="50" y1="50" x2="89" y2="72" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
          <line x1="50" y1="50" x2="11" y2="72" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
          <polygon points="50,15 80,45 60,85 40,75 20,55" fill="rgba(0, 230, 118, 0.1)" stroke="#00e676" strokeWidth="1" strokeLinejoin="round" />
        </svg>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
        {[ { l: 'Foot Traffic', v: 'HIGH', c: '#00e676' }, { l: 'Vendor Density', v: 'PEAK', c: '#f59e0b' }, { l: 'Logistics', v: 'POOR', c: '#ef4444' } ].map(s => (
          <div key={s.l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontFamily: mono }}>
            <span style={{ color: '#666' }}>{s.l}</span>
            <span style={{ color: s.c }}>{s.v}</span>
          </div>
        ))}
      </div>
    </div>
  </InteractiveNode>
);

const FrictionLogCard = () => (
  <InteractiveNode 
    title="Friction Logs" live={true}
    icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>}
    aiInsight="Multiple compounding friction events detected at sector thresholds. Anomalies correlate with recent localized supply chain tightening."
    deepMetrics={[ { label: 'Event Vol', val: '14/hr' }, { label: 'Severity', val: 'Moderate' }, { label: 'MTTR', val: '12m' }, { label: 'Impact', val: 'Low' } ]}
  >
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {[ { t: '14:22:01', e: 'Outflow anomaly', s: 'MODERATE', c: '#00e676' }, { t: '14:18:44', e: 'Supply bottleneck', s: 'PEAK', c: '#f59e0b' } ].map((log, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: i === 0 ? '8px' : '0', borderBottom: i === 0 ? '1px dashed rgba(255,255,255,0.06)' : 'none' }}>
           <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span style={{ fontSize: '9px', color: '#555', fontFamily: mono }}>{log.t}</span>
              <span style={{ fontSize: '11px', color: '#ccc', fontFamily: sans }}>{log.e}</span>
           </div>
           <span style={{ fontSize: '9px', color: log.c, fontFamily: mono }}>{log.s}</span>
        </div>
      ))}
    </div>
  </InteractiveNode>
);

const ConversionFunnelCard = () => (
  <InteractiveNode 
    title="Demographic Funnel" live={false}
    icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"></path></svg>}
    aiInsight="Top-of-funnel passing volume is robust, but the drop-off to 'Negotiating' is unusually steep (88% attrition), suggesting a product-market disconnect."
    deepMetrics={[ { label: 'Capture', val: '10%' }, { label: 'Bounce', val: '47%' }, { label: 'Dwell', val: '3m 12s' }, { label: 'Conv Val', val: '$142' } ]}
  >
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '64px' }}>
      {[ { h: '100%', l: 'PASS', v: '12k', c: '#444' }, { h: '60%', l: 'BROWSE', v: '7.8k', c: '#444' }, { h: '25%', l: 'NEGOT', v: '3.6k', c: '#444' }, { h: '12%', l: 'TRANS', v: '1.8k', c: '#00e676' } ].map((f, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '9px', color: '#ccc', fontFamily: mono }}>{f.v}</span>
          <div style={{ position: 'relative', width: '2px', height: f.h, background: f.c, borderRadius: '1px' }}>
             <div style={{ position: 'absolute', top: 0, left: '-1.5px', width: '5px', height: '5px', borderRadius: '50%', background: f.c, boxShadow: i === 3 ? `0 0 6px ${f.c}` : 'none' }} />
          </div>
          <span style={{ fontSize: '8px', color: '#666', fontFamily: mono }}>{f.l}</span>
        </div>
      ))}
    </div>
  </InteractiveNode>
);

const GhostTableLeaderboard = () => (
  <InteractiveNode 
    title="Commodities Demand" live={false}
    icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line></svg>}
    aiInsight="Primary Stock dominates standard channels. Secondary Variants display a +4.1% acceleration vector driven by recent supply chain shifts."
    deepMetrics={[ { label: 'Market Cap', val: '$1.2M' }, { label: 'Volatility', val: 'Low' }, { label: 'Dominance', val: '68%' }, { label: 'Restock', val: '14 Days' } ]}
  >
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {[ { n: 'Primary Stock', v: '84,210', t: '+12.4%' }, { n: 'Secondary Variants', v: '42,100', t: '+4.1%' }, { n: 'Tertiary Goods', v: '18,500', t: '-2.8%' } ].map((row, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i === 2 ? 'none' : '1px dashed rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: '11px', color: '#aaa', fontWeight: '500' }}>{row.n}</span>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#e4e4e7', fontFamily: mono }}>{row.v}</span>
            <span style={{ fontSize: '10px', color: row.t.includes('+') ? '#00e676' : '#ef4444', fontFamily: mono, width: '40px', textAlign: 'right' }}>{row.t}</span>
          </div>
        </div>
      ))}
    </div>
  </InteractiveNode>
);

const WidgetRegistry = {
  GiantMetric: VelocitySparklineCard,
  SegmentedMarketShare: SegmentedMarketShare,
  GhostTableLeaderboard: GhostTableLeaderboard,
  RadarSaturation: RadarSaturationCard,
  ConversionFunnel: ConversionFunnelCard,
  FrictionLogs: FrictionLogCard
};

// ==========================================
// 3. MAIN TAB COMPOSITOR & INTENT ROUTER
// ==========================================
export default function DataOverviewTab({ scanData, contextHub, activeTourNode }) {
  const financial = scanData?.financial_metrics || {};
  const totalVolume = financial.daily_volume || 0;
  const displayVolume = activeTourNode && activeTourNode.volMultiplier ? totalVolume * activeTourNode.volMultiplier : totalVolume;
  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  // RESTORED INTENT ENGINE
  const determineRelevantWidgets = (query) => {
    const q = (query || '').toLowerCase();
    let widgets = ['GiantMetric']; 
    
    if (q.includes('cashflow') || q.includes('liquidity') || q.includes('flow')) {
      widgets.push('SegmentedMarketShare', 'FrictionLogs', 'GhostTableLeaderboard', 'RadarSaturation');
    } else if (q.includes('where') || q.includes('density') || q.includes('saturation') || q.includes('seller')) {
      widgets.push('RadarSaturation', 'GhostTableLeaderboard', 'ConversionFunnel', 'SegmentedMarketShare');
    } else if (q.includes('most demanded') || q.includes('top') || q.includes('best')) {
      widgets.push('GhostTableLeaderboard', 'ConversionFunnel', 'SegmentedMarketShare', 'FrictionLogs');
    }
    
    // Safety Net: Guarantee the Rule of 7 (or 6 here) by padding with fallbacks
    const fallbackRegistry = ['SegmentedMarketShare', 'GhostTableLeaderboard', 'RadarSaturation', 'ConversionFunnel', 'FrictionLogs'];
    while (widgets.length < 6) { 
       const next = fallbackRegistry.find(w => !widgets.includes(w));
       if (next) widgets.push(next);
       else break;
    }
    return widgets;
  };

  const activeWidgets = determineRelevantWidgets(contextHub);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, background: '#000000', fontFamily: sans }}>
      
      {/* Live Mission Header */}
      {contextHub && (
        <div style={{ padding: '20px 20px 0 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
           <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#00e676', animation: 'pulseLive 2s infinite' }} />
           <span style={{ fontSize: '10px', color: '#666', fontFamily: mono, textTransform: 'uppercase', letterSpacing: '1px' }}>
             Target Locked: <span style={{ color: '#aaa' }}>{contextHub}</span>
           </span>
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 32px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        
        {/* Dynamic Data Feed */}
        {activeWidgets.map((widgetName, index) => {
          const WidgetComponent = WidgetRegistry[widgetName];
          if (!WidgetComponent) return null;
          return (
            <div key={`${widgetName}-${index}`} style={{ animation: `fadeInUp 0.4s ease-out ${index * 0.05}s backwards` }}>
              <WidgetComponent displayVolume={displayVolume} formatCurrency={formatCurrency} contextHub={contextHub} />
            </div>
          );
        })}

      </div>

      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulseLive { 0% { opacity: 1; } 50% { opacity: 0.2; } 100% { opacity: 1; } }
        
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
}
import React, { useState, useEffect } from 'react';

const sans = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
const mono = "'JetBrains Mono', 'Fira Code', ui-monospace, monospace";

// ==========================================
// 1. ADVANCED INTERACTIVE NODE WRAPPER
// ==========================================
// This wrapper handles the sleek borders, hover states, and the smooth accordion expansion for AI Overviews & Deep Breakdowns.

const InteractiveNode = ({ title, icon, live, aiInsight, deepMetrics, children }) => {
  const [expanded, setExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)} 
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: 'linear-gradient(180deg, rgba(12, 12, 14, 0.8) 0%, rgba(6, 6, 8, 0.95) 100%)',
        backdropFilter: 'blur(20px)',
        border: `1px solid ${isHovered ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.04)'}`,
        boxShadow: isHovered ? '0 8px 32px rgba(16, 185, 129, 0.05), inset 0 1px 0 rgba(255,255,255,0.05)' : '0 4px 24px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255,255,255,0.02)',
        borderRadius: '16px',
        padding: '24px',
        display: 'flex', flexDirection: 'column', gap: '20px',
        position: 'relative', overflow: 'hidden',
        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {/* Node Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {live && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 12px #10b981', animation: 'pulseLive 2s infinite' }} />}
          <span style={{ color: '#a1a1aa', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1.5px', fontFamily: sans }}>{title}</span>
        </div>
        <span style={{ color: '#52525b' }}>{icon}</span>
      </div>

      {/* Main Living Chart/Data */}
      <div>{children}</div>

      {/* Expand/Collapse Trigger */}
      <button 
        onClick={() => setExpanded(!expanded)}
        style={{
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px',
          padding: '8px 12px', color: '#e4e4e7', fontSize: '11px', fontWeight: '500', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          cursor: 'pointer', transition: 'background 0.2s', marginTop: '4px'
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
      >
        <span>Data Breakdown & AI Synthesis</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}><polyline points="6 9 12 15 18 9"></polyline></svg>
      </button>

      {/* Expanded Intelligence Section */}
      <div style={{ display: 'grid', gridTemplateRows: expanded ? '1fr' : '0fr', transition: 'grid-template-rows 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px dashed rgba(255,255,255,0.1)', marginTop: '12px' }}>
            {/* Deep Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {deepMetrics.map((m, i) => (
                <div key={i} style={{ background: 'rgba(0,0,0,0.4)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.02)' }}>
                  <div style={{ fontSize: '9px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>{m.label}</div>
                  <div style={{ fontSize: '13px', color: '#fff', fontFamily: mono, fontWeight: '500' }}>{m.val}</div>
                </div>
              ))}
            </div>
            {/* AI Generative Text Block */}
            <div style={{ background: 'rgba(16, 185, 129, 0.03)', padding: '16px', borderRadius: '8px', borderLeft: '2px solid #10b981' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                <span style={{ color: '#10b981', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: mono }}>AI Insight</span>
              </div>
              <div style={{ color: '#d4d4d8', fontSize: '12px', lineHeight: '1.6', fontWeight: '400' }}>{aiInsight}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


// ==========================================
// 2. THE LIVING WIDGETS (Radical UI Overhauls)
// ==========================================

// Curve Generator for Capital Velocity
const generateSmoothCurve = (points, width, height, volatility) => {
  let pts = [{ x: 0, y: height / 2 }];
  const step = width / (points - 1);
  for (let i = 1; i < points; i++) {
    let newY = pts[i - 1].y + (Math.random() - 0.5) * volatility;
    newY = Math.max(5, Math.min(height - 5, newY));
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
    setCurve(generateSmoothCurve(15, 180, 60, 25));
    const int = setInterval(() => setCurve(generateSmoothCurve(15, 180, 60, 25)), 2500);
    return () => clearInterval(int);
  }, []);

  return (
    <InteractiveNode 
      title="Capital Velocity" live={true} 
      icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>}
      aiInsight="High-frequency liquidity mapping detects a sustained 14.2% spike above the 24-hour moving average. Capital inflow is resisting standard diurnal drop-offs, indicating non-organic, targeted aggregation."
      deepMetrics={[ { label: 'Peak Tx/Sec', val: '1,442' }, { label: 'Avg Block Size', val: '$4,210' }, { label: 'Inbound Delta', val: '+4.8%' }, { label: 'Outbound Drain', val: '-1.2%' } ]}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div style={{ zIndex: 2 }}>
          <div style={{ color: '#fff', fontSize: '36px', fontWeight: '500', fontFamily: mono, letterSpacing: '-2px', textShadow: '0 4px 20px rgba(0,0,0,0.8)' }}>
            {formatCurrency(displayVolume)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
             <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><polyline points="18 15 12 9 6 15"></polyline></svg>
             <span style={{ color: '#10b981', fontSize: '13px', fontWeight: '600', fontFamily: mono }}>14.2%</span>
             <span style={{ color: '#71717a', fontSize: '11px' }}>/ trailing hour</span>
          </div>
        </div>
        <div style={{ position: 'relative', width: '180px', height: '60px' }}>
          <svg width="100%" height="100%" viewBox="0 0 180 60" style={{ overflow: 'visible' }}>
            <path d={curve.path} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'd 1.5s cubic-bezier(0.25, 1, 0.5, 1)', filter: 'drop-shadow(0px 6px 8px rgba(16, 185, 129, 0.4))' }} />
            <path d={`${curve.path} L 180 60 L 0 60 Z`} fill="url(#velocityGrad)" opacity="0.15" style={{ transition: 'd 1.5s cubic-bezier(0.25, 1, 0.5, 1)' }} />
            <circle cx={curve.lastPoint.x} cy={curve.lastPoint.y} r="3.5" fill="#fff" style={{ transition: 'cx 1.5s cubic-bezier(0.25, 1, 0.5, 1), cy 1.5s cubic-bezier(0.25, 1, 0.5, 1)', filter: 'drop-shadow(0 0 10px #10b981)' }} />
            <defs>
              <linearGradient id="velocityGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981"/><stop offset="100%" stopColor="transparent"/></linearGradient>
            </defs>
          </svg>
        </div>
      </div>
    </InteractiveNode>
  );
};

// Re-engineered Radar: Now features a spinning CSS scanner and glowing core
const RadarSaturationCard = () => (
  <InteractiveNode 
    title="Zone Saturation Vector" live={true}
    icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon></svg>}
    aiInsight="Spatial capacity has reached 94% threshold. Vendor clustering is out-scaling local infrastructural logistics, resulting in a 'Poor' logistics score. Immediate rerouting recommended for new deployments."
    deepMetrics={[ { label: 'Node Density', val: '142/km²' }, { label: 'Friction Index', val: '8.4/10' }, { label: 'Carry Capacity', val: 'Exceeded' }, { label: 'Risk Vector', val: 'High' } ]}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
      <div style={{ position: 'relative', width: '110px', height: '110px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {/* Animated Radar Scanner Sweep */}
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'conic-gradient(from 0deg, transparent 70%, rgba(16, 185, 129, 0.4) 100%)', animation: 'radarSweep 3s linear infinite' }} />
        {/* Grid */}
        <div style={{ position: 'absolute', width: '70%', height: '70%', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'absolute', width: '40%', height: '40%', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)' }} />
        {/* Axis */}
        <div style={{ position: 'absolute', width: '100%', height: '1px', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', height: '100%', width: '1px', background: 'rgba(255,255,255,0.05)' }} />
        {/* Live Data Mesh */}
        <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ position: 'absolute', zIndex: 2, overflow: 'visible' }}>
          <polygon points="50,15 80,45 60,85 40,75 20,55" fill="rgba(16, 185, 129, 0.15)" stroke="#10b981" strokeWidth="2" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.5))', animation: 'breathe 4s ease-in-out infinite' }} />
        </svg>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
        {[ { l: 'Foot Traffic', v: 'High', c: '#10b981' }, { l: 'Vendor Density', v: 'Peak', c: '#f59e0b' }, { l: 'Logistics', v: 'Poor', c: '#ef4444' } ].map(s => (
          <div key={s.l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ color: '#888' }}>{s.l}</span>
            <span style={{ color: s.c, fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase', textShadow: `0 0 10px ${s.c}40` }}>{s.v}</span>
          </div>
        ))}
      </div>
    </div>
  </InteractiveNode>
);

// Re-engineered Funnel: Liquid glowing flow simulation instead of static blocks
const ConversionFunnelCard = () => (
  <InteractiveNode 
    title="Demographic Funnel" live={false}
    icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"></path></svg>}
    aiInsight="Top-of-funnel passing volume is robust, but the drop-off to 'Negotiating' is unusually steep (88% attrition). This suggests a severe disconnect between display product and localized purchasing power."
    deepMetrics={[ { label: 'Total Capture', val: '10%' }, { label: 'Bounce Rate', val: '47%' }, { label: 'Dwell Time', val: '3m 12s' }, { label: 'Conv. Value', val: '$142' } ]}
  >
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '110px', marginTop: '8px' }}>
      {[ { h: '100%', l: 'Passing', v: '12k', c: 'rgba(255,255,255,0.1)' }, { h: '65%', l: 'Browsing', v: '7.8k', c: 'rgba(255,255,255,0.2)' }, { h: '30%', l: 'Negotiating', v: '3.6k', c: 'rgba(255,255,255,0.4)' }, { h: '15%', l: 'Transacting', v: '1.8k', c: '#10b981' } ].map((f, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '11px', color: '#e4e4e7', fontFamily: mono, fontWeight: '500' }}>{f.v}</span>
          {/* Liquid Flow Bar */}
          <div style={{ 
             width: '100%', height: f.h, 
             background: i === 3 ? 'linear-gradient(180deg, #10b981 0%, rgba(16,185,129,0.1) 100%)' : `linear-gradient(180deg, ${f.c} 0%, rgba(255,255,255,0.01) 100%)`, 
             borderRadius: '6px', 
             borderTop: `2px solid ${i === 3 ? '#34d399' : 'rgba(255,255,255,0.3)'}`,
             boxShadow: i === 3 ? '0 0 20px rgba(16,185,129,0.3)' : 'none',
             animation: `growUp 1s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.15}s backwards`
          }} />
          <span style={{ fontSize: '10px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{f.l}</span>
        </div>
      ))}
    </div>
  </InteractiveNode>
);

const GhostTableLeaderboard = () => (
  <InteractiveNode 
    title="Commodities Demand" live={false}
    icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>}
    aiInsight="Primary Stock dominates standard channels, but Secondary Variants are seeing a +4.1% acceleration vector driven by recent supply chain restrictions on top-tier imports."
    deepMetrics={[ { label: 'Market Cap', val: '$1.2M' }, { label: 'Volatility', val: 'Low' }, { label: 'Dominance', val: '68%' }, { label: 'Restock Est', val: '14 Days' } ]}
  >
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {[ { n: 'Primary Stock', v: '84,210', t: '+12.4%' }, { n: 'Secondary Variants', v: '42,100', t: '+4.1%' }, { n: 'Tertiary Goods', v: '18,500', t: '-2.8%' } ].map((row, i) => (
        <div key={i} className="ghost-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 12px', borderRadius: '8px', borderBottom: i === 2 ? 'none' : '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s, transform 0.2s' }}>
          <span style={{ fontSize: '13px', color: '#d4d4d8', fontWeight: '500' }}>{row.n}</span>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: '#fff', fontFamily: mono }}>{row.v}</span>
            <span style={{ fontSize: '12px', color: row.t.includes('+') ? '#10b981' : '#ef4444', fontWeight: '500', fontFamily: mono, width: '45px', textAlign: 'right' }}>{row.t}</span>
          </div>
        </div>
      ))}
    </div>
  </InteractiveNode>
);


const WidgetRegistry = {
  GiantMetric: VelocitySparklineCard,
  GhostTableLeaderboard: GhostTableLeaderboard,
  RadarSaturation: RadarSaturationCard,
  ConversionFunnel: ConversionFunnelCard
};

// ==========================================
// 3. MAIN TAB COMPOSITOR
// ==========================================
export default function DataOverviewTab({ scanData, contextHub, activeTourNode }) {
  const financial = scanData?.financial_metrics || {};
  const totalVolume = financial.daily_volume || 0;
  const displayVolume = activeTourNode && activeTourNode.volMultiplier ? totalVolume * activeTourNode.volMultiplier : totalVolume;
  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  // Intent Router determines the exact widget stack
  const activeWidgets = ['GiantMetric', 'RadarSaturation', 'ConversionFunnel', 'GhostTableLeaderboard'];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, background: '#000000', fontFamily: sans }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {activeWidgets.map((widgetName, index) => {
            const WidgetComponent = WidgetRegistry[widgetName];
            if (!WidgetComponent) return null;
            return (
              <div key={`${widgetName}-${index}`} style={{ animation: `fadeInUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.12}s backwards` }}>
                <WidgetComponent displayVolume={displayVolume} formatCurrency={formatCurrency} contextHub={contextHub} />
              </div>
            );
          })}
        </div>

      </div>

      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px) scale(0.98); filter: blur(8px); } to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); } }
        @keyframes pulseLive { 0% { opacity: 1; transform: scale(1); } 50% { opacity: 0.3; transform: scale(1.8); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes radarSweep { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes breathe { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.02); opacity: 0.8; } }
        @keyframes growUp { from { height: 0%; opacity: 0; } to { opacity: 1; } }
        
        .ghost-row:hover { background: rgba(255,255,255,0.03); transform: translateX(4px); cursor: default; }
        
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
}
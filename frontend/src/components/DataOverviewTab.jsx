import React, { useState, useEffect } from 'react';

const sans = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
const mono = "'JetBrains Mono', 'Fira Code', ui-monospace, monospace";

// ==========================================
// 1. PREMIUM UTILITIES & SHARED STYLES
// ==========================================

const baseCard = {
  background: 'linear-gradient(180deg, rgba(14, 14, 16, 0.7) 0%, rgba(8, 8, 10, 0.9) 100%)',
  backdropFilter: 'blur(16px)',
  border: '1px solid rgba(255, 255, 255, 0.05)',
  boxShadow: '0 4px 24px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.02)',
  borderRadius: '16px',
  padding: '24px',
  display: 'flex', flexDirection: 'column', gap: '20px',
  position: 'relative', overflow: 'hidden',
  transition: 'border 0.3s ease, background 0.3s ease'
};

const Header = ({ title, icon, live }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {live && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 12px #10b981', animation: 'pulseLive 2s infinite' }} />}
      <span style={{ color: '#888', fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1.5px', fontFamily: sans }}>{title}</span>
    </div>
    <span style={{ color: '#444' }}>{icon}</span>
  </div>
);

// Advanced smooth bezier curve generator for realistic financial data
const generateSmoothCurve = (points, width, height, volatility) => {
  let pts = [{ x: 0, y: height / 2 }];
  const step = width / (points - 1);
  for (let i = 1; i < points; i++) {
    let prevY = pts[i - 1].y;
    let newY = prevY + (Math.random() - 0.5) * volatility;
    newY = Math.max(5, Math.min(height - 5, newY));
    pts.push({ x: i * step, y: newY });
  }
  let path = `M ${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const xMid = (pts[i].x + pts[i + 1].x) / 2;
    const yMid = (pts[i].y + pts[i + 1].y) / 2;
    const cpX1 = (xMid + pts[i].x) / 2;
    const cpX2 = (xMid + pts[i + 1].x) / 2;
    path += ` Q ${cpX1},${pts[i].y} ${xMid},${yMid} T ${pts[i + 1].x},${pts[i + 1].y}`;
  }
  return { path, lastPoint: pts[pts.length - 1] };
};

// ==========================================
// 2. THE ATOMIC WIDGET REGISTRY
// ==========================================

const VelocitySparklineCard = ({ displayVolume, formatCurrency }) => {
  const [curve, setCurve] = useState({ path: '', lastPoint: { x: 0, y: 0 } });
  
  useEffect(() => {
    setCurve(generateSmoothCurve(12, 160, 50, 20));
    const int = setInterval(() => setCurve(generateSmoothCurve(12, 160, 50, 20)), 3500);
    return () => clearInterval(int);
  }, []);

  return (
    <div style={baseCard} onMouseEnter={e => e.currentTarget.style.border = '1px solid rgba(16, 185, 129, 0.25)'} onMouseLeave={e => e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.05)'}>
      <Header title="Capital Velocity" live={true} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div style={{ zIndex: 2 }}>
          <div style={{ color: '#fff', fontSize: '32px', fontWeight: '500', fontFamily: mono, letterSpacing: '-1.5px', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
            {formatCurrency(displayVolume)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
             <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><polyline points="18 15 12 9 6 15"></polyline></svg>
             <span style={{ color: '#10b981', fontSize: '12px', fontWeight: '500', fontFamily: mono }}>14.2%</span>
             <span style={{ color: '#666', fontSize: '11px' }}>/ trailing hour</span>
          </div>
        </div>
        <div style={{ position: 'relative', width: '160px', height: '50px' }}>
          <svg width="100%" height="100%" viewBox="0 0 160 50" style={{ overflow: 'visible' }}>
            <path d={curve.path} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'd 1.5s cubic-bezier(0.25, 1, 0.5, 1)', filter: 'drop-shadow(0px 4px 6px rgba(16, 185, 129, 0.4))' }} />
            <path d={`${curve.path} L 160 50 L 0 50 Z`} fill="url(#velocityGrad)" opacity="0.2" style={{ transition: 'd 1.5s cubic-bezier(0.25, 1, 0.5, 1)' }} />
            {/* Live pulsing dot at the edge of the graph */}
            <circle cx={curve.lastPoint.x} cy={curve.lastPoint.y} r="3" fill="#fff" style={{ transition: 'cx 1.5s cubic-bezier(0.25, 1, 0.5, 1), cy 1.5s cubic-bezier(0.25, 1, 0.5, 1)', filter: 'drop-shadow(0 0 8px #10b981)' }} />
            <defs>
              <linearGradient id="velocityGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981"/><stop offset="100%" stopColor="transparent"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
    </div>
  );
};

const SegmentedMarketShare = () => (
  <div style={baseCard}>
    <Header title="Flow Channels" icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>} />
    <div style={{ display: 'flex', width: '100%', height: '6px', borderRadius: '3px', overflow: 'hidden', gap: '3px', marginTop: '4px' }}>
      <div style={{ flex: 45, background: 'linear-gradient(90deg, #f59e0b, #fbbf24)' }} />
      <div style={{ flex: 30, background: 'linear-gradient(90deg, #10b981, #34d399)' }} />
      <div style={{ flex: 15, background: 'linear-gradient(90deg, #0ea5e9, #38bdf8)' }} />
      <div style={{ flex: 10, background: 'linear-gradient(90deg, #8b5cf6, #a78bfa)' }} />
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '12px' }}>
      {[ { label: 'Wholesale', val: '45%', c: '#f59e0b' }, { label: 'Retail', val: '30%', c: '#10b981' }, { label: 'Logistics', val: '15%', c: '#0ea5e9' }, { label: 'Dark Cash', val: '10%', c: '#8b5cf6' } ].map(i => (
        <div key={i.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#a1a1aa' }}>
            <div style={{ width:'6px', height:'6px', borderRadius:'1px', background: i.c, boxShadow: `0 0 8px ${i.c}80` }}/>{i.label}
          </span>
          <span style={{ color: '#fff', fontWeight: '500', fontFamily: mono, fontSize: '12px' }}>{i.val}</span>
        </div>
      ))}
    </div>
  </div>
);

const GhostTableLeaderboard = () => (
  <div style={{ ...baseCard, padding: '24px' }}>
    <Header title="Top Commodities Demand" icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>} />
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {[ { n: 'Primary Stock', v: '84,210', t: '+12.4%' }, { n: 'Secondary Variants', v: '42,100', t: '+4.1%' }, { n: 'Tertiary Goods', v: '18,500', t: '-2.8%' } ].map((row, i) => (
        <div key={i} className="ghost-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 10px', borderRadius: '8px', borderBottom: i === 2 ? 'none' : '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }}>
          <span style={{ fontSize: '13px', color: '#d4d4d8', fontWeight: '500' }}>{row.n}</span>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: '#fff', fontFamily: mono }}>{row.v}</span>
            <span style={{ fontSize: '12px', color: row.t.includes('+') ? '#10b981' : '#ef4444', fontWeight: '500', fontFamily: mono, width: '45px', textAlign: 'right' }}>{row.t}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const RadarSaturationCard = () => (
  <div style={baseCard}>
    <Header title="Zone Saturation Vector" icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>} />
    <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
      <div style={{ position: 'relative', width: '100px', height: '100px' }}>
        <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ overflow: 'visible' }}>
          {/* Smooth Concentric Grid Rings instead of harsh polygons */}
          <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
          <circle cx="50" cy="50" r="30" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          <circle cx="50" cy="50" r="15" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          {/* Axis Lines */}
          <line x1="50" y1="50" x2="50" y2="5" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          <line x1="50" y1="50" x2="90" y2="70" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          <line x1="50" y1="50" x2="10" y2="70" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          {/* Sleek Data Polygon */}
          <polygon points="50,15 80,45 60,85 40,75 20,55" fill="rgba(16, 185, 129, 0.15)" stroke="#10b981" strokeWidth="2" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.5))' }} />
          <circle cx="50" cy="15" r="3" fill="#fff" />
          <circle cx="80" cy="45" r="3" fill="#fff" />
          <circle cx="60" cy="85" r="3" fill="#fff" />
        </svg>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
        {[ { l: 'Foot Traffic', v: 'High', c: '#10b981' }, { l: 'Vendor Density', v: 'Peak', c: '#f59e0b' }, { l: 'Logistics', v: 'Poor', c: '#ef4444' } ].map(s => (
          <div key={s.l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ color: '#888' }}>{s.l}</span>
            <span style={{ color: s.c, fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{s.v}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const ConversionFunnelCard = () => (
  <div style={baseCard}>
    <Header title="Demographic Funnel" icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>} />
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '90px', marginTop: '8px' }}>
      {[ { h: '100%', l: 'Passing', v: '12k' }, { h: '53%', l: 'Browsing', v: '6.3k' }, { h: '13%', l: 'Negotiating', v: '1.5k' }, { h: '10%', l: 'Transacting', v: '1.2k' } ].map((f, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: '#e4e4e7', fontFamily: mono, fontWeight: '500' }}>{f.v}</span>
          <div style={{ width: '100%', height: f.h, background: i === 3 ? 'linear-gradient(180deg, #10b981 0%, rgba(16,185,129,0.1) 100%)' : 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.02) 100%)', borderRadius: '4px', borderTop: i === 3 ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.2)' }} />
          <span style={{ fontSize: '10px', color: '#777', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{f.l}</span>
        </div>
      ))}
    </div>
  </div>
);

// ==========================================
// 3. AI SYNTHESIS OVERVIEW (New Expandable Block)
// ==========================================
const AiSynthesisOverview = ({ contextHub }) => {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '16px', padding: '24px', marginTop: '8px', position: 'relative', overflow: 'hidden', transition: 'all 0.4s cubic-bezier(0.25, 1, 0.5, 1)' }}>
      {/* Subtle Glow Effect */}
      <div style={{ position: 'absolute', top: 0, left: '20%', width: '60%', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)' }} />
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '6px', background: '#fff', color: '#000' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
        </div>
        <span style={{ color: '#fff', fontSize: '14px', fontWeight: '600', letterSpacing: '-0.3px' }}>AI Overview</span>
      </div>

      <div style={{ color: '#a1a1aa', fontSize: '13px', lineHeight: '1.7', fontWeight: '400', height: expanded ? 'auto' : '65px', overflow: 'hidden', transition: 'height 0.4s ease' }}>
        The spatial analysis for <strong style={{ color: '#e4e4e7', fontWeight: '600' }}>{contextHub}</strong> reveals a highly concentrated liquidity vortex within the primary aggregator hub. Capital velocity is currently sustaining an elevated throughput of 14.2% above the trailing hourly average, primarily driven by wholesale channel influx. While vendor density implies peak market saturation, the logistical framework is demonstrating severe friction, suggesting an imminent plateau in spatial transaction volume if bottlenecking persists.
      </div>
      
      <button onClick={() => setExpanded(!expanded)} style={{ marginTop: '16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '6px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
        {expanded ? 'Collapse Analysis' : 'Expand Analysis'}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}><polyline points="6 9 12 15 18 9"></polyline></svg>
      </button>
    </div>
  );
};

const WidgetRegistry = {
  GiantMetric: VelocitySparklineCard,
  SegmentedMarketShare: SegmentedMarketShare,
  GhostTableLeaderboard: GhostTableLeaderboard,
  RadarSaturation: RadarSaturationCard,
  ConversionFunnel: ConversionFunnelCard
};

// ==========================================
// 4. MAIN COMPOSITOR COMPONENT EXPORT
// ==========================================
export default function DataOverviewTab({ scanData, contextHub, activeTourNode }) {
  const financial = scanData?.financial_metrics || {};
  const totalVolume = financial.daily_volume || 0;
  const displayVolume = activeTourNode && activeTourNode.volMultiplier ? totalVolume * activeTourNode.volMultiplier : totalVolume;
  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  const determineRelevantWidgets = (query) => {
    const q = (query || '').toLowerCase();
    let widgets = ['GiantMetric']; // Capital Velocity always first
    
    if (q.includes('cashflow') || q.includes('liquidity') || q.includes('flow')) {
      widgets.push('SegmentedMarketShare', 'GhostTableLeaderboard', 'RadarSaturation');
    } else if (q.includes('where') || q.includes('density') || q.includes('saturation') || q.includes('seller')) {
      widgets.push('RadarSaturation', 'GhostTableLeaderboard', 'ConversionFunnel', 'SegmentedMarketShare');
    } else if (q.includes('most demanded') || q.includes('top') || q.includes('best')) {
      widgets.push('GhostTableLeaderboard', 'ConversionFunnel', 'SegmentedMarketShare');
    }
    
    const fallbackRegistry = ['SegmentedMarketShare', 'GhostTableLeaderboard', 'RadarSaturation', 'ConversionFunnel'];
    while (widgets.length < 5) { 
       const next = fallbackRegistry.find(w => !widgets.includes(w));
       if (next) widgets.push(next);
       else break;
    }
    return widgets;
  };

  const activeWidgets = determineRelevantWidgets(contextHub);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, background: '#000000', fontFamily: sans }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Dynamic Data Widgets Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {activeWidgets.map((widgetName, index) => {
            const WidgetComponent = WidgetRegistry[widgetName];
            if (!WidgetComponent) return null;
            return (
              <div key={`${widgetName}-${index}`} style={{ animation: `fadeInUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.1}s backwards` }}>
                <WidgetComponent displayVolume={displayVolume} formatCurrency={formatCurrency} contextHub={contextHub} />
              </div>
            );
          })}
        </div>
        
        {/* New Generative AI Overview placed directly beneath the data feed */}
        <div style={{ animation: `fadeInUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${activeWidgets.length * 0.1}s backwards` }}>
           <AiSynthesisOverview contextHub={contextHub || "System Map"} />
        </div>

      </div>

      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); filter: blur(4px); } to { opacity: 1; transform: translateY(0); filter: blur(0); } }
        @keyframes pulseLive { 0% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(1.6); } 100% { opacity: 1; transform: scale(1); } }
        .ghost-row:hover { background: rgba(255,255,255,0.03); cursor: default; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
}
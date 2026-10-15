import React, { useState, useEffect } from 'react';

const sans = "'Inter', 'Plus Jakarta Sans', system-ui, sans-serif";
const mono = "'JetBrains Mono', 'Fira Code', monospace";

// ==========================================
// 1. HIGH-FIDELITY SHARED STYLES & ANIMATIONS
// ==========================================
const baseCard = {
  background: 'linear-gradient(145deg, rgba(18, 18, 22, 0.7) 0%, rgba(10, 10, 12, 0.9) 100%)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.04)',
  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.02), 0 8px 32px rgba(0, 0, 0, 0.4)',
  borderRadius: '12px',
  padding: '24px',
  display: 'flex', flexDirection: 'column', gap: '18px',
  position: 'relative', overflow: 'hidden',
  transition: 'border 0.3s ease, transform 0.3s ease'
};

const Header = ({ title, icon, live }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {live && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981', animation: 'pulse 2s infinite' }} />}
      <span style={{ color: '#71717a', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1.5px', fontFamily: sans }}>{title}</span>
    </div>
    <span style={{ color: '#52525b' }}>{icon}</span>
  </div>
);

// Generates realistic jagged chart data instead of a fake curve
const generateRealisticSparkline = (points, height, volatility) => {
  let path = `M 0 ${height / 2}`;
  let currentY = height / 2;
  const step = 100 / (points - 1);
  for (let i = 1; i < points; i++) {
    currentY += (Math.random() - 0.5) * volatility;
    currentY = Math.max(5, Math.min(height - 5, currentY));
    path += ` L ${i * step} ${currentY}`;
  }
  return path;
};

// ==========================================
// 2. THE ATOMIC WIDGET REGISTRY (LIVING UI)
// ==========================================

const LiveHeroBrief = ({ contextHub, activeTourNode }) => (
  <div style={{ background: 'rgba(16, 185, 129, 0.03)', border: '1px solid rgba(16, 185, 129, 0.1)', borderTop: '2px solid #10b981', padding: '20px', borderRadius: '8px', marginBottom: '8px', position: 'relative', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', top: 0, left: '-100%', width: '50%', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.05), transparent)', animation: 'shimmer 4s infinite' }} />
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
      <div style={{ fontSize: '10px', color: '#10b981', fontFamily: mono, fontWeight: '600', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Sys.Telemetry // Live</div>
    </div>
    <div style={{ fontSize: '13px', color: '#d4d4d8', fontWeight: '400', lineHeight: '1.6', fontFamily: sans }}>
      {activeTourNode ? (
        <span>Spatial parameters constrained to <strong style={{ color: '#fff', fontWeight: '600' }}>{activeTourNode.name}</strong> bounding box. Real-time metric filtering engaged.</span>
      ) : (
        <span>Aggregating high-frequency signals for <strong style={{ color: '#fff', fontWeight: '600' }}>{contextHub}</strong>. Spatial analysis indicates concentrated liquidity vortices within primary aggregator nodes.</span>
      )}
    </div>
  </div>
);

const VelocitySparklineCard = ({ displayVolume, formatCurrency }) => {
  const [path, setPath] = useState('');
  useEffect(() => {
    setPath(generateRealisticSparkline(15, 40, 15));
    const int = setInterval(() => setPath(generateRealisticSparkline(15, 40, 15)), 4000);
    return () => clearInterval(int);
  }, []);

  return (
    <div style={baseCard} onMouseEnter={e => e.currentTarget.style.border = '1px solid rgba(16, 185, 129, 0.2)'} onMouseLeave={e => e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.04)'}>
      <Header title="Capital Velocity" live={true} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ color: '#fff', fontSize: '28px', fontWeight: '600', fontFamily: mono, letterSpacing: '-1px' }}>{formatCurrency(displayVolume)}</div>
          <div style={{ color: '#10b981', fontSize: '11px', fontWeight: '600', marginTop: '6px', fontFamily: mono }}>↑ +14.2% / hr</div>
        </div>
        <div style={{ position: 'relative', width: '120px', height: '40px' }}>
          <svg width="100%" height="100%" viewBox="0 0 100 40" preserveAspectRatio="none">
            <path d={path} fill="none" stroke="#10b981" strokeWidth="2" vectorEffect="non-scaling-stroke" style={{ transition: 'd 1s cubic-bezier(0.4, 0, 0.2, 1)', filter: 'drop-shadow(0px 2px 4px rgba(16, 185, 129, 0.3))' }} />
            <path d={`${path} L 100 40 L 0 40 Z`} fill="url(#sparkGradient)" opacity="0.15" style={{ transition: 'd 1s cubic-bezier(0.4, 0, 0.2, 1)' }} />
            <defs><linearGradient id="sparkGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981"/><stop offset="100%" stopColor="transparent"/></linearGradient></defs>
          </svg>
        </div>
      </div>
    </div>
  );
};

const SegmentedMarketShare = () => (
  <div style={baseCard} onMouseEnter={e => e.currentTarget.style.border = '1px solid rgba(16, 185, 129, 0.2)'} onMouseLeave={e => e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.04)'}>
    <Header title="Flow Channels" icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>} />
    <div style={{ display: 'flex', width: '100%', height: '4px', borderRadius: '2px', overflow: 'hidden', gap: '2px', marginTop: '4px' }}>
      <div style={{ flex: 45, background: '#f59e0b' }} />
      <div style={{ flex: 30, background: '#10b981' }} />
      <div style={{ flex: 15, background: '#0ea5e9' }} />
      <div style={{ flex: 10, background: '#8b5cf6' }} />
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '8px' }}>
      {[ { label: 'Wholesale', val: '45%', c: '#f59e0b' }, { label: 'Retail', val: '30%', c: '#10b981' }, { label: 'Logistics', val: '15%', c: '#0ea5e9' }, { label: 'Dark Cash', val: '10%', c: '#8b5cf6' } ].map(i => (
        <div key={i.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#a1a1aa', fontFamily: sans }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width:'4px', height:'4px', borderRadius:'50%', background: i.c, boxShadow: `0 0 6px ${i.c}` }}/>{i.label}</span>
          <span style={{ color: '#e4e4e7', fontWeight: '500', fontFamily: mono }}>{i.val}</span>
        </div>
      ))}
    </div>
  </div>
);

const GhostTableLeaderboard = () => {
  const [hoverRow, setHoverRow] = useState(null);
  return (
    <div style={{ ...baseCard, padding: '20px 24px' }} onMouseEnter={e => e.currentTarget.style.border = '1px solid rgba(16, 185, 129, 0.2)'} onMouseLeave={e => e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.04)'}>
      <Header title="Top Commodities Demand" icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>} />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {[ { n: 'Primary Stock', v: '84,210', t: '+12.4%' }, { n: 'Secondary Variants', v: '42,100', t: '+4.1%' }, { n: 'Tertiary Goods', v: '18,500', t: '-2.8%' } ].map((row, i) => (
          <div key={i} onMouseEnter={() => setHoverRow(i)} onMouseLeave={() => setHoverRow(null)} style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 8px', borderBottom: i === 2 ? 'none' : '1px solid rgba(255,255,255,0.03)', background: hoverRow === i ? 'rgba(255,255,255,0.02)' : 'transparent', borderRadius: '6px', transition: 'background 0.2s ease', cursor: 'default' }}>
            <span style={{ fontSize: '12px', color: hoverRow === i ? '#fff' : '#a1a1aa', fontWeight: '500', transition: 'color 0.2s ease' }}>{row.n}</span>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#e4e4e7', fontFamily: mono }}>{row.v}</span>
              <span style={{ fontSize: '11px', color: row.t.includes('+') ? '#10b981' : '#ef4444', fontWeight: '500', fontFamily: mono, width: '40px', textAlign: 'right' }}>{row.t}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const RadarSaturationCard = () => (
  <div style={baseCard} onMouseEnter={e => e.currentTarget.style.border = '1px solid rgba(16, 185, 129, 0.2)'} onMouseLeave={e => e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.04)'}>
    <Header title="Zone Saturation Vector" icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>} />
    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
      <div style={{ position: 'relative', width: '90px', height: '90px' }}>
        <svg viewBox="0 0 100 100" width="100%" height="100%">
          {/* Concentric HUD Grid */}
          <polygon points="50,5 95,30 95,75 50,100 5,75 5,30" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
          <polygon points="50,20 80,38 80,68 50,85 20,68 20,38" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          <polygon points="50,35 65,45 65,60 50,70 35,60 35,45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          {/* Axis Lines */}
          <line x1="50" y1="50" x2="50" y2="5" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          <line x1="50" y1="50" x2="95" y2="75" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          <line x1="50" y1="50" x2="5" y2="75" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          {/* Live Data Polygon */}
          <polygon points="50,15 85,38 75,80 50,70 15,68 25,35" fill="rgba(16, 185, 129, 0.1)" stroke="#10b981" strokeWidth="1.5" style={{ filter: 'drop-shadow(0 0 4px rgba(16, 185, 129, 0.4))' }} />
        </svg>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
        {[ { l: 'Foot Traffic', v: 'High', c: '#10b981' }, { l: 'Vendor Density', v: 'Peak', c: '#f59e0b' }, { l: 'Logistics', v: 'Poor', c: '#ef4444' } ].map(s => (
          <div key={s.l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontFamily: sans }}>
            <span style={{ color: '#71717a' }}>{s.l}</span>
            <span style={{ color: s.c, fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{s.v}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const FrictionLogCard = () => {
  const [flicker, setFlicker] = useState(false);
  useEffect(() => { const int = setInterval(() => setFlicker(f => !f), 2500); return () => clearInterval(int); }, []);
  return (
    <div style={baseCard} onMouseEnter={e => e.currentTarget.style.border = '1px solid rgba(16, 185, 129, 0.2)'} onMouseLeave={e => e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.04)'}>
      <Header title="Friction Logs" live={true} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {[ { t: '14:22:01', e: 'Sudden outflow anomaly', s: 'Moderate' }, { t: '14:18:44', e: 'Supply chain bottleneck', s: 'Peak' } ].map((log, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '6px', borderLeft: `2px solid ${log.s === 'Peak' ? '#f59e0b' : '#10b981'}`, opacity: i === 0 && flicker ? 0.6 : 1, transition: 'opacity 0.2s ease' }}>
             <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', color: '#71717a', fontFamily: mono }}>{log.t}</span>
                <span style={{ fontSize: '11px', color: '#d4d4d8', fontWeight: '400', fontFamily: sans }}>{log.e}</span>
             </div>
             <span style={{ fontSize: '9px', color: log.s === 'Peak' ? '#f59e0b' : '#10b981', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{log.s}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const ConversionFunnelCard = () => (
  <div style={baseCard} onMouseEnter={e => e.currentTarget.style.border = '1px solid rgba(16, 185, 129, 0.2)'} onMouseLeave={e => e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.04)'}>
    <Header title="Demographic Funnel" icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>} />
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '80px', marginTop: '4px' }}>
      {[ { h: '100%', l: 'Passing', v: '12k' }, { h: '53%', l: 'Browsing', v: '6.3k' }, { h: '13%', l: 'Negotiating', v: '1.5k' }, { h: '10%', l: 'Transacting', v: '1.2k' } ].map((f, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '10px', color: '#e4e4e7', fontFamily: mono, fontWeight: '500' }}>{f.v}</span>
          <div style={{ width: '100%', height: f.h, background: i === 3 ? 'linear-gradient(180deg, #10b981 0%, rgba(16,185,129,0.2) 100%)' : 'rgba(255,255,255,0.06)', borderTopLeftRadius: '4px', borderTopRightRadius: '4px', borderTop: i === 3 ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.1)' }} />
          <span style={{ fontSize: '9px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{f.l}</span>
        </div>
      ))}
    </div>
  </div>
);

const WidgetRegistry = {
  GiantMetric: VelocitySparklineCard,
  SegmentedMarketShare: SegmentedMarketShare,
  GhostTableLeaderboard: GhostTableLeaderboard,
  RadarSaturation: RadarSaturationCard,
  FrictionLogs: FrictionLogCard,
  ConversionFunnel: ConversionFunnelCard
};

// ==========================================
// 3. MAIN COMPOSITOR COMPONENT EXPORT
// ==========================================
export default function DataOverviewTab({ scanData, contextHub, activeTourNode }) {
  const financial = scanData?.financial_metrics || {};
  const totalVolume = financial.daily_volume || 0;
  const displayVolume = activeTourNode && activeTourNode.volMultiplier ? totalVolume * activeTourNode.volMultiplier : totalVolume;
  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

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
    const fallbackRegistry = ['SegmentedMarketShare', 'GhostTableLeaderboard', 'RadarSaturation', 'FrictionLogs', 'ConversionFunnel'];
    while (widgets.length < 6) { 
       const next = fallbackRegistry.find(w => !widgets.includes(w));
       if (next) widgets.push(next);
       else break;
    }
    return widgets;
  };

  const activeWidgets = determineRelevantWidgets(contextHub);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, background: '#09090b', fontFamily: sans }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <LiveHeroBrief contextHub={contextHub} activeTourNode={activeTourNode} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {activeWidgets.map((widgetName, index) => {
            const WidgetComponent = WidgetRegistry[widgetName];
            if (!WidgetComponent) return null;
            return (
              <div key={`${widgetName}-${index}`} style={{ animation: `fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.08}s backwards` }}>
                <WidgetComponent displayVolume={displayVolume} formatCurrency={formatCurrency} contextHub={contextHub} />
              </div>
            );
          })}
        </div>
      </div>
      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.5); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes shimmer { 0% { left: -100%; } 100% { left: 200%; } }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
      `}</style>
    </div>
  );
}
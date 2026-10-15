import React, { useState, useEffect } from 'react';

const sans = "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";
const mono = "'JetBrains Mono', 'ui-monospace', monospace";

// ==========================================
// 1. SHARED STYLES & REAL-TIME ANIMATIONS
// ==========================================
const baseCard = {
  background: 'rgba(10, 12, 11, 0.6)', 
  backdropFilter: 'blur(24px)',
  border: '1px solid rgba(255,255,255,0.03)', 
  borderRadius: '16px', 
  padding: '20px',
  display: 'flex', flexDirection: 'column', gap: '16px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
  position: 'relative', overflow: 'hidden'
};

const Header = ({ title, icon, live }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {live && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00e676', animation: 'pulse 1.5s infinite' }} />}
      <span style={{ color: '#a1a1aa', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>{title}</span>
    </div>
    <span style={{ color: '#444' }}>{icon}</span>
  </div>
);

// ==========================================
// 2. THE ATOMIC WIDGET REGISTRY
// ==========================================

const LiveHeroBrief = ({ contextHub, activeTourNode }) => (
  <div style={{ background: 'linear-gradient(90deg, rgba(0, 230, 118, 0.08) 0%, rgba(0, 0, 0, 0) 100%)', borderLeft: '3px solid #00e676', padding: '16px', borderRadius: '0 12px 12px 0', marginBottom: '8px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
      <div style={{ width: '8px', height: '8px', background: '#00e676', borderRadius: '50%', boxShadow: '0 0 10px #00e676', animation: 'pulse 1s infinite' }} />
      <div style={{ fontSize: '10px', color: '#00e676', fontFamily: mono, fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>Live Uplink Active</div>
    </div>
    <div style={{ fontSize: '14px', color: '#fff', fontWeight: '500', lineHeight: '1.5' }}>
      {activeTourNode ? (
        <span>Spatial intelligence locked on <strong style={{ color: activeTourNode.color }}>{activeTourNode.name}</strong>. Filtering macro metrics for isolated geofence parameters.</span>
      ) : (
        <span>Ingesting real-time market data for <strong style={{ color: '#fff' }}>{contextHub}</strong>. Detecting high-frequency liquidity clustering in primary zones.</span>
      )}
    </div>
  </div>
);

const VelocitySparklineCard = ({ displayVolume, formatCurrency }) => (
  <div style={baseCard}>
    <Header title="Capital Velocity" live={true} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>} />
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
      <div>
        <div style={{ color: '#fff', fontSize: '24px', fontWeight: '800', fontFamily: mono, letterSpacing: '-1px' }}>{formatCurrency(displayVolume)}</div>
        <div style={{ color: '#00e676', fontSize: '11px', fontWeight: '700', marginTop: '4px' }}>↑ +14.2% trailing hour</div>
      </div>
      {/* SVG Micro-Sparkline */}
      <svg width="100" height="40" viewBox="0 0 100 40">
        <path d="M 0 30 Q 10 20 20 25 T 40 15 T 60 20 T 80 5 T 100 10" fill="none" stroke="#00e676" strokeWidth="2.5" strokeLinecap="round" style={{ filter: 'drop-shadow(0px 4px 4px rgba(0, 230, 118, 0.4))' }} />
        <path d="M 0 30 Q 10 20 20 25 T 40 15 T 60 20 T 80 5 T 100 10 L 100 40 L 0 40 Z" fill="url(#sparkGradient)" opacity="0.2" />
        <defs><linearGradient id="sparkGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#00e676"/><stop offset="100%" stopColor="transparent"/></linearGradient></defs>
      </svg>
    </div>
  </div>
);

const SegmentedMarketShare = () => (
  <div style={baseCard}>
    <Header title="Traffic & Flow Channels" icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>} />
    <div style={{ display: 'flex', width: '100%', height: '6px', borderRadius: '3px', overflow: 'hidden', gap: '2px' }}>
      <div style={{ flex: 45, background: '#facc15' }} />
      <div style={{ flex: 30, background: '#00e676' }} />
      <div style={{ flex: 15, background: '#00e5ff' }} />
      <div style={{ flex: 10, background: '#d946ef' }} />
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '4px' }}>
      {[ { label: 'Wholesale', val: '45%', c: '#facc15' }, { label: 'Retail', val: '30%', c: '#00e676' }, { label: 'Logistics', val: '15%', c: '#00e5ff' }, { label: 'Dark Cash', val: '10%', c: '#d946ef' } ].map(i => (
        <div key={i.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#a1a1aa' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width:'6px', height:'6px', borderRadius:'50%', background: i.c }}/>{i.label}</span>
          <span style={{ color: '#fff', fontWeight: '700', fontFamily: mono }}>{i.val}</span>
        </div>
      ))}
    </div>
  </div>
);

const GhostTableLeaderboard = () => (
  <div style={baseCard}>
    <Header title="Top Commodities Demand" icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>} />
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {[ { n: 'Primary Stock', v: '84,210', t: '+12%' }, { n: 'Secondary Variants', v: '42,100', t: '+4%' }, { n: 'Tertiary Goods', v: '18,500', t: '-2%' } ].map((row, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: i === 2 ? 'none' : '1px dashed rgba(255,255,255,0.08)' }}>
          <span style={{ fontSize: '12px', color: '#d4d4d8', fontWeight: '600' }}>{row.n}</span>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#fff', fontFamily: mono }}>{row.v}</span>
            <span style={{ fontSize: '10px', color: row.t.includes('+') ? '#00e676' : '#ef4444', fontWeight: '700', width: '30px', textAlign: 'right' }}>{row.t}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const RadarSaturationCard = () => (
  <div style={baseCard}>
    <Header title="Zone Saturation Vector" icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>} />
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <div style={{ position: 'relative', width: '80px', height: '80px' }}>
        {/* Mock Radar Chart SVG */}
        <svg viewBox="0 0 100 100" width="100%" height="100%">
          <polygon points="50,10 90,35 90,80 50,100 10,80 10,35" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          <polygon points="50,30 75,45 75,70 50,85 25,70 25,45" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
          <polygon points="50,20 85,45 70,85 40,75 15,40" fill="rgba(0, 230, 118, 0.15)" stroke="#00e676" strokeWidth="1.5" />
        </svg>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
        {[ { l: 'Foot Traffic', v: 'High', c: '#00e676' }, { l: 'Vendor Density', v: 'Peak', c: '#facc15' }, { l: 'Logistics', v: 'Poor', c: '#ef4444' } ].map(s => (
          <div key={s.l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
            <span style={{ color: '#888' }}>{s.l}</span>
            <span style={{ color: s.c, fontWeight: '700', textTransform: 'uppercase' }}>{s.v}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const FrictionLogCard = () => {
  const [flicker, setFlicker] = useState(false);
  useEffect(() => { const int = setInterval(() => setFlicker(f => !f), 3000); return () => clearInterval(int); }, []);
  return (
    <div style={baseCard}>
      <Header title="Live Market Friction" live={true} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {[ { t: '14:22:01', e: 'Sudden outflow anomaly', s: 'Moderate' }, { t: '14:18:44', e: 'Supply chain bottleneck', s: 'Peak' } ].map((log, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'rgba(255,255,255,0.015)', borderRadius: '6px', borderLeft: `2px solid ${log.s === 'Peak' ? '#facc15' : '#00e676'}`, opacity: i === 0 && flicker ? 0.7 : 1, transition: 'opacity 0.2s' }}>
             <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '9px', color: '#555', fontFamily: mono }}>{log.t}</span>
                <span style={{ fontSize: '10px', color: '#d4d4d8', fontWeight: '500' }}>{log.e}</span>
             </div>
             <span style={{ fontSize: '9px', color: log.s === 'Peak' ? '#facc15' : '#00e676', fontWeight: '700', textTransform: 'uppercase' }}>{log.s}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const ConversionFunnelCard = () => (
  <div style={baseCard}>
    <Header title="Demographic Funnel" icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>} />
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '60px', marginTop: '10px' }}>
      {[ { h: '100%', l: 'Passing', v: '12k' }, { h: '53%', l: 'Browsing', v: '6.3k' }, { h: '13%', l: 'Negotiating', v: '1.5k' }, { h: '10%', l: 'Transacting', v: '1.2k' } ].map((f, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '9px', color: '#fff', fontFamily: mono, fontWeight: '700' }}>{f.v}</span>
          <div style={{ width: '100%', height: f.h, background: i === 3 ? '#00e676' : 'rgba(255,255,255,0.1)', borderRadius: '2px', transition: 'height 1s ease' }} />
          <span style={{ fontSize: '8px', color: '#777', textTransform: 'uppercase' }}>{f.l}</span>
        </div>
      ))}
    </div>
  </div>
);

// We map string IDs to our sleek components
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
export default function DataOverviewTab({
  scanData,
  contextHub,
  activeTourNode
}) {
  const financial = scanData?.financial_metrics || {};
  const totalVolume = financial.daily_volume || 0;
  
  // Real-Time Cinematic Multipliers
  const displayVolume = activeTourNode && activeTourNode.volMultiplier ? totalVolume * activeTourNode.volMultiplier : totalVolume;
  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  // ----------------------------------------------------
  // THE INTENT COMPOSITOR: The "Rule of 7" Logic
  // ----------------------------------------------------
  const determineRelevantWidgets = (query) => {
    const q = (query || '').toLowerCase();
    
    // Baseline metrics everyone needs
    let widgets = ['GiantMetric']; 

    // Dynamic Context Injection based on Archetypes
    if (q.includes('cashflow') || q.includes('liquidity') || q.includes('flow')) {
      widgets.push('SegmentedMarketShare', 'FrictionLogs', 'GhostTableLeaderboard', 'RadarSaturation');
    } else if (q.includes('where') || q.includes('density') || q.includes('saturation') || q.includes('seller')) {
      widgets.push('RadarSaturation', 'GhostTableLeaderboard', 'ConversionFunnel', 'SegmentedMarketShare');
    } else if (q.includes('most demanded') || q.includes('top') || q.includes('best')) {
      widgets.push('GhostTableLeaderboard', 'ConversionFunnel', 'SegmentedMarketShare', 'FrictionLogs');
    }
    
    // Safety Net: Guarantee the Rule of 7 by padding with fallbacks if the array is short
    const fallbackRegistry = ['SegmentedMarketShare', 'GhostTableLeaderboard', 'RadarSaturation', 'FrictionLogs', 'ConversionFunnel'];
    while (widgets.length < 6) { // We have 6 total unique widgets built so far, cap to prevent duplicates
       const next = fallbackRegistry.find(w => !widgets.includes(w));
       if (next) widgets.push(next);
       else break;
    }

    return widgets;
  };

  const activeWidgets = determineRelevantWidgets(contextHub);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, background: '#010201', fontFamily: sans }}>
      
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Dynamic Mission Header replacing the old static Brief */}
        <LiveHeroBrief contextHub={contextHub} activeTourNode={activeTourNode} />

        {/* 
          THE FLUID INJECTION 
          Renders the perfectly tailored widget array in real-time.
        */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {activeWidgets.map((widgetName, index) => {
            const WidgetComponent = WidgetRegistry[widgetName];
            if (!WidgetComponent) return null;
            
            return (
              <div key={`${widgetName}-${index}`} style={{ animation: `fadeIn 0.5s ease-out ${index * 0.1}s backwards` }}>
                <WidgetComponent 
                  displayVolume={displayVolume} 
                  formatCurrency={formatCurrency} 
                  contextHub={contextHub}
                />
              </div>
            );
          })}
        </div>
        
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
      `}</style>
    </div>
  );
}
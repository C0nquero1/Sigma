import React, { useState, useEffect } from 'react';

const sans = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
const mono = "'JetBrains Mono', 'Fira Code', ui-monospace, monospace";

// ==========================================
// 1. HYPER-DENSE INTERACTIVE NODE
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
        borderRadius: '8px',
        display: 'flex', flexDirection: 'column',
        position: 'relative', overflow: 'hidden',
        transition: 'border 0.2s ease'
      }}
    >
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {live && <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#00e676', boxShadow: '0 0 8px #00e676', animation: 'pulseLive 2s infinite' }} />}
            <span style={{ color: '#888', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: sans }}>{title}</span>
          </div>
          <span style={{ color: '#444' }}>{icon}</span>
        </div>
        <div style={{ width: '100%' }}>{children}</div>
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', background: isHovered ? 'rgba(255,255,255,0.02)' : 'transparent', transition: 'background 0.2s' }}>
        <button 
          onClick={() => setExpanded(!expanded)}
          style={{
            width: '100%', padding: '12px 20px', background: 'transparent', border: 'none',
            color: '#888', fontSize: '10px', fontWeight: '500', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            cursor: 'pointer', fontFamily: sans
          }}
        >
          <span>Deep Correlation & AI Synthesis</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}><polyline points="6 9 12 15 18 9"></polyline></svg>
        </button>

        <div style={{ display: 'grid', gridTemplateRows: expanded ? '1fr' : '0fr', transition: 'grid-template-rows 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ padding: '0 20px 20px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                {deepMetrics.map((m, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ fontSize: '9px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{m.label}</div>
                    <div style={{ fontSize: '12px', color: '#d4d4d8', fontFamily: mono }}>{m.val}</div>
                  </div>
                ))}
              </div>
              <div style={{ padding: '12px 16px', borderLeft: '2px solid rgba(0, 230, 118, 0.5)', background: 'rgba(0, 230, 118, 0.02)' }}>
                <div style={{ color: '#aaa', fontSize: '12px', lineHeight: '1.6', fontFamily: sans }}>{aiInsight}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 2. DATA-RICH MACRO WIDGETS
// ==========================================

const generateCandlesticks = (count) => {
  let data = [];
  let currentPrice = 100;
  for (let i = 0; i < count; i++) {
    const open = currentPrice;
    const close = open + (Math.random() - 0.5) * 12;
    const high = Math.max(open, close) + Math.random() * 6;
    const low = Math.min(open, close) - Math.random() * 6;
    const volume = Math.random() * 100; // Added volume data
    currentPrice = close;
    data.push({ open, close, high, low, volume, bullish: close >= open });
  }
  return data;
};

const MacroVolatilityChart = () => {
  const [candles, setCandles] = useState([]);
  useEffect(() => {
    setCandles(generateCandlesticks(40));
    const int = setInterval(() => setCandles(generateCandlesticks(40)), 4000);
    return () => clearInterval(int);
  }, []);

  if (candles.length === 0) return null;
  const maxHigh = Math.max(...candles.map(c => c.high), 1);
  const minLow = Math.min(...candles.map(c => c.low), 0);
  const range = maxHigh - minLow;
  const maxVol = Math.max(...candles.map(c => c.volume), 1);

  return (
    <InteractiveNode 
      title="Macro Liquidity Volatility & Volume" live={true}
      icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 3v18h18"/><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/></svg>}
      aiInsight="Algorithmic flow analysis indicates extreme volatility clustering between 14:00 and 16:00. This pattern heavily correlates with unrecorded wholesale offloading from primary supply nodes."
      deepMetrics={[ { label: 'RSI (14)', val: '64.2' }, { label: 'MACD', val: '+0.04' }, { label: 'Bollinger', val: 'Upper Band' }, { label: 'Vol/Min', val: '4,210' }, { label: 'Skewness', val: '+1.42' }, { label: 'Kurtosis', val: '3.1' }, { label: 'VWAP', val: '$42.1k' }, { label: 'Spread', val: '1.2%' } ]}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '200px', position: 'relative' }}>
        
        {/* Dense Y-Axis Labels */}
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: '9px', color: '#555', fontFamily: mono, zIndex: 0, textAlign: 'right' }}>
          <span>${maxHigh.toFixed(1)}k</span>
          <span>${(minLow + range * 0.66).toFixed(1)}k</span>
          <span>${(minLow + range * 0.33).toFixed(1)}k</span>
          <span>${minLow.toFixed(1)}k</span>
        </div>

        {/* Grid Lines */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: '35px', bottom: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', opacity: 0.15, zIndex: 0 }}>
          <div style={{ borderBottom: '1px dashed #fff', width: '100%' }} />
          <div style={{ borderBottom: '1px dashed #fff', width: '100%' }} />
          <div style={{ borderBottom: '1px dashed #fff', width: '100%' }} />
          <div style={{ borderBottom: '1px dashed #fff', width: '100%' }} />
        </div>

        {/* Candlesticks & Volume Histogram */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '100%', zIndex: 1, paddingRight: '40px' }}>
          {candles.map((c, i) => {
            const h = ((c.high - minLow) / range) * 75; // Top 75% for candles
            const l = ((c.low - minLow) / range) * 75;
            const o = ((c.open - minLow) / range) * 75;
            const cl = ((c.close - minLow) / range) * 75;
            const volH = (c.volume / maxVol) * 20; // Bottom 20% for volume
            const color = c.bullish ? '#00e5ff' : '#ef4444';
            
            return (
              <div key={i} style={{ position: 'relative', width: '5px', height: '100%' }}>
                {/* Candle Wick */}
                <div style={{ position: 'absolute', bottom: `calc(${l}% + 25%)`, height: `${h - l}%`, width: '1px', background: color, left: '2px', opacity: 0.7 }} />
                {/* Candle Body */}
                <div style={{ position: 'absolute', bottom: `calc(${Math.min(o, cl)}% + 25%)`, height: `${Math.max(1, Math.abs(o - cl))}%`, width: '5px', background: color, borderRadius: '1px' }} />
                {/* Volume Bar */}
                <div style={{ position: 'absolute', bottom: 0, height: `${volH}%`, width: '4px', background: color, opacity: 0.3, left: '0.5px' }} />
              </div>
            );
          })}
        </div>
      </div>
    </InteractiveNode>
  );
};

const EntityLedgerTable = () => (
  <InteractiveNode 
    title="Entity Transaction Ledger" live={false}
    icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line></svg>}
    aiInsight="High frequency execution detected across Wholesale nodes. Mean transaction size is positively skewed, indicating institutional-grade aggregation within the geofence."
    deepMetrics={[ { label: 'Total Rows', val: '14,204' }, { label: 'Anomalies', val: '12' }, { label: 'Hash Int', val: '99.9%' }, { label: 'Latency', val: '42ms' }, { label: 'Mean Tx', val: '$8.4k' }, { label: 'Mode Tx', val: '$1.2k' }, { label: 'Outliers', val: '0.4%' }, { label: 'Confidence', val: 'High' } ]}
  >
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '4px' }}>
        <span style={{ fontSize: '9px', color: '#666', textTransform: 'uppercase', letterSpacing: '1px' }}>Encrypted Hash ID</span>
        <span style={{ fontSize: '9px', color: '#666', textTransform: 'uppercase', letterSpacing: '1px' }}>Vector</span>
        <span style={{ fontSize: '9px', color: '#666', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'right' }}>Capital Volume</span>
        <span style={{ fontSize: '9px', color: '#666', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'right' }}>Risk Profile</span>
      </div>
      {[ 
        { id: '0x8f73...4a1b', vec: 'Inbound', vol: '$14,200', r: 'Low', rc: '#00e676' },
        { id: '0x2a91...9b3f', vec: 'Outbound', vol: '$8,400', r: 'Med', rc: '#f59e0b' },
        { id: '0x9c44...1e2a', vec: 'Internal', vol: '$42,150', r: 'High', rc: '#ef4444' },
        { id: '0x4d12...8f5c', vec: 'Inbound', vol: '$2,100', r: 'Low', rc: '#00e676' },
        { id: '0x1a88...b22d', vec: 'Internal', vol: '$9,300', r: 'Med', rc: '#f59e0b' },
        { id: '0x7e05...c99f', vec: 'Outbound', vol: '$1,400', r: 'Low', rc: '#00e676' },
        { id: '0x3b11...a44e', vec: 'Inbound', vol: '$28,050', r: 'High', rc: '#ef4444' },
        { id: '0x5f90...d11c', vec: 'Internal', vol: '$6,200', r: 'Low', rc: '#00e676' }
      ].map((row, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', padding: '12px 0', borderBottom: i === 7 ? 'none' : '1px dashed rgba(255,255,255,0.04)' }}>
          <span style={{ fontSize: '11px', color: '#a1a1aa', fontFamily: mono }}>{row.id}</span>
          <span style={{ fontSize: '11px', color: '#888', fontFamily: sans }}>{row.vec}</span>
          <span style={{ fontSize: '11px', color: '#d4d4d8', fontFamily: mono, textAlign: 'right' }}>{row.vol}</span>
          <span style={{ fontSize: '10px', color: row.rc, fontFamily: mono, textAlign: 'right' }}>{row.r}</span>
        </div>
      ))}
    </div>
  </InteractiveNode>
);

const MacroCorrelationGrid = () => (
  <InteractiveNode 
    title="Macro Correlation Matrix" live={false}
    icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>}
    aiInsight="Strong negative correlation (-0.84) observed between Vendor Density and Logistical Efficiency. As active nodes increase, supply chain friction scales exponentially."
    deepMetrics={[ { label: 'Primary Node', val: 'S-4' }, { label: 'R-Squared', val: '0.92' }, { label: 'P-Value', val: '< 0.01' }, { label: 'Conf', val: '98%' }, { label: 'Covariance', val: '14.2' }, { label: 'Pearson-r', val: '-0.84' }, { label: 'Sample', val: '12k' }, { label: 'Outliers', val: 'Droppd' } ]}
  >
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', gap: '8px', height: '140px' }}>
         {[...Array(12)].map((_, colIdx) => (
           <div key={colIdx} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
             {[...Array(8)].map((_, rowIdx) => {
               const intensity = Math.random();
               const isHot = intensity > 0.8;
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
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#666', fontFamily: mono, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
        <span>Density</span> <span>Friction</span> <span>Volume</span> <span>Velocity</span> <span>Risk</span> <span>Arbitrage</span>
      </div>
    </div>
  </InteractiveNode>
);

const ExtendedConversionFunnel = () => (
  <InteractiveNode 
    title="Extended Lifecycle Funnel" live={false}
    icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"></path></svg>}
    aiInsight="Expanded demographic funnel reveals strong retention up to 'Validation', but 'Settlement' experiences a sharp 40% failure rate linked to lack of physical cash equivalents in the zone."
    deepMetrics={[ { label: 'Discovery', val: '12k' }, { label: 'Engagement', val: '7.8k' }, { label: 'Validation', val: '6.1k' }, { label: 'Intent', val: '3.6k' }, { label: 'Checkout', val: '3.0k' }, { label: 'Settlement', val: '1.8k' }, { label: 'Retention', val: '1.2k' }, { label: 'LTV Margin', val: '$420' } ]}
  >
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '140px' }}>
      {[ 
        { h: '100%', l: 'DISC', v: '12k', c: '#333' }, 
        { h: '75%', l: 'ENG', v: '7.8k', c: '#333' }, 
        { h: '60%', l: 'VAL', v: '6.1k', c: '#333' }, 
        { h: '45%', l: 'INT', v: '3.6k', c: '#333' }, 
        { h: '38%', l: 'CHK', v: '3.0k', c: '#333' },
        { h: '22%', l: 'SETL', v: '1.8k', c: '#00e676' },
        { h: '15%', l: 'RET', v: '1.2k', c: '#00e5ff' }
      ].map((f, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '10px', color: '#aaa', fontFamily: mono }}>{f.v}</span>
          <div style={{ position: 'relative', width: '2px', height: f.h, background: f.c, borderRadius: '1px' }}>
             <div style={{ position: 'absolute', top: 0, left: '-1.5px', width: '5px', height: '5px', borderRadius: '50%', background: f.c, boxShadow: i >= 5 ? `0 0 10px ${f.c}` : 'none' }} />
          </div>
          <span style={{ fontSize: '9px', color: '#666', fontFamily: mono }}>{f.l}</span>
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
// 3. MAIN TAB COMPOSITOR
// ==========================================
export default function DeepAnalysisTab({ canvasMode, scanData, contextHub, setCanvasMode }) {
  
  const determineRelevantWidgets = (query) => {
    const q = (query || '').toLowerCase();
    let widgets = ['MacroVolatility']; 
    if (q.includes('cashflow') || q.includes('liquidity') || q.includes('flow')) {
      widgets.push('EntityLedger', 'MacroCorrelation', 'ExtendedFunnel');
    } else if (q.includes('where') || q.includes('density') || q.includes('saturation')) {
      widgets.push('MacroCorrelation', 'ExtendedFunnel', 'EntityLedger');
    } else {
      widgets.push('ExtendedFunnel', 'EntityLedger', 'MacroCorrelation');
    }
    return widgets;
  };

  const activeWidgets = determineRelevantWidgets(contextHub);
  
  const execSummary = scanData?.deep_analysis?.overview_executive_summary || "The spatial analysis indicates a highly concentrated liquidity vortex within the primary aggregator hub. Unrecorded cash velocity is currently outperforming formal sector baselines by a factor of 3.2x in this specific geolocation. Friction variables remain stable, though logistical bottlenecks at wholesale checkpoints show a 12% increase in delay-related capital depreciation over the trailing 72 hours.";

  return (
    <div style={{ 
      position: 'absolute', inset: 0, 
      opacity: canvasMode === 'analysis' ? 1 : 0, 
      pointerEvents: canvasMode === 'analysis' ? 'auto' : 'none', 
      background: '#020202', 
      padding: '48px 64px', 
      overflowY: 'auto', zIndex: 100, 
      transition: 'opacity 0.3s ease-in-out',
      fontFamily: sans
    }}>
       <div style={{ maxWidth: '1600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '40px' }}>
          
          {/* Enhanced Hero Section with Telemetry HUD */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '24px' }}>
             <div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                 <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00e676', animation: 'pulseLive 2s infinite' }} />
                 <span style={{ fontSize: '11px', color: '#00e676', fontFamily: mono, textTransform: 'uppercase', letterSpacing: '1px' }}>Deep Analysis Uplink Active</span>
               </div>
               <div style={{ fontSize: '42px', color: '#fff', fontWeight: '700', letterSpacing: '-1.5px', marginBottom: '16px' }}>{contextHub || "Macro Topology"}</div>
               
               {/* New System Telemetry HUD */}
               <div style={{ display: 'flex', gap: '32px' }}>
                 {[
                   { label: 'S2 Cell ID', val: '89c25c7' },
                   { label: 'Signal Dwell', val: '42m 18s' },
                   { label: 'Confidence', val: '96.4%', c: '#00e676' },
                   { label: 'Live Nodes', val: '14,204' }
                 ].map((t, i) => (
                   <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                     <span style={{ fontSize: '9px', color: '#666', fontFamily: mono, textTransform: 'uppercase', letterSpacing: '1px' }}>{t.label}</span>
                     <span style={{ fontSize: '14px', color: t.c || '#d4d4d8', fontFamily: mono, fontWeight: '600' }}>{t.val}</span>
                   </div>
                 ))}
               </div>
             </div>
             
             <div style={{ display: 'flex', gap: '16px' }}>
               <button style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: '#e4e4e7', fontSize: '12px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }} onMouseEnter={(e)=>e.currentTarget.style.background='rgba(255,255,255,0.08)'} onMouseLeave={(e)=>e.currentTarget.style.background='rgba(255,255,255,0.03)'}>
                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Export Data
               </button>
               <button onClick={() => setCanvasMode('map')} style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: '600', transition: 'background 0.2s' }} onMouseEnter={(e)=>e.currentTarget.style.background='rgba(255,255,255,0.15)'} onMouseLeave={(e)=>e.currentTarget.style.background='rgba(255,255,255,0.1)'}>
                 Close Analysis
               </button>
             </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 480px', gap: '40px' }}>
             
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', alignContent: 'start' }}>
                {activeWidgets.map((widgetName, index) => {
                  const WidgetComponent = WidgetRegistry[widgetName];
                  if (!WidgetComponent) return null;
                  return (
                    <div key={`${widgetName}-${index}`} style={{ animation: `fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.08}s backwards` }}>
                      <WidgetComponent />
                    </div>
                  );
                })}
             </div>

             {/* Upgraded Data-Rich Executive Dossier */}
             <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: `fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.2s backwards` }}>
                <div style={{ background: '#050505', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '8px', padding: '32px', display: 'flex', flexDirection: 'column' }}>
                   <div style={{ fontSize: '11px', color: '#888', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> 
                     Executive Intelligence Dossier
                   </div>
                   
                   <div style={{ color: '#d4d4d8', fontSize: '13px', lineHeight: '1.8', fontWeight: '400', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      <p>{execSummary}</p>
                      
                      {/* Detailed Bullet Points */}
                      <div>
                        <div style={{ fontSize: '11px', color: '#fff', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Key Telemetry Findings</div>
                        <ul style={{ paddingLeft: '16px', margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', color: '#aaa' }}>
                          <li><strong style={{ color: '#d4d4d8' }}>Volatility Spike:</strong> Secondary analysis algorithms detected a <span style={{ color: '#00e676', fontFamily: mono }}>+14.2%</span> acceleration vector in macro liquidity between 14:00 and 16:00.</li>
                          <li><strong style={{ color: '#d4d4d8' }}>Routing Decay:</strong> Logistical efficiency has dropped 8.4% YoY due to infrastructure stress.</li>
                          <li><strong style={{ color: '#d4d4d8' }}>Arbitrage Gap:</strong> Cross-border delta currently holding at a 4.8% premium over domestic standard.</li>
                        </ul>
                      </div>

                      {/* Risk Matrix */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                         <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)', borderRadius: '6px' }}>
                           <div style={{ fontSize: '9px', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: mono, marginBottom: '4px' }}>Primary Risk Vector</div>
                           <div style={{ fontSize: '12px', color: '#fff' }}>Supply Bottleneck (North)</div>
                         </div>
                         <div style={{ padding: '12px', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.1)', borderRadius: '6px' }}>
                           <div style={{ fontSize: '9px', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: mono, marginBottom: '4px' }}>Secondary Friction</div>
                           <div style={{ fontSize: '12px', color: '#fff' }}>Settlement Attrition (40%)</div>
                         </div>
                      </div>
                      
                      {/* Automated Recommendation */}
                      <div style={{ padding: '20px', background: 'rgba(0, 230, 118, 0.03)', borderLeft: '2px solid #00e676', borderRadius: '4px' }}>
                        <div style={{ fontSize: '10px', color: '#00e676', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', fontFamily: mono }}>Strategic Imperative</div>
                        <div style={{ fontSize: '13px', color: '#ccc', lineHeight: '1.6' }}>Immediate reconfiguration of deployment strategies is required. Scale infrastructural nodes by 18% to absorb excess liquidity overflow and prevent critical logistical failure in Sector 4.</div>
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
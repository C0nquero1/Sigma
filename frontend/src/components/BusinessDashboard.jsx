import React, { useState, useEffect } from 'react';

const sans = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
const mono = "'JetBrains Mono', 'Fira Code', ui-monospace, monospace";

// ==========================================
// REAL-TIME MICRO-COMPONENTS
// ==========================================
const LiveNumber = ({ base, variance = 0.02, format = 'number', prefix = '', suffix = '' }) => {
  const [val, setVal] = useState(base);
  useEffect(() => {
    const int = setInterval(() => setVal(base + (base * variance * (Math.random() - 0.5))), 2000 + Math.random() * 1000);
    return () => clearInterval(int);
  }, [base, variance]);

  const display = format === 'currency' ? val.toLocaleString('en-NG', { maximumFractionDigits: 1 })
    : format === 'percent' ? val.toFixed(1) + '%' : val.toFixed(0);

  return <span style={{ transition: 'color 0.2s' }}>{prefix}{display}{suffix}</span>;
};

const MiniSparkline = ({ color }) => (
  <svg width="60" height="30" viewBox="0 0 60 30" fill="none">
    <path d="M0,25 Q5,15 15,20 T30,10 T45,15 T60,5" stroke={color} strokeWidth="2" fill="none" />
    <path d="M0,25 Q5,15 15,20 T30,10 T45,15 T60,5 L60,30 L0,30 Z" fill={color} opacity="0.1" />
  </svg>
);

const MiniBars = ({ color }) => (
  <svg width="60" height="30" viewBox="0 0 60 30" fill="none" style={{ display: 'flex', alignItems: 'flex-end', gap: '2px' }}>
    {[12, 24, 16, 28, 20, 30].map((h, i) => (
      <rect key={i} x={i * 10} y={30 - h} width="6" height={h} fill={color} rx="1" opacity={i === 5 ? 1 : 0.4} />
    ))}
  </svg>
);

// Simulated Spatial Heatmap Grid
const SpatialHeatmap = ({ colors = ['#0a0a0c', '#004d2c', '#00e676', '#00e5ff'] }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px', height: '60px' }}>
    {[...Array(18)].map((_, i) => {
      const heat = Math.random();
      const color = heat > 0.8 ? colors[3] : heat > 0.5 ? colors[2] : heat > 0.2 ? colors[1] : colors[0];
      return <div key={i} style={{ background: color, borderRadius: '2px', opacity: 0.9 }} />
    })}
  </div>
);

// ==========================================
// ANALYTIC VIEWS (DYNAMIC CONTENT)
// ==========================================

const CashVelocityView = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.4s ease-out' }}>
    
    {/* 1: Daily Velocity Chart */}
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', height: '160px', position: 'relative' }}>
      <svg width="100%" height="100%" viewBox="0 0 500 150" preserveAspectRatio="none">
        <defs>
          <linearGradient id="velGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="rgba(0, 230, 118, 0.3)"/><stop offset="100%" stopColor="rgba(0, 230, 118, 0)"/></linearGradient>
        </defs>
        <path d="M0,150 L0,100 Q50,120 100,80 T200,60 T300,90 T400,40 T500,70 L500,150 Z" fill="url(#velGrad)" />
        <path d="M0,100 Q50,120 100,80 T200,60 T300,90 T400,40 T500,70" fill="none" stroke="#00e676" strokeWidth="2" />
        <circle cx="500" cy="70" r="4" fill="#00e676" style={{ animation: 'pulseLive 2s infinite', boxShadow: '0 0 10px #00e676' }} />
      </svg>
      <div style={{ position: 'absolute', top: 0, left: 0 }}>
        <div style={{ fontSize: '36px', fontWeight: '700', color: '#fff', letterSpacing: '-1px', fontFamily: mono }}>₦<LiveNumber base={142.5} format="currency" suffix="M" /></div>
        <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: mono }}>Daily Cash Velocity (7-Day Trace)</div>
      </div>
    </div>
    
    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {/* 2 & 3: Top Zone & Business */}
          <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: '9px', color: '#888', textTransform: 'uppercase', fontFamily: mono, marginBottom: '8px' }}>Highest Velocity Zone</div>
            <div style={{ fontSize: '14px', color: '#fff', fontWeight: '600' }}>Central Wholesale Hub</div>
            <div style={{ fontSize: '10px', color: '#00e676', fontFamily: mono, marginTop: '6px' }}>42.8% OF TOTAL VOLUME</div>
          </div>
          <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: '9px', color: '#888', textTransform: 'uppercase', fontFamily: mono, marginBottom: '8px' }}>Top Profit Business</div>
            <div style={{ fontSize: '14px', color: '#fff', fontWeight: '600' }}>Acme FMCG Logistics</div>
            <div style={{ fontSize: '10px', color: '#00e5ff', fontFamily: mono, marginTop: '6px' }}>₦18.4M NET PROFIT</div>
          </div>
        </div>
        
        {/* 5, 6, 7, 8: Vital Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
          {[
            { l: 'Modality Split', v: '68% Cash / 32% Dig.', c: '#fff' }, 
            { l: 'Ecosystem Dwell', v: '42.5 Hours', c: '#fff' }, 
            { l: 'Tx Density', v: <><LiveNumber base={142} format="number"/> / min</>, c: '#00e5ff' }, 
            { l: 'Avg Tx Val (ATV)', v: <LiveNumber base={14.2} format="currency" prefix="₦" suffix="k"/>, c: '#00e676' } 
          ].map((m, i) => (
            <div key={i} style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.03)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '9px', color: '#666', fontFamily: mono, textTransform: 'uppercase' }}>{m.l}</span>
              <span style={{ fontSize: '11px', color: m.c, fontWeight: '700', fontFamily: mono }}>{m.v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 4: Spatial Heatmap */}
      <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ fontSize: '9px', color: '#888', textTransform: 'uppercase', fontFamily: mono, marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
          <span>Spatial Velocity Heatmap</span><span style={{ color: '#00e676' }}>LIVE</span>
        </div>
        <SpatialHeatmap />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '9px', color: '#555', fontFamily: mono }}>
          <span>Low Vel.</span><span>Peak Vel.</span>
        </div>
      </div>
    </div>

    {/* AI OVERVIEW & ACTION PLAN BUNDLE */}
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginTop: '16px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
       <div>
          <div style={{ fontSize: '10px', color: '#00e676', fontFamily: mono, textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg> AI Overview
          </div>
          <div style={{ fontSize: '12px', color: '#aaa', lineHeight: '1.6' }}>
            Based on logic, telemetry detects a highly concentrated liquidity vortex in Central Market. Cash-to-digital conversion has spiked 14% in the last 48 hours, driven by wholesale commodity trading. Ecosystem retention is strong at 42.5 hours before cash exits the zone. High transaction density indicates micro-retail dominance.
          </div>
       </div>
       <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: '10px', color: '#fff', fontFamily: mono, textTransform: 'uppercase', marginBottom: '12px' }}>Recommended Actions</div>
          <ul style={{ margin: 0, paddingLeft: '16px', color: '#888', fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li>Reroute supply chain away from Central Hub.</li>
            <li>Increase digital terminal deployment.</li>
          </ul>
       </div>
    </div>
  </div>
);

const DemandView = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.4s ease-out' }}>
    {/* 1: % Demand Today vs 7 Days */}
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', height: '120px', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 0, left: 0 }}>
        <div style={{ fontSize: '36px', fontWeight: '700', color: '#00e5ff', letterSpacing: '-1px', fontFamily: mono }}>+<LiveNumber base={45.2} format="percent" /></div>
        <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: mono }}>Demand Surge vs Trailing 7-Day Baseline</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '60px', width: '100%', paddingLeft: '280px' }}>
        {[40, 55, 30, 80, 60, 100, 75].map((h, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '100%', height: `${h}%`, background: i === 5 ? '#00e5ff' : '#222', borderRadius: '2px', transition: 'height 0.5s' }} />
            <span style={{ fontSize: '8px', color: '#666', fontFamily: mono }}>D-{6-i}</span>
          </div>
        ))}
      </div>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px' }}>
      {/* 2: Predictive Heatmap Surge */}
      <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ fontSize: '9px', color: '#888', textTransform: 'uppercase', fontFamily: mono, marginBottom: '16px' }}>Predictive Surge Trajectory</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 2fr 1fr', fontSize: '8px', color: '#555', fontFamily: mono, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
            <span>START ➔ PEAK</span><span>LOCATION</span><span>CATALYST (WHY)</span><span>INTENSITY</span>
          </div>
          {[
            { t: '08:00 ➔ 10:30', loc: 'Transit Perimeter', r: 'Morning Commuter Influx', l: 'Mild', c: '#f59e0b' },
            { t: '14:00 ➔ 16:00', loc: 'Central Wholesale', r: 'B2B Settlement Window', l: 'Peak', c: '#ef4444' },
            { t: '18:30 ➔ 21:00', loc: 'Retail Alley', r: 'Evening Micro-Fulfillment', l: 'High', c: '#00e676' }
          ].map((s, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 2fr 1fr', alignItems: 'center', fontSize: '11px', color: '#ccc' }}>
              <span style={{ fontFamily: mono, fontSize: '10px' }}>{s.t}</span>
              <span style={{ fontWeight: '600', color: '#fff' }}>{s.loc}</span>
              <span style={{ fontSize: '10px', color: '#888' }}>{s.r}</span>
              <span style={{ fontSize: '9px', fontWeight: '700', color: s.c, fontFamily: mono, textTransform: 'uppercase' }}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {/* 3 & 4: Zone Levels & Top Business */}
          <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: '9px', color: '#888', textTransform: 'uppercase', fontFamily: mono, marginBottom: '10px' }}>Zone Demand Levels</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#fff', fontFamily: mono }}><span>Core</span><span style={{ color: '#ef4444' }}>HIGH</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#fff', fontFamily: mono }}><span>East</span><span style={{ color: '#f59e0b' }}>MILD</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#fff', fontFamily: mono }}><span>North</span><span style={{ color: '#555' }}>NONE</span></div>
            </div>
          </div>
          <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: '9px', color: '#888', textTransform: 'uppercase', fontFamily: mono, marginBottom: '10px' }}>Top Demanded Biz</div>
            <div style={{ fontSize: '13px', color: '#fff', fontWeight: '600' }}>Apex Suppliers</div>
            <div style={{ fontSize: '10px', color: '#00e5ff', marginTop: '6px', fontFamily: mono }}>842 LIVE ORDERS</div>
          </div>
        </div>

        {/* 5, 6, 7: Conversion Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          {[
            { l: 'Dmd-to-Sale Conv.', v: <LiveNumber base={64.2} format="percent"/>, c: '#00e676' }, 
            { l: 'Inventory Burn', v: '1.8x Base', c: '#ef4444' }, 
            { l: 'Price Elasticity', v: 'High Tol.', c: '#fff' } 
          ].map((m, i) => (
            <div key={i} style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.03)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ fontSize: '8px', color: '#888', textTransform: 'uppercase', fontFamily: mono }}>{m.l}</div>
              <div style={{ fontSize: '12px', color: m.c, fontWeight: '700', fontFamily: mono }}>{m.v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* AI OVERVIEW & ACTION PLAN BUNDLE */}
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginTop: '16px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
       <div>
          <div style={{ fontSize: '10px', color: '#00e5ff', fontFamily: mono, textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg> AI Overview
          </div>
          <div style={{ fontSize: '12px', color: '#aaa', lineHeight: '1.6' }}>
            Predictive heatmaps indicate a massive 45% surge in aggregate demand. This surge originates from the Transit Perimeter at 08:00 AM. Inventory burn rate is currently 1.8x baseline, but Demand-to-Sale conversion remains steady at 64.2%. High price elasticity suggests tolerance for markup.
          </div>
       </div>
       <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: '10px', color: '#fff', fontFamily: mono, textTransform: 'uppercase', marginBottom: '12px' }}>Recommended Actions</div>
          <ul style={{ margin: 0, paddingLeft: '16px', color: '#888', fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li>Restock inventory immediately at Apex Suppliers.</li>
            <li>Increase markup by 6% in Core Zones.</li>
          </ul>
       </div>
    </div>
  </div>
);

const MarketView = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.4s ease-out' }}>
    
    {/* 1: Infographic of Share */}
    <div style={{ display: 'flex', alignItems: 'center', gap: '40px', height: '140px' }}>
      <div style={{ position: 'relative', width: '120px', height: '120px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <svg viewBox="0 0 100 100" width="100%" height="100%">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#111" strokeWidth="12" />
          <circle cx="50" cy="50" r="40" fill="none" stroke="#00e676" strokeWidth="12" strokeDasharray="251" strokeDashoffset="80" strokeLinecap="round" />
          <circle cx="50" cy="50" r="40" fill="none" stroke="#00e5ff" strokeWidth="12" strokeDasharray="251" strokeDashoffset="220" strokeLinecap="round" />
        </svg>
        <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: '24px', fontWeight: '700', color: '#fff', fontFamily: mono }}>68%</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#fff' }}>Informal Market Dominance</div>
          <div style={{ fontSize: '12px', color: '#888', marginTop: '6px', lineHeight: '1.5' }}>Real-time factors driving informal share: <strong style={{color:'#fff'}}>Localized credit networks (32%)</strong>, <strong style={{color:'#fff'}}>Zero-KYC friction (45%)</strong>, and <strong style={{color:'#fff'}}>Dynamic pricing (23%)</strong>.</div>
        </div>
        <div style={{ display: 'flex', gap: '24px', fontFamily: mono }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{width:'8px',height:'8px',background:'#00e676'}}/><span style={{fontSize:'10px',color:'#ccc'}}>Informal (68%)</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{width:'8px',height:'8px',background:'#00e5ff'}}/><span style={{fontSize:'10px',color:'#ccc'}}>Formal (21%)</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{width:'8px',height:'8px',background:'#222'}}/><span style={{fontSize:'10px',color:'#ccc'}}>Untapped (11%)</span></div>
        </div>
      </div>
    </div>

    <div style={{ display: 'flex', gap: '16px' }}>
      {/* 2: Real-time comp analysis */}
      <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', padding: '20px', flex: 2 }}>
        <div style={{ fontSize: '9px', color: '#888', textTransform: 'uppercase', fontFamily: mono, marginBottom: '16px' }}>Real-Time Competitor Telemetry</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '9px', color: '#555', fontFamily: mono }}>
            <span>COMPETITOR</span><span>DMND SHARE</span><span>SALES VOL</span><span>VELOCITY</span>
          </div>
          {[
            { n: 'Rival Logistics Co.', d: '24%', s: '₦84.2M', v: 'High', c: '#00e676' },
            { n: 'Urban Supply Hub', d: '18%', s: '₦61.0M', v: 'Med', c: '#f59e0b' },
            { n: 'Metro Micro-Retailers', d: '14%', s: '₦42.5M', v: 'Low', c: '#ef4444' }
          ].map((r, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '12px 0', borderBottom: i === 2 ? 'none' : '1px solid rgba(255,255,255,0.02)', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#fff' }}>{r.n}</span>
              <span style={{ fontSize: '11px', color: '#aaa', fontFamily: mono }}>{r.d}</span>
              <span style={{ fontSize: '11px', color: '#aaa', fontFamily: mono }}>{r.s}</span>
              <span style={{ fontSize: '9px', color: r.c, fontFamily: mono, background: `${r.c}15`, padding: '2px 6px', borderRadius: '2px', width: 'fit-content' }}>{r.v}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* 3, 4, 5: Advanced Metrics */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
         {[
           { l: 'Vendor Defection (Churn)', v: '4.2%', c: '#ef4444' },
           { l: 'Wholesale Pricing Delta', v: '-2.4% vs Avg', c: '#00e676' },
           { l: 'Zone Saturation Index', v: '88% (Peak)', c: '#f59e0b' }
         ].map((m, i) => (
           <div key={i} style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <span style={{ fontSize: '9px', color: '#888', textTransform: 'uppercase', fontFamily: mono, maxWidth: '100px', lineHeight: '1.4' }}>{m.l}</span>
             <span style={{ fontSize: '13px', color: m.c, fontWeight: '700', fontFamily: mono }}>{m.v}</span>
           </div>
         ))}
      </div>
    </div>

    {/* AI OVERVIEW & ACTION PLAN BUNDLE */}
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginTop: '16px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
       <div>
          <div style={{ fontSize: '10px', color: '#f59e0b', fontFamily: mono, textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg> AI Overview
          </div>
          <div style={{ fontSize: '12px', color: '#aaa', lineHeight: '1.6' }}>
            Informal networks are actively capturing 68% of the market share, heavily driven by localized credit. Competitor capital drain has decreased, but rival networks are experiencing severe logistics friction at the North Gate, resulting in a 4.2% vendor defection rate directly into our network.
          </div>
       </div>
       <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: '10px', color: '#fff', fontFamily: mono, textTransform: 'uppercase', marginBottom: '12px' }}>Recommended Actions</div>
          <ul style={{ margin: 0, paddingLeft: '16px', color: '#888', fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li>Capitalize on North Gate friction.</li>
            <li>Deploy marketing to defecting vendors.</li>
          </ul>
       </div>
    </div>
  </div>
);

// ==========================================
// MAIN DASHBOARD COMPONENT
// ==========================================
export default function BusinessDashboard() {
  const [activeTab, setActiveTab] = useState('velocity');
  const [chatInput, setChatInput] = useState('');

  return (
    <div style={{ flex: 1, background: '#050505', color: '#fff', padding: '40px 48px', overflowY: 'auto', fontFamily: sans }}>
      
      {/* 1. OBSIDIAN HERO SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '24px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {/* Sleek Profile Avatar */}
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #00e676, #004d2c)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#050505', fontWeight: '800', fontSize: '18px', boxShadow: '0 0 20px rgba(0, 230, 118, 0.2)' }}>
            A
          </div>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', letterSpacing: '-0.5px', margin: '0 0 6px 0', color: '#fff' }}>Acme FMCG Logistics</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: '#888', fontFamily: mono }}>
               <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg> 
                 Abuja, FCT
               </span>
               <span style={{ color: '#333' }}>|</span>
               <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#00e5ff' }}>
                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
                 Credit Available: ₦24.5M
               </span>
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '10px 16px', borderRadius: '24px', gap: '10px', width: '240px' }}>
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
             <input type="text" placeholder="Search systems..." style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '12px', color: '#fff', width: '100%', fontFamily: sans }} />
          </div>
          <div style={{ position: 'relative', cursor: 'pointer', padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.08)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
            <div style={{ position: 'absolute', top: '6px', right: '8px', width: '6px', height: '6px', background: '#ef4444', borderRadius: '50%', border: '1px solid #050505' }} />
          </div>
        </div>
      </div>

      {/* 2. COMPACT MINI-CHART METRIC CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {[
          { id: 'velocity', label: 'Cash Velocity', val: '₦142.5M', chart: <MiniSparkline color="#00e676" /> },
          { id: 'demands', label: 'Demands', val: '+45%', chart: <MiniBars color="#00e5ff" /> },
          { id: 'market', label: 'Market (Comp)', val: '68%', chart: <MiniSparkline color="#f59e0b" /> },
          { id: 'actions', label: 'Action Plan', val: '3 Pending', chart: <MiniBars color="#ef4444" /> }
        ].map(card => {
          const isActive = activeTab === card.id;
          return (
            <div 
              key={card.id} onClick={() => setActiveTab(card.id)}
              style={{ background: isActive ? 'rgba(255,255,255,0.05)' : '#0a0a0c', padding: '16px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', border: `1px solid ${isActive ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '9px', color: isActive ? '#fff' : '#888', fontFamily: mono, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{card.label}</span>
                <span style={{ fontSize: '20px', fontWeight: '700', color: '#fff', fontFamily: mono }}>{card.val}</span>
              </div>
              <div>{card.chart}</div>
            </div>
          );
        })}
      </div>

      {/* 3. MAIN SPLIT VIEW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2.5fr) 1fr', gap: '32px' }}>
        
        {/* LEFT COLUMN: Analytic View */}
        <div style={{ background: '#0a0a0c', borderRadius: '12px', padding: '32px', border: '1px solid rgba(255,255,255,0.05)', minHeight: '500px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
            <div style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.05)', color: '#fff', borderRadius: '4px', fontSize: '9px', fontFamily: mono, textTransform: 'uppercase', letterSpacing: '1px' }}>Analytic View</div>
            <div style={{ fontSize: '13px', color: '#aaa', fontWeight: '500' }}>
              {activeTab === 'velocity' ? 'Cash Velocity Trends & Spatial Mapping' : activeTab === 'demands' ? 'Demand Heatmap & Predictive Surges' : activeTab === 'market' ? 'Competition & Market Share Telemetry' : 'Master Action Plan & Directives'}
            </div>
          </div>
          
          {activeTab === 'velocity' && <CashVelocityView />}
          {activeTab === 'demands' && <DemandView />}
          {activeTab === 'market' && <MarketView />}
        </div>

        {/* RIGHT COLUMN: Chat Interface & Live Alerts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* System AI Copilot Chat */}
          <div style={{ background: '#0a0a0c', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', height: '400px', overflow: 'hidden' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
              <span style={{ fontSize: '11px', color: '#fff', fontFamily: mono, textTransform: 'uppercase', letterSpacing: '1px' }}>System Copilot</span>
            </div>
            
            <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: 'rgba(0, 229, 255, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#00e5ff' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', fontSize: '12px', color: '#aaa', lineHeight: '1.5', flex: 1, border: '1px solid rgba(255,255,255,0.02)' }}>
                  How can I assist with your supply chain logistics today? I noticed a surge in the Central Hub.
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flexDirection: 'row-reverse' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff', fontSize: '10px', fontWeight: '700' }}>
                  A
                </div>
                <div style={{ background: '#111', padding: '12px', borderRadius: '8px', fontSize: '12px', color: '#fff', lineHeight: '1.5', flex: 1, border: '1px solid rgba(255,255,255,0.05)' }}>
                  Route excess inventory to the Retail Alley for the 18:30 peak.
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: 'rgba(0, 229, 255, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#00e5ff' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                </div>
                <div style={{ background: 'transparent', padding: '12px', fontSize: '12px', color: '#888', display: 'flex', gap: '4px' }}>
                   <span style={{ animation: 'pulseLive 1s infinite' }}>●</span>
                   <span style={{ animation: 'pulseLive 1s infinite 0.2s' }}>●</span>
                   <span style={{ animation: 'pulseLive 1s infinite 0.4s' }}>●</span>
                </div>
              </div>
            </div>

            <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}>
              <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '8px 12px' }}>
                <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Type command..." style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: '12px', fontFamily: sans }} />
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" style={{ cursor: 'pointer' }}><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
              </div>
            </div>
          </div>

          {/* Live Alerts Widget */}
          <div style={{ background: '#0a0a0c', borderRadius: '12px', padding: '24px', border: '1px solid rgba(255,255,255,0.05)', flex: 1 }}>
            <div style={{ fontSize: '11px', fontFamily: mono, color: '#fff', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              Live Operations
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '10px', bottom: '10px', left: '3.5px', width: '1px', background: 'rgba(255,255,255,0.05)', zIndex: 0 }} />
              
              <div style={{ display: 'flex', gap: '16px', position: 'relative', zIndex: 1 }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00e5ff', marginTop: '4px', outline: '4px solid #050505' }} />
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#fff' }}>Demand Surge Hit</div>
                  <div style={{ fontSize: '9px', color: '#666', fontFamily: mono, marginTop: '4px' }}>WEST MARKET • 14:00</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', position: 'relative', zIndex: 1 }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', marginTop: '4px', outline: '4px solid #050505' }} />
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#fff' }}>Vendor Attrition Alert</div>
                  <div style={{ fontSize: '9px', color: '#666', fontFamily: mono, marginTop: '4px' }}>NORTH GATE • 15:15</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', position: 'relative', zIndex: 1 }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#888', marginTop: '4px', outline: '4px solid #050505' }} />
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#fff' }}>Velocity Vector Locked</div>
                  <div style={{ fontSize: '9px', color: '#666', fontFamily: mono, marginTop: '4px' }}>ALL SECTORS • 16:00</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulseLive { 0% { opacity: 1; transform: scale(1); } 50% { opacity: 0.3; transform: scale(1.5); } 100% { opacity: 1; transform: scale(1); } }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
}
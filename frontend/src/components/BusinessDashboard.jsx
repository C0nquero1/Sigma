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

  return <span style={{ transition: 'color 0.2s', color: '#fff' }}>{prefix}{display}{suffix}</span>;
};

// Simulated Spatial Heatmap Grid
const SpatialHeatmap = ({ colors = ['#050505', '#004d2c', '#00e676', '#00e5ff'] }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '2px', height: '60px' }}>
    {[...Array(18)].map((_, i) => {
      const heat = Math.random();
      const color = heat > 0.8 ? colors[3] : heat > 0.5 ? colors[2] : heat > 0.2 ? colors[1] : colors[0];
      return <div key={i} style={{ background: color, borderRadius: '1px', opacity: 0.8 }} />
    })}
  </div>
);

// ==========================================
// ANALYTIC VIEWS (DYNAMIC CONTENT)
// ==========================================

const CashVelocityView = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.4s ease-out' }}>
    
    {/* 1 & 2: Daily Velocity (Today) & 7-Day Trend */}
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', height: '140px', position: 'relative', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px' }}>
      <svg width="100%" height="100%" viewBox="0 0 500 150" preserveAspectRatio="none">
        <defs>
          <linearGradient id="velGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="rgba(0, 230, 118, 0.3)"/><stop offset="100%" stopColor="rgba(0, 230, 118, 0)"/></linearGradient>
        </defs>
        <path d="M0,150 L0,100 Q50,120 100,80 T200,60 T300,90 T400,40 T500,70 L500,150 Z" fill="url(#velGrad)" />
        <path d="M0,100 Q50,120 100,80 T200,60 T300,90 T400,40 T500,70" fill="none" stroke="#00e676" strokeWidth="2" />
        <circle cx="500" cy="70" r="4" fill="#00e676" style={{ animation: 'pulseLive 2s infinite' }} />
      </svg>
      <div style={{ position: 'absolute', top: 0, left: 0 }}>
        <div style={{ fontSize: '36px', fontWeight: '700', color: '#fff', letterSpacing: '-1px', fontFamily: mono }}>₦<LiveNumber base={142.5} format="currency" suffix="M" /></div>
        <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>Daily Cash Velocity (7-Day Trace)</div>
      </div>
    </div>
    
    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {/* 3: Highest Velocity Zone */}
          <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: '9px', color: '#666', textTransform: 'uppercase', fontFamily: mono, marginBottom: '8px' }}>Highest Velocity Zone</div>
            <div style={{ fontSize: '14px', color: '#fff', fontWeight: '600' }}>Central Wholesale Hub</div>
            <div style={{ fontSize: '11px', color: '#00e676', fontFamily: mono, marginTop: '4px' }}>42.8% OF TOTAL VOLUME</div>
          </div>
          {/* 4: Top Profit Business */}
          <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: '9px', color: '#666', textTransform: 'uppercase', fontFamily: mono, marginBottom: '8px' }}>Top Profit Business</div>
            <div style={{ fontSize: '14px', color: '#fff', fontWeight: '600' }}>Acme FMCG Logistics</div>
            <div style={{ fontSize: '11px', color: '#00e5ff', fontFamily: mono, marginTop: '4px' }}>₦18.4M NET PROFIT</div>
          </div>
        </div>
        
        {/* Advanced Vital Metrics (6, 7, 8) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
          {[
            { l: 'Modality Split', v: '68% Cash / 32% Dig.', c: '#fff' }, // 6
            { l: 'Ecosystem Dwell', v: '42.5 Hours', c: '#fff' }, // 7
            { l: 'Tx Density', v: <><LiveNumber base={142} format="number"/> / min</>, c: '#f59e0b' }, // 8a
            { l: 'Avg Tx Val (ATV)', v: <LiveNumber base={14.2} format="currency" prefix="₦" suffix="k"/>, c: '#00e676' } // 8b
          ].map((m, i) => (
            <div key={i} style={{ padding: '12px', background: '#0a0a0c', borderRadius: '4px', border: '1px solid #1a1a1c', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '9px', color: '#666', fontFamily: mono }}>{m.l}</span>
              <span style={{ fontSize: '11px', color: m.c, fontWeight: '700', fontFamily: mono }}>{m.v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 5: Heatmap of location by Cash Velocity */}
      <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: '9px', color: '#666', textTransform: 'uppercase', fontFamily: mono, marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
          <span>Spatial Velocity Heatmap</span>
          <span style={{ color: '#00e676' }}>LIVE</span>
        </div>
        <SpatialHeatmap />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '9px', color: '#555', fontFamily: mono }}>
          <span>Low Vel.</span><span>Peak Vel.</span>
        </div>
      </div>
    </div>
  </div>
);

const DemandView = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.4s ease-out' }}>
    {/* 1: Percentage of demand today vs 7 days */}
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', height: '100px', position: 'relative', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px' }}>
      <div style={{ position: 'absolute', top: 0, left: 0 }}>
        <div style={{ fontSize: '36px', fontWeight: '700', color: '#00e5ff', letterSpacing: '-1px', fontFamily: mono }}>+<LiveNumber base={45.2} format="percent" /></div>
        <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>Demand Surge vs Trailing 7-Day Baseline</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '60px', width: '100%', paddingLeft: '280px' }}>
        {[40, 55, 30, 80, 60, 100, 75].map((h, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '100%', height: `${h}%`, background: i === 5 ? '#00e5ff' : '#333', borderRadius: '2px', transition: 'height 0.5s' }} />
            <span style={{ fontSize: '8px', color: '#666', fontFamily: mono }}>D-{6-i}</span>
          </div>
        ))}
      </div>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px' }}>
      {/* 2: Predict Heatmap Surge Table */}
      <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ fontSize: '9px', color: '#666', textTransform: 'uppercase', fontFamily: mono, marginBottom: '16px' }}>Predictive Surge Trajectory</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 2fr 1fr', fontSize: '8px', color: '#555', fontFamily: mono, borderBottom: '1px solid #222', paddingBottom: '6px' }}>
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
        {/* 3 & 4: Location Heatmap (None/Mild/High) & Top Business */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: '9px', color: '#666', textTransform: 'uppercase', fontFamily: mono, marginBottom: '8px' }}>Zone Demand Levels</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#fff' }}><span>Core</span><span style={{ color: '#ef4444' }}>HIGH</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#fff' }}><span>East</span><span style={{ color: '#f59e0b' }}>MILD</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#fff' }}><span>North</span><span style={{ color: '#555' }}>NONE</span></div>
            </div>
          </div>
          <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: '9px', color: '#666', textTransform: 'uppercase', fontFamily: mono, marginBottom: '8px' }}>Top Demanded Biz</div>
            <div style={{ fontSize: '13px', color: '#fff', fontWeight: '600' }}>Apex Suppliers</div>
            <div style={{ fontSize: '10px', color: '#00e5ff', marginTop: '4px', fontFamily: mono }}>842 Live Orders</div>
          </div>
        </div>

        {/* 5, 6, 7: Advanced Conversion Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          {[
            { l: 'Dmd-to-Sale Conv.', v: <LiveNumber base={64.2} format="percent"/>, c: '#00e676' }, // 5
            { l: 'Inventory Burn', v: '1.8x Base', c: '#ef4444' }, // 6
            { l: 'Price Elasticity', v: 'High Tol.', c: '#fff' } // 7
          ].map((m, i) => (
            <div key={i} style={{ padding: '10px', background: '#0a0a0c', borderRadius: '4px', border: '1px solid #1a1a1c', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ fontSize: '9px', color: '#666', textTransform: 'uppercase', fontFamily: mono }}>{m.l}</div>
              <div style={{ fontSize: '12px', color: m.c, fontWeight: '700', fontFamily: mono }}>{m.v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const MarketView = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.4s ease-out' }}>
    {/* 1: Detailed Infographic of Informal Market Share & Factors */}
    <div style={{ display: 'flex', alignItems: 'center', gap: '40px', height: '140px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px' }}>
      <div style={{ position: 'relative', width: '120px', height: '120px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <svg viewBox="0 0 100 100" width="100%" height="100%">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#222" strokeWidth="12" />
          <circle cx="50" cy="50" r="40" fill="none" stroke="#00e676" strokeWidth="12" strokeDasharray="251" strokeDashoffset="80" strokeLinecap="round" />
          <circle cx="50" cy="50" r="40" fill="none" stroke="#f59e0b" strokeWidth="12" strokeDasharray="251" strokeDashoffset="220" strokeLinecap="round" />
        </svg>
        <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: '24px', fontWeight: '700', color: '#fff', fontFamily: mono }}>68%</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#fff' }}>Informal Market Dominance</div>
          <div style={{ fontSize: '12px', color: '#aaa', marginTop: '6px', lineHeight: '1.5' }}>Real-time factors driving informal share: <strong style={{color:'#fff'}}>Localized credit networks (32%)</strong>, <strong style={{color:'#fff'}}>Zero-KYC friction (45%)</strong>, and <strong style={{color:'#fff'}}>Dynamic unrecorded pricing (23%)</strong>.</div>
        </div>
        <div style={{ display: 'flex', gap: '24px', fontFamily: mono }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{width:'8px',height:'8px',background:'#00e676'}}/><span style={{fontSize:'10px',color:'#ccc'}}>Informal (68%)</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{width:'8px',height:'8px',background:'#f59e0b'}}/><span style={{fontSize:'10px',color:'#ccc'}}>Formal (21%)</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{width:'8px',height:'8px',background:'#222'}}/><span style={{fontSize:'10px',color:'#ccc'}}>Untapped (11%)</span></div>
        </div>
      </div>
    </div>

    <div style={{ display: 'flex', gap: '16px' }}>
      {/* 2: Real-time competition analysis */}
      <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)', padding: '16px', flex: 2 }}>
        <div style={{ fontSize: '9px', color: '#666', textTransform: 'uppercase', fontFamily: mono, marginBottom: '16px' }}>Real-Time Competitor Telemetry</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', paddingBottom: '8px', borderBottom: '1px solid #222', fontSize: '9px', color: '#555', fontFamily: mono }}>
            <span>COMPETITOR</span><span>DMND SHARE</span><span>SALES VOL</span><span>VELOCITY</span>
          </div>
          {[
            { n: 'Rival Logistics Co.', d: '24%', s: '₦84.2M', v: 'High', c: '#00e676' },
            { n: 'Urban Supply Hub', d: '18%', s: '₦61.0M', v: 'Med', c: '#f59e0b' },
            { n: 'Metro Micro-Retailers', d: '14%', s: '₦42.5M', v: 'Low', c: '#ef4444' }
          ].map((r, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '12px 0', borderBottom: i === 2 ? 'none' : '1px solid #1a1a1c', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#fff' }}>{r.n}</span>
              <span style={{ fontSize: '11px', color: '#aaa', fontFamily: mono }}>{r.d}</span>
              <span style={{ fontSize: '11px', color: '#aaa', fontFamily: mono }}>{r.s}</span>
              <span style={{ fontSize: '9px', color: r.c, fontFamily: mono, background: `${r.c}15`, padding: '2px 6px', borderRadius: '2px', width: 'fit-content' }}>{r.v}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* 3, 4, 5: Advanced Market Metrics */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
         {[
           { l: 'Vendor Defection (Churn)', v: '4.2%', c: '#ef4444' }, // 3
           { l: 'Wholesale Pricing Delta', v: '-2.4% vs Avg', c: '#00e676' }, // 4
           { l: 'Zone Saturation Index', v: '88% (Peak)', c: '#f59e0b' } // 5
         ].map((m, i) => (
           <div key={i} style={{ padding: '14px', background: '#0a0a0c', borderRadius: '6px', border: '1px solid #1a1a1c', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <span style={{ fontSize: '9px', color: '#666', textTransform: 'uppercase', fontFamily: mono, maxWidth: '80px', lineHeight: '1.4' }}>{m.l}</span>
             <span style={{ fontSize: '13px', color: m.c, fontWeight: '700', fontFamily: mono }}>{m.v}</span>
           </div>
         ))}
      </div>
    </div>
  </div>
);

const ActionPlanView = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.4s ease-out' }}>
    <div style={{ fontSize: '18px', fontWeight: '600', color: '#fff', marginBottom: '8px' }}>Master Execution Plan</div>
    {[
      { t: 'Reroute Supply Chain: Bypass North Gate Friction', p: 'Critical', s: 'Pending Exec' },
      { t: 'Deploy Mobile Settlement Terminals to Central Hub', p: 'High', s: 'In Progress' },
      { t: 'Adjust Pricing: +6% markup in high-demand zones', p: 'Medium', s: 'Scheduled' }
    ].map((a, i) => (
      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '16px 20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid #555', cursor: 'pointer' }} />
          <span style={{ fontSize: '13px', color: '#fff' }}>{a.t}</span>
        </div>
        <div style={{ display: 'flex', gap: '12px', fontFamily: mono }}>
          <span style={{ fontSize: '9px', color: a.p === 'Critical' ? '#ef4444' : a.p === 'High' ? '#f59e0b' : '#00e5ff', background: a.p === 'Critical' ? 'rgba(239, 68, 68, 0.1)' : a.p === 'High' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(0, 229, 255, 0.1)', padding: '4px 8px', borderRadius: '2px', textTransform: 'uppercase' }}>{a.p}</span>
          <span style={{ fontSize: '9px', color: '#888', background: '#111', padding: '4px 8px', borderRadius: '2px', border: '1px solid #222' }}>{a.s}</span>
        </div>
      </div>
    ))}
  </div>
);

// ==========================================
// MAIN DASHBOARD COMPONENT
// ==========================================
export default function BusinessDashboard() {
  const [activeTab, setActiveTab] = useState('velocity');

  const aiOverviews = {
    velocity: "Based on logic, telemetry detects a highly concentrated liquidity vortex in Central Market. Cash-to-digital conversion has spiked 14% in the last 48 hours, driven by wholesale commodity trading. Ecosystem retention is strong at 42.5 hours before cash exits the zone. High transaction density indicates micro-retail dominance.",
    demands: "Predictive heatmaps indicate a massive 45% surge in aggregate demand. This surge originates from the Transit Perimeter at 08:00 AM. Inventory burn rate is currently 1.8x baseline, but Demand-to-Sale conversion remains steady at 64.2%. High price elasticity suggests tolerance for markup.",
    market: "Informal networks are actively capturing 68% of the market share, heavily driven by localized credit. Competitor capital drain has decreased, but rival networks are experiencing severe logistics friction at the North Gate, resulting in a 4.2% vendor defection rate directly into our network.",
    actions: "Based on combined velocity, demand, and market data, System AI has generated a master execution strategy to maximize liquidity capture over the next 7 days. Immediate action required on the North Gate bypass to prevent a 12% logistical depreciation."
  };

  return (
    <div style={{ flex: 1, background: '#050505', color: '#fff', padding: '32px 40px', overflowY: 'auto', fontFamily: sans }}>
      
      {/* 1. OBSIDIAN HERO SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '24px', marginBottom: '32px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00e676', animation: 'pulseLive 2s infinite', boxShadow: '0 0 10px #00e676' }} />
            <span style={{ fontSize: '10px', color: '#00e676', fontFamily: mono, textTransform: 'uppercase', letterSpacing: '2px' }}>System Command Uplink</span>
          </div>
          <h1 style={{ fontSize: '36px', fontWeight: '700', letterSpacing: '-1px', margin: '0 0 8px 0', color: '#fff' }}>ACME FMCG LOGISTICS</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '11px', color: '#888', fontFamily: mono }}>
             <span>SESSION: <span style={{color:'#fff'}}>ADMIN_FOUNDER</span></span>
             <span>|</span>
             <span>NETWORK STATUS: <span style={{color:'#00e5ff'}}>ENCRYPTED</span></span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '10px 16px', borderRadius: '6px', gap: '8px' }}>
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
             <input type="text" placeholder="Query data streams..." style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '12px', color: '#fff', width: '140px', fontFamily: mono }} />
          </div>
          <button style={{ background: 'rgba(0, 230, 118, 0.1)', color: '#00e676', border: '1px solid rgba(0, 230, 118, 0.3)', padding: '10px 20px', borderRadius: '6px', fontSize: '11px', fontFamily: mono, fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg> Connect AI
          </button>
        </div>
      </div>

      {/* 2. COMPACT TOP METRIC CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {[
          { id: 'velocity', label: 'Cash Velocity', val: '₦142.5M', sub: '+12.4% vs 7D', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg> },
          { id: 'demands', label: 'Demands', val: '+45%', sub: 'Surge: 3 Hubs', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg> },
          { id: 'market', label: 'Market (Comp)', val: '68%', sub: 'Informal Share', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a10 10 0 0 1 10 10"></path></svg> },
          { id: 'actions', label: 'Action Plan', val: '3', sub: 'Critical Pending', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> }
        ].map(card => {
          const isActive = activeTab === card.id;
          return (
            <div 
              key={card.id} onClick={() => setActiveTab(card.id)}
              style={{ background: isActive ? 'rgba(255,255,255,0.05)' : '#08080a', padding: '16px 20px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', border: `1px solid ${isActive ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)'}`, display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', color: isActive ? '#fff' : '#888', fontFamily: mono, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{card.label}</span>
                <span style={{ color: isActive ? '#00e676' : '#444' }}>{card.icon}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#fff', fontFamily: mono }}>{card.val}</div>
                <div style={{ fontSize: '9px', color: isActive ? '#00e676' : '#666', fontFamily: mono }}>{card.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. MAIN SPLIT VIEW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2.5fr) 1fr', gap: '32px' }}>
        
        {/* LEFT COLUMN: Analytic View & AI Overview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          <div style={{ background: '#0a0a0c', borderRadius: '12px', padding: '32px', border: '1px solid rgba(255,255,255,0.05)', minHeight: '340px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
              <div style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.05)', color: '#fff', borderRadius: '4px', fontSize: '9px', fontFamily: mono, textTransform: 'uppercase', letterSpacing: '1px' }}>Analytic View</div>
              <div style={{ fontSize: '13px', color: '#aaa', fontWeight: '500' }}>
                {activeTab === 'velocity' ? 'Cash Velocity Trends & Spatial Mapping' : activeTab === 'demands' ? 'Demand Heatmap & Predictive Surges' : activeTab === 'market' ? 'Competition & Market Share Telemetry' : 'Master Action Plan & Directives'}
              </div>
            </div>
            
            {activeTab === 'velocity' && <CashVelocityView />}
            {activeTab === 'demands' && <DemandView />}
            {activeTab === 'market' && <MarketView />}
            {activeTab === 'actions' && <ActionPlanView />}
          </div>

          {/* Bottom Grid: AI Overview & Action Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
            <div style={{ background: '#0a0a0c', borderRadius: '8px', padding: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '10px', fontFamily: mono, color: '#fff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00e676" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg> AI Synthesis
              </div>
              <div style={{ fontSize: '12px', color: '#aaa', lineHeight: '1.7', fontFamily: sans }}>
                {aiOverviews[activeTab]}
              </div>
            </div>

            <div style={{ background: '#0a0a0c', borderRadius: '8px', padding: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                 <div style={{ fontSize: '10px', fontFamily: mono, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> Directives
                 </div>
                 <div style={{ fontSize: '9px', fontFamily: mono, background: 'rgba(255,255,255,0.05)', color: '#888', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>EXPAND</div>
               </div>
               <ul style={{ margin: 0, paddingLeft: '16px', color: '#888', fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '12px', fontFamily: sans }}>
                 <li>Reroute Supply Chain: Bypass North Gate Friction.</li>
                 <li>Deploy Mobile Settlement Terminals to Hub.</li>
                 <li>Adjust Pricing: +6% markup in high-demand zones.</li>
               </ul>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Right Sidebar Widgets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Calendar Widget */}
          <div style={{ background: '#0a0a0c', borderRadius: '8px', padding: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff' }}>October 2026</div>
              <div style={{ display: 'flex', gap: '12px', color: '#666' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{cursor:'pointer'}}><polyline points="15 18 9 12 15 6"></polyline></svg>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{cursor:'pointer'}}><polyline points="9 18 15 12 9 6"></polyline></svg>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', textAlign: 'center', fontSize: '9px', color: '#555', fontFamily: mono, marginBottom: '12px' }}>
              <span>SU</span><span>MO</span><span>TU</span><span>WE</span><span>TH</span><span>FR</span><span>SA</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', textAlign: 'center', fontSize: '11px', color: '#888', fontFamily: mono }}>
              {[...Array(31)].map((_, i) => {
                const day = i + 1;
                const isToday = day === 12; // Matching the context date
                return (
                  <div key={day} style={{ padding: '6px 0', background: isToday ? '#00e676' : 'transparent', color: isToday ? '#000' : '#888', borderRadius: '4px', cursor: 'pointer', fontWeight: isToday ? '700' : '400' }}>
                    {day}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Alerts Widget */}
          <div style={{ background: '#0a0a0c', borderRadius: '8px', padding: '24px', border: '1px solid rgba(255,255,255,0.05)', flex: 1 }}>
            <div style={{ fontSize: '11px', fontFamily: mono, color: '#fff', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '24px' }}>System Logs: Oct 12</div>
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
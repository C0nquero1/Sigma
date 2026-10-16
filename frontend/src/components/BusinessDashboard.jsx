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

const Sparkline = ({ color, data }) => (
  <svg width="80" height="24" viewBox="0 0 80 24" fill="none">
    <path d={data} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SpatialHeatmap = () => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px', height: '48px' }}>
    {[...Array(18)].map((_, i) => {
      const heat = Math.random();
      const color = heat > 0.8 ? '#00e5ff' : heat > 0.5 ? '#00e676' : heat > 0.2 ? '#004d2c' : '#111';
      return <div key={i} style={{ background: color, borderRadius: '2px', opacity: 0.9 }} />
    })}
  </div>
);

// ==========================================
// AI SYNTHESIS & ACTION WRAPPER
// ==========================================
const AISynthesisFooter = ({ overview, actions }) => (
  <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px dashed rgba(255,255,255,0.1)', display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px' }}>
    <div>
      <div style={{ fontSize: '10px', color: '#00e5ff', fontFamily: mono, textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '1px' }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg> Data Breakdown & AI Synthesis
      </div>
      <div style={{ fontSize: '12px', color: '#aaa', lineHeight: '1.7', fontFamily: sans }}>{overview}</div>
    </div>
    <div>
      <div style={{ fontSize: '10px', color: '#00e676', fontFamily: mono, textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '1px' }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> Automated Action Plan
      </div>
      <ul style={{ margin: 0, paddingLeft: '16px', color: '#ccc', fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '10px', fontFamily: sans }}>
        {actions.map((act, i) => <li key={i}>{act}</li>)}
      </ul>
    </div>
  </div>
);

// ==========================================
// ANALYTIC VIEWS
// ==========================================

const CashVelocityView = () => (
  <div style={{ display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.4s ease-out' }}>
    
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
      {/* 1. Daily Cash Velocity (7-Days) */}
      <div style={{ background: '#09090b', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontFamily: mono, marginBottom: '8px' }}>Daily Cash Velocity (Trailing 7 Days)</div>
        <div style={{ fontSize: '32px', fontWeight: '700', color: '#fff', fontFamily: mono }}>₦<LiveNumber base={142.5} format="currency" suffix="M" /></div>
        <svg width="100%" height="80" viewBox="0 0 200 80" preserveAspectRatio="none" style={{ position: 'absolute', bottom: 0, left: 0 }}>
          <path d="M0,80 L0,50 Q25,60 50,40 T100,30 T150,45 T200,20 L200,80 Z" fill="rgba(0, 230, 118, 0.1)" />
          <path d="M0,50 Q25,60 50,40 T100,30 T150,45 T200,20" fill="none" stroke="#00e676" strokeWidth="2" />
        </svg>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* 2. Highest Velocity Zone */}
        <div style={{ background: '#09090b', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: '9px', color: '#666', textTransform: 'uppercase', fontFamily: mono, marginBottom: '8px' }}>Highest Velocity Zone</div>
          <div style={{ fontSize: '14px', color: '#fff', fontWeight: '600' }}>Central Wholesale Hub</div>
          <div style={{ fontSize: '10px', color: '#00e676', fontFamily: mono, marginTop: '8px' }}>42.8% TOTAL VOLUME</div>
        </div>
        {/* 3. Top Profit Business */}
        <div style={{ background: '#09090b', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: '9px', color: '#666', textTransform: 'uppercase', fontFamily: mono, marginBottom: '8px' }}>Top Profit Business</div>
          <div style={{ fontSize: '14px', color: '#fff', fontWeight: '600' }}>Acme FMCG Logistics</div>
          <div style={{ fontSize: '10px', color: '#00e5ff', fontFamily: mono, marginTop: '8px' }}>₦18.4M NET PROFIT</div>
        </div>
      </div>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
       {/* 4. Heatmap */}
       <div style={{ background: '#09090b', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
         <div style={{ fontSize: '9px', color: '#888', textTransform: 'uppercase', fontFamily: mono, marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
           <span>Spatial Velocity Heatmap</span><span style={{ color: '#00e676' }}>LIVE</span>
         </div>
         <SpatialHeatmap />
       </div>

       {/* 5, 6, 7, 8. Advanced Metrics */}
       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {[
            { l: 'Modality Split', v: '68% Cash / 32% Dig.', c: '#fff' }, // 5
            { l: 'Ecosystem Dwell', v: '42.5 Hours', c: '#fff' }, // 6
            { l: 'Tx Density', v: <><LiveNumber base={142} format="number"/> / min</>, c: '#00e5ff' }, // 7
            { l: 'Avg Tx Val (ATV)', v: <LiveNumber base={14.2} format="currency" prefix="₦" suffix="k"/>, c: '#00e676' } // 8
          ].map((m, i) => (
            <div key={i} style={{ padding: '16px', background: '#09090b', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '9px', color: '#666', fontFamily: mono, textTransform: 'uppercase' }}>{m.l}</span>
              <span style={{ fontSize: '12px', color: m.c, fontWeight: '700', fontFamily: mono }}>{m.v}</span>
            </div>
          ))}
       </div>
    </div>

    <AISynthesisFooter 
      overview="Telemetry detects a highly concentrated liquidity vortex in Central Market. Cash-to-digital conversion has spiked 14% in the last 48 hours, driven by wholesale commodity trading. Ecosystem retention remains strong at 42.5 hours before cash physically exits the geofence. High transaction density combined with a low ATV indicates massive micro-retail dominance."
      actions={[
        "Deploy rapid-response digital POS terminals to Central Wholesale Hub.",
        "Incentivize digital conversion with a 2% fee waiver for the next 4 hours.",
        "Prepare logistics for high-volume cash extraction from Central Hub."
      ]}
    />
  </div>
);

const DemandView = () => (
  <div style={{ display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.4s ease-out' }}>
    
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '24px', marginBottom: '24px' }}>
      {/* 1. Demand % */}
      <div style={{ background: '#09090b', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontFamily: mono, marginBottom: '12px' }}>Demand Surge vs 7-Day Baseline</div>
        <div style={{ fontSize: '36px', fontWeight: '700', color: '#00e5ff', fontFamily: mono }}>+<LiveNumber base={45.2} format="percent" /></div>
      </div>
      
      {/* 2. Predictive Heatmap Surge */}
      <div style={{ background: '#09090b', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ fontSize: '9px', color: '#666', textTransform: 'uppercase', fontFamily: mono, marginBottom: '12px' }}>Predictive Surge Trajectory</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 2fr 1fr', fontSize: '8px', color: '#555', fontFamily: mono, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px', marginBottom: '8px' }}>
          <span>TIME (PEAK)</span><span>LOCATION</span><span>CATALYST (WHY)</span><span>INTENSITY</span>
        </div>
        {[
          { t: '08:00 ➔ 10:30', loc: 'Transit Perimeter', r: 'Morning Commuter Influx', l: 'MILD', c: '#f59e0b' },
          { t: '14:00 ➔ 16:00', loc: 'Central Wholesale', r: 'B2B Settlement Window', l: 'PEAK', c: '#ef4444' },
          { t: '18:30 ➔ 21:00', loc: 'Retail Alley', r: 'Evening Micro-Fulfillment', l: 'HIGH', c: '#00e676' }
        ].map((s, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 2fr 1fr', alignItems: 'center', fontSize: '11px', color: '#ccc', padding: '6px 0' }}>
            <span style={{ fontFamily: mono, fontSize: '10px' }}>{s.t}</span>
            <span style={{ fontWeight: '600', color: '#fff' }}>{s.loc}</span>
            <span style={{ fontSize: '10px', color: '#888' }}>{s.r}</span>
            <span style={{ fontSize: '9px', fontWeight: '700', color: s.c, fontFamily: mono }}>{s.l}</span>
          </div>
        ))}
      </div>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
      {/* 3. Heatmap Levels */}
      <div style={{ padding: '16px', background: '#09090b', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ fontSize: '9px', color: '#666', textTransform: 'uppercase', fontFamily: mono, marginBottom: '12px' }}>Zone Demand Levels</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#fff', marginBottom: '6px' }}><span>Core</span><span style={{ color: '#ef4444', fontFamily: mono }}>HIGH</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#fff', marginBottom: '6px' }}><span>East</span><span style={{ color: '#f59e0b', fontFamily: mono }}>MILD</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#fff' }}><span>North</span><span style={{ color: '#555', fontFamily: mono }}>NONE</span></div>
      </div>
      
      {/* 4. Top Business */}
      <div style={{ padding: '16px', background: '#09090b', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ fontSize: '9px', color: '#666', textTransform: 'uppercase', fontFamily: mono, marginBottom: '12px' }}>Top Demanded Biz</div>
        <div style={{ fontSize: '13px', color: '#fff', fontWeight: '600' }}>Apex Suppliers</div>
        <div style={{ fontSize: '10px', color: '#00e5ff', marginTop: '8px', fontFamily: mono }}>842 LIVE ORDERS</div>
      </div>

      {/* 5 & 6. Conversion & Burn */}
      <div style={{ padding: '16px', background: '#09090b', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '4px', justifyContent: 'center' }}>
        <div style={{ fontSize: '9px', color: '#666', textTransform: 'uppercase', fontFamily: mono }}>Dmd-to-Sale Conv.</div>
        <div style={{ fontSize: '16px', color: '#00e676', fontWeight: '700', fontFamily: mono }}><LiveNumber base={64.2} format="percent"/></div>
      </div>
      <div style={{ padding: '16px', background: '#09090b', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '4px', justifyContent: 'center' }}>
        <div style={{ fontSize: '9px', color: '#666', textTransform: 'uppercase', fontFamily: mono }}>Inventory Burn / Elasticity</div>
        <div style={{ fontSize: '14px', color: '#ef4444', fontWeight: '700', fontFamily: mono }}>1.8x <span style={{color:'#888', fontSize:'10px'}}>| High Tol.</span></div>
      </div>
    </div>

    <AISynthesisFooter 
      overview="Predictive heatmaps indicate a massive 45% surge in aggregate demand. This surge consistently originates from the Transit Perimeter at 08:00 AM and collapses into the Central Wholesale hub by 14:00. While the inventory burn rate is critical at 1.8x baseline, the Demand-to-Sale conversion remains steady at 64.2%. High price elasticity suggests the market will absorb an emergency markup."
      actions={[
        "Execute emergency inventory restock for Apex Suppliers before 14:00.",
        "Apply a +4% dynamic pricing markup to all Central Wholesale inventory.",
        "Divert idle logistics assets from North Zone to Core."
      ]}
    />
  </div>
);

const MarketView = () => (
  <div style={{ display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.4s ease-out' }}>
    
    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px', marginBottom: '24px' }}>
      {/* 1. Infographic of Share */}
      <div style={{ background: '#09090b', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '32px' }}>
        <div style={{ position: 'relative', width: '100px', height: '100px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <svg viewBox="0 0 100 100" width="100%" height="100%">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#111" strokeWidth="10" />
            <circle cx="50" cy="50" r="40" fill="none" stroke="#00e676" strokeWidth="10" strokeDasharray="251" strokeDashoffset="80" strokeLinecap="round" />
            <circle cx="50" cy="50" r="40" fill="none" stroke="#00e5ff" strokeWidth="10" strokeDasharray="251" strokeDashoffset="220" strokeLinecap="round" />
          </svg>
          <div style={{ position: 'absolute', fontSize: '20px', fontWeight: '700', color: '#fff', fontFamily: mono }}>68%</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#fff', marginBottom: '8px' }}>Informal Market Dominance</div>
          <div style={{ fontSize: '11px', color: '#888', lineHeight: '1.6', marginBottom: '12px' }}>Driven by <strong style={{color:'#ccc'}}>Credit Networks (32%)</strong>, <strong style={{color:'#ccc'}}>Zero-KYC (45%)</strong>, & <strong style={{color:'#ccc'}}>Dynamic Pricing (23%)</strong>.</div>
          <div style={{ display: 'flex', gap: '16px', fontFamily: mono }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{width:'8px',height:'8px',background:'#00e676',borderRadius:'50%'}}/><span style={{fontSize:'9px',color:'#888'}}>Informal</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{width:'8px',height:'8px',background:'#00e5ff',borderRadius:'50%'}}/><span style={{fontSize:'9px',color:'#888'}}>Formal</span></div>
          </div>
        </div>
      </div>

      {/* 3, 4, 5. Market Metrics */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
         {[
           { l: 'Vendor Defection (Churn)', v: '4.2%', c: '#ef4444' },
           { l: 'Wholesale Pricing Delta', v: '-2.4% vs Avg', c: '#00e676' },
           { l: 'Zone Saturation Index', v: '88% (Peak)', c: '#f59e0b' }
         ].map((m, i) => (
           <div key={i} style={{ padding: '16px', background: '#09090b', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flex: 1 }}>
             <span style={{ fontSize: '9px', color: '#666', textTransform: 'uppercase', fontFamily: mono }}>{m.l}</span>
             <span style={{ fontSize: '13px', color: m.c, fontWeight: '700', fontFamily: mono }}>{m.v}</span>
           </div>
         ))}
      </div>
    </div>

    {/* 2. Real-time Comp Analysis */}
    <div style={{ background: '#09090b', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ fontSize: '9px', color: '#666', textTransform: 'uppercase', fontFamily: mono, marginBottom: '16px' }}>Real-Time Competitor Telemetry</div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', paddingBottom: '8px', borderBottom: '1px solid #222', fontSize: '9px', color: '#555', fontFamily: mono }}>
        <span>COMPETITOR</span><span>DMND SHARE</span><span>SALES VOL</span><span>VELOCITY</span>
      </div>
      {[
        { n: 'Rival Logistics Co.', d: '24%', s: '₦84.2M', v: 'High', c: '#00e676' },
        { n: 'Urban Supply Hub', d: '18%', s: '₦61.0M', v: 'Med', c: '#f59e0b' },
        { n: 'Metro Micro-Retailers', d: '14%', s: '₦42.5M', v: 'Low', c: '#ef4444' }
      ].map((r, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '16px 0', borderBottom: i === 2 ? 'none' : '1px solid #1a1a1c', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: '600', color: '#fff' }}>{r.n}</span>
          <span style={{ fontSize: '11px', color: '#aaa', fontFamily: mono }}>{r.d}</span>
          <span style={{ fontSize: '11px', color: '#aaa', fontFamily: mono }}>{r.s}</span>
          <span style={{ fontSize: '9px', color: r.c, fontFamily: mono, background: `${r.c}15`, padding: '4px 8px', borderRadius: '4px', width: 'fit-content' }}>{r.v}</span>
        </div>
      ))}
    </div>

    <AISynthesisFooter 
      overview="Informal networks are actively capturing 68% of the market share, heavily driven by localized zero-KYC credit lines. Overall competitor capital drain has decreased, but Rival Logistics Co. is experiencing severe logistics friction at the North Gate. This specific bottleneck has resulted in a 4.2% vendor defection rate directly into our network over the last 12 hours."
      actions={[
        "Target defecting vendors with a zero-fee onboarding campaign.",
        "Maintain current pricing delta (-2.4%) to accelerate competitor churn.",
        "Monitor Zone Saturation; prepare to halt onboarding if index exceeds 92%."
      ]}
    />
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
      
      {/* 1. OBSIDIAN HERO SECTION (Fully Rebuilt & Sleek) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {/* Sleek Profile Avatar */}
          <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'linear-gradient(135deg, #00e676, #004d2c)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#050505', fontWeight: '800', fontSize: '24px', boxShadow: '0 0 20px rgba(0, 230, 118, 0.2)' }}>
            A
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
               <h1 style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-0.5px', margin: 0, color: '#fff' }}>Acme FMCG Logistics</h1>
               <span style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', color: '#aaa', display: 'flex', alignItems: 'center', gap: '6px' }}>
                 <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg> Abuja, FCT
               </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#00e5ff', fontFamily: mono }}>
               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
               Credit Available: ₦24.5M
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: '#0a0a0c', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 16px', borderRadius: '8px', gap: '10px', width: '280px', transition: 'border 0.2s' }}>
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
             <input type="text" placeholder="Search systems or metrics..." style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '13px', color: '#fff', width: '100%', fontFamily: sans }} />
          </div>
          <div style={{ position: 'relative', cursor: 'pointer', padding: '10px', background: '#0a0a0c', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
            <div style={{ position: 'absolute', top: '8px', right: '8px', width: '6px', height: '6px', background: '#00e676', borderRadius: '50%', boxShadow: '0 0 8px #00e676' }} />
          </div>
        </div>
      </div>

      {/* 2. COMPACT MINI-CHART METRIC CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {[
          { id: 'velocity', label: 'Cash Velocity', val: '₦142.5M', chart: <Sparkline color="#00e676" data="M0,15 L15,20 L30,10 L45,15 L60,5 L80,10" /> },
          { id: 'demands', label: 'Demands', val: '+45%', chart: <Sparkline color="#00e5ff" data="M0,20 L20,15 L40,18 L60,5 L80,8" /> },
          { id: 'market', label: 'Market (Comp)', val: '68%', chart: <Sparkline color="#f59e0b" data="M0,10 L20,15 L40,5 L60,10 L80,2" /> },
          { id: 'actions', label: 'Action Plan', val: '3 Pending', chart: <Sparkline color="#ef4444" data="M0,5 L20,10 L40,8 L60,20 L80,15" /> }
        ].map(card => {
          const isActive = activeTab === card.id;
          return (
            <div 
              key={card.id} onClick={() => setActiveTab(card.id)}
              style={{ background: isActive ? 'rgba(255,255,255,0.05)' : '#0a0a0c', padding: '20px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s', border: `1px solid ${isActive ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: isActive ? '0 10px 30px rgba(0,0,0,0.5)' : 'none' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '10px', color: isActive ? '#fff' : '#888', fontFamily: mono, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{card.label}</span>
                <span style={{ fontSize: '24px', fontWeight: '700', color: '#fff', fontFamily: mono, letterSpacing: '-0.5px' }}>{card.val}</span>
              </div>
              <div style={{ opacity: isActive ? 1 : 0.4, transition: 'opacity 0.2s' }}>{card.chart}</div>
            </div>
          );
        })}
      </div>

      {/* 3. MAIN SPLIT VIEW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2.5fr) 1fr', gap: '32px' }}>
        
        {/* LEFT COLUMN: Deep Analytic View */}
        <div style={{ background: '#060608', borderRadius: '16px', padding: '32px', border: '1px solid rgba(255,255,255,0.05)', minHeight: '500px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
            <div style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.05)', color: '#fff', borderRadius: '4px', fontSize: '9px', fontFamily: mono, textTransform: 'uppercase', letterSpacing: '1px' }}>Analytic View</div>
            <div style={{ fontSize: '14px', color: '#ccc', fontWeight: '500' }}>
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
          <div style={{ background: '#0a0a0c', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', height: '420px', overflow: 'hidden' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
              <span style={{ fontSize: '11px', color: '#fff', fontFamily: mono, textTransform: 'uppercase', letterSpacing: '1px' }}>System Copilot</span>
            </div>
            
            <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(0, 229, 255, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#00e5ff', flexShrink: 0 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '8px', fontSize: '13px', color: '#ccc', lineHeight: '1.6', border: '1px solid rgba(255,255,255,0.05)' }}>
                  How can I assist with your supply chain logistics today? I noticed a surge in the Central Hub.
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flexDirection: 'row-reverse' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#00e676', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#000', fontSize: '12px', fontWeight: '800', flexShrink: 0 }}>
                  A
                </div>
                <div style={{ background: '#111', padding: '14px', borderRadius: '8px', fontSize: '13px', color: '#fff', lineHeight: '1.6', border: '1px solid rgba(255,255,255,0.1)' }}>
                  Route excess inventory to the Retail Alley for the 18:30 peak.
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(0, 229, 255, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#00e5ff', flexShrink: 0 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                </div>
                <div style={{ background: 'transparent', padding: '14px', fontSize: '16px', color: '#888', display: 'flex', gap: '4px' }}>
                   <span style={{ animation: 'pulseLive 1s infinite' }}>●</span>
                   <span style={{ animation: 'pulseLive 1s infinite 0.2s' }}>●</span>
                   <span style={{ animation: 'pulseLive 1s infinite 0.4s' }}>●</span>
                </div>
              </div>
            </div>

            <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', background: '#050505' }}>
              <div style={{ display: 'flex', alignItems: 'center', background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 16px' }}>
                <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Prompt System AI..." style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: '13px', fontFamily: sans }} />
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" style={{ cursor: 'pointer' }}><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
              </div>
            </div>
          </div>

          {/* Live Alerts Widget */}
          <div style={{ background: '#0a0a0c', borderRadius: '16px', padding: '28px', border: '1px solid rgba(255,255,255,0.05)', flex: 1 }}>
            <div style={{ fontSize: '11px', fontFamily: mono, color: '#fff', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '28px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              Live Operations
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '10px', bottom: '10px', left: '4.5px', width: '1px', background: 'rgba(255,255,255,0.05)', zIndex: 0 }} />
              
              <div style={{ display: 'flex', gap: '20px', position: 'relative', zIndex: 1 }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#00e5ff', marginTop: '4px', outline: '4px solid #0a0a0c' }} />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff' }}>Demand Surge Hit</div>
                  <div style={{ fontSize: '10px', color: '#888', fontFamily: mono, marginTop: '6px' }}>WEST MARKET • 14:00</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '20px', position: 'relative', zIndex: 1 }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', marginTop: '4px', outline: '4px solid #0a0a0c' }} />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff' }}>Vendor Attrition Alert</div>
                  <div style={{ fontSize: '10px', color: '#888', fontFamily: mono, marginTop: '6px' }}>NORTH GATE • 15:15</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '20px', position: 'relative', zIndex: 1 }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#666', marginTop: '4px', outline: '4px solid #0a0a0c' }} />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff' }}>Velocity Vector Locked</div>
                  <div style={{ fontSize: '10px', color: '#888', fontFamily: mono, marginTop: '6px' }}>ALL SECTORS • 16:00</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulseLive { 0% { opacity: 1; transform: scale(1); } 50% { opacity: 0.3; transform: scale(1.5); } 100% { opacity: 1; transform: scale(1); } }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
}
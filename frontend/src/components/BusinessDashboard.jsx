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

  return <span>{prefix}{display}{suffix}</span>;
};

// ==========================================
// ANALYTIC VIEWS (DYNAMIC CONTENT)
// ==========================================

const CashVelocityView = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.4s ease-out' }}>
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', height: '180px', position: 'relative' }}>
      {/* Smooth Area Chart */}
      <svg width="100%" height="100%" viewBox="0 0 500 150" preserveAspectRatio="none">
        <defs>
          <linearGradient id="velGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="rgba(16, 185, 129, 0.2)"/><stop offset="100%" stopColor="rgba(16, 185, 129, 0)"/></linearGradient>
        </defs>
        <path d="M0,150 L0,100 Q50,120 100,80 T200,60 T300,90 T400,40 T500,70 L500,150 Z" fill="url(#velGrad)" />
        <path d="M0,100 Q50,120 100,80 T200,60 T300,90 T400,40 T500,70" fill="none" stroke="#10b981" strokeWidth="3" />
        {/* Live Data Pulse */}
        <circle cx="500" cy="70" r="5" fill="#10b981" style={{ animation: 'pulseLive 2s infinite' }} />
      </svg>
      <div style={{ position: 'absolute', top: 0, left: 0 }}>
        <div style={{ fontSize: '32px', fontWeight: '800', color: '#111827', letterSpacing: '-1px' }}>₦<LiveNumber base={142.5} format="currency" suffix="M" /></div>
        <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Daily Cash Velocity (Trailing 7 Days)</div>
      </div>
    </div>
    
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
      <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #f3f4f6' }}>
        <div style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', fontWeight: '700', marginBottom: '8px' }}>Highest Velocity Zone</div>
        <div style={{ fontSize: '16px', color: '#111827', fontWeight: '700' }}>Central Wholesale Hub</div>
        <div style={{ fontSize: '12px', color: '#10b981', fontWeight: '600', marginTop: '4px' }}>42.8% of total volume</div>
      </div>
      <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #f3f4f6' }}>
        <div style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', fontWeight: '700', marginBottom: '8px' }}>Top Profit Business</div>
        <div style={{ fontSize: '16px', color: '#111827', fontWeight: '700' }}>Acme FMCG Logistics</div>
        <div style={{ fontSize: '12px', color: '#10b981', fontWeight: '600', marginTop: '4px' }}>₦18.4M Net Profit (Today)</div>
      </div>
      <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
        <div style={{ fontSize: '11px', color: '#ef4444', textTransform: 'uppercase', fontWeight: '700', marginBottom: '8px' }}>Capital Leakage (New)</div>
        <div style={{ fontSize: '16px', color: '#111827', fontWeight: '700' }}>₦<LiveNumber base={4.2} format="currency" suffix="M" /></div>
        <div style={{ fontSize: '12px', color: '#ef4444', fontWeight: '600', marginTop: '4px' }}>Unrecorded out-of-zone flow</div>
      </div>
    </div>
  </div>
);

const DemandView = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.4s ease-out' }}>
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', height: '180px', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 0, left: 0 }}>
        <div style={{ fontSize: '32px', fontWeight: '800', color: '#111827', letterSpacing: '-1px' }}>+<LiveNumber base={45.2} format="percent" /></div>
        <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Demand Surge vs Trailing 7-Day Average</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '100px', width: '100%', paddingLeft: '160px' }}>
        {[40, 55, 30, 80, 60, 100, 75].map((h, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '16px', height: `${h}%`, background: i === 5 ? '#10b981' : '#e5e7eb', borderRadius: '4px', transition: 'height 0.5s' }} />
            <span style={{ fontSize: '10px', color: '#9ca3af', fontFamily: mono }}>D-{6-i}</span>
          </div>
        ))}
      </div>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px' }}>
      <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #f3f4f6' }}>
        <div style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', fontWeight: '700', marginBottom: '12px' }}>Predictive Surge Heatmap Timeline</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { time: '08:00 AM', loc: 'Transit Perimeter', r: 'Commuter influx', l: 'Mild' },
            { time: '02:00 PM', loc: 'Central Hub', r: 'Wholesale settlement', l: 'Peak' },
            { time: '06:30 PM', loc: 'Retail Alley', r: 'Evening fulfillment', l: 'High' }
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '11px', fontFamily: mono, color: '#4b5563', background: '#e5e7eb', padding: '2px 6px', borderRadius: '4px' }}>{s.time}</span>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#111827' }}>{s.loc}</span>
                  <span style={{ fontSize: '10px', color: '#6b7280' }}>{s.r}</span>
                </div>
              </div>
              <span style={{ fontSize: '10px', fontWeight: '700', color: s.l === 'Peak' ? '#ef4444' : s.l === 'High' ? '#f59e0b' : '#10b981', textTransform: 'uppercase' }}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #f3f4f6', flex: 1 }}>
          <div style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', fontWeight: '700', marginBottom: '4px' }}>Top Demanded Business</div>
          <div style={{ fontSize: '16px', color: '#111827', fontWeight: '700' }}>Apex Suppliers Ltd.</div>
        </div>
        <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #f3f4f6', flex: 1 }}>
          <div style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', fontWeight: '700', marginBottom: '4px' }}>Unfulfilled Demand Gap (New)</div>
          <div style={{ fontSize: '16px', color: '#ef4444', fontWeight: '700' }}>18.4% Shortage</div>
        </div>
      </div>
    </div>
  </div>
);

const MarketView = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.4s ease-out' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '40px', height: '180px' }}>
      <div style={{ position: 'relative', width: '140px', height: '140px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <svg viewBox="0 0 100 100" width="100%" height="100%">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="12" />
          <circle cx="50" cy="50" r="40" fill="none" stroke="#10b981" strokeWidth="12" strokeDasharray="251" strokeDashoffset="80" strokeLinecap="round" />
          <circle cx="50" cy="50" r="40" fill="none" stroke="#f59e0b" strokeWidth="12" strokeDasharray="251" strokeDashoffset="220" strokeLinecap="round" />
        </svg>
        <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: '28px', fontWeight: '800', color: '#111827', letterSpacing: '-1px' }}>68%</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: '700', color: '#111827' }}>Informal Market Dominance</div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Real-time factors driving share: localized credit networks (32%), zero-KYC friction (45%), and dynamic pricing (23%).</div>
        </div>
        <div style={{ display: 'flex', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{width:'10px',height:'10px',borderRadius:'2px',background:'#10b981'}}/><span style={{fontSize:'12px',color:'#4b5563',fontWeight:'600'}}>Informal (68%)</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{width:'10px',height:'10px',borderRadius:'2px',background:'#f59e0b'}}/><span style={{fontSize:'12px',color:'#4b5563',fontWeight:'600'}}>Formal (21%)</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{width:'10px',height:'10px',borderRadius:'2px',background:'#e5e7eb'}}/><span style={{fontSize:'12px',color:'#4b5563',fontWeight:'600'}}>Untapped (11%)</span></div>
        </div>
      </div>
    </div>

    <div style={{ background: '#f9fafb', borderRadius: '12px', border: '1px solid #f3f4f6', padding: '16px' }}>
      <div style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', fontWeight: '700', marginBottom: '12px' }}>Real-Time Competitor Analysis</div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', paddingBottom: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '10px', color: '#9ca3af', fontWeight: '700', textTransform: 'uppercase' }}>
          <span>Competitor</span><span>Demand Share</span><span>Sales Vol</span><span>Cash Velocity</span>
        </div>
        {[
          { n: 'Rival Logistics Co.', d: '24%', s: '₦84.2M', v: 'High', c: '#10b981' },
          { n: 'Urban Supply Hub', d: '18%', s: '₦61.0M', v: 'Med', c: '#f59e0b' },
          { n: 'Metro Micro-Retailers', d: '14%', s: '₦42.5M', v: 'Low', c: '#ef4444' }
        ].map((r, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '12px 0', borderBottom: i === 2 ? 'none' : '1px solid #f3f4f6', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>{r.n}</span>
            <span style={{ fontSize: '12px', color: '#4b5563', fontWeight: '500' }}>{r.d}</span>
            <span style={{ fontSize: '12px', color: '#4b5563', fontFamily: mono }}>{r.s}</span>
            <span style={{ fontSize: '10px', color: r.c, fontWeight: '700', textTransform: 'uppercase', padding: '4px 8px', background: `${r.c}15`, borderRadius: '4px', width: 'fit-content' }}>{r.v}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const ActionPlanView = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.4s ease-out' }}>
    <div style={{ fontSize: '18px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>Master Execution Plan</div>
    {[
      { t: 'Reroute Supply Chain: Bypass North Gate Friction', p: 'Critical', s: 'Pending Exec' },
      { t: 'Deploy Mobile Settlement Terminals to Central Hub', p: 'High', s: 'In Progress' },
      { t: 'Adjust Pricing: +6% markup in high-demand zones', p: 'Medium', s: 'Scheduled' }
    ].map((a, i) => (
      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid #d1d5db', cursor: 'pointer' }} />
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{a.t}</span>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <span style={{ fontSize: '10px', fontWeight: '700', color: a.p === 'Critical' ? '#ef4444' : a.p === 'High' ? '#f59e0b' : '#3b82f6', background: a.p === 'Critical' ? '#fef2f2' : a.p === 'High' ? '#fffbeb' : '#eff6ff', padding: '4px 10px', borderRadius: '20px', textTransform: 'uppercase' }}>{a.p}</span>
          <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: '500', background: '#f3f4f6', padding: '4px 10px', borderRadius: '20px' }}>{a.s}</span>
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
    velocity: "Based on logic, telemetry detects a highly concentrated liquidity vortex in Central Market. Cash-to-digital conversion has spiked 14% in the last 48 hours, driven by wholesale commodity trading. Acme FMCG Logistics is currently capturing the highest profit margins by routing through low-friction secondary roads.",
    demands: "Predictive heatmaps indicate a massive 45% surge in aggregate demand compared to the 7-day trailing average. This surge originates from the Transit Perimeter at 08:00 AM and migrates to the Central Hub by 14:00. An unfulfilled demand gap of 18.4% exists—representing immediate lost revenue potential.",
    market: "Informal networks are actively capturing 68% of the market share. Competitor capital drain has decreased, but rival networks are experiencing severe logistics friction at the North Gate, resulting in a 14% vendor defection rate. You currently hold a pricing monopoly on premium tier goods.",
    actions: "Based on combined velocity, demand, and market data, System AI has generated a master execution strategy to maximize liquidity capture over the next 7 days. Immediate action required on the North Gate bypass to prevent a 12% logistical depreciation."
  };

  return (
    <div style={{ flex: 1, background: '#f4f7f6', color: '#111827', padding: '32px 40px', overflowY: 'auto', fontFamily: sans }}>
      
      {/* 1. Dashboard Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px', margin: '0 0 4px 0', color: '#111827' }}>Welcome Back, Founder</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
            Active Project: <span style={{ color: '#111827', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>Acme FMCG Logistics <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg></span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid #e5e7eb', padding: '8px 16px', borderRadius: '20px', gap: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
             <input type="text" placeholder="Search data..." style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '13px', color: '#111827', width: '120px' }} />
          </div>
          <button style={{ background: '#111827', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(17, 24, 39, 0.3)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg> AI Assistant
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
        {[
          { id: 'velocity', label: 'Cash Velocity', val: '₦142.5M', sub: '+12.4% vs Last 7 Days', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg> },
          { id: 'demands', label: 'Demands', val: '+45%', sub: 'Surge detected in 3 Hubs', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg> },
          { id: 'market', label: 'Market (Comp)', val: '68%', sub: 'Informal Share Captured', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a10 10 0 0 1 10 10"></path></svg> },
          { id: 'actions', label: 'Action Plan', val: '3', sub: 'Critical tasks pending', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> }
        ].map(card => {
          const isActive = activeTab === card.id;
          return (
            <div 
              key={card.id} onClick={() => setActiveTab(card.id)}
              style={{ background: isActive ? '#111827' : '#fff', color: isActive ? '#fff' : '#111827', padding: '24px', borderRadius: '20px', cursor: 'pointer', transition: 'all 0.3s ease', boxShadow: isActive ? '0 10px 25px rgba(17, 24, 39, 0.2)' : '0 4px 15px rgba(0,0,0,0.03)', border: `1px solid ${isActive ? '#111827' : '#e5e7eb'}`, display: 'flex', flexDirection: 'column', position: 'relative' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: isActive ? '#9ca3af' : '#6b7280' }}>{card.label}</span>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: isActive ? 'rgba(16, 185, 129, 0.2)' : '#f3f4f6', color: isActive ? '#10b981' : '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{card.icon}</div>
              </div>
              <div style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-1px', marginBottom: '8px' }}>{card.val}</div>
              <div style={{ fontSize: '11px', fontWeight: '500', color: isActive ? '#10b981' : '#6b7280' }}>{card.sub}</div>
            </div>
          );
        })}
      </div>

      {/* 3. Main Split View */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2.5fr) 1fr', gap: '24px' }}>
        
        {/* LEFT COLUMN: Analytic View & AI Overview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ background: '#fff', borderRadius: '24px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #e5e7eb', minHeight: '340px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
              <div style={{ padding: '6px 12px', background: '#111827', color: '#fff', borderRadius: '8px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Analytic View</div>
              <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '600' }}>
                {activeTab === 'velocity' ? 'Cash Velocity Trends' : activeTab === 'demands' ? 'Demand Heatmap & Surges' : activeTab === 'market' ? 'Competition & Market Share' : 'Master Action Plan'}
              </div>
            </div>
            
            {activeTab === 'velocity' && <CashVelocityView />}
            {activeTab === 'demands' && <DemandView />}
            {activeTab === 'market' && <MarketView />}
            {activeTab === 'actions' && <ActionPlanView />}
          </div>

          {/* Bottom Grid: AI Overview & Action Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
            <div style={{ background: '#fff', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#111827', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg> AI Overview
              </div>
              <div style={{ fontSize: '13px', color: '#4b5563', lineHeight: '1.6' }}>
                {aiOverviews[activeTab]}
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid #e5e7eb' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                 <div style={{ fontSize: '13px', fontWeight: '700', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
                   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> Action Plan
                 </div>
                 <div style={{ fontSize: '10px', fontWeight: '700', background: '#111827', color: '#fff', padding: '4px 10px', borderRadius: '12px', cursor: 'pointer' }}>More</div>
               </div>
               <ul style={{ margin: 0, paddingLeft: '16px', color: '#4b5563', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                 <li>Reroute Supply Chain: Bypass North Gate Friction.</li>
                 <li>Deploy Mobile Settlement Terminals to Hub.</li>
                 <li>Adjust Pricing: +6% markup in high-demand zones.</li>
               </ul>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Right Sidebar Widgets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Calendar Widget */}
          <div style={{ background: '#fff', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#111827' }}>October 2026</div>
              <div style={{ display: 'flex', gap: '8px', color: '#9ca3af' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{cursor:'pointer'}}><polyline points="15 18 9 12 15 6"></polyline></svg>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{cursor:'pointer'}}><polyline points="9 18 15 12 9 6"></polyline></svg>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', textAlign: 'center', fontSize: '11px', color: '#6b7280', fontWeight: '600', marginBottom: '12px' }}>
              <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', textAlign: 'center', fontSize: '12px', color: '#111827', fontWeight: '500' }}>
              {[...Array(31)].map((_, i) => {
                const day = i + 1;
                const isToday = day === 12; // Matching the context date
                return (
                  <div key={day} style={{ padding: '6px 0', background: isToday ? '#10b981' : 'transparent', color: isToday ? '#fff' : '#111827', borderRadius: '50%', cursor: 'pointer', fontWeight: isToday ? '700' : '500' }}>
                    {day}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Alerts Widget */}
          <div style={{ background: '#fff', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid #e5e7eb', flex: 1 }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#111827', marginBottom: '20px' }}>October 12, 2026</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '10px', bottom: '10px', left: '3.5px', width: '1px', background: '#e5e7eb', zIndex: 0 }} />
              
              <div style={{ display: 'flex', gap: '12px', position: 'relative', zIndex: 1 }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', marginTop: '4px', outline: '4px solid #fff' }} />
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#111827' }}>Demand Surge Hit</div>
                  <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px' }}>West Market • 45 min read • 2pm</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', position: 'relative', zIndex: 1 }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', marginTop: '4px', outline: '4px solid #fff' }} />
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#111827' }}>Vendor Attrition Alert</div>
                  <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px' }}>North Gate • 15 min read • 3pm</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', position: 'relative', zIndex: 1 }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#111827', marginTop: '4px', outline: '4px solid #fff' }} />
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#111827' }}>Daily Velocity Locked</div>
                  <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px' }}>All Sectors • Automated • 4pm</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulseLive { 0% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.5); } 100% { opacity: 1; transform: scale(1); } }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
      `}</style>
    </div>
  );
}
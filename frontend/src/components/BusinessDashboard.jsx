import React, { useState } from 'react';

const sans = "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";

export default function BusinessDashboard() {
  const [activeBusiness, setActiveBusiness] = useState('Acme FMCG Logistics');
  // State to track which of the 4 cards is clicked
  const [activeCard, setActiveCard] = useState('velocity'); 

  // --- MOCK DATA FOR THE DYNAMIC VIEWS ---
  const views = {
    velocity: {
      title: "Cash Velocity",
      chartMetric: "₦142.5M",
      chartLabel: "Total Cash Velocity (7 Days)",
      overview: "Street AI logic detects a highly concentrated liquidity vortex in Wuse Market. Cash-to-digital conversion has spiked 12% in the last 48 hours, driven by wholesale commodity trading. The highest profit capture is currently held by localized bulk distributors.",
      actions: [
        "Deploy 5 additional mobile money agents to Wuse Sector 4.",
        "Increase bulk FMCG inventory drop by 15% before 14:00 peak."
      ]
    },
    demand: {
      title: "Market Demands",
      chartMetric: "+45%",
      chartLabel: "Demand Surge (vs Last 7 Days)",
      overview: "A predictive surge heatmap indicates demand will peak this Friday at 16:00. This is driven by end-of-month wage cycles hitting the informal sector. Unmet demand volume currently sits at ₦12.4M due to low formal inventory.",
      actions: [
        "Pre-position micro-sachet inventory in Garki Hub.",
        "Launch localized SMS marketing targeted at Friday rush."
      ]
    },
    market: {
      title: "Competition & Market",
      chartMetric: "68%",
      chartLabel: "Informal Market Share",
      overview: "Competitor capital drain has decreased. Rival networks are experiencing severe logistics friction at the North Gate, resulting in a 14% vendor defection rate. You currently hold a monopoly on premium tier goods in this zone.",
      actions: [
        "Implement a 5% friction premium markup on all FMCG goods.",
        "Onboard defecting vendors with aggressive wholesale discounts."
      ]
    },
    action: {
      title: "Master Action Plan",
      chartMetric: "3",
      chartLabel: "Critical Executions Pending",
      overview: "Based on combined velocity, demand, and market data, Street AI has generated a master execution strategy to maximize liquidity capture over the next 7 days.",
      actions: [
        "Reroute Supply Chain: Bypass North Gate friction.",
        "Deploy Assets: Send 12 PoS terminals to Garki Hub.",
        "Adjust Pricing: +5% markup in high-demand zones."
      ]
    }
  };

  const activeData = views[activeCard];

  return (
    <div style={{ flex: 1, background: '#f4f5f7', color: '#111827', padding: '32px 40px', overflowY: 'auto', fontFamily: sans }}>
      
      {/* 1. HERO SECTION & HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', background: '#fff', padding: '20px 24px', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px', color: '#022c22', margin: '0 0 4px 0' }}>
            Welcome Back, Founder
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>Active Project:</span>
            <select 
              value={activeBusiness}
              onChange={(e) => setActiveBusiness(e.target.value)}
              style={{ background: '#f3f4f6', color: '#022c22', border: 'none', borderRadius: '6px', padding: '4px 8px', fontSize: '14px', fontWeight: '700', outline: 'none', cursor: 'pointer' }}
            >
              <option value="Acme FMCG Logistics">Acme FMCG Logistics</option>
              <option value="Add New">+ Add Business</option>
            </select>
          </div>
        </div>
        
        {/* Right Side Header Utilities */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: '#f3f4f6', padding: '10px 16px', borderRadius: '24px', display: 'flex', alignItems: 'center', gap: '8px', width: '240px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input type="text" placeholder="Search data..." style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '13px', width: '100%' }} />
          </div>
          <div style={{ background: '#022c22', color: '#fff', padding: '10px 20px', borderRadius: '24px', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            AI Assistant
          </div>
        </div>
      </div>

      {/* 2. THE 4 MAIN CLICKABLE CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        
        {/* Cash Velocity Card */}
        <div 
          onClick={() => setActiveCard('velocity')}
          style={{ background: activeCard === 'velocity' ? '#022c22' : '#fff', color: activeCard === 'velocity' ? '#fff' : '#111', border: '1px solid #e5e7eb', borderRadius: '20px', padding: '20px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: activeCard === 'velocity' ? '0 10px 25px rgba(2, 44, 34, 0.2)' : '0 2px 10px rgba(0,0,0,0.02)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <span style={{ fontSize: '13px', fontWeight: '700' }}>Cash Velocity</span>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: activeCard === 'velocity' ? '#00e676' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={activeCard === 'velocity' ? '#022c22' : '#6b7280'} strokeWidth="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', marginBottom: '4px' }}>₦142.5M</div>
          <div style={{ fontSize: '12px', color: activeCard === 'velocity' ? '#a7f3d0' : '#059669', fontWeight: '600' }}>+12.4% vs Last 7 Days</div>
        </div>

        {/* Demands Card */}
        <div 
          onClick={() => setActiveCard('demand')}
          style={{ background: activeCard === 'demand' ? '#022c22' : '#fff', color: activeCard === 'demand' ? '#fff' : '#111', border: '1px solid #e5e7eb', borderRadius: '20px', padding: '20px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: activeCard === 'demand' ? '0 10px 25px rgba(2, 44, 34, 0.2)' : '0 2px 10px rgba(0,0,0,0.02)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <span style={{ fontSize: '13px', fontWeight: '700' }}>Demands</span>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: activeCard === 'demand' ? '#00e676' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={activeCard === 'demand' ? '#022c22' : '#6b7280'} strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', marginBottom: '4px' }}>+45%</div>
          <div style={{ fontSize: '12px', color: activeCard === 'demand' ? '#a7f3d0' : '#059669', fontWeight: '600' }}>Surge detected in 3 Hubs</div>
        </div>

        {/* Market Card */}
        <div 
          onClick={() => setActiveCard('market')}
          style={{ background: activeCard === 'market' ? '#022c22' : '#fff', color: activeCard === 'market' ? '#fff' : '#111', border: '1px solid #e5e7eb', borderRadius: '20px', padding: '20px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: activeCard === 'market' ? '0 10px 25px rgba(2, 44, 34, 0.2)' : '0 2px 10px rgba(0,0,0,0.02)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <span style={{ fontSize: '13px', fontWeight: '700' }}>Market (Comp)</span>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: activeCard === 'market' ? '#00e676' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={activeCard === 'market' ? '#022c22' : '#6b7280'} strokeWidth="2.5"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', marginBottom: '4px' }}>68%</div>
          <div style={{ fontSize: '12px', color: activeCard === 'market' ? '#a7f3d0' : '#059669', fontWeight: '600' }}>Informal Share Captured</div>
        </div>

        {/* Action Plan Card */}
        <div 
          onClick={() => setActiveCard('action')}
          style={{ background: activeCard === 'action' ? '#022c22' : '#fff', color: activeCard === 'action' ? '#fff' : '#111', border: '1px solid #e5e7eb', borderRadius: '20px', padding: '20px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: activeCard === 'action' ? '0 10px 25px rgba(2, 44, 34, 0.2)' : '0 2px 10px rgba(0,0,0,0.02)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <span style={{ fontSize: '13px', fontWeight: '700' }}>Action Plan</span>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: activeCard === 'action' ? '#00e676' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={activeCard === 'action' ? '#022c22' : '#6b7280'} strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', marginBottom: '4px' }}>3</div>
          <div style={{ fontSize: '12px', color: activeCard === 'action' ? '#a7f3d0' : '#ef4444', fontWeight: '600' }}>Critical tasks pending</div>
        </div>

      </div>

      {/* 3. MAIN CONTENT AND RIGHT SIDEBAR GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '24px' }}>
        
        {/* LEFT COMPONENT: DYNAMIC DATA & OVERVIEW */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Main Chart Area */}
          <div style={{ background: '#fff', borderRadius: '24px', padding: '32px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: '#022c22', color: '#fff', padding: '6px 12px', borderRadius: '8px', fontSize: '14px', fontWeight: '700' }}>Analytic View</div>
                <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: '600' }}>{activeData.title}</span>
              </div>
              <button style={{ background: '#f3f4f6', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
              </button>
            </div>

            <div style={{ display: 'flex', gap: '40px', alignItems: 'center' }}>
              <div style={{ minWidth: '150px' }}>
                <div style={{ fontSize: '48px', fontWeight: '800', color: '#111', letterSpacing: '-1px' }}>{activeData.chartMetric}</div>
                <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '600' }}>{activeData.chartLabel}</div>
              </div>
              
              {/* Dynamic Abstract Chart Representation */}
              <div style={{ flex: 1, height: '160px', background: '#f9fafb', borderRadius: '16px', border: '1px solid #f3f4f6', position: 'relative', overflow: 'hidden' }}>
                {activeCard === 'velocity' && (
                  <svg viewBox="0 0 400 160" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
                    <path d="M0 160 L 0 100 Q 50 120, 100 80 T 200 90 T 300 40 T 400 60 L 400 160 Z" fill="rgba(0, 230, 118, 0.1)" />
                    <path d="M0 100 Q 50 120, 100 80 T 200 90 T 300 40 T 400 60" fill="none" stroke="#022c22" strokeWidth="3" />
                  </svg>
                )}
                {activeCard === 'demand' && (
                  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: '100%', padding: '20px' }}>
                    {[40, 60, 30, 90, 120, 80, 50].map((h, i) => (
                      <div key={i} style={{ width: '32px', height: `${h}px`, background: i === 4 ? '#00e676' : '#022c22', borderRadius: '6px' }} />
                    ))}
                  </div>
                )}
                {activeCard === 'market' && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                     <div style={{ width: '120px', height: '120px', borderRadius: '50%', border: '16px solid #f3f4f6', borderTopColor: '#022c22', borderRightColor: '#022c22', borderBottomColor: '#00e676', transform: 'rotate(-45deg)' }} />
                  </div>
                )}
                {activeCard === 'action' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '24px' }}>
                     {[1, 2, 3].map(i => (
                       <div key={i} style={{ height: '24px', background: 'rgba(2, 44, 34, 0.05)', borderRadius: '12px', width: `${100 - (i*15)}%`, borderLeft: '4px solid #00e676' }} />
                     ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Overview & Action Plan Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
            
            {/* AI Overview */}
            <div style={{ background: '#fff', borderRadius: '24px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#111', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00e676" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                AI Overview
              </div>
              <p style={{ fontSize: '13px', color: '#4b5563', lineHeight: '1.6', fontWeight: '500' }}>
                {activeData.overview}
              </p>
            </div>

            {/* Action Plan */}
            <div style={{ background: '#fff', borderRadius: '24px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#111', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#022c22" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                  Action Plan
                </div>
                <button style={{ background: '#022c22', color: '#fff', border: 'none', borderRadius: '12px', padding: '4px 12px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>More</button>
              </div>
              <ul style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {activeData.actions.map((action, i) => (
                  <li key={i} style={{ fontSize: '12px', color: '#4b5563', fontWeight: '600', lineHeight: '1.4' }}>{action}</li>
                ))}
              </ul>
            </div>

          </div>
        </div>

        {/* RIGHT SIDEBAR: CALENDAR & ALERTS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Calendar Block */}
          <div style={{ background: '#fff', borderRadius: '24px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '15px', fontWeight: '800', color: '#111' }}>October 2026</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button style={{ background: '#f3f4f6', border: 'none', borderRadius: '8px', padding: '4px 8px', cursor: 'pointer' }}>&lt;</button>
                <button style={{ background: '#f3f4f6', border: 'none', borderRadius: '8px', padding: '4px 8px', cursor: 'pointer' }}>&gt;</button>
              </div>
            </div>
            
            {/* Simple Calendar Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', textAlign: 'center', fontSize: '12px' }}>
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                <div key={d} style={{ fontWeight: '700', color: '#9ca3af', marginBottom: '8px' }}>{d}</div>
              ))}
              {[27, 28, 29, 30, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31].map((day, i) => (
                 <div key={i} style={{ 
                   fontWeight: '600', 
                   color: i < 4 ? '#d1d5db' : '#111', 
                   background: day === 12 && i > 10 ? '#00e676' : 'transparent', // Highlight today
                   color: day === 12 && i > 10 ? '#022c22' : (i < 4 ? '#d1d5db' : '#111'),
                   borderRadius: '50%', 
                   width: '28px', 
                   height: '28px', 
                   display: 'flex', 
                   alignItems: 'center', 
                   justifyContent: 'center',
                   margin: '0 auto'
                 }}>
                   {day}
                 </div>
              ))}
            </div>
          </div>

          {/* Live Alerts Stream */}
          <div style={{ background: '#fff', borderRadius: '24px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', border: '1px solid #e5e7eb', flex: 1 }}>
            <div style={{ fontSize: '15px', fontWeight: '800', color: '#111', marginBottom: '20px' }}>October 12, 2026</div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#00e676', marginTop: '4px' }} />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#111' }}>Demand Surge Hit</div>
                  <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', marginTop: '2px' }}>Wuse Market • 45 min read • 2pm</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', marginTop: '4px' }} />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#111' }}>Vendor Attrition Alert</div>
                  <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', marginTop: '2px' }}>Garki Hub • 10 min read • 3pm</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#022c22', marginTop: '4px' }} />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#111' }}>Daily Velocity Locked</div>
                  <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', marginTop: '2px' }}>All Sectors • Automated • 4pm</div>
                </div>
              </div>
            </div>
            
          </div>

        </div>
      </div>
    </div>
  );
}
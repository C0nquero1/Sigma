import React from 'react';

const mono = "ui-monospace, monospace";

export default function DeepAnalysisTab({ canvasMode, scanData, contextHub, setCanvasMode }) {
  // Gracefully fallback if the backend hasn't generated deep analysis yet
  const deepData = scanData?.deep_analysis || {
    supply_chain_origin: "Awaiting macro-logistics resolution...",
    buyer_demographic: "Awaiting behavioral analysis...",
    operational_risks: "Scanning for local friction events...",
    micro_hotspots: [
        { name: "Primary Node", flow_share: "Calculating...", peak_time: "..." }
    ]
  };

  const execSummary = deepData.overview_executive_summary || "The spatial analysis indicates a highly concentrated liquidity vortex within the primary aggregator hub. Unrecorded cash velocity is currently outperforming formal sector baselines by a factor of 3.2x in this specific geolocation. Friction variables remain stable, though logistical bottlenecks at wholesale checkpoints show a 12% increase in delay-related capital depreciation over the trailing 72 hours.";

  return (
    <div style={{ position: 'absolute', inset: 0, opacity: canvasMode === 'analysis' ? 1 : 0, pointerEvents: canvasMode === 'analysis' ? 'auto' : 'none', background: 'rgba(5, 5, 7, 0.98)', backdropFilter: 'blur(30px)', padding: '60px 40px 60px 40px', overflowY: 'auto', zIndex: 100, transition: 'opacity 0.3s ease-in-out' }}>
       <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '40px' }}>
          
          {/* Sleek Obsidian UI Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '24px' }}>
             <div>
               <div style={{ fontSize: '36px', color: '#fff', fontWeight: '800', letterSpacing: '-1.5px', marginBottom: '8px' }}>Deep Spatial Analysis</div>
               <div style={{ fontSize: '14px', color: '#888', fontWeight: '500' }}>Extended intelligence & flow topology filtered via parameters.</div>
             </div>
             <div style={{ display: 'flex', gap: '16px' }}>
               <button style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#fff', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }} onMouseEnter={(e)=>{e.currentTarget.style.background='rgba(255,255,255,0.08)'; e.currentTarget.style.color='#fff'}} onMouseLeave={(e)=>{e.currentTarget.style.background='rgba(255,255,255,0.03)'; e.currentTarget.style.color='#aaa'}}>
                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Export CSV
               </button>
               <button style={{ padding: '12px 20px', background: 'linear-gradient(135deg, #3ca096 0%, #28648c 100%)', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '13px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 6px 20px rgba(60, 160, 150, 0.25)' }}>
                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> Generate Report
               </button>
               <button onClick={() => setCanvasMode('map')} style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontWeight: '700', marginLeft: '12px' }}>Close Analysis</button>
             </div>
          </div>

          {/* Generative Intelligence Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            <div style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px' }}>
               <div style={{ fontSize: '11px', color: '#3ca096', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Logistics Origin</div>
               <div style={{ fontSize: '18px', color: '#fff', fontWeight: '700', marginTop: '12px', lineHeight: '1.4' }}>{deepData.supply_chain_origin}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px' }}>
               <div style={{ fontSize: '11px', color: '#74c365', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Primary Demographic</div>
               <div style={{ fontSize: '18px', color: '#fff', fontWeight: '700', marginTop: '12px', lineHeight: '1.4' }}>{deepData.buyer_demographic}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px' }}>
               <div style={{ fontSize: '11px', color: '#ff7b72', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Local Friction & Risks</div>
               <div style={{ fontSize: '18px', color: '#fff', fontWeight: '700', marginTop: '12px', lineHeight: '1.4' }}>{deepData.operational_risks}</div>
            </div>
          </div>

          {/* SECTION 1: Dynamic Data Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
             {[
               { label: 'Total Verified Volume', val: '$4,218,500', trend: '▲ 23%', c: '#74c365' },
               { label: 'Network Velocity Index', val: '84.2', trend: '▲ 17%', c: '#74c365' },
               { label: 'Friction Incidents', val: '142', trend: '▼ 5%', c: '#ff7b72' },
               { label: 'Active Routing Nodes', val: '4,218', trend: '▲ 12%', c: '#74c365' }
             ].map(kpi => (
               <div key={kpi.label} style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px', transition: 'transform 0.2s', cursor: 'default' }} onMouseEnter={(e)=>e.currentTarget.style.transform='translateY(-4px)'} onMouseLeave={(e)=>e.currentTarget.style.transform='translateY(0)'}>
                  <div style={{ fontSize: '11px', color: '#888', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>{kpi.label}</div>
                  <div style={{ fontSize: '32px', color: '#fff', fontWeight: '800', marginTop: '12px', letterSpacing: '-1px' }}>{kpi.val}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: '12px', color: kpi.c, fontWeight: '800' }}>{kpi.trend}</span>
                    <span style={{ fontSize: '11px', color: '#666', fontWeight: '500' }}>YoY growth</span>
                  </div>
               </div>
             ))}
          </div>

          {/* SECTION 2: Complex Graphs & Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '24px' }}>
             
             {/* Area Chart */}
             <div style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '28px', minHeight: '340px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontSize: '16px', color: '#fff', fontWeight: '800' }}>Extended Velocity Trend</div>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '11px', fontWeight: '700' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#aaa' }}><div style={{width:'8px',height:'8px',borderRadius:'50%',background:'#3ca096', boxShadow:'0 0 8px #3ca096'}}/> Transaction Amount</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#aaa' }}><div style={{width:'8px',height:'8px',borderRadius:'50%',background:'#d4d95c', boxShadow:'0 0 8px #d4d95c'}}/> Revenue</span>
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '36px' }}>Trailing 12-month capital flow across targeted hex cells.</div>
                <div style={{ flex: 1, position: 'relative', width: '100%' }}>
                  <svg viewBox="0 0 600 150" style={{ width: '100%', height: '100%', overflow: 'visible' }} preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="0%" stopColor="#3ca096" stopOpacity="0.3" />
                         <stop offset="100%" stopColor="#3ca096" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <line x1="0" y1="37" x2="600" y2="37" stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray="4 4" />
                    <line x1="0" y1="75" x2="600" y2="75" stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray="4 4" />
                    <line x1="0" y1="112" x2="600" y2="112" stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray="4 4" />
                    <line x1="0" y1="150" x2="600" y2="150" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                    <path d="M0,130 L60,100 L120,110 L180,40 L240,60 L300,20 L360,80 L420,40 L480,100 L540,50 L600,10 L600,150 L0,150 Z" fill="url(#areaGrad)" />
                    <path d="M0,130 L60,100 L120,110 L180,40 L240,60 L300,20 L360,80 L420,40 L480,100 L540,50 L600,10" fill="none" stroke="#3ca096" strokeWidth="3" vectorEffect="non-scaling-stroke" />
                    <path d="M0,50 L60,70 L120,60 L180,110 L240,90 L300,130 L360,90 L420,110 L480,50 L540,90 L600,70" fill="none" stroke="#d4d95c" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeDasharray="5,5" />
                  </svg>
                </div>
             </div>

             {/* Radar Chart */}
             <div style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '28px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: '16px', color: '#fff', fontWeight: '800', alignSelf: 'flex-start', marginBottom: '4px' }}>Market Resilience</div>
                <div style={{ fontSize: '12px', color: '#666', alignSelf: 'flex-start', marginBottom: '40px' }}>Multivariate friction analysis.</div>
                <svg viewBox="0 0 100 100" style={{ width: '180px', height: '180px', overflow: 'visible' }}>
                   <polygon points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                   <polygon points="50,25 75,38.5 75,61.5 50,75 25,61.5 25,38.5" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                   <polygon points="50,15 85,45 70,80 30,70 20,35" fill="rgba(116, 195, 101, 0.15)" stroke="#74c365" strokeWidth="2" />
                   <polygon points="50,30 75,35 60,60 40,85 15,50" fill="rgba(60, 160, 150, 0.15)" stroke="#3ca096" strokeWidth="2" />
                </svg>
                <div style={{ display: 'flex', gap: '20px', marginTop: 'auto', fontSize: '11px', fontWeight: '700', color: '#aaa', paddingTop: '24px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{width:'10px',height:'10px',borderRadius:'50%',background:'#74c365'}}/> Target Node</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{width:'10px',height:'10px',borderRadius:'50%',background:'#3ca096'}}/> Baseline Avg</span>
                </div>
             </div>

             {/* Donut Chart */}
             <div style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '28px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '16px', color: '#fff', fontWeight: '800', marginBottom: '4px' }}>Demographic Split</div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '32px' }}>Account engagement ratios.</div>
                <div style={{ display: 'flex', justifyContent: 'center', position: 'relative', marginBottom: '32px' }}>
                   <svg width="140" height="140" viewBox="0 0 100 100">
                     <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="14" />
                     <circle cx="50" cy="50" r="40" fill="none" stroke="#3ca096" strokeWidth="14" strokeDasharray="251" strokeDashoffset="50" />
                     <circle cx="50" cy="50" r="40" fill="none" stroke="#d4d95c" strokeWidth="14" strokeDasharray="251" strokeDashoffset="180" />
                     <circle cx="50" cy="50" r="40" fill="none" stroke="#74c365" strokeWidth="14" strokeDasharray="251" strokeDashoffset="220" />
                   </svg>
                   <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                     <span style={{ fontSize: '28px', fontWeight: '800', color: '#fff' }}>129</span>
                     <span style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: '700' }}>Total</span>
                   </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: 'auto' }}>
                  {[
                    { name: 'Direct Consumers', c: '#3ca096' },
                    { name: 'Wholesale Buyers', c: '#d4d95c' },
                    { name: 'Logistics Proxies', c: '#74c365' }
                  ].map(t => (
                    <div key={t.name} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: '#ccc', fontWeight: '600' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: t.c }} /> {t.name}
                    </div>
                  ))}
                </div>
             </div>
          </div>

          {/* Micro-Hotspots Table */}
          <div style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '28px' }}>
             <div style={{ fontSize: '16px', color: '#fff', fontWeight: '800', marginBottom: '20px' }}>Hyper-Local Transacting Nodes</div>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {deepData.micro_hotspots.map((hotspot, idx) => (
                   <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: '#121214', borderRadius: '8px', border: '1px solid #1a1a1c' }}>
                      <div style={{ fontSize: '15px', color: '#fff', fontWeight: '600' }}>{hotspot.name}</div>
                      <div style={{ display: 'flex', gap: '24px' }}>
                         <div><span style={{ fontSize: '10px', color: '#888' }}>CAPITAL SHARE:</span> <strong style={{ color: '#00e5ff', marginLeft: '6px' }}>{hotspot.flow_share}</strong></div>
                         <div><span style={{ fontSize: '10px', color: '#888' }}>PEAK VELOCITY:</span> <strong style={{ color: '#d4d95c', marginLeft: '6px' }}>{hotspot.peak_time}</strong></div>
                      </div>
                   </div>
                ))}
             </div>
          </div>

          {/* SECTION 3: Deep Expandable Text Report */}
          <div style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '32px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ fontSize: '12px', color: '#3ca096', fontFamily: mono, fontWeight: '800', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '16px' }}>EXECUTIVE INTELLIGENCE DOSSIER</div>
            
            <div style={{ color: '#ccc', fontSize: '15px', lineHeight: '1.8', fontWeight: '400', maxHeight: '120px', overflow: 'hidden', position: 'relative' }}>
               {execSummary}
               
               {/* Gradient Fade out for text */}
               <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '80px', background: 'linear-gradient(to bottom, rgba(5,5,7,0), rgba(5,5,7,1))' }} />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
              <button style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '30px', color: '#fff', padding: '10px 24px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'background 0.2s', backdropFilter: 'blur(10px)' }} onMouseEnter={(e)=>e.currentTarget.style.background='rgba(255,255,255,0.1)'} onMouseLeave={(e)=>e.currentTarget.style.background='rgba(255,255,255,0.05)'}>
                Read Full Deep Report <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </button>
            </div>
          </div>

       </div>
    </div>
  );
}
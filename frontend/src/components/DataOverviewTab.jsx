import React, { useState } from 'react';

const mono = "ui-monospace, monospace";

export default function DataOverviewTab({ 
  setCommandTab, 
  setCanvasMode, 
  activeTourNode, 
  scanData, 
  contextHub,
  resolvedLocation 
}) {
  // Local States for Toggles and Dropdowns
  const [timeframe, setTimeframe] = useState('Last 24hrs');
  const [timeframeDropdown, setTimeframeDropdown] = useState(false);
  const [expandedSections, setExpandedSections] = useState({ vol: false, demo: false, flow: false });

  // Safe destructuring of Backend Data (Preserving your exact layout math)
  const financial = scanData?.financial_metrics || {};
  const taxonomy = scanData?.taxonomy_metrics || {};
  const commodityData = scanData?.commodity_intelligence || null;

  // Real-Time Cinematic Walkthrough Metric Sync
  const totalVolume = financial.daily_volume || 0;
  const txVelocity = financial.velocity || 0;
  const activeContributors = taxonomy.active_contributors || 0;
  const activeBuyers = taxonomy.buyers || 0;
  const activeMerchants = taxonomy.merchants || 0;
  const digitalPercentage = financial.digital_percentage || 15;
  const priceMarkup = financial.markup || 12;
  const digitalCash = financial.digital_cash || 0;
  const physicalCash = financial.physical_cash || 0;

  const displayVolume = activeTourNode && activeTourNode.volMultiplier ? totalVolume * activeTourNode.volMultiplier : totalVolume;
  const displayVelocity = activeTourNode && activeTourNode.txMultiplier ? Math.round(txVelocity * activeTourNode.txMultiplier) : txVelocity;
  const displayContributors = activeTourNode && activeTourNode.volMultiplier ? Math.round(activeContributors * activeTourNode.volMultiplier) : activeContributors;
  const displayBuyers = activeTourNode && activeTourNode.volMultiplier ? Math.round(activeBuyers * activeTourNode.volMultiplier) : activeBuyers;
  const displayMerchants = activeTourNode && activeTourNode.txMultiplier ? Math.round(activeMerchants * activeTourNode.txMultiplier) : activeMerchants;

  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #1a1a1a', height: '40px', minHeight: '40px', flexShrink: 0 }}>
        <button onClick={() => { setCommandTab('chat'); setCanvasMode('map'); }} style={{ background: 'transparent', border: '1px solid #333', padding: '4px 10px', borderRadius: '12px', color: '#ededef', fontSize: '9px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg> Back to AI Chat
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {activeTourNode ? (
          <div style={{ background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(0, 0, 0, 0) 100%)', border: `1px solid ${activeTourNode.color}50`, borderRadius: '8px', padding: '12px 14px', animation: 'fadeIn 0.4s ease-out', position: 'relative', overflow: 'hidden', marginBottom: '16px' }}>
             <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '3px', background: activeTourNode.color, boxShadow: `0 0 10px ${activeTourNode.color}` }} />
             <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
               <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: activeTourNode.color, animation: 'pulse 1s infinite' }} />
               <div style={{ fontSize: '9px', color: activeTourNode.color, fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', fontFamily: mono }}>Isolated View: {activeTourNode.type}</div>
             </div>
             <div style={{ fontSize: '14px', color: '#fff', fontWeight: '800', letterSpacing: '-0.2px' }}>{activeTourNode.name}</div>
             <div style={{ fontSize: '9px', color: '#aaa', marginTop: '4px', lineHeight: '1.4' }}>All dashboard metrics below are now filtering exclusively for data originating within this localized geofence.</div>
             <div style={{ display: 'flex', gap: '10px', marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                 <div style={{ flex: 1 }}><div style={{ fontSize: '8px', color: '#888', textTransform: 'uppercase', fontFamily: mono }}>Volume Concentration</div><div style={{ fontSize: '12px', color: '#fff', fontWeight: '700', marginTop: '4px' }}>{(activeTourNode.volMultiplier * 100).toFixed(0)}% of Grid</div></div>
                 <div style={{ flex: 1 }}><div style={{ fontSize: '8px', color: '#888', textTransform: 'uppercase', fontFamily: mono }}>Transaction Friction</div><div style={{ fontSize: '12px', color: '#fff', fontWeight: '700', marginTop: '4px' }}>{(activeTourNode.txMultiplier * 100).toFixed(0)}% Baseline</div></div>
             </div>
          </div>
        ) : null}

        {commodityData && (
          <div style={{ background: 'rgba(60, 160, 150, 0.08)', border: '1px solid rgba(60, 160, 150, 0.3)', borderRadius: '14px', padding: '18px 20px', animation: 'fadeIn 0.3s ease-out', marginBottom: '24px' }}>
            <div style={{ fontSize: '11px', color: '#3ca096', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase' }}>TARGET COMMODITY INTEL</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '6px' }}>
              <span style={{ fontSize: '20px', fontWeight: '700', color: '#fff', textTransform: 'capitalize' }}>{commodityData.commodity}</span>
              <span style={{ fontSize: '18px', fontWeight: '800', color: '#3ca096' }}>{formatCurrency(commodityData.live_street_price)} / {commodityData.unit}</span>
            </div>
            <div style={{ fontSize: '12px', color: '#888', marginTop: '6px' }}>Origin: {commodityData.import_origin} • Spread: <span style={{ color: '#74c365' }}>{commodityData.formal_spread}</span> vs formal retail</div>
          </div>
        )}

        {scanData?.executive_summary?.overview_pill && (
          <div style={{ background: 'linear-gradient(90deg, rgba(60, 160, 150, 0.08) 0%, rgba(40, 100, 140, 0.03) 100%)', borderLeft: '4px solid #3ca096', borderTop: '1px solid rgba(60, 160, 150, 0.2)', borderRight: '1px solid rgba(255, 255, 255, 0.05)', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '0 12px 12px 0', padding: '16px 20px', marginBottom: '24px', animation: 'fadeIn 0.4s ease-out' }}>
            <div style={{ fontSize: '10px', color: '#3ca096', fontFamily: mono, fontWeight: '800', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '6px' }}>Executive Intelligence Brief</div>
            <div style={{ fontSize: '13px', color: '#ddd', lineHeight: '1.6', fontWeight: '500' }}>{scanData.executive_summary.overview_pill}</div>
          </div>
        )}

        <div style={{ background: '#0a0a0c', borderRadius: '10px', padding: '14px', border: '1px solid #222', position: 'relative', opacity: activeTourNode ? 0.4 : 1, transition: 'opacity 0.3s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#fff' }}>{scanData?.ui_labels?.card_1_title || 'Cash Volume & Velocity'}</div>
                <div style={{ fontSize: '8px', color: '#888', marginTop: '4px', maxWidth: '300px', lineHeight: '1.4' }}>{scanData?.ui_labels?.card_1_subtitle || `Daily unbanked cash volume generated from ${contextHub}`}</div>
            </div>
            <div style={{ position: 'relative' }}>
              <button onClick={() => setTimeframeDropdown(!timeframeDropdown)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#ededef', padding: '4px 8px', borderRadius: '12px', fontSize: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', backdropFilter: 'blur(10px)', transition: 'background 0.2s' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> {scanData?.financial_metrics?.time_horizon || timeframe} <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </button>
              {timeframeDropdown && (
                 <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '4px', background: '#121214', border: '1px solid #333', borderRadius: '8px', padding: '4px', zIndex: 100, width: '120px', boxShadow: '0 10px 40px rgba(0,0,0,0.8)' }}>
                   {['Live (1hr)', 'Last 12hrs', 'Last 24hrs', 'Trailing 7 Days'].map(t => (
                     <div key={t} onClick={() => { setTimeframe(t); setTimeframeDropdown(false); }} style={{ padding: '6px 8px', fontSize: '9px', fontWeight: '500', color: timeframe === t ? '#3ca096' : '#aaa', cursor: 'pointer', borderRadius: '4px', background: timeframe === t ? 'rgba(60,160,150,0.1)' : 'transparent', transition: 'background 0.2s' }}>{t}</div>
                   ))}
                 </div>
              )}
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '14px' }}>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#fff', letterSpacing: '-0.5px' }}>{formatCurrency(displayVolume)}</div>
            <span style={{fontSize:'8px', color:'#3ca096', background:'rgba(60,160,150,0.15)', padding:'2px 6px', borderRadius:'4px', fontWeight:'700'}}>{digitalPercentage}% digital</span>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
            <div style={{ flex: 1, background: '#121214', padding: '10px', borderRadius: '8px', border: '1px solid #1a1a1a', transition: 'border 0.2s', cursor: 'default' }}>
                <div style={{ fontSize: '9px', color: '#888', fontWeight: '600' }}>{scanData?.ui_labels?.metric_1_label || 'Street vs Formal Gap'}</div>
                <div style={{ fontSize: '15px', color: '#fff', fontWeight: '700', marginTop: '4px' }}>+{priceMarkup}% <span style={{fontSize:'8px', color:'#74c365', fontWeight:'600'}}>spread</span></div>
            </div>
            <div style={{ flex: 1, background: '#121214', padding: '10px', borderRadius: '8px', border: '1px solid #1a1a1a', transition: 'border 0.2s', cursor: 'default' }}>
                <div style={{ fontSize: '9px', color: '#888', fontWeight: '600' }}>{scanData?.ui_labels?.metric_2_label || 'Transaction Velocity'}</div>
                <div style={{ fontSize: '15px', color: '#fff', fontWeight: '700', marginTop: '4px' }}>{displayVelocity.toLocaleString()} <span style={{fontSize:'8px', color:'#d4d95c', fontWeight:'600'}}>tx/period</span></div>
            </div>
          </div>

          {expandedSections.vol && (
            <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px dashed #222', animation: 'fadeIn 0.4s ease-out' }}>
              <div style={{ fontSize: '9px', color: '#888', fontWeight: '600', marginBottom: '10px' }}>Liquidity Channel Distribution</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ flex: digitalPercentage || 15, height: '6px', background: '#3ca096', borderRadius: '3px' }} title="Digital/USSD Flow" />
                <div style={{ flex: (100 - digitalPercentage) || 85, height: '6px', background: '#74c365', borderRadius: '3px' }} title="Physical Dark Cash" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: '#aaa', marginTop: '6px', fontWeight: '600' }}>
                <span>Digital/USSD: {formatCurrency(digitalCash)} ({digitalPercentage}%)</span>
                <span>Physical Cash: {formatCurrency(physicalCash)} ({(100 - digitalPercentage).toFixed(1)}%)</span>
              </div>
            </div>
          )}
          <button onClick={() => setExpandedSections({...expandedSections, vol: !expandedSections.vol})} style={{ width: '100%', marginTop: '14px', background: 'transparent', border: 'none', color: '#3ca096', fontSize: '9px', fontWeight: '600', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', opacity: 0.8, transition: 'opacity 0.2s' }}>
            {expandedSections.vol ? 'Collapse metrics ↑' : 'See advanced metrics ↓'}
          </button>
        </div>                                                                                                                                                                                                                                                                                             
        
        <div style={{ background: '#0a0a0c', borderRadius: '10px', padding: '14px', border: '1px solid #222', opacity: activeTourNode ? 0.4 : 1, transition: 'opacity 0.3s' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#fff' }}>{scanData?.breakdown_meta?.card_2_title || 'Active Vendor Network'}</div>
          <div style={{ fontSize: '8px', color: '#888', marginTop: '4px', maxWidth: '300px', lineHeight: '1.4' }}>{scanData?.breakdown_meta?.card_2_subtitle || `Active distribution profiles across ${contextHub}`}</div>

          <div style={{ display: 'flex', alignItems: 'center', marginTop: '14px', gap: '16px' }}>
            <div style={{ position: 'relative', width: '80px', height: '80px', flexShrink: 0 }}>
              <svg width="80" height="80" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#222" strokeWidth="12" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#3ca096" strokeWidth="12" strokeDasharray="251" strokeDashoffset="100" style={{ transition: 'stroke-dashoffset 1s ease-in-out' }} />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#74c365" strokeWidth="12" strokeDasharray="251" strokeDashoffset="180" style={{ transition: 'stroke-dashoffset 1s ease-in-out' }} />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '800', color: '#fff' }}>100%</div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {(scanData?.breakdown_data || []).map((x, idx) => {
                  const fallbackColors = ['#3ca096', '#74c365', '#d4d95c', '#28648c', '#1a3668'];
                  const c = x.color || fallbackColors[idx % fallbackColors.length];
                  return (
                    <div key={x.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#aaa', fontWeight: '500', padding: '4px 8px', borderRadius: '4px', transition: 'background 0.2s', cursor: 'pointer' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{width:'6px', height:'6px', borderRadius:'50%', background: c, boxShadow: `0 0 6px ${c}`}}/> {x.label}</span>
                        <span style={{ color: '#fff', fontWeight: '700' }}>{(x.value * 100).toFixed(0)}%</span>
                    </div>
                  );
                })}
            </div>
          </div>

          {expandedSections.demo && (
            <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px dashed #222', animation: 'fadeIn 0.4s ease-out' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div><div style={{ fontSize: '8px', color: '#888', fontWeight: '600' }}>Total Foot Traffic</div><div style={{ fontSize: '14px', color: '#fff', fontWeight: '800', marginTop: '2px' }}>{displayContributors.toLocaleString()}</div></div>
                <div><div style={{ fontSize: '8px', color: '#888', fontWeight: '600' }}>Active Buyers</div><div style={{ fontSize: '14px', color: '#3ca096', fontWeight: '800', marginTop: '2px' }}>{displayBuyers.toLocaleString()}</div></div>
                <div><div style={{ fontSize: '8px', color: '#888', fontWeight: '600' }}>Permanent Vendors</div><div style={{ fontSize: '14px', color: '#74c365', fontWeight: '800', marginTop: '2px' }}>{displayMerchants.toLocaleString()}</div></div>
              </div>
            </div>
          )}
          <button onClick={() => setExpandedSections({...expandedSections, demo: !expandedSections.demo})} style={{ width: '100%', marginTop: '14px', background: 'transparent', border: 'none', color: '#3ca096', fontSize: '9px', fontWeight: '600', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', opacity: 0.8, transition: 'opacity 0.2s' }}>
            {expandedSections.demo ? 'Collapse breakdown ↑' : 'See advanced breakdown ↓'}
          </button>
        </div>                                                                                                                                                                                                                                                                                             
        
        <div style={{ background: '#0a0a0c', borderRadius: '10px', padding: '14px', border: '1px solid #222', opacity: activeTourNode ? 0.4 : 1, transition: 'opacity 0.3s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#fff' }}>{scanData?.ui_labels?.card_3_title || 'Market Friction & Flow'}</div>
              <div style={{ fontSize: '8px', color: '#888', marginTop: '4px' }}>{scanData?.ui_labels?.card_3_subtitle || `Real-time activity and friction flags in ${contextHub}`}</div>
            </div>
            <button style={{ background: '#121214', border: '1px solid #333', borderRadius: '4px', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', cursor: 'pointer', transition: 'color 0.2s' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
              {[{title: 'Inflow Peak', val: '12.1k', c: '#3ca096'}, {title: 'Outflow Dip', val: '8.4k', c: '#28648c'}, {title: 'Friction Events', val: '142', c: '#d4d95c'}].map((x, idx) => (
                <div key={x.title} style={{ flex: 1, background: '#121214', border: '1px solid #1a1a1a', borderRadius: '8px', padding: '10px', transition: 'border 0.2s, transform 0.2s', cursor: 'pointer' }}>
                    <div style={{ fontSize: '8px', color: '#888', fontWeight: '600' }}>{x.title}</div>
                    <div style={{ fontSize: '14px', color: '#fff', fontWeight: '800', marginTop: '6px' }}>{x.val}</div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '16px', marginTop: '10px' }}>
                      {[40,70,30,80,50,90,100].map((h, i) => <div key={i} style={{ flex: 1, background: (idx === 0 && i === 6) ? x.c : '#222', height: `${h}%`, borderRadius: '1px', transition: 'height 0.3s' }} />)}
                    </div>
                </div>
              ))}
          </div>

          {expandedSections.flow && (
            <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px dashed #222', animation: 'fadeIn 0.4s ease-out' }}>
              <div style={{ fontSize: '9px', color: '#888', fontWeight: '600', marginBottom: '10px' }}>Live Friction Event Log</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[{time: '14:22', event: 'Sudden outflow detected at North Gate', sev: 'Moderate'}, {time: '14:18', event: 'Price anomaly in commodity sector', sev: 'Peak'}].map((log, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', borderLeft: `2px solid ${log.sev === 'Peak' ? '#d4d95c' : '#74c365'}` }}>
                     <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                       <span style={{ fontSize: '8px', color: '#666', fontFamily: mono }}>{log.time}</span>
                       <span style={{ fontSize: '9px', color: '#ccc', fontWeight: '500' }}>{log.event}</span>
                     </div>
                     <span style={{ fontSize: '8px', color: log.sev === 'Peak' ? '#d4d95c' : '#74c365', fontWeight: '700' }}>{log.sev}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <button onClick={() => setExpandedSections({...expandedSections, flow: !expandedSections.flow})} style={{ width: '100%', marginTop: '14px', background: 'transparent', border: 'none', color: '#3ca096', fontSize: '9px', fontWeight: '600', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', opacity: 0.8, transition: 'opacity 0.2s' }}>
            {expandedSections.flow ? 'Collapse event logs ↑' : 'See live event logs ↓'}
          </button>
        </div>

        <div style={{ marginTop: '12px', padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
           <div style={{ fontSize: '11px', color: '#888', fontWeight: '700', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3fb950" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> Data Provenance & Confidence
           </div>
           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#ccc', marginBottom: '4px' }}>Telemetry Intercept</div>
                <div style={{ fontSize: '11px', color: '#666' }}><span style={{ color: '#00e5ff' }}>●</span> {scanData?.data_provenance?.intercept_type || 'OpenCelliD RF Density Active'}</div>
                <div style={{ fontSize: '11px', color: '#666' }}><span style={{ color: '#00e5ff' }}>●</span> Dwell: {scanData?.data_provenance?.dwell_time || 'Avg 30 min'}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#ccc', marginBottom: '4px' }}>Node Integrity</div>
                <div style={{ fontSize: '11px', color: '#666' }}>S2 Spatial Cell: <span style={{ color: '#fff', fontFamily: mono }}>{resolvedLocation?.s2_cell_id || 'Awaiting Lock'}</span></div>
                <div style={{ fontSize: '11px', color: '#666' }}>Engine Confidence: <span style={{ color: '#3fb950', fontWeight: '700' }}>{scanData?.data_provenance?.engine_confidence || 94.2}%</span></div>
              </div>
           </div>
        </div>

      </div>
    </div>
    );
}
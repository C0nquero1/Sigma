import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import CommandPanel from '../components/CommandPanel';
import TelemetryPanel from '../components/TelemetryPanel';
import MapCanvas from '../components/MapCanvas';
import DeepAnalysisTab from '../components/DeepAnalysisTab';
import BusinessDashboard from '../components/BusinessDashboard'; 
import API from '../components/API';               
import ExportData from '../components/ExportData'; 
import Website from './Website'; 

export default function Dashboard() {
  const [navExpanded, setNavExpanded] = useState(false);
  const [deckExpanded, setDeckExpanded] = useState(true);
  const [activePage, setActivePage] = useState('Command'); 
  const [canvasMode, setCanvasMode] = useState('map'); 
  const [commandTab, setCommandTab] = useState('chat');
  
  const [scanData, setScanData] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isDataGenerated, setIsDataGenerated] = useState(false);
  const [resolvedLocation, setResolvedLocation] = useState(null);
  const [contextHub, setContextHub] = useState('System Initialized');

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTourNode, setActiveTourNode] = useState(null);

  // =========================================================
  // CRITICAL FIX: Automatically close Deep Analysis when 
  // navigating away via the primary sidebar icons.
  // =========================================================
  useEffect(() => {
    if (activePage !== 'Command') {
      setCanvasMode('map');
    }
  }, [activePage]);

  const executeIntelligenceScan = async (promptText, candidateToForce = null) => {
    setIsSearching(true);
    setIsDataGenerated(false);
    setContextHub(promptText);
    setSearchQuery(promptText);

    setTimeout(() => {
      const mockData = {
        status: "TARGET_LOCKED",
        city_overview: {
          lat: candidateToForce ? candidateToForce.latitude : 6.5244,
          lon: candidateToForce ? candidateToForce.longitude : 3.3792,
          city_name: candidateToForce ? candidateToForce.name : promptText
        },
        financial_metrics: { daily_volume: 4218500, velocity: 84, digital_percentage: 15, markup: 12, digital_cash: 632775, physical_cash: 3585725, time_horizon: "Last 24hrs" },
        taxonomy_metrics: { active_contributors: 12500, buyers: 8420, merchants: 1450 },
        commodity_intelligence: { commodity: promptText.split(' ')[0] || "Commercial", live_street_price: 14500, unit: "kg", import_origin: "Southeast Asia via Apapa", formal_spread: "+18.4%" },
        executive_summary: { overview_pill: `Live unbanked market data simulated for ${promptText}. The spatial analysis indicates a highly concentrated liquidity vortex within the primary aggregator hub.` },
        deep_analysis: {
          supply_chain_origin: "Tier-1 Port Corridors", buyer_demographic: "High-frequency micro-retailers", operational_risks: "Severe logistics bottleneck at North Gate",
          overview_executive_summary: `Deep spatial analysis for ${promptText} reveals unrecorded cash velocity outperforming formal sector baselines by a factor of 3.2x.`,
          micro_hotspots: [
            { name: "Central Wholesale Hub", flow_share: "42.8%", peak_time: "14:00 - 16:30" },
            { name: "Outer Transit Perimeter", flow_share: "18.2%", peak_time: "06:00 - 09:00" },
            { name: "Capillary Retail Alley", flow_share: "39.0%", peak_time: "18:00 - 21:00" }
          ]
        },
        data_provenance: { intercept_type: "Sentinel-1 SAR + Cellular RF", dwell_time: "Avg 42 min", engine_confidence: 96.4 }
      };

      setScanData(mockData);
      setResolvedLocation({ lat: mockData.city_overview.lat, lng: mockData.city_overview.lon, name: mockData.city_overview.city_name });
      setContextHub(mockData.city_overview.city_name);
      
      setIsSearching(false);
      setIsDataGenerated(true); 
    }, 2000); 
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: '#050505', color: '#ededef', overflow: 'hidden', position: 'relative' }}>
      
      {['About', 'Documentation', 'Support'].includes(activePage) && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999 }}>
          <Website 
            initialPage={activePage === 'Documentation' ? 'docs' : activePage.toLowerCase()} 
            onReturnToDashboard={() => setActivePage('Command')} 
          />
        </div>
      )}

      {/* PERFECTED OVERLAY: Anchored to left: 0 to permanently prevent background bleeding */}
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        right: 0, 
        bottom: 0, 
        left: 0, /* FIX: Always covers the left edge, sitting safely behind the Nav Bar */
        paddingLeft: navExpanded ? '240px' : '64px', /* FIX: We animate padding instead of the container's physical position */
        opacity: (activePage === 'Command' && canvasMode === 'analysis') ? 1 : 0, 
        pointerEvents: (activePage === 'Command' && canvasMode === 'analysis') ? 'auto' : 'none', 
        transition: 'opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), padding-left 0.4s ease-in-out', 
        zIndex: 40,
        background: '#050505' /* Ensures any gap during the animation is pure black */
      }}>
          {/* We wrap the tab in a relative container so it smoothly inherits the animated padding bounds */}
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <DeepAnalysisTab canvasMode={canvasMode} scanData={scanData} contextHub={contextHub} setCanvasMode={setCanvasMode} />
          </div>
      </div>

      {/* Keep Navigation rendered normally without the 9999 z-index wrapper */}
      <Navigation navExpanded={navExpanded} setNavExpanded={setNavExpanded} activePage={activePage} setActivePage={setActivePage} setCanvasMode={setCanvasMode} />

      {activePage === 'Business' ? (
        <BusinessDashboard />
      ) : ['API', 'Export'].includes(activePage) ? (
        <div style={{ flex: 1, background: '#050505', color: '#fff', padding: '40px', overflowY: 'auto' }}>
          {activePage === 'API' && <API />}
          {activePage === 'Export' && <ExportData />}
        </div>
      ) : (
        <>
          <div style={{ width: deckExpanded ? '460px' : '0px', minWidth: deckExpanded ? '460px' : '0px', maxWidth: deckExpanded ? '460px' : '0px', flex: deckExpanded ? '0 0 460px' : '0 0 0px', display: 'flex', flexDirection: 'column', background: '#050505', borderRight: deckExpanded ? '1px solid #1a1a1c' : 'none', position: 'relative', transition: 'all 0.3s ease', height: '100vh', overflow: 'visible', zIndex: 20 }}>
            
            <div onClick={() => setDeckExpanded(!deckExpanded)} style={{ position: 'absolute', top: '50%', right: '-14px', transform: 'translateY(-50%)', width: '28px', height: '56px', background: '#0a0a0c', border: '1px solid #333', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 100, color: '#888', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points={deckExpanded ? "15 18 9 12 15 6" : "9 18 15 12 9 6"} /></svg>
            </div>

            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', opacity: deckExpanded ? 1 : 0 }}>
              {activePage !== 'Command' ? (
                <TelemetryPanel 
                  activePage={activePage} 
                  setActivePage={setActivePage} 
                  scanData={scanData} 
                  contextHub={contextHub} 
                  executeIntelligenceScan={executeIntelligenceScan} 
                />
              ) : (
                <CommandPanel 
                  executeIntelligenceScan={executeIntelligenceScan} 
                  isSearching={isSearching} 
                  isDataGenerated={isDataGenerated} 
                  scanData={scanData}
                  contextHub={contextHub}
                  setCanvasMode={setCanvasMode}
                  activeTourNode={activeTourNode}
                  commandTab={commandTab}        
                  setCommandTab={setCommandTab}
                />
              )}
            </div>
          </div>

          <div style={{ flex: 1, position: 'relative' }}>
             <MapCanvas searchQuery={searchQuery} resolvedLocation={resolvedLocation} isDataGenerated={isDataGenerated} scanData={scanData} canvasMode={canvasMode} setCanvasMode={setCanvasMode} setActiveTourNode={setActiveTourNode} />
          </div>
        </>
      )}

    </div>
  );
}
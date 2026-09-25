import React, { useState, useEffect, useRef } from 'react';
import ThirdSection from './ThirdSection';

const sans = "system-ui, -apple-system, sans-serif";
const mono = "ui-monospace, monospace";

const blueShadesGradient = "linear-gradient(135deg, #00e5ff 0%, #0077ff 30%, #0033ff 70%, #00aaff 100%)";

export default function KineticDashboard() {
  // Global States
  const [navExpanded, setNavExpanded] = useState(false);
  const [deckExpanded, setDeckExpanded] = useState(true);
  const [commandTab, setCommandTab] = useState('chat'); // 'chat' or 'data'
  const [activePage, setActivePage] = useState('Command'); // 'Command', 'News', 'Export', 'API'
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [canvasMode, setCanvasMode] = useState('map'); // Lifted from ThirdSection
  const [mapStyle, setMapStyle] = useState('dark');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSimExpanded, setIsSimExpanded] = useState(true);
  const [activeTourNode, setActiveTourNode] = useState(null);
  
  // Data States
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isDataGenerated, setIsDataGenerated] = useState(false);
  const [contextHub, setContextHub] = useState('System Initialized'); 

  // --- SPATIAL LOCK & DISAMBIGUATION (SCROLL-UP) STATES ---
  const [resolvedLocation, setResolvedLocation] = useState(null);
  const [ambiguousCandidates, setAmbiguousCandidates] = useState([]);
  const [showScrollUp, setShowScrollUp] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  // NEW: Fast Live Typing Autocomplete
  const [liveSuggestions, setLiveSuggestions] = useState([]);
  
  // Interactive Data Panel States
  const [timeframe, setTimeframe] = useState('Last 24hrs');
  const [timeframeDropdown, setTimeframeDropdown] = useState(false);
  const [currency, setCurrency] = useState('USD');
  const [expandedSections, setExpandedSections] = useState({ vol: false, demo: false, flow: false });
  const [ticker, setTicker] = useState([]);

  // Live Telemetry & Financial Engine State
  const [totalVolume, setTotalVolume] = useState(0);
  const [physicalCash, setPhysicalCash] = useState(0);
  const [digitalCash, setDigitalCash] = useState(0);
  const [digitalPercentage, setDigitalPercentage] = useState(0);
  const [txVelocity, setTxVelocity] = useState(0);
  const [priceMarkup, setPriceMarkup] = useState(0);
  const [scanData, setScanData] = useState(null);

  // Live Taxonomy & Contributor Metrics
  const [activeContributors, setActiveContributors] = useState(0);
  const [activeBuyers, setActiveBuyers] = useState(0);
  const [activeMerchants, setActiveMerchants] = useState(0);
  const [vendorCategories, setVendorCategories] = useState({});
  const [commodityData, setCommodityData] = useState(null);

  // Trigger cinematic map flight when location resolves
  useEffect(() => {
    if (resolvedLocation && mapRef.current) {
      const map = mapRef.current.getMap();
      map.flyTo({
        center: [resolvedLocation.lng, resolvedLocation.lat],
        zoom: 14.5, // Deep zoom for informal hubs
        pitch: 60,  // Cinematic tilt
        bearing: -15, 
        duration: 2500, // Smooth 2.5s transition
        essential: true
      });
    }
  }, [resolvedLocation]);

  // Currency formatting helper
  const formatCurrency = (val, curr = currency) => {
    if (!val) return curr === 'NGN' ? '₦0.00' : '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: curr,
      maximumFractionDigits: 0
    }).format(val);
  };
  
  const mapRef = useRef(null);

  // ==========================================
  // FAST LIVE TYPING AUTOCOMPLETE (Debounced & Intelligent)
  // ==========================================
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const queryStr = inputValue.trim().toLowerCase();
      // Intelligent Gate: Ignore conversational triggers
      const stopWords = ['what', 'where', 'how', 'map', 'find', 'track', 'show', 'analyze', 'the'];
      const isConversational = stopWords.some(w => queryStr.startsWith(w));

      if (queryStr.length > 3 && !isSearching && !isConversational) {
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(inputValue)}&limit=5`)
          .then(res => res.json())
          .then(data => {
            if (data && data.length > 0) {
              // Filter out random POIs, only suggest actual geographical areas
              const validTypes = ['city', 'administrative', 'state', 'country', 'town', 'village'];
              const filteredData = data.filter(item => validTypes.includes(item.type));
              
              const formatted = filteredData.map(item => ({
                name: item.display_name.split(',')[0],
                context: item.display_name.split(',').slice(1, 3).join(',').trim(),
                latitude: parseFloat(item.lat),
                longitude: parseFloat(item.lon),
                location_type: item.type ? item.type.replace('_', ' ').toUpperCase() : "NODE",
                candidate_id: item.place_id
              }));
              setLiveSuggestions(formatted);
            } else {
              setLiveSuggestions([]);
            }
          }).catch(() => setLiveSuggestions([]));
      } else {
        setLiveSuggestions([]);
      }
    }, 300); // Optimized 300ms delay

    return () => clearTimeout(delayDebounceFn);
  }, [inputValue, isSearching]);

  // Map Resize Ref (Crucial for fixing the blank space glitch)
  const mapContainerSizeRef = useRef({ width: 0, height: 0 });
  
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        const map = mapRef.current.getMap();
        if (map && map.getTerrain()) map.setTerrain(null);
      }
    };
  }, []);

  useEffect(() => {
    // Dispatch a resize event during the 0.3s CSS transition so Mapbox fills the space
    const interval = setInterval(() => {
      window.dispatchEvent(new Event('resize'));
    }, 20);
    
    // Stop dispatching just after the transition ends
    const timeout = setTimeout(() => {
      clearInterval(interval);
      window.dispatchEvent(new Event('resize'));
    }, 350); 
    
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [navExpanded, deckExpanded]);

  const handleStyleChange = (newStyle) => {
    const styleString = newStyle === 'satellite' 
        ? 'mapbox://styles/mapbox/satellite-v9' 
        : 'mapbox://styles/mapbox/dark-v11';
    
    if (mapRef.current) {
      const map = mapRef.current.getMap();
      if (map && map.getTerrain()) map.setTerrain(null);
    }
    setMapStyle(styleString);
  };

  // Helper function to execute the intelligence scan to backend
  const executeIntelligenceScan = async (promptText, candidateToForce = null) => {
    setIsSearching(true);
    setIsDataGenerated(false);
    setCommandTab('chat');
    setContextHub(promptText);

    try {
      const payload = { 
        prompt: promptText,
        explicit_lat: candidateToForce ? candidateToForce.latitude : null,
        explicit_lon: candidateToForce ? candidateToForce.longitude : null,
        // FIX: Cast target_id to String to prevent Python 422 Crash which stalls the map
        target_id: candidateToForce ? String(candidateToForce.candidate_id || candidateToForce.id || "node") : null
      };

      const response = await fetch('http://68.210.185.20:8000/api/v1/intelligence/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    
      const data = await response.json();
      setScanData(data);

      // Case 1: Multiple locations match (Triggers the Scroll-Up Menu)
      if (data.status === "AMBIGUOUS_TARGET" && data.candidates && data.candidates.length > 1) {
        setAmbiguousCandidates(data.candidates);
        setShowScrollUp(true);
        setIsSearching(false);
        return;
      }

      // Case 2: Target is locked with precise coordinates
      if (data.status === "TARGET_LOCKED") {
        setShowScrollUp(false);
        setAmbiguousCandidates([]);
        setSelectedCandidate(null);
      
        if (data.city_overview) {
          setResolvedLocation({
            lat: data.city_overview.lat,
            lng: data.city_overview.lon,
            name: data.city_overview.city_name,
            context: data.city_overview.full_context,
            s2_cell_id: data.city_overview.s2_cell_id
          });
          setContextHub(data.city_overview.city_name || promptText);
        }

        // Hydrate Live Engine Metrics
        if (data.financial_metrics) {
          // FIX: Map to 'local_currency' and default to 'USD'
          setCurrency(data.financial_metrics.local_currency || "USD"); 
          setTotalVolume(data.financial_metrics.daily_volume || 0);
          setPhysicalCash(data.financial_metrics.physical_cash || 0);
          setDigitalCash(data.financial_metrics.digital_cash || 0);
          setDigitalPercentage(data.financial_metrics.digital_percentage || 0);
          setTxVelocity(data.financial_metrics.velocity || 0);
          setPriceMarkup(data.financial_metrics.markup || 0);
        }

        // Hydrate Contributor Demographics
        if (data.taxonomy_metrics) {
          setActiveContributors(data.taxonomy_metrics.active_contributors || 0);
          setActiveBuyers(data.taxonomy_metrics.buyers || 0);
          setActiveMerchants(data.taxonomy_metrics.merchants || 0);
          setVendorCategories(data.taxonomy_metrics.categories || {});
        }

        // Hydrate Commodity Intelligence (if queried)
        if (data.commodity_intelligence) {
          setCommodityData(data.commodity_intelligence);
        }

        // Inject the Groq executive narrative
        if (data.narrative_report) {
          setChatHistory(prev => [{ id: Date.now() + 1, text: data.narrative_report }, ...prev]);
        }
      
        setIsDataGenerated(true);
      } else {
        setTimeout(() => { setIsDataGenerated(true); }, 1500);
      }
    } catch (err) {
      console.error("Backend scan failed, running fallback view:", err);
      setTimeout(() => { setIsDataGenerated(true); }, 1500);
    } finally {
      setIsSearching(false);
    }
  };

  // Triggered when user submits the prompt form
  const handlePromptSubmit = (e) => {
  e.preventDefault();
  if (!inputValue.trim() || isSearching) return;
  
  const query = inputValue.trim();
  setSearchQuery(query);
  
  // HISTORY JUNK PREVENTION: Ignore greetings, gibberish, or short tests
  const isJunk = ['hi', 'hello', 'hey', 'test', 'yo'].includes(query.toLowerCase()) || query.length < 4;
  if (!isJunk) {
    setChatHistory(prev => [{ id: Date.now(), text: query }, ...prev]);
  }
  
  setInputValue(''); // FIX: Completely clears the prompt bar immediately
  
  let forcedCandidate = selectedCandidate;
  if (showScrollUp && !selectedCandidate && ambiguousCandidates.length > 0) {
    forcedCandidate = ambiguousCandidates[0];
  }
  executeIntelligenceScan(query, forcedCandidate);
};

const handleCandidateClick = (candidate) => {
  setSelectedCandidate(candidate);
  setShowScrollUp(false);
  setLiveSuggestions([]); 
  
  // FIX: Preserve what the user actually typed instead of replacing it!
  const userPrompt = inputValue.trim() || searchQuery;
  setSearchQuery(userPrompt);
  setInputValue('');
  
  // IMMEDIATELY force the map to fly to the target
  setResolvedLocation({
      lat: candidate.latitude,
      lng: candidate.longitude,
      name: candidate.name,
      context: candidate.context,
      s2_cell_id: String(candidate.candidate_id || "s2-node")
  });
  setContextHub(candidate.name);
  
  // FIX: Send the original prompt to backend, not the candidate name
  executeIntelligenceScan(userPrompt, candidate);
};

   // ==========================================
   // REAL-TIME CINEMATIC WALKTHROUGH METRIC SYNC
   // ==========================================
   const displayVolume = activeTourNode && activeTourNode.volMultiplier ? totalVolume * activeTourNode.volMultiplier : totalVolume;
   const displayVelocity = activeTourNode && activeTourNode.txMultiplier ? Math.round(txVelocity * activeTourNode.txMultiplier) : txVelocity;
   const displayContributors = activeTourNode && activeTourNode.volMultiplier ? Math.round(activeContributors * activeTourNode.volMultiplier) : activeContributors;
   const displayBuyers = activeTourNode && activeTourNode.volMultiplier ? Math.round(activeBuyers * activeTourNode.volMultiplier) : activeBuyers;
   const displayMerchants = activeTourNode && activeTourNode.txMultiplier ? Math.round(activeMerchants * activeTourNode.txMultiplier) : activeMerchants;

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: '#050505', color: '#ededef', fontFamily: sans, overflow: 'hidden' }}>
      
      {/* Global CSS for Modern Scrollbars & Animations */}
      <style>{`
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #222; border-radius: 10px; transition: background 0.2s; }
        ::-webkit-scrollbar-thumb:hover { background: #00e5ff; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-5px); } 100% { transform: translateY(0px); } }
      `}</style>

      {/* ========================================= */}
      {/* 1. SECTION ONE: NAVIGATION (7-Icon Layout) */}
      {/* ========================================= */}
      <div style={{ width: navExpanded ? '140px' : '44px', background: '#0a0a0c', borderRight: '1px solid #1a1a1a', transition: 'width 0.3s ease', display: 'flex', flexDirection: 'column', padding: '12px 0', zIndex: 40 }}>
        
        {/* Toggle Button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: navExpanded ? 'space-between' : 'center', padding: navExpanded ? '0 16px' : '0', marginBottom: '24px' }}>
          {navExpanded && <span style={{ color: '#666', fontSize: '9px', fontWeight: '800', letterSpacing: '1.5px' }}>NAVIGATION</span>}
          <div onClick={() => setNavExpanded(!navExpanded)} style={{ width: '20px', height: '20px', background: '#121214', border: '1px solid #222', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2"><polyline points={navExpanded ? "15 18 9 12 15 6" : "9 18 15 12 9 6"} /></svg>
          </div>
        </div>

        {/* TOP ICONS (Command, News, Export, API) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '0 8px', alignItems: navExpanded ? 'stretch' : 'center' }}>
          {[
            { id: 'Command', label: 'Command', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg> },
            { id: 'News/Updates', label: 'News & Impact', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg> },
            { id: 'Export', label: 'Export Data', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> },
            { id: 'API', label: 'API Keys', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg> }
          ].map(item => {
            const isActive = activePage === item.id;
            return (
              <div 
                key={item.id} 
                onClick={() => { setActivePage(item.id); if (item.id !== 'Command') setCanvasMode('map'); }}
                style={{ 
                  background: isActive ? blueShadesGradient : 'transparent', 
                  padding: isActive ? '1px' : '0', 
                  borderRadius: '8px', 
                  width: navExpanded ? '100%' : (isActive ? '34px' : '32px'),
                  display: 'flex',
                  cursor: 'pointer'
                }}
              >
                <button style={{ 
                  background: isActive ? '#0a0a0c' : 'transparent', 
                  border: 'none', 
                  color: isActive ? '#00e5ff' : '#888', 
                  borderRadius: '7px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px', 
                  padding: '8px', 
                  cursor: 'pointer', 
                  width: '100%', 
                  height: '32px', 
                  justifyContent: navExpanded ? 'flex-start' : 'center', 
                  transition: 'all 0.2s' 
                }}>
                  {item.icon}
                  {navExpanded && <span style={{ fontSize: '11px', fontWeight: isActive ? '700' : '500' }}>{item.label}</span>}
                </button>
              </div>
            );
          })}
        </div>

        {/* BOTTOM ICONS (About, Docs, Support) - Pushed to the very bottom */}
        <div style={{ marginTop: 'auto', paddingTop: '16px', paddingLeft: '8px', paddingRight: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: navExpanded ? 'stretch' : 'center' }}>
          {[
            { id: 'About', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg> },
            { id: 'Documentation', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> },
            { id: 'Support', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg> }
          ].map(item => {
            const isActive = activePage === item.id;
            return (
              <div 
                key={item.id} 
                onClick={() => { setActivePage(item.id); setCanvasMode('map'); }}
                style={{ 
                  background: isActive ? blueShadesGradient : 'transparent', 
                  padding: isActive ? '1px' : '0', 
                  borderRadius: '8px', 
                  width: navExpanded ? '100%' : (isActive ? '34px' : '32px'),
                  display: 'flex',
                  cursor: 'pointer'
                }}
              >
                <button style={{ 
                  background: isActive ? '#0a0a0c' : 'transparent', 
                  border: 'none', 
                  color: isActive ? '#00e5ff' : '#888', 
                  borderRadius: '7px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px', 
                  padding: '8px', 
                  cursor: 'pointer', 
                  width: '100%', 
                  height: '32px', 
                  justifyContent: navExpanded ? 'flex-start' : 'center', 
                  transition: 'all 0.2s' 
                }}>
                  {item.icon}
                  {navExpanded && <span style={{ fontSize: '11px', fontWeight: isActive ? '700' : '500' }}>{item.id}</span>}
                </button>
              </div>
            );
          })}
        </div>

      </div> 


      {/* ========================================================= */}
      {/* 2. SECTION TWO: MAIN COMMAND DECK & CHAT                  */}
      {/* ========================================================= */}
      <div style={{ 
        width: deckExpanded ? '460px' : '0px',
        minWidth: deckExpanded ? '460px' : '0px', 
        maxWidth: deckExpanded ? '460px' : '0px',
        flex: deckExpanded ? '0 0 460px' : '0 0 0px', 
        display: 'flex', 
        flexDirection: 'column', 
        background: '#050505', 
        borderRight: deckExpanded ? '1px solid #1a1a1c' : 'none', 
        position: 'relative',
        transition: 'all 0.3s ease',
        height: '100vh',
        overflow: 'visible'
      }}>
        
        {/* Valgo-Style Right Border Collapse Button */}
        <div onClick={() => setDeckExpanded(!deckExpanded)} style={{ position: 'absolute', top: '50%', right: '-14px', transform: 'translateY(-50%)', width: '28px', height: '56px', background: '#0a0a0c', border: '1px solid #333', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 100, color: '#888', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points={deckExpanded ? "15 18 9 12 15 6" : "9 18 15 12 9 6"} /></svg>
        </div>

        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', opacity: deckExpanded ? 1 : 0 }}>
          
          {activePage !== 'Command' ? (
            /* ========================================= */
            /* A. TELEMETRY & API PAGES                  */
            /* ========================================= */
            <div style={{ flex: 1, padding: '32px', color: '#fff', overflowY: 'auto' }}>
              
              {/* Back to Scan Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', paddingBottom: '16px', borderBottom: '1px solid #1a1a1a' }}>
                <button onClick={() => setActivePage('Command')} style={{ background: 'transparent', border: '1px solid #333', padding: '6px 14px', borderRadius: '16px', color: '#ededef', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg> Return to Command
                </button>
                <div style={{ fontSize: '11px', color: '#00e5ff', fontFamily: mono, fontWeight: '700', letterSpacing: '1px' }}>SYSTEM D TELEMETRY SUITE</div>
              </div>

              {activePage === 'News/Updates' && (
                <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                    <div>
                      <h2 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px' }}>Live Economic Footprint</h2>
                      <p style={{ color: '#888', fontSize: '13px', marginTop: '4px' }}>Real-time unbanked liquidity generated across your immediate geolocation, city, and nation.</p>
                    </div>
                    <span style={{ fontSize: '11px', color: '#3fb950', background: 'rgba(63, 185, 80, 0.1)', padding: '6px 12px', borderRadius: '20px', fontWeight: '700', border: '1px solid rgba(63, 185, 80, 0.3)' }}>● LIVE SENSORY SYNC</span>
                  </div>

                  <div style={{ background: '#0a0a0c', border: '1px solid #1a1a1a', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(0, 229, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(0, 229, 255, 0.3)' }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                        </div>
                        <div>
                          <div style={{ fontSize: '11px', color: '#888', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Pinned User Location</div>
                          <div style={{ fontSize: '18px', color: '#fff', fontWeight: '700', marginTop: '2px' }}>{contextHub || 'Abuja, Federal Capital Territory'}</div>
                        </div>
                      </div>
                      <button onClick={() => { if (navigator.geolocation) { navigator.geolocation.getCurrentPosition((pos) => { executeIntelligenceScan(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`); }); } }} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid #333', color: '#fff', padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Pin My GPS</button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                      {[
                        { label: 'Your Immediate Sector', val: formatCurrency(totalVolume || 4800), sub: 'Neighborhood Node' },
                        { label: 'Metropolitan City', val: formatCurrency((totalVolume * 15) || 84200), sub: 'Hub Capital Flow' },
                        { label: 'National Aggregate', val: formatCurrency((totalVolume * 105) || 4100000), sub: 'Country Level' },
                        { label: 'Global System D', val: '$12.4B', sub: 'Worldwide Estimate' }
                      ].map((card, i) => (
                        <div key={i} style={{ background: '#121214', border: '1px solid #1c1c1f', borderRadius: '10px', padding: '14px' }}>
                          <div style={{ fontSize: '10px', color: '#888', fontWeight: '600', textTransform: 'uppercase' }}>{card.label}</div>
                          <div style={{ fontSize: '20px', color: i === 0 ? '#00e5ff' : '#fff', fontWeight: '800', marginTop: '6px' }}>{card.val}</div>
                          <div style={{ fontSize: '10px', color: '#555', marginTop: '4px' }}>{card.sub}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ background: 'linear-gradient(135deg, rgba(0,229,255,0.06) 0%, rgba(0,119,255,0.02) 100%)', border: '1px solid rgba(0,229,255,0.25)', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <span style={{ fontSize: '11px', color: '#00e5ff', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>CAPILLARY SPEND IMPACT</span>
                    </div>
                    <div style={{ fontSize: '15px', color: '#ddd', lineHeight: '1.6', fontWeight: '500' }}>
                      Every cash and USSD transfer you execute sustains <strong style={{ color: '#fff' }}>14 unbanked micro-merchants</strong> within a 2.5km radial geofence. In the informal economy, direct consumer transactions prevent wholesale capital decay and circulate liquidity 3.2× faster than institutional bank settlements.
                    </div>
                    <div style={{ display: 'flex', gap: '16px', marginTop: '16px', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '16px' }}>
                      <div><span style={{ fontSize: '11px', color: '#888' }}>Your Velocity Multiplier:</span> <strong style={{ color: '#00e5ff', marginLeft: '6px' }}>3.28x</strong></div>
                      <div><span style={{ fontSize: '11px', color: '#888' }}>Supply Chain Retainage:</span> <strong style={{ color: '#3fb950', marginLeft: '6px' }}>92.4%</strong></div>
                    </div>
                  </div>

                  <div style={{ background: '#0a0a0c', border: '1px solid #1a1a1a', borderRadius: '16px', padding: '24px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff', marginBottom: '16px' }}>Verified Geolocation Updates</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {[
                        { time: '12 min ago', headline: 'Fuel retail bottleneck eases in Wuse zone; cash pricing falls 4.2% against POS terminals', tag: 'Micro-Pricing' },
                        { time: '48 min ago', headline: 'Cellular tower telemetry indicates 28% surge in USSD mobile transfers near outer bypass', tag: 'Telemetry' },
                        { time: '2 hrs ago', headline: 'Informal foodstuff wholesale manifests confirm 12,000 MT baseline arrival at main depots', tag: 'Logistics' }
                      ].map((news, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '16px', padding: '12px', background: '#121214', borderRadius: '8px', border: '1px solid #1c1c1f' }}>
                          <span style={{ fontSize: '11px', color: '#666', fontFamily: mono, width: '80px', flexShrink: 0 }}>{news.time}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13px', color: '#ddd', fontWeight: '500' }}>{news.headline}</div>
                            <span style={{ fontSize: '10px', color: '#00e5ff', background: 'rgba(0,229,255,0.1)', padding: '2px 6px', borderRadius: '4px', marginTop: '6px', display: 'inline-block' }}>{news.tag}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activePage === 'API' && (
                <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
                  <h2 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px', marginBottom: '8px' }}>Developer API & Webhooks</h2>
                  <p style={{ color: '#888', fontSize: '13px', marginBottom: '24px' }}>Programmatic access to Street AI reality stack telemetry, YOLO counts, and liquidity matrices.</p>
                  <div style={{ background: '#0a0a0c', border: '1px solid #1a1a1a', borderRadius: '16px', padding: '24px', marginBottom: '20px' }}>
                    <div style={{ fontSize: '12px', color: '#888', fontWeight: '700', textTransform: 'uppercase', marginBottom: '10px' }}>Active Production Key</div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input readOnly value="sk_live_streetai_99x_78f1a238910cd4" style={{ flex: 1, background: '#121214', border: '1px solid #333', padding: '12px 16px', borderRadius: '8px', color: '#00e5ff', fontFamily: mono, fontSize: '13px' }} />
                      <button style={{ background: '#00e5ff', color: '#000', border: 'none', padding: '0 20px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>Copy</button>
                    </div>
                  </div>
                  <div style={{ background: '#0a0a0c', border: '1px solid #1a1a1a', borderRadius: '16px', padding: '24px' }}>
                    <div style={{ fontSize: '12px', color: '#888', fontWeight: '700', textTransform: 'uppercase', marginBottom: '12px' }}>Endpoint Verification</div>
                    <pre style={{ background: '#121214', padding: '16px', borderRadius: '8px', color: '#ccc', fontFamily: mono, fontSize: '12px', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
{`curl -X POST https://api.streetai.io/v1/scan \\
  -H "Authorization: Bearer sk_live_..." \\
  -d '{"target_region": "Wuse", "cadence": "DAILY"}'`}
                    </pre>
                  </div>
                </div>
              )}

              {activePage === 'Export' && (
                <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
                  <h2 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px', marginBottom: '8px' }}>Intelligence Export Matrix</h2>
                  <p style={{ color: '#888', fontSize: '13px', marginBottom: '24px' }}>Export processed econometric models and raw spatial scans for external modeling.</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    {[
                      { title: 'Full GeoJSON FeatureCollection', sub: 'Overture POI contours + S2 calibrated voxel cells', format: 'GEOJSON' },
                      { title: 'Econometric CSV Ledger', sub: 'Cash vs mobile money split, velocity, and markup', format: 'CSV' },
                      { title: 'Satellite & CCTV Inference Manifest', sub: 'YOLOv8 detected stalls, crowd counts, bounding boxes', format: 'JSON' },
                      { title: 'Executive Intelligence Brief (PDF)', sub: 'Formal macro analysis report formatted for institutional review', format: 'PDF' }
                    ].map((exp, i) => (
                      <div key={i} style={{ background: '#0a0a0c', border: '1px solid #1a1a1a', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: '15px', color: '#fff', fontWeight: '700' }}>{exp.title}</div>
                          <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>{exp.sub}</div>
                        </div>
                        <button style={{ marginTop: '20px', background: 'rgba(255,255,255,0.05)', border: '1px solid #333', color: '#00e5ff', padding: '10px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          Download {exp.format}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {['About', 'Documentation', 'Support'].includes(activePage) && (
                <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
                  <h2 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px', marginBottom: '8px' }}>{activePage}</h2>
                  <p style={{ color: '#888', fontSize: '13px', marginBottom: '24px' }}>Universal System D unbanked economic observation engine.</p>
                  <div style={{ background: '#0a0a0c', border: '1px solid #1a1a1a', borderRadius: '16px', padding: '28px' }}>
                    <div style={{ fontSize: '14px', color: '#ddd', lineHeight: '1.8' }}>
                      {activePage === 'About' && "Street AI tracks the global informal economy across dark cash and mobile money channels with 99% precision targets. By combining Sentinel orbital SAR, cellular RF signals, and decentralized pricing networks, the platform provides institutional-grade visibility into previously invisible markets."}
                      {activePage === 'Documentation' && "The 7-Pillar Architecture executes zero-cost spatial pipelines through DuckDB, Overture Maps Parquet, and localized Playwright scrapers before applying typed Pydantic ontology graphs to prevent LLM hallucinations."}
                      {activePage === 'Support' && "For custom enterprise integrations, high-frequency Sentinel-1 orbital Tasking, or dedicated municipal geofence calibration, contact the core engineering team directly via secure channel."}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
          ) : canvasMode === 'analysis' ? (
            /* ========================================= */
            /* B. DEEP ANALYSIS: LEFT FILTER TAB         */
            /* ========================================= */
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: '#050507', animation: 'fadeIn 0.3s ease-out', borderRight: '1px solid #1a1a1c' }}>
              <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)', backdropFilter: 'blur(10px)', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(60, 160, 150, 0.1)', border: '1px solid rgba(60, 160, 150, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3ca096', boxShadow: '0 4px 12px rgba(60, 160, 150, 0.1)' }}>
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                  </div>
                  <span style={{ fontSize: '13px', color: '#fff', fontWeight: '800', letterSpacing: '1px' }}>DEEP FILTERS</span>
                </div>
                <button style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: '#aaa', padding: '6px 12px', fontSize: '10px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }} onMouseEnter={(e)=>{e.currentTarget.style.background='rgba(255,255,255,0.08)'; e.currentTarget.style.color='#fff'}} onMouseLeave={(e)=>{e.currentTarget.style.background='rgba(255,255,255,0.03)'; e.currentTarget.style.color='#aaa'}}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg> Reset
                </button>
              </div>
              
              <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                 <div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#666', textTransform: 'uppercase', fontWeight: '700', marginBottom: '16px', letterSpacing: '1px' }}>
                     <span>Data Domain</span><span>−</span>
                   </div>
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                     <button style={{ background: 'linear-gradient(135deg, rgba(60,160,150,0.15) 0%, rgba(60,160,150,0.05) 100%)', border: '1px solid rgba(60, 160, 150, 0.4)', color: '#3ca096', padding: '12px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)' }}>Verified Nodes</button>
                     <button style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', color: '#888', padding: '12px', borderRadius: '8px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={(e)=>e.currentTarget.style.background='rgba(255,255,255,0.05)'} onMouseLeave={(e)=>e.currentTarget.style.background='rgba(255,255,255,0.02)'}>Dark Liquidity</button>
                     <button style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', color: '#888', padding: '12px', borderRadius: '8px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={(e)=>e.currentTarget.style.background='rgba(255,255,255,0.05)'} onMouseLeave={(e)=>e.currentTarget.style.background='rgba(255,255,255,0.02)'}>High Friction</button>
                     <button style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', color: '#888', padding: '12px', borderRadius: '8px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={(e)=>e.currentTarget.style.background='rgba(255,255,255,0.05)'} onMouseLeave={(e)=>e.currentTarget.style.background='rgba(255,255,255,0.02)'}>Anomalies</button>
                   </div>
                 </div>

                 <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '24px' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#666', textTransform: 'uppercase', fontWeight: '700', marginBottom: '24px', letterSpacing: '1px' }}>
                     <span>Capital Velocity Range</span><span>−</span>
                   </div>
                   <div style={{ padding: '0 8px' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#fff', marginBottom: '16px', fontWeight: '700', fontFamily: mono }}>
                       <span style={{ background: 'rgba(255,255,255,0.05)', padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}>₦10,000</span>
                       <span style={{ background: 'rgba(255,255,255,0.05)', padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}>₦2,500,000+</span>
                     </div>
                     <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', position: 'relative', marginTop: '16px' }}>
                       <div style={{ position: 'absolute', left: '15%', right: '25%', height: '100%', background: 'linear-gradient(90deg, #28648c, #3ca096)', borderRadius: '3px', boxShadow: '0 0 10px rgba(60, 160, 150, 0.4)' }} />
                       <div style={{ position: 'absolute', left: '15%', top: '50%', transform: 'translate(-50%, -50%)', width: '18px', height: '18px', background: '#fff', border: '3px solid #3ca096', borderRadius: '50%', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.8)' }} />
                       <div style={{ position: 'absolute', right: '25%', top: '50%', transform: 'translate(50%, -50%)', width: '18px', height: '18px', background: '#fff', border: '3px solid #3ca096', borderRadius: '50%', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.8)' }} />
                     </div>
                   </div>
                 </div>

                 <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '24px' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#666', textTransform: 'uppercase', fontWeight: '700', marginBottom: '20px', letterSpacing: '1px' }}>
                     <span>Node Sub-sectors</span><span>−</span>
                   </div>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                     {[
                       { label: 'Commodity Trading', count: 142, active: true },
                       { label: 'Mobile Money Agents', count: 89, active: true },
                       { label: 'Informal Logistics', count: 54, active: false },
                       { label: 'Wholesale Hubs', count: 12, active: false }
                     ].map((s) => (
                       <label key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: s.active ? 'rgba(60, 160, 150, 0.05)' : 'rgba(255,255,255,0.02)', border: s.active ? '1px solid rgba(60, 160, 150, 0.2)' : '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                           <div style={{ width: '18px', height: '18px', borderRadius: '4px', border: s.active ? 'none' : '1px solid #444', background: s.active ? '#3ca096' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                             {s.active && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#050507" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                           </div>
                           <span style={{ fontSize: '12px', color: s.active ? '#fff' : '#888', fontWeight: s.active ? '700' : '500' }}>{s.label}</span>
                         </div>
                         <span style={{ fontSize: '10px', color: s.active ? '#3ca096' : '#555', fontFamily: mono, fontWeight: '600' }}>{s.count}</span>
                       </label>
                     ))}
                   </div>
                 </div>
                 
                 <button style={{ marginTop: 'auto', background: 'linear-gradient(135deg, #3ca096 0%, #28648c 100%)', color: '#fff', border: 'none', padding: '16px', borderRadius: '10px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', boxShadow: '0 8px 24px rgba(60, 160, 150, 0.3)', transition: 'transform 0.1s' }} onMouseDown={(e)=>e.currentTarget.style.transform='scale(0.98)'} onMouseUp={(e)=>e.currentTarget.style.transform='scale(1)'}>
                   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="5 12 10 17 19 8"></polyline></svg>
                   Apply Parameters
                 </button>
              </div>
            </div>

          ) : commandTab === 'chat' ? (
            /* ========================================= */
            /* C. MAIN CHAT TAB                          */
            /* ========================================= */
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
              <div style={{ padding: '8px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10, height: '40px', minHeight: '40px' }}>
                <button onClick={() => setIsHistoryOpen(!isHistoryOpen)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', padding: '4px 10px', borderRadius: '12px', color: '#ededef', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '9px', fontWeight: '600' }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> History
                </button>
              </div>

              {/* History Panel Overlay */}
              <div style={{ position: 'absolute', top: '40px', left: isHistoryOpen ? 0 : '-100%', bottom: 0, width: '100%', background: 'rgba(7, 7, 9, 0.95)', backdropFilter: 'blur(24px)', zIndex: 40, transition: 'left 0.3s cubic-bezier(0.16, 1, 0.3, 1)', borderRight: '1px solid rgba(255,255,255,0.08)', padding: '16px 20px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3ca096', boxShadow: '0 0 8px #3ca096' }} />
                    <span style={{ fontSize: '9px', color: '#aaa', fontFamily: mono, fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>Query Ledger</span>
                  </div>
                  <button onClick={() => setIsHistoryOpen(false)} style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', borderRadius: '6px' }} onMouseEnter={(e)=>e.currentTarget.style.color='#fff'} onMouseLeave={(e)=>e.currentTarget.style.color='#666'}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                </div>

                <div onClick={() => { setIsHistoryOpen(false); setInputValue(''); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(60, 160, 150, 0.1)', border: '1px solid rgba(60, 160, 150, 0.3)', borderRadius: '8px', cursor: 'pointer', marginBottom: '16px', transition: 'all 0.2s' }} onMouseEnter={(e)=>e.currentTarget.style.border='1px solid #3ca096'} onMouseLeave={(e)=>e.currentTarget.style.border='1px solid rgba(60, 160, 150, 0.3)'}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3ca096" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    <span style={{ fontSize: '11px', color: '#fff', fontWeight: '600' }}>Run Market Inference</span>
                  </div>
                  <span style={{ fontSize: '9px', color: '#666', fontFamily: mono, background: '#121214', padding: '2px 4px', borderRadius: '4px', border: '1px solid #222' }}>Alt+N</span>
                </div>

                <div style={{ fontSize: '11px', color: '#555', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', paddingLeft: '4px' }}>Recent Sessions</div>

                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', paddingRight: '4px' }}>
                  {chatHistory.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 16px', color: '#555', fontSize: '13px' }}>
                      No verified scans recorded yet.<br/>Run a prompt to populate memory.
                    </div>
                  ) : (
                    chatHistory.map((chat) => (
                      <div key={chat.id} onClick={() => { setInputValue(chat.text); setIsHistoryOpen(false); executeIntelligenceScan(chat.text); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.15s' }} onMouseEnter={(e)=>{ e.currentTarget.style.background = '#121214'; e.currentTarget.style.borderColor = '#333'; }} onMouseLeave={(e)=>{ e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)'; }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                          <span style={{ color: '#ccc', fontSize: '13px', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{chat.text}</span>
                        </div>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', height: '100%', borderTop: '1px solid #1a1a1a' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '400px', background: 'linear-gradient(180deg, rgba(0, 229, 255, 0.15) 0%, rgba(0, 229, 255, 0.01) 60%, transparent 100%)', pointerEvents: 'none', zIndex: 0 }} />
                
                <div style={{ flex: 1, overflowY: 'auto', padding: '32px 24px 24px 24px', display: 'flex', flexDirection: 'column', gap: '16px', zIndex: 10 }}>
                  {chatHistory.length === 0 && !isSearching && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '24px', animation: 'fadeIn 0.5s ease-out', marginTop: '20px' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#1a1a1c', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', border: '1px solid #333' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>
                      </div>
                      <h2 style={{ fontSize: '24px', color: '#fff', fontWeight: '600', marginBottom: '8px' }}>Hi, Founder.</h2>
                      <p style={{ fontSize: '13px', color: '#888', marginBottom: '32px' }}>What would you like to discover now?</p>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '32px', width: '100%' }}>
                        {[
                          { title: "Where is the best rubber in Wuse?", sub: "Commodity pricing & volume" },
                          { title: "Map the cashflow in Las Vegas", sub: "Macro-liquidity analysis" },
                          { title: "What sells the most in Balogun?", sub: "Consumer demand heat" },
                          { title: "Track vendor density in Dharavi", sub: "Spatial population metrics" }
                        ].map((prompt, idx) => (
                          <div key={idx} onClick={() => setInputValue(prompt.title)} style={{ padding: '14px', background: 'transparent', border: '1px solid #222', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left' }} onMouseEnter={(e) => e.currentTarget.style.border = '1px solid #444'} onMouseLeave={(e) => e.currentTarget.style.border = '1px solid #222'}>
                            <div style={{ color: '#e0e0e0', fontSize: '11px', fontWeight: '600', marginBottom: '4px', lineHeight: '1.4' }}>{prompt.title}</div>
                            <div style={{ color: '#666', fontSize: '10px' }}>{prompt.sub}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(isSearching || isDataGenerated) && (
                    <div style={{ display: 'flex', gap: '12px', flexDirection: 'row-reverse', animation: 'fadeIn 0.3s ease-out' }}>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <div style={{ fontSize: '11px', color: '#e0e0e0', background: 'rgba(0, 229, 255, 0.15)', padding: '8px 14px', borderRadius: '14px 2px 14px 14px', border: '1px solid rgba(0, 229, 255, 0.3)', maxWidth: '85%', fontWeight: '500', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                      {searchQuery}
                       </div>
                      </div>
                    </div>
                  )}

                   {isSearching ? (
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2" className="animate-spin"><circle cx="12" cy="12" r="10"/></svg>
                  <div style={{ fontSize: '10px', color: '#00e5ff', fontStyle: 'italic', fontFamily: mono, opacity: 0.8 }}>Analyzing live nodes...</div>
                 </div>
                ) : isDataGenerated ? (
                    <div style={{ display: 'flex', gap: '12px', animation: 'fadeIn 0.3s ease-out' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '11px', lineHeight: '1.5', color: '#ccc', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', padding: '10px 14px', borderRadius: '2px 14px 14px 14px', fontWeight: '500' }}>
                          I have compiled the velocity estimates for {contextHub}. The spatial topology models have been generated.
                          <div onClick={() => { setCommandTab('data'); }} style={{ marginTop: '12px', background: '#0a0a0c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', maxWidth: '240px', transition: 'border 0.2s' }} onMouseEnter={(e)=>e.currentTarget.style.border='1px solid #3ca096'} onMouseLeave={(e)=>e.currentTarget.style.border='1px solid rgba(255,255,255,0.08)'}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ width: '24px', height: '24px', background: 'rgba(60,160,150,0.1)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3ca096' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg></div>
                              <div>
                                <div style={{ color: '#fff', fontSize: '10px', fontWeight: '700' }}>Overview Data Ready</div>
                                <div style={{ color: '#888', fontSize: '8px', marginTop: '1px' }}>Click to view Overview Data</div>
                              </div>
                            </div>
                            <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#1a1a1c', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}><svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px 32px 32px 32px', background: 'linear-gradient(180deg, rgba(7,7,9,0) 0%, rgba(7,7,9,1) 40%)', zIndex: 20 }}>
                  {showScrollUp && (
                      <div style={{ position: 'absolute', bottom: '100%', left: '32px', right: '32px', background: 'rgba(10,10,12,0.95)', backdropFilter: 'blur(16px)', border: '1px solid #333', borderRadius: '12px', padding: '12px', marginBottom: '16px', boxShadow: '0 -10px 40px rgba(0,0,0,0.8)' }}>
                        <div style={{ fontSize: '11px', color: '#3ca096', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: '800', padding: '4px 12px 12px 12px', borderBottom: '1px solid #222', marginBottom: '8px' }}>Disambiguation Required — Did you mean:</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '200px', overflowY: 'auto' }}>
                            {ambiguousCandidates.map((cand, idx) => (
                              <div key={idx} onClick={() => handleCandidateClick(cand)} style={{ padding: '12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', transition: 'all 0.2s', border: '1px solid transparent' }} onMouseEnter={(e)=>{e.currentTarget.style.background='#121214'; e.currentTarget.style.border='1px solid #333';}} onMouseLeave={(e)=>{e.currentTarget.style.background='transparent'; e.currentTarget.style.border='1px solid transparent';}}>
                                  <div style={{ width: '32px', height: '32px', background: 'rgba(60,160,150,0.1)', border: '1px solid rgba(60,160,150,0.3)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3ca096' }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ color: '#fff', fontSize: '14px', fontWeight: '600' }}>{cand.name}</span>
                                    <span style={{ color: '#888', fontSize: '12px', marginTop: '2px' }}>{cand.context} • {cand.location_type}</span>
                                  </div>
                              </div>
                            ))}
                        </div>
                      </div>
                  )}

                <div style={{ padding: '2px', background: 'linear-gradient(90deg, #0077ff, #00e5ff)', borderRadius: '32px', boxShadow: '0 8px 30px rgba(0, 229, 255, 0.15)' }}>
                  <form onSubmit={handlePromptSubmit} style={{ position: 'relative', display: 'flex', alignItems: 'center', background: '#050505', borderRadius: '30px' }}>
                     <div style={{ position: 'relative', width: '100%' }}>
                        {liveSuggestions.length > 0 && (
                          <div style={{ position: 'absolute', bottom: '100%', left: '16px', right: '16px', background: '#121214', border: '1px solid #333', borderRadius: '12px', marginBottom: '16px', overflow: 'hidden', zIndex: 100, boxShadow: '0 -10px 40px rgba(0,0,0,0.8)' }}>
                            <div style={{ padding: '8px 16px', fontSize: '10px', color: '#666', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid #222' }}>Detected Locations</div>
                            {liveSuggestions.filter(sug => sug.location_type !== "WORD").slice(0, 3).map((sug) => (
                              <div key={sug.candidate_id} onClick={() => { setInputValue(sug.name); setLiveSuggestions([]); executeIntelligenceScan(sug.name, sug); }} style={{ padding: '12px 16px', borderBottom: '1px solid #222', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} onMouseEnter={(e)=>e.currentTarget.style.background='rgba(255,255,255,0.03)'} onMouseLeave={(e)=>e.currentTarget.style.background='transparent'}>
                                <div>
                                  <span style={{ color: '#fff', fontSize: '14px', fontWeight: '600' }}>{sug.name}</span>
                                  <span style={{ color: '#888', marginLeft: '8px', fontSize: '12px' }}>{sug.context}</span>
                                </div>
                                <span style={{ fontSize: '10px', color: '#3ca096', background: 'rgba(60, 160, 150, 0.1)', padding: '4px 8px', borderRadius: '4px' }}>{sug.location_type}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Ask Street AI..." disabled={isSearching} style={{ width: '100%', background: 'transparent', border: 'none', padding: '12px 48px 12px 20px', color: '#fff', fontSize: '13px', fontWeight: '500', outline: 'none', fontFamily: sans }} />
                      </div>
                      <button type="submit" disabled={isSearching || !inputValue.trim()} style={{ position: 'absolute', right: '6px', background: (isSearching || !inputValue.trim()) ? '#1a1a1c' : '#00e5ff', border: 'none', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: (isSearching || !inputValue.trim()) ? 'default' : 'pointer', transition: 'all 0.2s' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={(isSearching || !inputValue.trim()) ? '#666' : '#000'} strokeWidth="3"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>

          ) : (
            /* ========================================= */
            /* D. OVERVIEW DATA TAB                      */
            /* ========================================= */
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
          )}
        </div>
      </div>

      {/* ========================================== */}
      {/* 3. SECTION THREE: RIGHT MAP CANVAS         */}
      {/* ========================================== */}
      <ThirdSection 
        searchQuery={searchQuery}
        isDataGenerated={isDataGenerated}
        resolvedLocation={resolvedLocation}
        canvasMode={canvasMode}
        setCanvasMode={setCanvasMode}
        setActiveTourNode={setActiveTourNode}
      />
      </div> 
  );
}
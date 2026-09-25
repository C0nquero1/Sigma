import React, { useState, useEffect, useRef } from 'react';

const sans = "system-ui, -apple-system, sans-serif";
const mono = "ui-monospace, monospace";

export default function ThirdSection({ searchQuery = "Broadway", isDataGenerated = false, resolvedLocation = null, canvasMode = 'map', setCanvasMode, setActiveTourNode }) {
  const [mapStyle, setMapStyle] = useState('Dark'); // 'Dark' or 'Satellite'
  const [isPlaying, setIsPlaying] = useState(false);
  const [tourStep, setTourStep] = useState(-1);
  
  // Interactive States
  const [activeTool, setActiveTool] = useState(null); // 'rect' or 'poly'
  const [styleMenuOpen, setStyleMenuOpen] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(9.5);
  const [dimLevel, setDimLevel] = useState(56);
  
  // Dynamic Geolocation State (Takes you to the prompted location)
  const [targetCoords, setTargetCoords] = useState({ lng: 3.3792, lat: 6.5244 }); // Default Lagos

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const svgRef = useRef(null);

  // ==========================================
  // DYNAMIC GEOLOCATION ENGINE
  // ==========================================
  useEffect(() => {
    if (resolvedLocation && resolvedLocation.lat && resolvedLocation.lng) {
      if (mapRef.current) {
        
        // FIX: Update targetCoords so Cinematic Tour nodes center here, NOT Lagos
        if (typeof setTargetCoords === 'function') {
           setTargetCoords({ lng: resolvedLocation.lng, lat: resolvedLocation.lat });
        }
        
        mapRef.current.flyTo({ 
          center: [resolvedLocation.lng, resolvedLocation.lat], 
          zoom: 15.5,     // Increased from 14.5 for a much tighter, zoomed-in view
          pitch: 60,      // Increased from 0 to 60 for the 3D cinematic angle
          bearing: -15,   // Adds a slight camera rotation
          speed: 1.5,
          essential: true
        });
        
        // Re-generate the Valgo Voxel grid over the new precise coordinates
        const source = mapRef.current.getSource('valgo-grid');
        if (source) {
          source.setData(generateValgoGrid(resolvedLocation.lng, resolvedLocation.lat));
        }
      }
    }
  }, [resolvedLocation]); // Trigger instantly when resolvedLocation changes!

  // ==========================================
  // DYNAMIC CINEMATIC & NETWORK NODES
  // ==========================================
  const { cinematicNodes, flowmapNodes } = React.useMemo(() => {
    const commodityContext = searchQuery ? searchQuery.split(' ')[0] : 'Commercial';
    
    // Dynamic nodes sync to the KineticDashboard with vol/tx multipliers for real-time data projection
    const cNodes = [
      { id: 'macro', lng: targetCoords.lng, lat: targetCoords.lat, zoom: 8.5, pitch: 0, name: 'Macro Spatial Distribution', type: 'City Baseline', color: '#28648c', volMultiplier: 1.0, txMultiplier: 1.0, description: `Real-time kinetic flow mapping across ${commodityContext} agents for ${searchQuery}, trailing 24 hours.` },
      { id: 'hub', lng: targetCoords.lng - 0.015, lat: targetCoords.lat + 0.015, zoom: 14.8, pitch: 45, name: 'Primary Aggregator Hub', type: 'Wholesale Node', color: '#d4d95c', volMultiplier: 0.68, txMultiplier: 0.45, description: `Zoomed into Primary Aggregator Hub. Detecting massive wholesale inventory displacement. Flowmap vectors indicate 68% of capital is concentrated here.` },
      { id: 'transit', lng: targetCoords.lng - 0.01, lat: targetCoords.lat - 0.01, zoom: 15.5, pitch: 60, name: 'Major Transit Corridor', type: 'Friction Point', color: '#74c365', volMultiplier: 0.45, txMultiplier: 0.30, description: `Tracking Major Transit Corridor. High friction detected. Mobile money transfers show a bottleneck pattern due to logistics loading zones.` },
      { id: 'micro', lng: targetCoords.lng + 0.02, lat: targetCoords.lat + 0.01, zoom: 16.5, pitch: 70, name: 'Capillary Distribution Market', type: 'Micro-Vendors', color: '#3ca096', volMultiplier: 0.15, txMultiplier: 0.85, description: `Micro-Vendor Capillary Market. Flowmap reveals highly decentralized, low-value/high-frequency transactions forming the terminal edge of the ${commodityContext} supply chain.` }
    ];

    // Expanded web nodes for advanced flowmap graphics
    const fNodes = [
      { id: 'hub', lng: targetCoords.lng, lat: targetCoords.lat, r: 8, color: '#fff' },
      { id: 'n1', lng: targetCoords.lng - 0.015, lat: targetCoords.lat + 0.015, r: 5, color: '#00e5ff' },
      { id: 'n2', lng: targetCoords.lng - 0.01, lat: targetCoords.lat - 0.01, r: 5, color: '#ff007f' },
      { id: 'n3', lng: targetCoords.lng + 0.02, lat: targetCoords.lat + 0.01, r: 5, color: '#ffcc00' },
      { id: 'n4', lng: targetCoords.lng + 0.03, lat: targetCoords.lat - 0.015, r: 4, color: '#9b51e0' },
      { id: 'n5', lng: targetCoords.lng - 0.03, lat: targetCoords.lat + 0.005, r: 3, color: '#cc00ff' },
      { id: 'n6', lng: targetCoords.lng + 0.01, lat: targetCoords.lat - 0.025, r: 3, color: '#0055ff' },
    ];

    return { cinematicNodes: cNodes, flowmapNodes: fNodes };
  }, [targetCoords, searchQuery]);

  // ==========================================
  // ORGANIC VALGO S2 VOXEL GRID 
  // ==========================================
  const generateValgoGrid = (centerLng = targetCoords.lng, centerLat = targetCoords.lat, query = searchQuery) => {
    const features = [];
    const count = 40; // Wider scan area
    const spacing = 0.0035; 
    const size = 0.003; 

    // Procedural seed to ensure unique organic shapes per location
    let seed = 0;
    for(let i=0; i<query.length; i++) seed += query.charCodeAt(i);

    for (let x = -count; x <= count; x++) {
      for (let y = -count; y <= count; y++) {
        const lng = centerLng + (x * spacing);
        const lat = centerLat + (y * spacing);
        
        // Complex interference pattern for organic, decentralized clusters
        const dist = Math.sqrt(x*x + y*y);
        const organicNoise = Math.sin((x + seed) * 0.3) * Math.cos((y + seed) * 0.3) * 6;
        const structuralNoise = Math.sin((x + y) * 0.5) * 4;
        
        const totalWeight = dist - organicNoise - structuralNoise;

        if (totalWeight > 22 || totalWeight < 0) continue; 

        // True Valgo Thermal Scale (Deep Blue -> Cyan -> Green -> Yellow)
        let color = '#d4d95c'; // Yellow/Gold (Core/Hottest)
        if (totalWeight > 19) color = '#0c1938';      // Deep Space Blue (Edge/Coldest)
        else if (totalWeight > 15) color = '#1a3668'; // Navy Blue
        else if (totalWeight > 11) color = '#28648c'; // Ocean Teal
        else if (totalWeight > 7) color = '#3ca096';  // Mint/Teal
        else if (totalWeight > 3) color = '#74c365';  // Light Green

        const half = size / 2;
        features.push({
          type: 'Feature',
          properties: { color: color },
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [lng - half, lat - half], [lng + half, lat - half],
              [lng + half, lat + half], [lng - half, lat + half],
              [lng - half, lat - half]
            ]]
          }
        });
      }
    }
    return { type: 'FeatureCollection', features };
  };

  const cartoDarkStyle = {
    version: 8,
    sources: {
      'esri-dark': {
        type: 'raster',
        tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'],
        tileSize: 256,
        attribution: '&copy; Esri, HERE, Garmin, OpenStreetMap contributors'
      }
    },
    layers: [{ id: 'esri-dark-layer', type: 'raster', source: 'esri-dark', minzoom: 0, maxzoom: 22 }]
  };

  const maxarSatelliteStyle = {
    version: 8,
    sources: {
      'google-satellite': {
        type: 'raster',
        tiles: ['https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'],
        tileSize: 256,
        attribution: '&copy; Google'
      }
    },
    layers: [{ id: 'google-satellite-layer', type: 'raster', source: 'google-satellite', minzoom: 0, maxzoom: 22 }]
  };

  useEffect(() => {
    if (!document.getElementById('maplibre-css')) {
      const link = document.createElement('link'); link.id = 'maplibre-css'; link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/maplibre-gl@3.3.1/dist/maplibre-gl.css';
      document.head.appendChild(link);
    }

    const initMap = () => {
      const map = new window.maplibregl.Map({
        container: mapContainerRef.current,
        style: mapStyle === 'Satellite' ? maxarSatelliteStyle : cartoDarkStyle,
        center: [cinematicNodes[0].lng, cinematicNodes[0].lat], 
        zoom: cinematicNodes[0].zoom,
        pitch: cinematicNodes[0].pitch,
        attributionControl: false
      });

      mapRef.current = map;

      map.on('zoom', () => setCurrentZoom(map.getZoom()));

      map.on('style.load', () => {
        if (!map.getSource('valgo-grid')) {
          map.addSource('valgo-grid', { type: 'geojson', data: generateValgoGrid() });
          map.addLayer({
            id: 'valgo-grid-layer',
            type: 'fill',
            source: 'valgo-grid',
            paint: {
              'fill-color': ['get', 'color'],
              'fill-opacity': isDataGenerated ? 0.85 : 0.0,
              'fill-outline-color': 'rgba(0,0,0,0)' // No outline ensures solid voxel look
            }
          });
        }
      });

      // Flowmap.blue Live WebGL Node Projection
      map.on('render', () => {
        if (!svgRef.current || !isDataGenerated) return;
        
        const projectNode = (id, lng, lat) => {
          const p = map.project([lng, lat]);
          const el = document.getElementById(`node-${id}`);
          if (el) { el.setAttribute('cx', p.x); el.setAttribute('cy', p.y); }
          return p;
        };

        const pHub = projectNode('hub', flowmapNodes[0].lng, flowmapNodes[0].lat);
        const p1 = projectNode('n1', flowmapNodes[1].lng, flowmapNodes[1].lat);
        const p2 = projectNode('n2', flowmapNodes[2].lng, flowmapNodes[2].lat);
        const p3 = projectNode('n3', flowmapNodes[3].lng, flowmapNodes[3].lat);
        const p4 = projectNode('n4', flowmapNodes[4].lng, flowmapNodes[4].lat);
        const p5 = projectNode('n5', flowmapNodes[5].lng, flowmapNodes[5].lat);
        const p6 = projectNode('n6', flowmapNodes[6].lng, flowmapNodes[6].lat);

        const setCurvedEdge = (id, pStart, pEnd, curveOffset) => {
          const edge = document.getElementById(`edge-${id}`);
          const track = document.getElementById(`edge-track-${id}`);
          
          const cx = (pStart.x + pEnd.x) / 2 + curveOffset;
          const cy = (pStart.y + pEnd.y) / 2 + curveOffset;
          const path = `M ${pStart.x},${pStart.y} Q ${cx},${cy} ${pEnd.x},${pEnd.y}`;
          
          if (edge) edge.setAttribute('d', path);
          if (track) track.setAttribute('d', path);
       };

       // Create intersecting, curved network edges
       setCurvedEdge('e1', pHub, p1, 40);
       setCurvedEdge('e2', p1, p3, -30);
       setCurvedEdge('e3', pHub, p2, -40);
       setCurvedEdge('e4', p2, p4, 20);
       setCurvedEdge('e5', pHub, p5, 50);
       setCurvedEdge('e6', pHub, p6, -50);
       setCurvedEdge('e7', p1, p5, -15);
      });
    };

    if (!document.getElementById('maplibre-js')) {
      const script = document.createElement('script'); script.id = 'maplibre-js';
      script.src = 'https://unpkg.com/maplibre-gl@3.3.1/dist/maplibre-gl.js';
      script.onload = initMap;
      document.head.appendChild(script);
    } else if (window.maplibregl) {
      initMap();
    }

    // Force resize to fix blank spaces
    const resizeInterval = setInterval(() => {
      window.dispatchEvent(new Event('resize'));
    }, 200);

    setTimeout(() => clearInterval(resizeInterval), 1000);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      if (typeof resizeInterval !== 'undefined') clearInterval(resizeInterval);
    };
  }, []);

  // Handle Location Locks (Instantly Fly)
  useEffect(() => {
    if (isDataGenerated && resolvedLocation && resolvedLocation.lat && resolvedLocation.lng) {
      if (mapRef.current) {
        mapRef.current.flyTo({
          center: [resolvedLocation.lng, resolvedLocation.lat],
          zoom: 14.5,
          speed: 1.5,
          essential: true
        });

        const source = mapRef.current.getSource('valgo-grid');
        if (source) {
          source.setData(generateValgoGrid(resolvedLocation.lng, resolvedLocation.lat)); 
        }
      }
    }
  }, [resolvedLocation, isDataGenerated]);

  // Handle Styles
  useEffect(() => {
    if (mapRef.current && mapRef.current.isStyleLoaded()) {
       mapRef.current.setStyle(mapStyle === 'Satellite' ? googleSatelliteStyle : cartoDarkStyle);
    }
  }, [mapStyle]);

  // Handle Zoom Transition (Heatmap dims aggressively, Flowmap reveals)
  const isZoomedIn = currentZoom >= 13.5 || tourStep >= 0;
  
  useEffect(() => {
    if (mapRef.current && mapRef.current.getLayer('valgo-grid-layer')) {
      // Dims the heatmap to 0.15 (15%) during zoom/cinematic to prioritize the Flowmap
      mapRef.current.setPaintProperty('valgo-grid-layer', 'fill-opacity', isDataGenerated ? (isZoomedIn ? 0.15 : 0.85) : 0.0);
    }
  }, [isDataGenerated, currentZoom, tourStep]);

  // Cinematic Tour Engine
  useEffect(() => {
    let interval;
    if (isPlaying && isDataGenerated && mapRef.current) {
      const runStep = (step) => {
        setTourStep(step);
        // Sync active node to KineticDashboard to update live metrics on the left!
        setActiveTourNode(cinematicNodes[step]); 
        
        mapRef.current.flyTo({ 
          center: [cinematicNodes[step].lng, cinematicNodes[step].lat], 
          zoom: cinematicNodes[step].zoom, 
          pitch: cinematicNodes[step].pitch,
          speed: 0.5, 
          curve: 1.2
        });
      };

      runStep(1); 
      interval = setInterval(() => {
        setTourStep((prev) => {
          let next = prev + 1;
          if (next >= cinematicNodes.length) {
            setIsPlaying(false);
            setActiveTourNode(null);
            return -1; 
          }
          runStep(next);
          return next;
        });
      }, 9000); 
    } else if (!isPlaying && tourStep >= 0) {
       setTourStep(tourStep); 
    } else {
       setTourStep(-1);
       setActiveTourNode(null);
       if (mapRef.current) {
           mapRef.current.flyTo({ center: [cinematicNodes[0].lng, cinematicNodes[0].lat], zoom: cinematicNodes[0].zoom, pitch: 0 });
       }
    }
    return () => clearInterval(interval);
  }, [isPlaying, isDataGenerated, cinematicNodes, setActiveTourNode]);

  const currentDescription = (tourStep >= 0 && tourStep < cinematicNodes.length)
    ? cinematicNodes[tourStep].description 
    : cinematicNodes[0].description;

    return (
      <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', background: '#050505', zIndex: 10, overflow: 'hidden', fontFamily: sans }}>
        
        {/* PERFECTLY PERSISTENT TOP MASTER TOGGLE PILL */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '54px', display: 'flex', alignItems: 'center', padding: '0 24px', zIndex: 9999, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', display: 'flex', background: 'rgba(10,10,12,0.85)', backdropFilter: 'blur(10px)', border: '1px solid #333', borderRadius: '24px', padding: '3px', pointerEvents: 'auto', boxShadow: '0 4px 15px rgba(0,0,0,0.5)' }}>
            <button onClick={() => setCanvasMode('map')} style={{ padding: '4px 14px', borderRadius: '20px', border: 'none', fontSize: '10px', fontWeight: '700', cursor: 'pointer', background: canvasMode === 'map' ? 'rgba(255,255,255,0.1)' : 'transparent', color: canvasMode === 'map' ? '#fff' : '#888', transition: 'all 0.2s' }}>Map View</button>
            <button onClick={() => setCanvasMode('analysis')} style={{ padding: '4px 14px', borderRadius: '20px', border: 'none', fontSize: '10px', fontWeight: '700', cursor: 'pointer', background: canvasMode === 'analysis' ? 'rgba(255,255,255,0.1)' : 'transparent', color: canvasMode === 'analysis' ? '#fff' : '#888', transition: 'all 0.2s' }}>Deep Analysis</button>
          </div>
        </div>
  
        {/* ========================================== */}
        {/* LAYER 1: MAPBOX CANVAS (ALWAYS RENDERED)   */}
        {/* ========================================== */}
        <div style={{ position: 'absolute', inset: 0, opacity: canvasMode === 'map' ? 1 : 0, pointerEvents: canvasMode === 'map' ? 'auto' : 'none', transition: 'opacity 0.3s ease-in-out', zIndex: 1 }}>
            <div ref={mapContainerRef} style={{ position: 'absolute', inset: 0, zIndex: 1, background: '#111', filter: `brightness(${dimLevel}%)`, transition: 'filter 0.3s' }} />
            
            {/* FLOWMAP.BLUE DYNAMIC NETWORK GRAPH OVERLAY */}
          <svg ref={svgRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 10, pointerEvents: 'none', opacity: (isDataGenerated && isZoomedIn) ? 1 : 0, transition: 'opacity 0.8s ease-in-out' }}>
             <defs>
               {/* Glowing Arrows and Flow Gradients */}
               <marker id="arrow-pink" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 2 L 10 5 L 0 8 z" fill="#ff007f" /></marker>
               <marker id="arrow-cyan" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 2 L 10 5 L 0 8 z" fill="#00e5ff" /></marker>
               <marker id="arrow-yellow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 2 L 10 5 L 0 8 z" fill="#ffcc00" /></marker>
               <filter id="glow"><feGaussianBlur stdDeviation="4" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
             </defs>
             <g>
                 {/* Complex Network Edges with Flowmap.blue aesthetic */}
                 {/* Base thick tracks (opacity) */}
                 <path id="edge-track-e1" fill="none" stroke="#00e5ff" strokeWidth="8" opacity="0.2" strokeLinecap="round" />
                 <path id="edge-track-e3" fill="none" stroke="#ff007f" strokeWidth="6" opacity="0.2" strokeLinecap="round" />
                 <path id="edge-track-e5" fill="none" stroke="#cc00ff" strokeWidth="5" opacity="0.2" strokeLinecap="round" />
                 
                 {/* Core pulsing lines with arrows */}
                 <path id="edge-e1" fill="none" stroke="#00e5ff" strokeWidth="2.5" opacity="0.9" markerEnd="url(#arrow-cyan)" style={{ animation: isPlaying ? 'dash 20s linear infinite' : 'none' }} filter="url(#glow)" />
                 <path id="edge-e2" fill="none" stroke="#00e5ff" strokeWidth="1.5" opacity="0.6" strokeDasharray="4 4" />
                 <path id="edge-e3" fill="none" stroke="#ff007f" strokeWidth="2" opacity="0.8" markerEnd="url(#arrow-pink)" filter="url(#glow)" />
                 <path id="edge-e4" fill="none" stroke="#9b51e0" strokeWidth="1.5" opacity="0.7" />
                 <path id="edge-e5" fill="none" stroke="#cc00ff" strokeWidth="1.5" opacity="0.8" markerEnd="url(#arrow-yellow)" filter="url(#glow)" />
                 <path id="edge-e6" fill="none" stroke="#0055ff" strokeWidth="1" opacity="0.5" />
                 <path id="edge-e7" fill="none" stroke="#ffcc00" strokeWidth="1" opacity="0.4" strokeDasharray="2 6" />

                 {/* Flowmap Target Nodes */}
                 {flowmapNodes.map((n) => (
                    <circle key={n.id} id={`node-${n.id}`} r={n.r} fill={n.color} filter="url(#glow)" stroke="#fff" strokeWidth="1" />
                 ))}
             </g>
          </svg>
  
            {/* TOP LEFT: ACTIVE DRAWING TOOLS (Micro-UI Scale) */}
          <div style={{ position: 'absolute', top: '16px', left: '16px', display: 'flex', flexDirection: 'column', gap: '6px', zIndex: 9999 }}>
             <button onClick={() => setActiveTool(activeTool === 'rect' ? null : 'rect')} style={{ background: '#121212', border: `1px solid ${activeTool === 'rect' ? '#00e5ff' : '#2a2a2a'}`, color: activeTool === 'rect' ? '#00e5ff' : '#a0a0a0', padding: '4px 8px', borderRadius: '4px', fontSize: '9px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
               <div style={{ width: '8px', height: '8px', border: `1px solid ${activeTool === 'rect' ? '#00e5ff' : '#a0a0a0'}`, borderRadius: '1px' }} /> Rectangle Area
             </button>
             <button onClick={() => setActiveTool(activeTool === 'poly' ? null : 'poly')} style={{ background: '#121212', border: `1px solid ${activeTool === 'poly' ? '#00e5ff' : '#2a2a2a'}`, color: activeTool === 'poly' ? '#00e5ff' : '#a0a0a0', padding: '4px 8px', borderRadius: '4px', fontSize: '9px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
               <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={activeTool === 'poly' ? '#00e5ff' : 'currentColor'} strokeWidth="2"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5" /></svg> Polygon Area
             </button>
          </div>

          {/* TOP RIGHT: MAP CONTROLS (Micro-UI Scale) */}
          <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '6px', zIndex: 9999, alignItems: 'flex-start' }}>
             <button onClick={() => { if(mapRef.current) mapRef.current.zoomIn(); }} style={{ background: '#121212', border: '1px solid #2a2a2a', color: '#a0a0a0', padding: '4px 8px', borderRadius: '4px', fontSize: '9px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
                Zoom in <span style={{ color: '#888', border: '1px solid #444', borderRadius: '2px', padding: '1px 3px', fontSize: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>C</span>
             </button>
             
             <div style={{ position: 'relative' }}>
               <button onClick={() => setStyleMenuOpen(!styleMenuOpen)} style={{ background: '#121212', border: '1px solid #2a2a2a', color: '#a0a0a0', padding: '4px 8px', borderRadius: '4px', fontSize: '9px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg> Map style
               </button>
               
               {styleMenuOpen && (
                 <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', width: '200px', background: '#121214', border: '1px solid #333', borderRadius: '6px', padding: '8px', boxShadow: '0 12px 40px rgba(0,0,0,0.8)' }}>
                    {['Dark', 'Satellite'].map(style => (
                      <div key={style} onClick={() => { setMapStyle(style); setStyleMenuOpen(false); }} style={{ padding: '10px 14px', color: mapStyle === style ? '#00e5ff' : '#888', fontSize: '12px', fontWeight: '600', cursor: 'pointer', borderRadius: '4px', background: mapStyle === style ? 'rgba(0,229,255,0.08)' : 'transparent', transition: 'all 0.2s' }}>
                        {style}
                      </div>
                    ))}
                    <div style={{ borderTop: '1px solid #222', marginTop: '8px', paddingTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px' }}>
                      <span style={{ color: '#888', fontSize: '11px' }}>Dim</span>
                      <input type="range" min="20" max="100" value={dimLevel} onChange={(e) => setDimLevel(e.target.value)} style={{ width: '80px', accentColor: '#00e5ff' }} />
                    </div>
                 </div>
               )}
             </div>
          </div>
  
            {/* DYNAMIC DESCRIPTION BOX (Updates based on Cinematic Zoom) */}
            {isDataGenerated && (
               <div style={{ position: 'absolute', top: '70px', right: '16px', width: '220px', background: 'rgba(5, 5, 7, 0.9)', backdropFilter: 'blur(16px)', border: '1px solid #222', borderRadius: '6px', padding: '10px', zIndex: 40, boxShadow: '0 20px 40px rgba(0,0,0,0.8)', transition: 'all 0.3s' }}>
               <div style={{ fontSize: '9px', color: '#fff', lineHeight: '1.5', fontWeight: '500' }}>
                     <strong style={{color: '#00e5ff'}}>Description:</strong> {currentDescription}
                  </div>
               </div>
            )}
  
            {/* Valgo Legend (Ultra-Micro Scale) */}
          <div style={{ position: 'absolute', bottom: '36px', left: '24px', background: 'rgba(5, 5, 7, 0.75)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '6px', padding: '10px 14px', zIndex: 40, display: 'flex', flexDirection: 'column', gap: '6px' }}>
             <div style={{ color: '#888', fontSize: '7px', textTransform: 'uppercase', fontFamily: mono, fontWeight: '700', letterSpacing: '0.5px' }}>Per-Cell Vol (NGN)</div>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '8px', fontFamily: mono, color: '#ccc', fontWeight: '500' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '6px', height: '6px', background: '#0c1938', borderRadius: '1px' }}/> 0 - 25k</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '6px', height: '6px', background: '#1a3668', borderRadius: '1px' }}/> 25k - 60k</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '6px', height: '6px', background: '#28648c', borderRadius: '1px' }}/> 60k - 130k</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '6px', height: '6px', background: '#3ca096', borderRadius: '1px' }}/> 130k - 350k</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '6px', height: '6px', background: '#74c365', borderRadius: '1px' }}/> 350k - 660k</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '6px', height: '6px', background: '#d4d95c', borderRadius: '1px' }}/> 660k+</div>
             </div>
          </div>
  
            {/* BOTTOM CENTER: Apple Cinematic Play Button */}
            {isDataGenerated && (
              <div style={{ position: 'absolute', bottom: '36px', left: '50%', transform: 'translateX(-50%)', zIndex: 50 }}>
                  <div style={{ 
                      background: 'rgba(10, 10, 12, 0.85)', backdropFilter: 'blur(20px)',
                      borderRadius: '30px', border: '1px solid rgba(255,255,255,0.1)',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', 
                      padding: isPlaying ? '4px 16px 4px 4px' : '4px',
                      width: isPlaying ? '280px' : '36px', height: '36px',
                      transition: 'all 0.5s cubic-bezier(0.25, 1, 0.5, 1)', overflow: 'hidden'
                  }}>
                      <button onClick={() => setIsPlaying(!isPlaying)} style={{ width: '26px', height: '26px', borderRadius: '50%', background: isPlaying ? '#74c365' : '#3ca096', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: 'background 0.3s' }}>
                          {isPlaying ? (
                              <svg width="8" height="8" viewBox="0 0 24 24" fill="#fff"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                          ) : (
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="#000" style={{ transform: 'translateX(1px)' }}><polygon points="5 3 19 12 5 21"/></svg>
                          )}
                      </button>
                      <div style={{ display: 'flex', flexDirection: 'column', opacity: isPlaying ? 1 : 0, transition: 'opacity 0.3s 0.2s', overflow: 'hidden', whiteSpace: 'nowrap', marginLeft: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <div style={{ width: '4px', height: '4px', background: tourStep >= 0 ? cinematicNodes[tourStep].color : '#fff', borderRadius: '50%', boxShadow: `0 0 8px ${tourStep >= 0 ? cinematicNodes[tourStep].color : '#fff'}`, animation: 'pulse 1.5s infinite' }} />
                              <span style={{ fontSize: '8px', color: tourStep >= 0 ? cinematicNodes[tourStep].color : '#fff', fontFamily: mono, fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase' }}>
                                TOUR GUIDE ACTIVE • {tourStep >= 0 ? cinematicNodes[tourStep].type : 'INITIATING'}
                              </span>
                          </div>
                          <span style={{ fontSize: '10px', color: '#fff', fontWeight: '600', marginTop: '2px' }}>
                            Analyzing informal cash velocity at {tourStep >= 0 ? cinematicNodes[tourStep].name : '...'}
                          </span>
                      </div>
                  </div>
              </div>
            )}
  
            {/* Telemetry Footer */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '24px', background: '#050505', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px', fontSize: '8px', color: '#666', fontFamily: mono, borderTop: '1px solid #1a1a1a', zIndex: 60 }}>
                <div>Target: {searchQuery}, NG <span style={{margin:'0 8px', color:'#333'}}>|</span> S2 Hex Level 11 <span style={{margin:'0 8px', color:'#333'}}>|</span> <span style={{ color: '#fff' }}>4,218</span> active vendor nodes / 5,000 cells</div>
                <div>MapLibre | © OpenStreetMap | CARTO | Maxar</div>
            </div>
        </div>
  
        {/* ========================================== */}
        {/* LAYER 2: DEEP ANALYSIS CANVAS (OVERLAY)    */}
        {/* ========================================== */}
        <div style={{ position: 'absolute', inset: 0, opacity: canvasMode === 'analysis' ? 1 : 0, pointerEvents: canvasMode === 'analysis' ? 'auto' : 'none', background: 'rgba(5, 5, 7, 0.98)', backdropFilter: 'blur(30px)', padding: '60px 40px 60px 40px', overflowY: 'auto', zIndex: 100, transition: 'opacity 0.3s ease-in-out' }}>
           <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '40px' }}>
              
              {/* Sleek Obsidian UI Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '24px' }}>
                 <div>
                   <div style={{ fontSize: '36px', color: '#fff', fontWeight: '800', letterSpacing: '-1.5px', marginBottom: '8px' }}>Deep Spatial Analysis</div>
                   <div style={{ fontSize: '14px', color: '#888', fontWeight: '500' }}>Extended intelligence & flow topology filtered via parameters.</div>
                 </div>
                 <div style={{ display: 'flex', gap: '16px' }}>
                   <button style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#fff', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }} onMouseEnter={(e)=>e.currentTarget.style.background='rgba(255,255,255,0.08)'} onMouseLeave={(e)=>e.currentTarget.style.background='rgba(255,255,255,0.03)'}>
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Export CSV
                   </button>
                   <button style={{ padding: '12px 20px', background: 'linear-gradient(135deg, #3ca096 0%, #28648c 100%)', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '13px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 6px 20px rgba(60, 160, 150, 0.25)' }}>
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> Generate Report
                   </button>
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

              {/* SECTION 3: Deep Expandable Text Report */}
              <div style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '32px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ fontSize: '12px', color: '#3ca096', fontFamily: mono, fontWeight: '800', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '16px' }}>EXECUTIVE INTELLIGENCE DOSSIER</div>
                
                <div style={{ color: '#ccc', fontSize: '15px', lineHeight: '1.8', fontWeight: '400', maxHeight: '120px', overflow: 'hidden', position: 'relative' }}>
                   The spatial analysis indicates a highly concentrated liquidity vortex within the primary aggregator hub. 
                   Unrecorded cash velocity is currently outperforming formal sector baselines by a factor of 3.2x in this specific geolocation. 
                   Friction variables remain stable, though logistical bottlenecks at wholesale checkpoints show a 12% increase in delay-related capital depreciation over the trailing 72 hours.
                   <br/><br/>
                   Furthermore, our kinetic models suggest that consumer demand heat in adjacent sub-sectors is absorbing the overflow, creating a localized micro-inflationary bubble that...
                   
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

      </div>
    );
  }
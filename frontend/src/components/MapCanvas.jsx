import React, { useState, useEffect, useRef, useMemo } from 'react';

const sans = "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";
const mono = "'JetBrains Mono', 'ui-monospace', monospace";

export default function MapCanvas({ 
  searchQuery = "Broadway", 
  isDataGenerated = false, 
  resolvedLocation = null, 
  canvasMode = 'map', 
  setCanvasMode, 
  setActiveTourNode 
}) {
  const [mapStyle, setMapStyle] = useState('Dark'); 
  const [isPlaying, setIsPlaying] = useState(false);
  const [tourStep, setTourStep] = useState(-1);
  
  const [activeTool, setActiveTool] = useState(null); 
  const [styleMenuOpen, setStyleMenuOpen] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(10.2); 
  
  const [targetCoords, setTargetCoords] = useState({ lng: 3.3792, lat: 6.5244 }); 

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const svgRef = useRef(null);

  // ==========================================
  // DYNAMIC GEOLOCATION ENGINE
  // ==========================================
  useEffect(() => {
    if (resolvedLocation && resolvedLocation.lat && resolvedLocation.lng) {
      if (mapRef.current) {
        setTargetCoords({ lng: resolvedLocation.lng, lat: resolvedLocation.lat });
        mapRef.current.flyTo({ 
          center: [resolvedLocation.lng, resolvedLocation.lat], 
          zoom: 10.2, pitch: 45, bearing: -10, speed: 1.5, essential: true
        });
      }
    }
  }, [resolvedLocation]);

  // ==========================================
  // DYNAMIC CINEMATIC & NETWORK NODES
  // ==========================================
  const { cinematicNodes, flowmapNodes } = useMemo(() => {
    const commodityContext = searchQuery ? searchQuery.split(' ')[0] : 'Commercial';
    
    const cNodes = [
      { id: 'macro', lng: targetCoords.lng, lat: targetCoords.lat, zoom: 10.5, pitch: 30, name: 'Macro Spatial Distribution', type: 'City Baseline', color: '#0d9488', description: `Real-time kinetic flow mapping across ${commodityContext} agents for ${searchQuery}, trailing 24 hours.` },
      { id: 'hub', lng: targetCoords.lng - 0.015, lat: targetCoords.lat + 0.015, zoom: 12.5, pitch: 45, name: 'Primary Aggregator Hub', type: 'Wholesale Node', color: '#facc15', description: `Zoomed into Primary Aggregator Hub. Detecting massive wholesale inventory displacement. Flowmap vectors indicate 68% of capital is concentrated here.` },
      { id: 'transit', lng: targetCoords.lng - 0.01, lat: targetCoords.lat - 0.01, zoom: 13.0, pitch: 60, name: 'Major Transit Corridor', type: 'Friction Point', color: '#00e676', description: `Tracking Major Transit Corridor. High friction detected. Mobile money transfers show a bottleneck pattern due to logistics loading zones.` },
      { id: 'micro', lng: targetCoords.lng + 0.02, lat: targetCoords.lat + 0.01, zoom: 13.5, pitch: 55, name: 'Capillary Distribution Market', type: 'Micro-Vendors', color: '#a5f3fc', description: `Micro-Vendor Capillary Market. Flowmap reveals highly decentralized, low-value/high-frequency transactions forming the terminal edge of the ${commodityContext} supply chain.` }
    ];

    const fNodes = [
      { id: 'hub', lng: targetCoords.lng - 0.015, lat: targetCoords.lat + 0.015, r: 8, color: '#facc15' }, 
      { id: 'n1', lng: targetCoords.lng + 0.01, lat: targetCoords.lat + 0.02, r: 6, color: '#ffffff' },
      { id: 'n2', lng: targetCoords.lng - 0.03, lat: targetCoords.lat - 0.01, r: 6, color: '#ffffff' },
      { id: 'n3', lng: targetCoords.lng + 0.02, lat: targetCoords.lat - 0.015, r: 5, color: '#ffffff' },
      { id: 'n4', lng: targetCoords.lng - 0.005, lat: targetCoords.lat - 0.025, r: 5, color: '#ffffff' },
      { id: 'n5', lng: targetCoords.lng + 0.03, lat: targetCoords.lat + 0.005, r: 4, color: '#ffffff' },
      { id: 'n6', lng: targetCoords.lng - 0.025, lat: targetCoords.lat + 0.03, r: 4, color: '#ffffff' },
    ];

    return { cinematicNodes: cNodes, flowmapNodes: fNodes };
  }, [targetCoords, searchQuery]);

  // ==========================================
  // MAP DATA GENERATORS (Geofence & Hex Grid)
  // ==========================================
  // Geofence is strictly a polygon shape with lines, NO round dots.
  const generateGeofence = (lng = targetCoords.lng, lat = targetCoords.lat) => ({
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [lng - 0.05, lat - 0.04], [lng + 0.05, lat - 0.04], 
        [lng + 0.06, lat + 0.02], [lng + 0.02, lat + 0.06], 
        [lng - 0.04, lat + 0.05], [lng - 0.05, lat - 0.04]
      ]]
    }
  });

  const generateValgoGrid = (centerLng = targetCoords.lng, centerLat = targetCoords.lat, query = searchQuery) => {
    const features = [];
    const count = 45; 
    const spacing = 0.0035; 
    const size = 0.003; 

    let seed = 0;
    for(let i=0; i<query.length; i++) seed += query.charCodeAt(i);

    for (let x = -count; x <= count; x++) {
      for (let y = -count; y <= count; y++) {
        const lng = centerLng + (x * spacing);
        const lat = centerLat + (y * spacing);
        const dist = Math.sqrt(x*x + y*y);
        const organicNoise = Math.sin((x + seed) * 0.3) * Math.cos((y + seed) * 0.3) * 6;
        const structuralNoise = Math.sin((x + y) * 0.5) * 4;
        const totalWeight = dist - organicNoise - structuralNoise;

        if (totalWeight > 22 || totalWeight < 0) continue; 

        let color = '#facc15'; 
        if (totalWeight > 19) color = '#3b0764';      
        else if (totalWeight > 14) color = '#1e3a8a'; 
        else if (totalWeight > 9) color = '#0d9488'; 
        else if (totalWeight > 4) color = '#00e676';  

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

  // ==========================================
  // BASEMAP STYLES (Streets & Names Fully Visible)
  // ==========================================
  const cartoDarkStyle = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
  const maxarSatelliteStyle = {
    version: 8,
    sources: { 'google-satellite': { type: 'raster', tiles: ['https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'], tileSize: 256 } },
    layers: [{ id: 'google-satellite-layer', type: 'raster', source: 'google-satellite', minzoom: 0, maxzoom: 22 }]
  };

  // ==========================================
  // DEFINE STATES & FIX STALE CLOSURES
  // ==========================================
  const isTouring = tourStep >= 0;
  const isZoomedIn = currentZoom >= 11.0 || isPlaying || activeTool !== null;

  // This ref guarantees the map NEVER uses stale memory when rebuilding layers
  const stateRef = useRef({ isDataGenerated, isZoomedIn });
  useEffect(() => {
    stateRef.current = { isDataGenerated, isZoomedIn };
  }, [isDataGenerated, isZoomedIn]);

  // Robust master function to instantly rebuild layers AND enforce correct opacities
  const enforceMapLayers = (map) => {
    if (!map || !map.isStyleLoaded()) return;

    // Pull the absolute freshest state from the ref
    const { isDataGenerated: dataGen, isZoomedIn: zoomed } = stateRef.current;
    
    const gridOpacity = dataGen ? (zoomed ? 0.15 : 0.85) : 0.0;
    const geoOpacity = dataGen ? 1.0 : 0.0;
    const geoFillOpacity = dataGen ? 0.15 : 0.0;

    if (!map.getSource('geofence')) map.addSource('geofence', { type: 'geojson', data: generateGeofence() });
    if (!map.getSource('valgo-grid')) map.addSource('valgo-grid', { type: 'geojson', data: generateValgoGrid() });

    // Geofence Fill
    if (!map.getLayer('geofence-fill')) {
      map.addLayer({ id: 'geofence-fill', type: 'fill', source: 'geofence', paint: { 'fill-color': '#00e676', 'fill-opacity': geoFillOpacity } });
    } else {
      map.setPaintProperty('geofence-fill', 'fill-opacity', geoFillOpacity);
    }

    // Geofence Line (Sleek line, NO round dots)
    if (!map.getLayer('geofence-line')) {
      map.addLayer({ id: 'geofence-line', type: 'line', source: 'geofence', paint: { 'line-color': '#00e676', 'line-width': 3, 'line-opacity': geoOpacity } });
    } else {
      map.setPaintProperty('geofence-line', 'line-opacity', geoOpacity);
    }

    // Valgo Hex Grid
    if (!map.getLayer('valgo-grid-layer')) {
      map.addLayer({ id: 'valgo-grid-layer', type: 'fill', source: 'valgo-grid', paint: { 'fill-color': ['get', 'color'], 'fill-opacity': gridOpacity, 'fill-outline-color': 'rgba(0,0,0,0)' } });
    } else {
      map.setPaintProperty('valgo-grid-layer', 'fill-opacity', gridOpacity);
    }
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
      
      // Ensure layers apply when style loads initially
      map.on('style.load', () => enforceMapLayers(map));

      // Continuous SVG Projection Logic for Flowmap
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
          if (!edge || !pStart || !pEnd || isNaN(pStart.x) || isNaN(pEnd.x)) return;
          const cx = (pStart.x + pEnd.x) / 2 + curveOffset;
          const cy = (pStart.y + pEnd.y) / 2 + curveOffset;
          edge.setAttribute('d', `M ${pStart.x},${pStart.y} Q ${cx},${cy} ${pEnd.x},${pEnd.y}`);
        };

        setCurvedEdge('e1', p1, pHub, 40);
        setCurvedEdge('e2', p3, p1, -30);
        setCurvedEdge('e3', p2, pHub, -40);
        setCurvedEdge('e4', p4, p2, 20);
        setCurvedEdge('e5', p5, pHub, 50);
        setCurvedEdge('e6', p6, pHub, -50);
        setCurvedEdge('e7', p5, p1, -15);
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

    const resizeInterval = setInterval(() => window.dispatchEvent(new Event('resize')), 200);
    setTimeout(() => clearInterval(resizeInterval), 1000);

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
      clearInterval(resizeInterval);
    };
  }, []);

  // ==========================================
  // PERFECTED STYLE SWITCHER & LAYER RESTORER
  // ==========================================

  // 1. Master Layer Controller: Guarantees layers survive style swaps with fresh state
  useEffect(() => {
    const applyLayersAndOpacities = () => {
      if (!mapRef.current || !mapRef.current.isStyleLoaded()) return;
      const map = mapRef.current;

      // Ensure Sources Exist (MapLibre wipes these on style change)
      if (!map.getSource('geofence')) map.addSource('geofence', { type: 'geojson', data: generateGeofence() });
      if (!map.getSource('valgo-grid')) map.addSource('valgo-grid', { type: 'geojson', data: generateValgoGrid() });

      // Ensure Layers Exist & Update Opacities
      if (!map.getLayer('geofence-fill')) {
        map.addLayer({ id: 'geofence-fill', type: 'fill', source: 'geofence', paint: { 'fill-color': '#00e676', 'fill-opacity': isDataGenerated ? 0.15 : 0 } });
      } else {
        map.setPaintProperty('geofence-fill', 'fill-opacity', isDataGenerated ? 0.15 : 0);
      }

      if (!map.getLayer('geofence-line')) {
        map.addLayer({ id: 'geofence-line', type: 'line', source: 'geofence', paint: { 'line-color': '#00e676', 'line-width': 3, 'line-opacity': isDataGenerated ? 1.0 : 0 } });
      } else {
        map.setPaintProperty('geofence-line', 'line-opacity', isDataGenerated ? 1.0 : 0);
      }

      if (!map.getLayer('valgo-grid-layer')) {
        map.addLayer({ id: 'valgo-grid-layer', type: 'fill', source: 'valgo-grid', paint: { 'fill-color': ['get', 'color'], 'fill-opacity': isDataGenerated ? (isZoomedIn ? 0.15 : 0.85) : 0.0, 'fill-outline-color': 'rgba(0,0,0,0)' } });
      } else {
        map.setPaintProperty('valgo-grid-layer', 'fill-opacity', isDataGenerated ? (isZoomedIn ? 0.15 : 0.85) : 0.0);
      }
    };

    // Apply immediately for standard interactions (e.g., Data Gen, Zooming, Play Button)
    applyLayersAndOpacities();

    // Re-apply automatically the precise millisecond a new Map Style finishes loading
    const handleStyleLoad = () => applyLayersAndOpacities();
    if (mapRef.current) {
      mapRef.current.on('style.load', handleStyleLoad);
    }

    return () => {
      if (mapRef.current) mapRef.current.off('style.load', handleStyleLoad);
    };
  }, [mapStyle, isDataGenerated, isZoomedIn, targetCoords, searchQuery]);

  // 2. Trigger the map style swap securely
  useEffect(() => {
    if (mapRef.current) {
       mapRef.current.setStyle(mapStyle === 'Satellite' ? maxarSatelliteStyle : cartoDarkStyle);
    }
  }, [mapStyle]);

  // ==========================================
  // PERFECTED TRUE PAUSE & AUTO-RESET CINEMATIC TOUR
  // ==========================================
  useEffect(() => {
    let interval;
    if (isPlaying && isDataGenerated && mapRef.current) {
      
      setTourStep(prev => {
        if (prev === -1) {
          const next = 0;
          if(setActiveTourNode) setActiveTourNode(cinematicNodes[next]);
          mapRef.current.flyTo({ center: [cinematicNodes[next].lng, cinematicNodes[next].lat], zoom: cinematicNodes[next].zoom, pitch: cinematicNodes[next].pitch, speed: 0.6, curve: 1.2 });
          return next;
        }
        return prev; 
      });

      interval = setInterval(() => {
        setTourStep(prev => {
          let next = prev + 1;
          
          // Reached the end! Auto-reset to beginning and pause.
          if (next >= cinematicNodes.length) {
            setIsPlaying(false);
            if(setActiveTourNode) setActiveTourNode(null);
            // Fly back to Macro View ready to play again
            mapRef.current.flyTo({ center: [cinematicNodes[0].lng, cinematicNodes[0].lat], zoom: cinematicNodes[0].zoom, pitch: cinematicNodes[0].pitch, speed: 1.0, curve: 1.2 });
            return -1; 
          }
          
          if(setActiveTourNode) setActiveTourNode(cinematicNodes[next]);
          mapRef.current.flyTo({ center: [cinematicNodes[next].lng, cinematicNodes[next].lat], zoom: cinematicNodes[next].zoom, pitch: cinematicNodes[next].pitch, speed: 0.6, curve: 1.2 });
          return next;
        });
      }, 7000);
      
    }
    // Clicking pause simply clears the interval. It does NOT reset tourStep or camera!
    return () => clearInterval(interval);
  }, [isPlaying, isDataGenerated, cinematicNodes, setActiveTourNode]);

  const currentDescription = (tourStep >= 0 && tourStep < cinematicNodes.length)
    ? cinematicNodes[tourStep].description 
    : cinematicNodes[0].description;

  const GlassButton = ({ icon, text, shortcut, onClick, isActive }) => (
    <button onClick={onClick} style={{ 
      background: 'rgba(15, 15, 18, 0.85)', backdropFilter: 'blur(12px)', 
      border: `1px solid ${isActive ? '#00e676' : 'rgba(255,255,255,0.08)'}`, 
      borderRadius: '6px', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
      color: isActive ? '#00e676' : '#d4d4d8', fontSize: '10px', fontWeight: '600', transition: 'all 0.2s'
    }}
    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(15, 15, 18, 0.85)'; e.currentTarget.style.color = isActive ? '#00e676' : '#d4d4d8'; }}
    >
      <span style={{ display: 'flex', alignItems: 'center', opacity: 0.8 }}>{icon}</span>
      <span>{text}</span>
      {shortcut && <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 4px', borderRadius: '4px', fontSize: '8px', marginLeft: '2px' }}>{shortcut}</span>}
    </button>
  );

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: '#020504', zIndex: 10, overflow: 'hidden', fontFamily: sans }}>
      
      <div ref={mapContainerRef} style={{ position: 'absolute', inset: 0, zIndex: 1 }} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(2, 5, 4, 0.45)', mixBlendMode: 'multiply', pointerEvents: 'none', zIndex: 2 }} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0, 230, 118, 0.05)', mixBlendMode: 'overlay', pointerEvents: 'none', zIndex: 3 }} />

      {/* ========================================== */}
      {/* VIBRANT FLOWMAP.BLUE AESTHETIC (NO SVG FILTERS) */}
      {/* ========================================== */}
      <svg ref={svgRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 20, pointerEvents: 'none', overflow: 'visible', opacity: (isDataGenerated && isZoomedIn) ? 1 : 0, transition: 'opacity 0.6s ease-in-out' }}>
         <defs>
           {/* Drastically scaled up arrow heads for the Flowmap.blue style */}
           <marker id="arrow-cyan" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M 0 1 L 10 5 L 0 9 z" fill="#00e5ff" /></marker>
           <marker id="arrow-white" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M 0 1 L 10 5 L 0 9 z" fill="#ffffff" /></marker>
           <marker id="arrow-yellow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M 0 1 L 10 5 L 0 9 z" fill="#facc15" /></marker>
         </defs>
         <g>
             {/* 1. Base Tracks: Thick, highly visible translucent lines mapping the street connections */}
             <path id="edge-track-e1" fill="none" stroke="#ffffff" strokeWidth="8" opacity="0.3" strokeLinecap="round" />
             <path id="edge-track-e3" fill="none" stroke="#00e5ff" strokeWidth="6" opacity="0.3" strokeLinecap="round" />
             <path id="edge-track-e5" fill="none" stroke="#1e3a8a" strokeWidth="5" opacity="0.3" strokeLinecap="round" />
             
             {/* 2. Highly Visible Kinetic Flow Arrows (Thickened ribbons, 100% Opacity) */}
             <path id="edge-e1" fill="none" stroke="#ffffff" strokeWidth="5" opacity="1.0" strokeDasharray="15 20" markerEnd="url(#arrow-white)" style={{ animation: (isPlaying || isZoomedIn) ? 'flowDash 1.2s linear infinite' : 'none' }} />
             <path id="edge-e2" fill="none" stroke="#00e5ff" strokeWidth="4" opacity="1.0" strokeDasharray="6 8" />
             <path id="edge-e3" fill="none" stroke="#ffffff" strokeWidth="4.5" opacity="1.0" strokeDasharray="12 18" markerEnd="url(#arrow-white)" style={{ animation: (isPlaying || isZoomedIn) ? 'flowDash 1.8s linear infinite' : 'none' }} />
             <path id="edge-e4" fill="none" stroke="#00e5ff" strokeWidth="3" opacity="0.9" />
             <path id="edge-e5" fill="none" stroke="#facc15" strokeWidth="4" opacity="1.0" strokeDasharray="15 20" markerEnd="url(#arrow-yellow)" style={{ animation: (isPlaying || isZoomedIn) ? 'flowDash 2.2s linear infinite' : 'none' }} />
             <path id="edge-e6" fill="none" stroke="#1e3a8a" strokeWidth="3" opacity="0.9" />
             <path id="edge-e7" fill="none" stroke="#00e5ff" strokeWidth="2.5" opacity="0.8" strokeDasharray="4 10" />

             {/* 3. Enlarged High-Contrast Nodes */}
             {flowmapNodes.map((n) => (
                <circle key={n.id} id={`node-${n.id}`} r={n.r + 3} fill="#ffffff" stroke={n.color === '#ffffff' ? '#00e676' : n.color} strokeWidth="2.5" />
             ))}
         </g>
      </svg>

      <div style={{ position: 'absolute', top: '16px', left: '16px', display: 'flex', flexDirection: 'column', gap: '6px', zIndex: 40 }}>
        <GlassButton isActive={activeTool === 'rect'} onClick={() => setActiveTool(activeTool === 'rect' ? null : 'rect')} icon={<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>} text="Rectangle Area" />
        <GlassButton isActive={activeTool === 'poly'} onClick={() => setActiveTool(activeTool === 'poly' ? null : 'poly')} icon={<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"></polygon></svg>} text="Polygon Area" />
      </div>

      <div style={{ position: 'absolute', top: '16px', left: '50%', transform: 'translateX(-50%)', display: 'flex', background: 'rgba(15, 15, 18, 0.75)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '3px', zIndex: 40, boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
        <button onClick={() => setCanvasMode('map')} style={{ padding: '5px 14px', borderRadius: '16px', border: 'none', fontSize: '10px', fontWeight: '700', cursor: 'pointer', background: canvasMode === 'map' ? 'rgba(255,255,255,0.1)' : 'transparent', color: canvasMode === 'map' ? '#fff' : '#a1a1aa', transition: 'all 0.2s' }}>Map View</button>
        <button onClick={() => setCanvasMode('analysis')} style={{ padding: '5px 14px', borderRadius: '16px', border: 'none', fontSize: '10px', fontWeight: '700', cursor: 'pointer', background: canvasMode === 'analysis' ? 'rgba(255,255,255,0.1)' : 'transparent', color: canvasMode === 'analysis' ? '#fff' : '#a1a1aa', transition: 'all 0.2s' }}>Deep Analysis</button>
      </div>

      {/* OVERLAP FIX: Z-Index 150 ensures Map Style Dropdown overlays Description Card */}
      <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '6px', zIndex: 150 }}>
        <GlassButton onClick={() => { if(mapRef.current) mapRef.current.zoomIn(); }} icon={<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>} text="Zoom in" shortcut="C" />
        <div style={{ position: 'relative' }}>
          <GlassButton isActive={styleMenuOpen} onClick={() => setStyleMenuOpen(!styleMenuOpen)} icon={<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>} text="Map style" />
          {styleMenuOpen && (
             <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', width: '140px', background: '#0a0a0c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '6px', boxShadow: '0 12px 40px rgba(0,0,0,0.8)' }}>
                {['Dark', 'Satellite'].map(style => (
                  <div key={style} onClick={() => { setMapStyle(style); setStyleMenuOpen(false); }} style={{ padding: '8px', color: mapStyle === style ? '#00e676' : '#d4d4d8', fontSize: '10px', fontWeight: '600', cursor: 'pointer', borderRadius: '4px', background: mapStyle === style ? 'rgba(0, 230, 118, 0.1)' : 'transparent', transition: 'all 0.2s' }}>
                    {style}
                  </div>
                ))}
             </div>
          )}
        </div>
      </div>

      {/* FURTHER REDUCED DESCRIPTION CARD */}
      {isDataGenerated && (
         <div style={{ 
            position: 'absolute', top: '60px', right: '16px', 
            width: '180px', // Further Shrunk Width
            background: 'rgba(15, 15, 18, 0.85)', backdropFilter: 'blur(20px)', 
            border: `1px solid ${isZoomedIn ? '#00e676' : 'rgba(255,255,255,0.08)'}`, 
            borderRadius: '8px', padding: '8px', zIndex: 40, 
            boxShadow: isZoomedIn ? '0 10px 40px rgba(0, 230, 118, 0.15)' : '0 10px 40px rgba(0,0,0,0.5)',
            transform: isDataGenerated ? 'translateX(0)' : 'translateX(20px)',
            opacity: isDataGenerated ? 1 : 0, transition: 'all 0.4s ease'
         }}>
            <div style={{ fontSize: '8px', color: isZoomedIn ? '#00e676' : '#a5f3fc', fontWeight: '700', fontFamily: mono, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isZoomedIn ? '#00e676' : '#a5f3fc' }} />
              Description:
            </div>
            <div style={{ fontSize: '9px', color: '#d4d4d8', lineHeight: '1.4', fontWeight: '500' }}>
               {currentDescription}
            </div>
            <div style={{ marginTop: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '6px', padding: '6px', fontSize: '7px', color: '#888', fontWeight: '600', fontFamily: mono }}>
              [NOTE: Active geofence drawn. Data prioritized.]
            </div>
         </div>
      )}

      {/* ========================================== */}
      {/* PERFECTED, READABLE LEGEND CARD            */}
      {/* ========================================== */}
      <div style={{ 
        position: 'absolute', bottom: '48px', left: '16px', 
        background: 'rgba(15, 15, 18, 0.85)', backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', 
        padding: '10px', width: '210px', zIndex: 40, // Scaled down width and padding
        opacity: isDataGenerated ? 1 : 0, transition: 'opacity 0.4s ease'
      }}>
         <div style={{ color: '#a1a1aa', fontSize: '8.5px', textTransform: 'uppercase', fontFamily: mono, fontWeight: '800', letterSpacing: '0.5px', marginBottom: '8px' }}>
            PER-CELL CALIBRATED VOLUME (NGN)
         </div>
         <div style={{ width: '100%', height: '5px', borderRadius: '2.5px', background: 'linear-gradient(90deg, #3b0764 0%, #1e3a8a 25%, #0d9488 50%, #00e676 75%, #facc15 100%)', marginBottom: '8px' }} />
         <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#d4d4d8', fontWeight: '700', fontFamily: mono }}>
            <span>0</span><span>36.0k</span><span>72.0k+</span>
         </div>
      </div>

      {isDataGenerated && (
        <div style={{ position: 'absolute', bottom: '48px', left: '50%', transform: 'translateX(-50%)', zIndex: 50 }}>
            <div style={{ 
                background: 'rgba(10, 10, 12, 0.85)', backdropFilter: 'blur(20px)',
                borderRadius: '30px', border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', 
                padding: '4px', width: isPlaying ? '260px' : '36px', height: '36px',
                transition: 'all 0.5s cubic-bezier(0.25, 1, 0.5, 1)', overflow: 'hidden'
            }}>
                <button onClick={() => setIsPlaying(!isPlaying)} style={{ width: '28px', height: '28px', borderRadius: '50%', background: isPlaying ? '#00e676' : '#0d9488', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: 'background 0.3s' }}>
                    {isPlaying ? (
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="#040a08"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                    ) : (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="#040a08" style={{ transform: 'translateX(1px)' }}><polygon points="5 3 19 12 5 21"/></svg>
                    )}
                </button>
                <div style={{ display: 'flex', flexDirection: 'column', opacity: isPlaying ? 1 : 0, transition: 'opacity 0.3s 0.2s', overflow: 'hidden', whiteSpace: 'nowrap', marginLeft: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '4px', height: '4px', background: '#fff', borderRadius: '50%', boxShadow: `0 0 8px #fff` }} />
                        <span style={{ fontSize: '8px', color: '#fff', fontFamily: mono, fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase' }}>
                            TOUR GUIDE ACTIVE • {cinematicNodes[tourStep]?.type || 'INITIATING'}
                        </span>
                    </div>
                    <span style={{ fontSize: '10px', color: '#fff', fontWeight: '600', marginTop: '2px' }}>
                      Analyzing informal cash velocity at {cinematicNodes[tourStep]?.name || '...'}
                    </span>
                </div>
            </div>
        </div>
      )}

      {/* FOOTER BAR */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '24px', background: '#020504', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px', fontSize: '9px', color: '#6b7280', fontFamily: mono, borderTop: '1px solid rgba(255,255,255,0.05)', zIndex: 60 }}>
          <div>Target: {searchQuery}, NG <span style={{margin:'0 8px', color:'#333'}}>|</span> S2 Hex Level 11 <span style={{margin:'0 8px', color:'#333'}}>|</span> <span style={{ color: '#fff' }}>4,218</span> active vendor nodes / 5,000 cells</div>
          <div>MapLibre | © OpenStreetMap | CARTO | Maxar</div>
      </div>

      <style>{`
        @keyframes flowDash { from { stroke-dashoffset: 100; } to { stroke-dashoffset: 0; } }
      `}</style>
    </div>
  );
}
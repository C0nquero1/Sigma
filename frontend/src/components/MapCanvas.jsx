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
  
  // Interactive States
  const [activeTool, setActiveTool] = useState(null); 
  const [styleMenuOpen, setStyleMenuOpen] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(11.0);
  
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
          zoom: 11.5,     
          pitch: 45,      
          bearing: -10,   
          speed: 1.5,
          essential: true
        });
        
        const source = mapRef.current.getSource('valgo-grid');
        if (source) source.setData(generateValgoGrid(resolvedLocation.lng, resolvedLocation.lat));
        
        const geoSource = mapRef.current.getSource('geofence');
        if (geoSource) geoSource.setData(generateGeofence(resolvedLocation.lng, resolvedLocation.lat));
      }
    }
  }, [resolvedLocation]);

  // ==========================================
  // DYNAMIC CINEMATIC & NETWORK NODES
  // ==========================================
  const { cinematicNodes, flowmapNodes } = useMemo(() => {
    const commodityContext = searchQuery ? searchQuery.split(' ')[0] : 'Commercial';
    
    // Z-levels restricted to max 13.5 to prevent blank map tiles
    const cNodes = [
      { id: 'macro', lng: targetCoords.lng, lat: targetCoords.lat, zoom: 11.5, pitch: 30, name: 'Macro Spatial Distribution', type: 'City Baseline', color: '#0d9488', description: `Real-time kinetic flow mapping across ${commodityContext} agents for ${searchQuery}, trailing 24 hours.` },
      { id: 'hub', lng: targetCoords.lng - 0.015, lat: targetCoords.lat + 0.015, zoom: 13.0, pitch: 45, name: 'Primary Aggregator Hub', type: 'Wholesale Node', color: '#facc15', description: `Zoomed into Primary Aggregator Hub. Detecting massive wholesale inventory displacement. Flowmap vectors indicate 68% of capital is concentrated here.` },
      { id: 'transit', lng: targetCoords.lng - 0.01, lat: targetCoords.lat - 0.01, zoom: 13.5, pitch: 60, name: 'Major Transit Corridor', type: 'Friction Point', color: '#00e676', description: `Tracking Major Transit Corridor. High friction detected. Mobile money transfers show a bottleneck pattern due to logistics loading zones.` },
      { id: 'micro', lng: targetCoords.lng + 0.02, lat: targetCoords.lat + 0.01, zoom: 13.5, pitch: 55, name: 'Capillary Distribution Market', type: 'Micro-Vendors', color: '#1e3a8a', description: `Micro-Vendor Capillary Market. Flowmap reveals highly decentralized, low-value/high-frequency transactions forming the terminal edge of the ${commodityContext} supply chain.` }
    ];

    const fNodes = [
      { id: 'hub', lng: targetCoords.lng - 0.015, lat: targetCoords.lat + 0.015, r: 10, color: '#facc15' }, // Hub
      { id: 'n1', lng: targetCoords.lng + 0.01, lat: targetCoords.lat + 0.02, r: 6, color: '#00e676' },
      { id: 'n2', lng: targetCoords.lng - 0.03, lat: targetCoords.lat - 0.01, r: 6, color: '#00e676' },
      { id: 'n3', lng: targetCoords.lng + 0.02, lat: targetCoords.lat - 0.015, r: 5, color: '#0d9488' },
      { id: 'n4', lng: targetCoords.lng - 0.005, lat: targetCoords.lat - 0.025, r: 5, color: '#0d9488' },
      { id: 'n5', lng: targetCoords.lng + 0.03, lat: targetCoords.lat + 0.005, r: 4, color: '#1e3a8a' },
      { id: 'n6', lng: targetCoords.lng - 0.025, lat: targetCoords.lat + 0.03, r: 4, color: '#3b0764' },
    ];

    return { cinematicNodes: cNodes, flowmapNodes: fNodes };
  }, [targetCoords, searchQuery]);

  // ==========================================
  // VALGO S2 VOXEL GRID & GEOFENCE
  // ==========================================
  const generateGeofence = (lng = targetCoords.lng, lat = targetCoords.lat) => ({
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [lng - 0.04, lat - 0.03], [lng + 0.03, lat - 0.04], 
        [lng + 0.05, lat + 0.02], [lng + 0.01, lat + 0.05], 
        [lng - 0.03, lat + 0.04], [lng - 0.04, lat - 0.03]
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

        // Upgraded Valgo Color Palette (Purple -> Blue -> Teal -> Green -> Yellow)
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

  const cartoDarkStyle = {
    version: 8,
    sources: {
      'esri-dark': {
        type: 'raster',
        tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'],
        tileSize: 256,
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
        // Geofence Layer
        if (!map.getSource('geofence')) {
          map.addSource('geofence', { type: 'geojson', data: generateGeofence() });
          map.addLayer({
            id: 'geofence-fill', type: 'fill', source: 'geofence',
            paint: { 'fill-color': '#00e676', 'fill-opacity': isDataGenerated ? 0.05 : 0 }
          });
          map.addLayer({
            id: 'geofence-line', type: 'line', source: 'geofence',
            paint: { 'line-color': '#00e676', 'line-width': 2, 'line-dasharray': [2, 4], 'line-opacity': isDataGenerated ? 0.8 : 0 }
          });
        }

        // Valgo Hex Grid Layer
        if (!map.getSource('valgo-grid')) {
          map.addSource('valgo-grid', { type: 'geojson', data: generateValgoGrid() });
          map.addLayer({
            id: 'valgo-grid-layer', type: 'fill', source: 'valgo-grid',
            paint: {
              'fill-color': ['get', 'color'],
              'fill-opacity': isDataGenerated ? 0.85 : 0.0,
              'fill-outline-color': 'rgba(0,0,0,0)' 
            }
          });
        }
      });

      // SVG Projection Logic for Flowmap
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

  useEffect(() => {
    if (mapRef.current && mapRef.current.isStyleLoaded()) {
       mapRef.current.setStyle(mapStyle === 'Satellite' ? maxarSatelliteStyle : cartoDarkStyle);
    }
  }, [mapStyle]);

  // Handle Layer Opacities during Cinematic Tour
  const isTouring = tourStep >= 0;
  
  useEffect(() => {
    if (mapRef.current && mapRef.current.getLayer('valgo-grid-layer')) {
      // Dims the hex grid heavily when the flowmap tour is active
      mapRef.current.setPaintProperty('valgo-grid-layer', 'fill-opacity', isDataGenerated ? (isTouring ? 0.2 : 0.85) : 0.0);
    }
    if (mapRef.current && mapRef.current.getLayer('geofence-line')) {
      mapRef.current.setPaintProperty('geofence-line', 'line-opacity', isDataGenerated ? 0.8 : 0.0);
      mapRef.current.setPaintProperty('geofence-fill', 'fill-opacity', isDataGenerated ? 0.05 : 0.0);
    }
  }, [isDataGenerated, isTouring]);

  useEffect(() => {
    let interval;
    if (isPlaying && isDataGenerated && mapRef.current) {
      const runStep = (step) => {
        setTourStep(step);
        if(setActiveTourNode) setActiveTourNode(cinematicNodes[step]); 
        
        mapRef.current.flyTo({ 
          center: [cinematicNodes[step].lng, cinematicNodes[step].lat], 
          zoom: cinematicNodes[step].zoom, 
          pitch: cinematicNodes[step].pitch,
          speed: 0.6, 
          curve: 1.2
        });
      };

      runStep(1); 
      interval = setInterval(() => {
        setTourStep((prev) => {
          let next = prev + 1;
          if (next >= cinematicNodes.length) {
            setIsPlaying(false);
            if(setActiveTourNode) setActiveTourNode(null);
            return -1; 
          }
          runStep(next);
          return next;
        });
      }, 7000); 
    } else if (!isPlaying) {
       setTourStep(-1);
       setTimeout(() => { if(typeof setActiveTourNode === 'function') setActiveTourNode(null); }, 0);
       
       if (mapRef.current && isDataGenerated) {
           mapRef.current.flyTo({ center: [cinematicNodes[0].lng, cinematicNodes[0].lat], zoom: cinematicNodes[0].zoom, pitch: cinematicNodes[0].pitch });
       }
    }
    return () => clearInterval(interval);
  }, [isPlaying, isDataGenerated, cinematicNodes, setActiveTourNode]);

  const currentDescription = (tourStep >= 0 && tourStep < cinematicNodes.length)
    ? cinematicNodes[tourStep].description 
    : cinematicNodes[0].description;

  // Reusable Valgo Glass Button Component
  const GlassButton = ({ icon, text, shortcut, onClick, isActive }) => (
    <button onClick={onClick} style={{ 
      background: 'rgba(15, 15, 18, 0.75)', backdropFilter: 'blur(12px)', 
      border: `1px solid ${isActive ? '#00e676' : 'rgba(255,255,255,0.08)'}`, 
      borderRadius: '6px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
      color: isActive ? '#00e676' : '#d4d4d8', fontSize: '11px', fontWeight: '600', transition: 'all 0.2s'
    }}
    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(15, 15, 18, 0.75)'; e.currentTarget.style.color = isActive ? '#00e676' : '#d4d4d8'; }}
    >
      <span style={{ display: 'flex', alignItems: 'center', opacity: 0.8 }}>{icon}</span>
      <span>{text}</span>
      {shortcut && <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 4px', borderRadius: '4px', fontSize: '9px', marginLeft: '4px' }}>{shortcut}</span>}
    </button>
  );

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: '#020504', zIndex: 10, overflow: 'hidden', fontFamily: sans }}>
      
      {/* MAP CONTAINER */}
      <div ref={mapContainerRef} style={{ position: 'absolute', inset: 0, zIndex: 1 }} />
      
      {/* OBSIDIAN SLATE / ABYSSAL GREEN TINT LAYER (Forces the Valgo aesthetic onto the base map) */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(2, 5, 4, 0.65)', mixBlendMode: 'multiply', pointerEvents: 'none', zIndex: 2 }} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0, 230, 118, 0.05)', mixBlendMode: 'overlay', pointerEvents: 'none', zIndex: 3 }} />

      {/* FLOWMAP.BLUE KINETIC ARROWS (Visible only during tour) */}
      <svg ref={svgRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 10, pointerEvents: 'none', opacity: (isDataGenerated && isTouring) ? 1 : 0, transition: 'opacity 0.8s ease-in-out' }}>
         <defs>
           <marker id="arrow-green" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 2 L 10 5 L 0 8 z" fill="#00e676" /></marker>
           <marker id="arrow-yellow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 2 L 10 5 L 0 8 z" fill="#facc15" /></marker>
           <filter id="glow"><feGaussianBlur stdDeviation="3" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
         </defs>
         <g>
             {/* Tracks */}
             <path id="edge-track-e1" fill="none" stroke="#00e676" strokeWidth="6" opacity="0.15" strokeLinecap="round" />
             <path id="edge-track-e3" fill="none" stroke="#0d9488" strokeWidth="4" opacity="0.15" strokeLinecap="round" />
             <path id="edge-track-e5" fill="none" stroke="#1e3a8a" strokeWidth="3" opacity="0.15" strokeLinecap="round" />
             
             {/* Kinetic Arrows */}
             <path id="edge-e1" fill="none" stroke="#00e676" strokeWidth="3" opacity="0.9" markerEnd="url(#arrow-green)" style={{ animation: isPlaying ? 'dash 15s linear infinite' : 'none' }} filter="url(#glow)" />
             <path id="edge-e2" fill="none" stroke="#0d9488" strokeWidth="2" opacity="0.7" strokeDasharray="4 4" />
             <path id="edge-e3" fill="none" stroke="#0d9488" strokeWidth="2.5" opacity="0.8" markerEnd="url(#arrow-green)" filter="url(#glow)" />
             <path id="edge-e4" fill="none" stroke="#0d9488" strokeWidth="1.5" opacity="0.6" />
             <path id="edge-e5" fill="none" stroke="#1e3a8a" strokeWidth="2" opacity="0.8" markerEnd="url(#arrow-yellow)" filter="url(#glow)" />
             <path id="edge-e6" fill="none" stroke="#3b0764" strokeWidth="1.5" opacity="0.6" />
             <path id="edge-e7" fill="none" stroke="#0d9488" strokeWidth="1.5" opacity="0.5" strokeDasharray="2 6" />

             {flowmapNodes.map((n) => (
                <circle key={n.id} id={`node-${n.id}`} r={n.r} fill={n.color} filter="url(#glow)" stroke="#040a08" strokeWidth="1.5" />
             ))}
         </g>
      </svg>

      {/* ========================================== */}
      {/* TOP VALGO UI CONTROLS                      */}
      {/* ========================================== */}
      
      {/* Top Left: Tools */}
      <div style={{ position: 'absolute', top: '24px', left: '24px', display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 40 }}>
        <GlassButton 
          isActive={activeTool === 'rect'} onClick={() => setActiveTool(activeTool === 'rect' ? null : 'rect')}
          icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>} 
          text="Rectangle Area" 
        />
        <GlassButton 
          isActive={activeTool === 'poly'} onClick={() => setActiveTool(activeTool === 'poly' ? null : 'poly')}
          icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"></polygon></svg>} 
          text="Polygon Area" 
        />
      </div>

      {/* Top Center: View Toggle */}
      <div style={{ position: 'absolute', top: '24px', left: '50%', transform: 'translateX(-50%)', display: 'flex', background: 'rgba(15, 15, 18, 0.75)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '4px', zIndex: 40, boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
        <button onClick={() => setCanvasMode('map')} style={{ padding: '6px 16px', borderRadius: '20px', border: 'none', fontSize: '11px', fontWeight: '700', cursor: 'pointer', background: canvasMode === 'map' ? 'rgba(255,255,255,0.1)' : 'transparent', color: canvasMode === 'map' ? '#fff' : '#a1a1aa', transition: 'all 0.2s' }}>Map View</button>
        <button onClick={() => setCanvasMode('analysis')} style={{ padding: '6px 16px', borderRadius: '20px', border: 'none', fontSize: '11px', fontWeight: '700', cursor: 'pointer', background: canvasMode === 'analysis' ? 'rgba(255,255,255,0.1)' : 'transparent', color: canvasMode === 'analysis' ? '#fff' : '#a1a1aa', transition: 'all 0.2s' }}>Deep Analysis</button>
      </div>

      {/* Top Right: View Controls */}
      <div style={{ position: 'absolute', top: '24px', right: '24px', display: 'flex', gap: '8px', zIndex: 40 }}>
        <GlassButton 
          onClick={() => { if(mapRef.current) mapRef.current.zoomIn(); }}
          icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>} 
          text="Zoom in" shortcut="C"
        />
        <div style={{ position: 'relative' }}>
          <GlassButton 
            isActive={styleMenuOpen} onClick={() => setStyleMenuOpen(!styleMenuOpen)}
            icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>} 
            text="Map style" 
          />
          {styleMenuOpen && (
             <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', width: '180px', background: '#0a0a0c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px', boxShadow: '0 12px 40px rgba(0,0,0,0.8)' }}>
                {['Dark', 'Satellite'].map(style => (
                  <div key={style} onClick={() => { setMapStyle(style); setStyleMenuOpen(false); }} style={{ padding: '10px', color: mapStyle === style ? '#00e676' : '#d4d4d8', fontSize: '12px', fontWeight: '600', cursor: 'pointer', borderRadius: '4px', background: mapStyle === style ? 'rgba(0, 230, 118, 0.1)' : 'transparent', transition: 'all 0.2s' }}>
                    {style}
                  </div>
                ))}
             </div>
          )}
        </div>
      </div>

      {/* ========================================== */}
      {/* VALGO DYNAMIC DESCRIPTION CARD (RIGHT)       */}
      {/* ========================================== */}
      {isDataGenerated && (
         <div style={{ 
            position: 'absolute', top: '80px', right: '24px', width: '300px', 
            background: 'rgba(15, 15, 18, 0.85)', backdropFilter: 'blur(20px)', 
            border: `1px solid ${isTouring ? '#00e676' : 'rgba(255,255,255,0.08)'}`, 
            borderRadius: '12px', padding: '20px', zIndex: 40, 
            boxShadow: isTouring ? '0 10px 40px rgba(0, 230, 118, 0.15)' : '0 10px 40px rgba(0,0,0,0.5)',
            transform: isDataGenerated ? 'translateX(0)' : 'translateX(20px)',
            opacity: isDataGenerated ? 1 : 0, transition: 'all 0.4s ease'
         }}>
            <div style={{ fontSize: '11px', color: isTouring ? '#00e676' : '#00e5ff', fontWeight: '700', fontFamily: mono, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isTouring ? '#00e676' : '#00e5ff', animation: 'pulseGeofence 1s infinite alternate' }} />
              Description:
            </div>
            <div style={{ fontSize: '13px', color: '#d4d4d8', lineHeight: '1.6', fontWeight: '500' }}>
               {currentDescription}
            </div>
            <div style={{ marginTop: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '6px', padding: '10px', fontSize: '10px', color: '#888', fontWeight: '600', fontFamily: mono }}>
              [NOTE: Active geofence drawn. Data within geofence is prioritized.]
            </div>
         </div>
      )}

      {/* ========================================== */}
      {/* VALGO GRADIENT LEGEND (BOTTOM LEFT)          */}
      {/* ========================================== */}
      <div style={{ 
        position: 'absolute', bottom: '60px', left: '24px', 
        background: 'rgba(15, 15, 18, 0.85)', backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', 
        padding: '16px', width: '320px', zIndex: 40,
        opacity: isDataGenerated ? 1 : 0, transition: 'opacity 0.4s ease'
      }}>
         <div style={{ color: '#a1a1aa', fontSize: '10px', textTransform: 'uppercase', fontFamily: mono, fontWeight: '700', letterSpacing: '1px', marginBottom: '12px' }}>
            PER-CELL CALIBRATED VOLUME (NGN)
         </div>
         {/* Valgo Continuous Gradient Bar */}
         <div style={{ width: '100%', height: '8px', borderRadius: '4px', background: 'linear-gradient(90deg, #3b0764 0%, #1e3a8a 25%, #0d9488 50%, #00e676 75%, #facc15 100%)', marginBottom: '8px' }} />
         <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#d4d4d8', fontWeight: '600', fontFamily: mono }}>
            <span>0</span>
            <span>36.0k</span>
            <span>72.0k+</span>
         </div>
      </div>

      {/* ========================================== */}
      {/* CINEMATIC PLAY/PAUSE CONTROLLER            */}
      {/* ========================================== */}
      {isDataGenerated && (
        <div style={{ position: 'absolute', bottom: '60px', left: '50%', transform: 'translateX(-50%)', zIndex: 50 }}>
            <div style={{ 
                background: 'rgba(10, 10, 12, 0.85)', backdropFilter: 'blur(20px)',
                borderRadius: '30px', border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', 
                padding: '4px', width: isPlaying ? '300px' : '40px', height: '40px',
                transition: 'all 0.5s cubic-bezier(0.25, 1, 0.5, 1)', overflow: 'hidden'
            }}>
                <button onClick={() => setIsPlaying(!isPlaying)} style={{ width: '30px', height: '30px', borderRadius: '50%', background: isPlaying ? '#00e676' : '#0d9488', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: 'background 0.3s' }}>
                    {isPlaying ? (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="#040a08"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                    ) : (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="#040a08" style={{ transform: 'translateX(1px)' }}><polygon points="5 3 19 12 5 21"/></svg>
                    )}
                </button>
                <div style={{ display: 'flex', flexDirection: 'column', opacity: isPlaying ? 1 : 0, transition: 'opacity 0.3s 0.2s', overflow: 'hidden', whiteSpace: 'nowrap', marginLeft: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '4px', height: '4px', background: tourStep >= 0 ? cinematicNodes[tourStep].color : '#fff', borderRadius: '50%', boxShadow: `0 0 8px ${tourStep >= 0 ? cinematicNodes[tourStep].color : '#fff'}`, animation: 'pulseGeofence 1s infinite' }} />
                        <span style={{ fontSize: '9px', color: tourStep >= 0 ? cinematicNodes[tourStep].color : '#fff', fontFamily: mono, fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase' }}>
                            TOUR GUIDE ACTIVE • {tourStep >= 0 ? cinematicNodes[tourStep].type : 'INITIATING'}
                        </span>
                    </div>
                    <span style={{ fontSize: '11px', color: '#fff', fontWeight: '600', marginTop: '2px' }}>
                      Analyzing informal cash velocity at {tourStep >= 0 ? cinematicNodes[tourStep].name : '...'}
                    </span>
                </div>
            </div>
        </div>
      )}

      {/* FOOTER BAR */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '24px', background: '#020504', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 24px', fontSize: '9px', color: '#6b7280', fontFamily: mono, borderTop: '1px solid rgba(255,255,255,0.05)', zIndex: 60 }}>
          <div>Target: {searchQuery}, NG <span style={{margin:'0 8px', color:'#333'}}>|</span> S2 Hex Level 11 <span style={{margin:'0 8px', color:'#333'}}>|</span> <span style={{ color: '#fff' }}>4,218</span> active vendor nodes / 5,000 cells</div>
          <div>MapLibre | © OpenStreetMap | CARTO | Maxar</div>
      </div>

      <style>{`
        @keyframes pulseGeofence {
          0% { opacity: 0.4; }
          100% { opacity: 1; }
        }
        @keyframes dash {
          to { stroke-dashoffset: -50; }
        }
      `}</style>
    </div>
  );
}
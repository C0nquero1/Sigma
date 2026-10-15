import React, { useState, useEffect } from 'react';
import DataOverviewTab from './DataOverviewTab';

// Upgraded Modern Typography Stack
const sans = "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";
const mono = "'JetBrains Mono', 'ui-monospace', monospace";

export default function CommandPanel({ 
  executeIntelligenceScan, 
  isSearching, 
  isDataGenerated, 
  scanData, 
  contextHub, 
  setCanvasMode,
  showScrollUp,
  ambiguousCandidates,
  handleCandidateClick,
  activeTourNode,
  commandTab,      
  setCommandTab    
}) {
  const [inputValue, setInputValue] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [hoveredPill, setHoveredPill] = useState(null);

  const userName = "Founder"; 

  const chatEndRef = React.useRef(null);
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isSearching]);

  const handlePromptSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    setChatHistory(prev => [...prev, { role: 'user', content: inputValue }]);
    executeIntelligenceScan(inputValue);
    setInputValue('');
  };

  const startNewChat = () => {
    setChatHistory([]);
    setInputValue('');
    setIsHistoryOpen(false);
    setCommandTab('chat');
  };

  // Upgraded Preset Prompts matching your new screenshot
  const presetPrompts = [
    { 
      title: 'Where is the best rubber in Wuse?', 
      desc: 'Commodity pricing & volume',
    },
    { 
      title: 'Map the cashflow in Las Vegas', 
      desc: 'Macro-liquidity analysis',
    },
    { 
      title: 'What sells the most in Balogun?', 
      desc: 'Consumer demand heat',
    },
    { 
      title: 'Track vendor density in Dharavi', 
      desc: 'Spatial population metrics',
    }
  ];

  const recentHistory = [
    { id: 1, query: "Map cashflow in Las Vegas", time: "2 hours ago" },
    { id: 2, query: "Best rubber in Wuse?", time: "Yesterday" },
    { id: 3, query: "Vendor density in Dharavi", time: "Oct 4" },
    { id: 4, query: "Top seller in Balogun?", time: "Oct 2" }
  ];

  return (
    // UPDATED: Base background is now a deep, moody dark green (#040a08)
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#040a08', fontFamily: sans, position: 'relative', overflow: 'hidden' }}>
      
      {/* SHORELINE WAVE ANIMATION BACKGROUND (Tuned to Dark Green) */}
      {commandTab === 'chat' && (
        <div style={{ 
          position: 'absolute', 
          inset: 0, 
          background: 'radial-gradient(circle at 50% 120%, rgba(0, 230, 118, 0.08) 0%, rgba(16, 185, 129, 0.03) 30%, transparent 70%)',
          backgroundSize: '200% 200%',
          animation: 'shorelineWave 12s ease-in-out infinite alternate',
          pointerEvents: 'none',
          zIndex: 0
        }} />
      )}

      {isHistoryOpen && <div onClick={() => setIsHistoryOpen(false)} style={{ position: 'absolute', inset: 0, zIndex: 40 }} />}

      {/* ========================================== */}
      {/* 1. TOP FLOATING ACTION BAR (Compact & Glassy)*/}
      {/* ========================================== */}
      <div style={{ padding: '16px 20px 0 20px', zIndex: 50, position: 'relative', display: 'flex', justifyContent: 'space-between' }}>
        
        {/* Compact History Pill */}
        <div 
          onClick={() => setIsHistoryOpen(!isHistoryOpen)}
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '6px',
            background: isHistoryOpen ? 'rgba(0, 230, 118, 0.1)' : 'rgba(255,255,255,0.03)', 
            backdropFilter: 'blur(10px)',
            border: isHistoryOpen ? '1px solid rgba(0, 230, 118, 0.3)' : '1px solid rgba(255,255,255,0.06)', 
            borderRadius: '20px', 
            padding: '6px 14px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            color: isHistoryOpen ? '#00e676' : '#d4d4d8',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
          }}
          onMouseEnter={(e)=> { if(!isHistoryOpen) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff'; }}}
          onMouseLeave={(e)=> { if(!isHistoryOpen) { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = '#d4d4d8'; }}}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <span style={{ fontSize: '12px', fontWeight: '600' }}>History</span>
        </div>

        {/* Chat Button (Only shows when in data mode) */}
        {commandTab === 'data' && (
          <div 
            onClick={() => setCommandTab('chat')}
            style={{ display: 'flex', alignItems: 'center', background: 'rgba(0, 230, 118, 0.1)', border: '1px solid rgba(0, 230, 118, 0.3)', borderRadius: '20px', padding: '6px 14px', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={(e)=>e.currentTarget.style.background='rgba(0, 230, 118, 0.2)'}
            onMouseLeave={(e)=>e.currentTarget.style.background='rgba(0, 230, 118, 0.1)'}
          >
            <span style={{ color: '#00e676', fontSize: '12px', fontWeight: '700', marginRight: '6px' }}>Return to Chat</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00e676" strokeWidth="2.5"><polyline points="9 10 4 15 9 20"></polyline><path d="M20 4v7a4 4 0 0 1-4 4H4"></path></svg>
          </div>
        )}

        {/* Expandable History Dropdown */}
        {isHistoryOpen && (
          <div style={{ position: 'absolute', top: '56px', left: '20px', width: '280px', background: 'rgba(6, 15, 12, 0.95)', backdropFilter: 'blur(30px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '12px', zIndex: 100, boxShadow: '0 20px 40px rgba(0,0,0,0.8)', animation: 'fadeIn 0.2s ease-out', display: 'flex', flexDirection: 'column' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.04)', marginBottom: '8px' }}>
                <span style={{ fontSize: '10px', color: '#888', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Recent Scans</span>
                <button onClick={startNewChat} style={{ background: 'transparent', color: '#00e676', border: 'none', fontSize: '11px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  New Chat
                </button>
             </div>
             <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
               {recentHistory.map(item => (
                  <div key={item.id} onClick={() => setIsHistoryOpen(false)} style={{ padding: '10px', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.2s', display: 'flex', flexDirection: 'column', gap: '4px' }} onMouseEnter={(e)=>e.currentTarget.style.background='rgba(255,255,255,0.03)'} onMouseLeave={(e)=>e.currentTarget.style.background='transparent'}>
                     <span style={{ color: '#eee', fontSize: '12px', fontWeight: '600' }}>{item.query}</span>
                     <span style={{ color: '#666', fontSize: '10px', fontWeight: '500' }}>{item.time}</span>
                  </div>
               ))}
             </div>
          </div>
        )}
      </div>

      {/* ========================================== */}
      {/* 2. CHAT OR DATA TAB ROUTING                */}
      {/* ========================================== */}
      {commandTab === 'data' && isDataGenerated ? (
        <DataOverviewTab setCommandTab={setCommandTab} setCanvasMode={setCanvasMode} activeTourNode={activeTourNode} scanData={scanData} contextHub={contextHub} />
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 20px 24px', display: 'flex', flexDirection: 'column', zIndex: 10 }}>
          
          {/* ========================================== */}
          {/* 3. SCALED DOWN, COMPACT HERO SECTION       */}
          {/* ========================================== */}
          {chatHistory.length === 0 && !isSearching && (
            <div style={{ marginTop: 'auto', marginBottom: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: '20px' }}>
              
              {/* Minimal Circle Target Icon (from 71m.PNG) */}
              <div style={{ width: '40px', height: '40px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line>
                </svg>
              </div>

              {/* Scaled down typography */}
              <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#fff', letterSpacing: '-0.5px', margin: '0 0 6px 0', textAlign: 'center' }}>
                Hi, Founder.
              </h1>
              <p style={{ fontSize: '13px', color: '#a1a1aa', fontWeight: '500', marginBottom: '32px', textAlign: 'center' }}>
                What would you like to discover now?
              </p>

              {/* Tighter Bento-Box Preset Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', width: '100%', maxWidth: '400px' }}>
                {presetPrompts.map((preset, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => {
                      setInputValue(preset.title);
                      setChatHistory([{ role: 'user', content: preset.title }]);
                      executeIntelligenceScan(preset.title);
                    }}
                    onMouseEnter={() => setHoveredPill(idx)}
                    onMouseLeave={() => setHoveredPill(null)}
                    style={{ 
                      background: hoveredPill === idx ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)', 
                      border: '1px solid',
                      borderColor: hoveredPill === idx ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
                      borderRadius: '12px', 
                      padding: '14px', 
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <div style={{ fontSize: '12px', color: hoveredPill === idx ? '#fff' : '#e4e4e7', fontWeight: '600', lineHeight: '1.4' }}>{preset.title}</div>
                    <div style={{ fontSize: '11px', color: '#71717a', fontWeight: '500' }}>{preset.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* 4. COMPACT SLEEK CHAT FEED                 */}
          {/* ========================================== */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingTop: chatHistory.length > 0 ? '24px' : '0' }}>
            {chatHistory.map((msg, idx) => (
              <div key={idx} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                {msg.role === 'user' ? (
                  // Glassy Dark Green User Bubble
                  <div style={{ 
                    background: 'rgba(0, 230, 118, 0.08)', 
                    border: '1px solid rgba(0, 230, 118, 0.15)', 
                    backdropFilter: 'blur(10px)',
                    padding: '10px 16px', 
                    borderRadius: '16px 16px 4px 16px', 
                    color: '#fff', 
                    fontSize: '13px', 
                    fontWeight: '500', 
                    lineHeight: '1.5'
                  }}>
                    {msg.content}
                  </div>
                ) : (
                  // Clean Compact AI Bubble
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#00e676', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#040a08" strokeWidth="2.5"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>
                    </div>
                    <div style={{ color: '#d4d4d8', fontSize: '13px', lineHeight: '1.6', fontWeight: '400' }}>
                      {msg.content}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isSearching && (
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', opacity: 0.8 }}>
                <div style={{ width: '26px', height: '26px', borderRadius: '50%', border: '2px solid rgba(0, 230, 118, 0.2)', borderTopColor: '#00e676', animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: '11px', color: '#00e676', fontWeight: '700', fontFamily: mono, letterSpacing: '0.5px' }}>UPLINK ESTABLISHED...</span>
              </div>
            )}

            {isDataGenerated && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#00e676', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#040a08" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                  <div style={{ color: '#d4d4d8', fontSize: '13px', lineHeight: '1.6', fontWeight: '400' }}>
                    <strong style={{ color: '#fff', fontWeight: '700' }}>Target Locked: {contextHub}.</strong> Spatial topology generated.
                  </div>
                </div>
                <div style={{ paddingLeft: '38px' }}>
                  <button onClick={() => setCommandTab('data')} style={{ background: 'rgba(0, 230, 118, 0.1)', border: '1px solid rgba(0, 230, 118, 0.3)', color: '#00e676', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }} onMouseEnter={(e)=>e.currentTarget.style.background='rgba(0, 230, 118, 0.2)'} onMouseLeave={(e)=>e.currentTarget.style.background='rgba(0, 230, 118, 0.1)'}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg> View Live Dashboard
                  </button>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 5. SLIMMER, TIGHTER FLOATING CHAT INPUT    */}
      {/* ========================================== */}
      {commandTab === 'chat' && (
        <div style={{ padding: '0 20px 20px 20px', background: 'linear-gradient(to top, #040a08 80%, transparent)', zIndex: 10 }}>
          <form onSubmit={handlePromptSubmit} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask Street AI..."
              disabled={isSearching}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid #00e676',
                boxShadow: '0 0 10px rgba(0, 230, 118, 0.1)',
                borderRadius: '20px',
                padding: '12px 44px 12px 16px',
                color: '#fff',
                fontSize: '13px',
                fontWeight: '500',
                outline: 'none',
                fontFamily: sans,
                transition: 'box-shadow 0.3s'
              }}
              onFocus={(e) => e.target.style.boxShadow = '0 0 15px rgba(0, 230, 118, 0.2)'}
              onBlur={(e) => e.target.style.boxShadow = '0 0 10px rgba(0, 230, 118, 0.1)'}
            />
            <button 
              type="submit"
              disabled={isSearching || !inputValue.trim()}
              style={{
                position: 'absolute',
                right: '6px',
                width: '30px',
                height: '30px',
                background: inputValue.trim() ? '#18181b' : 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: inputValue.trim() ? 'pointer' : 'default',
                transition: 'all 0.2s'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={inputValue.trim() ? '#fff' : '#52525b'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>
            </button>
          </form>
          <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '10px', color: '#52525b', fontWeight: '500', fontFamily: sans }}>
            Street AI agents can make mistakes. Verify critical field data.
          </div>
        </div>
      )}

      {/* Embedded Modern Font & Animations */}
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shorelineWave { 0% { background-position: 0% 50%; } 100% { background-position: 100% 50%; } }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
      `}</style>
    </div>
  );
}
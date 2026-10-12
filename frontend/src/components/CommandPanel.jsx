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
  const [hoveredNav, setHoveredNav] = useState(null);

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

  const presetPrompts = [
    { 
      title: 'Best rubber in Wuse?', 
      desc: 'Commodity pricing & volume',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00e676" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>
    },
    { 
      title: 'Map cashflow in Las Vegas', 
      desc: 'Macro-liquidity analysis',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
    },
    { 
      title: 'Top seller in Balogun?', 
      desc: 'Consumer demand heat',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00e676" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
    },
    { 
      title: 'Vendor density in Dharavi', 
      desc: 'Spatial population metrics',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon><line x1="9" y1="3" x2="9" y2="18"></line><line x1="15" y1="6" x2="15" y2="21"></line></svg>
    }
  ];

  const recentHistory = [
    { id: 1, query: "Map cashflow in Las Vegas", time: "2 hours ago" },
    { id: 2, query: "Best rubber in Wuse?", time: "Yesterday" },
    { id: 3, query: "Vendor density in Dharavi", time: "Oct 4" },
    { id: 4, query: "Top seller in Balogun?", time: "Oct 2" },
    { id: 5, query: "Logistics bottlenecks in Apapa", time: "Sep 28" },
    { id: 6, query: "Micro-retailers in Lagos Island", time: "Sep 25" },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#050505', fontFamily: sans, position: 'relative', overflow: 'hidden' }}>
      
      {/* SHORELINE WAVE ANIMATION BACKGROUND */}
      {commandTab === 'chat' && (
        <div style={{ 
          position: 'absolute', 
          inset: 0, 
          background: 'radial-gradient(circle at 50% 120%, rgba(16, 185, 129, 0.08) 0%, rgba(0, 230, 118, 0.03) 30%, rgba(5,5,7,1) 70%)',
          backgroundSize: '200% 200%',
          animation: 'shorelineWave 12s ease-in-out infinite alternate',
          pointerEvents: 'none',
          zIndex: 0
        }} />
      )}

      {isHistoryOpen && <div onClick={() => setIsHistoryOpen(false)} style={{ position: 'absolute', inset: 0, zIndex: 40 }} />}

      {/* ========================================== */}
      {/* 1. TOP FLOATING ACTION BAR                 */}
      {/* ========================================== */}
      <div style={{ padding: '24px 24px 0 24px', zIndex: 50, position: 'relative' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          background: 'rgba(255,255,255,0.02)', 
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.06)', 
          borderRadius: '40px', 
          padding: commandTab === 'data' ? '6px 6px 6px 20px' : '6px 20px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          minHeight: '44px' 
        }}>
          
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span 
              onClick={() => setIsHistoryOpen(!isHistoryOpen)}
              onMouseEnter={() => setHoveredNav('History')}
              onMouseLeave={() => setHoveredNav(null)}
              style={{ 
                color: hoveredNav === 'History' || isHistoryOpen ? '#fff' : '#888', 
                fontSize: '13px', 
                fontWeight: '600', 
                cursor: 'pointer',
                transition: 'color 0.2s',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              History
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: isHistoryOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                 <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
              <div style={{ position: 'absolute', bottom: '-4px', left: 0, width: hoveredNav === 'History' || isHistoryOpen ? '100%' : '0%', height: '2px', background: '#00e676', transition: 'width 0.2s ease-out', borderRadius: '2px' }} />
            </span>
          </div>

          {commandTab === 'data' && (
            <div 
              onClick={() => setCommandTab('chat')}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                background: 'linear-gradient(135deg, #00e676 0%, #10b981 100%)', 
                borderRadius: '30px', 
                padding: '2px 2px 2px 16px',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.2)',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <span style={{ color: '#050505', fontSize: '13px', fontWeight: '800', marginRight: '12px' }}>Chat</span>
              <div style={{ width: '28px', height: '28px', background: '#050505', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 10 4 15 9 20"></polyline><path d="M20 4v7a4 4 0 0 1-4 4H4"></path></svg>
              </div>
            </div>
          )}
        </div>

        {isHistoryOpen && (
          <div style={{ 
            position: 'absolute', 
            top: '80px', 
            left: '24px', 
            width: '320px', 
            background: 'rgba(18, 18, 20, 0.95)', 
            backdropFilter: 'blur(30px)',
            border: '1px solid rgba(255,255,255,0.08)', 
            borderRadius: '16px', 
            padding: '12px', 
            zIndex: 100, 
            boxShadow: '0 20px 40px rgba(0,0,0,0.8)', 
            animation: 'fadeIn 0.2s ease-out',
            display: 'flex',
            flexDirection: 'column'
          }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', color: '#666', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Recent Scans</span>
                <button 
                  onClick={startNewChat}
                  style={{ background: 'rgba(0, 230, 118, 0.1)', border: '1px solid rgba(0, 230, 118, 0.3)', color: '#00e676', padding: '6px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'background 0.2s' }}
                  onMouseEnter={(e)=>e.currentTarget.style.background='rgba(0, 230, 118, 0.2)'} 
                  onMouseLeave={(e)=>e.currentTarget.style.background='rgba(0, 230, 118, 0.1)'}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  New Chat
                </button>
             </div>
             <div style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
               {recentHistory.map(item => (
                  <div 
                    key={item.id} 
                    onClick={() => setIsHistoryOpen(false)}
                    onMouseEnter={(e)=>e.currentTarget.style.background='rgba(255,255,255,0.04)'} 
                    onMouseLeave={(e)=>e.currentTarget.style.background='transparent'}
                    style={{ padding: '12px', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.2s', display: 'flex', flexDirection: 'column', gap: '4px' }} 
                  >
                     <span style={{ color: '#eee', fontSize: '13px', fontWeight: '600' }}>{item.query}</span>
                     <span style={{ color: '#555', fontSize: '11px', fontWeight: '500' }}>{item.time}</span>
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
        <DataOverviewTab 
          setCommandTab={setCommandTab} 
          setCanvasMode={setCanvasMode} 
          activeTourNode={activeTourNode} 
          scanData={scanData} 
          contextHub={contextHub} 
        />
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 24px 24px', display: 'flex', flexDirection: 'column', zIndex: 10 }}>
          
          {/* ========================================== */}
          {/* 3. UPGRADED OBSIDIAN HERO SECTION          */}
          {/* ========================================== */}
          {chatHistory.length === 0 && !isSearching && (
            <div style={{ marginTop: 'auto', marginBottom: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: '40px' }}>
              
              <div style={{ width: '60px', height: '60px', background: 'radial-gradient(circle, rgba(0,230,118,0.15) 0%, rgba(5,5,7,0) 70%)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="url(#heroGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <defs>
                    <linearGradient id="heroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#00e676" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                  </defs>
                  <circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
                </svg>
              </div>

              <h1 style={{ fontSize: '36px', fontWeight: '800', color: '#fff', letterSpacing: '-1px', margin: '0 0 8px 0', textAlign: 'center' }}>
                What's up, <span style={{ background: 'linear-gradient(135deg, #00e676 0%, #10b981 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{userName}.</span>
              </h1>
              <p style={{ fontSize: '15px', color: '#888', fontWeight: '500', marginBottom: '40px', textAlign: 'center' }}>
                Deploy an intelligence agent to map spatial liquidity.
              </p>

              {/* Bento-Box Style Preset Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', width: '100%' }}>
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
                      background: hoveredPill === idx ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.015)', 
                      border: '1px solid',
                      borderColor: hoveredPill === idx ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
                      borderTop: hoveredPill === idx ? '1px solid rgba(0, 230, 118, 0.4)' : '1px solid rgba(255,255,255,0.04)',
                      borderRadius: '16px', 
                      padding: '20px', 
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
                      boxShadow: hoveredPill === idx ? '0 10px 30px rgba(0, 0, 0, 0.5)' : 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}
                  >
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                       {preset.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', color: hoveredPill === idx ? '#fff' : '#ccc', fontWeight: '600', marginBottom: '4px', transition: 'color 0.2s' }}>{preset.title}</div>
                      <div style={{ fontSize: '12px', color: '#666', fontWeight: '500' }}>{preset.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* 4. UPGRADED SLEEK CHAT FEED                */}
          {/* ========================================== */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', paddingTop: chatHistory.length > 0 ? '24px' : '0' }}>
            {chatHistory.map((msg, idx) => (
              <div key={idx} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '88%' }}>
                {msg.role === 'user' ? (
                  // Sleek User Bubble
                  <div style={{ 
                    background: 'linear-gradient(135deg, rgba(0, 230, 118, 0.08) 0%, rgba(16, 185, 129, 0.02) 100%)', 
                    border: '1px solid rgba(0, 230, 118, 0.15)', 
                    padding: '14px 20px', 
                    borderRadius: '24px 24px 4px 24px', 
                    color: '#fff', 
                    fontSize: '15px', 
                    fontWeight: '500', 
                    lineHeight: '1.6',
                    boxShadow: '0 4px 20px rgba(0, 230, 118, 0.05)'
                  }}>
                    {msg.content}
                  </div>
                ) : (
                  // Clean AI Bubble
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #00e676 0%, #10b981 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px', boxShadow: '0 0 15px rgba(16, 185, 129, 0.3)' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#050505" strokeWidth="2.5"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>
                    </div>
                    <div style={{ color: '#d4d4d4', fontSize: '15px', lineHeight: '1.7', fontWeight: '400', background: 'transparent' }}>
                      {msg.content}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isSearching && (
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', opacity: 0.8 }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid rgba(0, 230, 118, 0.2)', borderTopColor: '#00e676', animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: '13px', color: '#00e676', fontWeight: '600', fontFamily: mono, letterSpacing: '1px' }}>ESTABLISHING UPLINK...</span>
              </div>
            )}

            {isDataGenerated && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #00e676 0%, #10b981 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 0 15px rgba(16, 185, 129, 0.3)' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#050505" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                  <div style={{ color: '#d4d4d4', fontSize: '15px', lineHeight: '1.7', fontWeight: '400' }}>
                    <strong style={{ color: '#fff', fontWeight: '700' }}>Target Locked: {contextHub}.</strong> Spatial topology generated. Fluid metrics mapped to S2 voxel grid.
                  </div>
                </div>
                <div style={{ paddingLeft: '48px' }}>
                  <button onClick={() => setCommandTab('data')} style={{ background: 'rgba(0, 230, 118, 0.1)', border: '1px solid rgba(0, 230, 118, 0.3)', color: '#00e676', padding: '12px 24px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', boxShadow: '0 4px 15px rgba(0, 230, 118, 0.1)' }} onMouseEnter={(e)=>e.currentTarget.style.background='rgba(0, 230, 118, 0.2)'} onMouseLeave={(e)=>e.currentTarget.style.background='rgba(0, 230, 118, 0.1)'}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg> View Live Dashboard
                  </button>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 5. FLOATING CHAT INPUT                     */}
      {/* ========================================== */}
      {commandTab === 'chat' && (
        <div style={{ padding: '0 24px 24px 24px', background: 'linear-gradient(to top, #050505 80%, transparent)', zIndex: 10 }}>
          <form onSubmit={handlePromptSubmit} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Deploy an agent..."
              disabled={isSearching}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid #00e676',
                boxShadow: '0 0 15px rgba(0, 230, 118, 0.15)',
                borderRadius: '24px',
                padding: '16px 50px 16px 20px',
                color: '#fff',
                fontSize: '15px',
                fontWeight: '500',
                outline: 'none',
                fontFamily: sans,
                transition: 'box-shadow 0.3s'
              }}
              onFocus={(e) => e.target.style.boxShadow = '0 0 20px rgba(0, 230, 118, 0.3)'}
              onBlur={(e) => e.target.style.boxShadow = '0 0 15px rgba(0, 230, 118, 0.15)'}
            />
            <button 
              type="submit"
              disabled={isSearching || !inputValue.trim()}
              style={{
                position: 'absolute',
                right: '8px',
                width: '38px',
                height: '38px',
                background: inputValue.trim() ? '#fff' : 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: inputValue.trim() ? 'pointer' : 'default',
                transition: 'all 0.2s'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={inputValue.trim() ? '#050505' : '#888'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>
            </button>
          </form>
          <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '11px', color: '#555', fontWeight: '500', fontFamily: sans }}>
            Street AI agents can make mistakes. Verify critical field data.
          </div>
        </div>
      )}

      {/* Embedded Modern Font & Animations */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');
        
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        
        /* The Shoreline Wave Animation */
        @keyframes shorelineWave { 
          0% { background-position: 0% 50%; } 
          100% { background-position: 100% 50%; } 
        }
        
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
}
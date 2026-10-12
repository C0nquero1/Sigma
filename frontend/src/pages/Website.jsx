import React, { useState, useEffect } from 'react';

const sans = "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";

export default function Website({ onLoginSuccess, initialPage = 'about', onReturnToDashboard }) {
  // Navigation State: 'about', 'login', 'register', 'docs', 'support'
  const [activePage, setActivePage] = useState(initialPage);

  // Sync state if navigating from the Dashboard
  useEffect(() => {
    if (initialPage) setActivePage(initialPage);
  }, [initialPage]);

  // --- REUSABLE COMPONENTS ---

  const WebsiteNav = () => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 40px', width: '100%', maxWidth: '1400px', margin: '0 auto', fontFamily: sans }}>
      {/* Brand */}
      <div 
        onClick={() => onReturnToDashboard ? onReturnToDashboard() : setActivePage('about')}
        style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
      >
        <div style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="url(#logoGradWeb)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <defs>
              <linearGradient id="logoGradWeb" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00e676" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
            <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon>
            <line x1="9" y1="3" x2="9" y2="18"></line><line x1="15" y1="6" x2="15" y2="21"></line>
          </svg>
        </div>
        <span style={{ color: '#fff', fontSize: '18px', fontWeight: '800', letterSpacing: '-0.5px' }}>Street AI</span>
      </div>

      {/* Center Links */}
      <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
        {['About', 'Documentation', 'Support'].map(link => {
          const key = link === 'Documentation' ? 'docs' : link.toLowerCase();
          const isActive = activePage === key;
          return (
            <span 
              key={key} 
              onClick={() => setActivePage(key)}
              style={{ color: isActive ? '#fff' : '#888', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'color 0.2s' }}
              onMouseEnter={(e) => e.target.style.color = '#fff'}
              onMouseLeave={(e) => e.target.style.color = isActive ? '#fff' : '#888'}
            >
              {link}
            </span>
          );
        })}
      </div>

      {/* Right Actions (Dynamic based on login status) */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        {onReturnToDashboard ? (
          <button 
            onClick={onReturnToDashboard}
            style={{ background: '#00e676', color: '#050505', border: 'none', borderRadius: '24px', padding: '8px 20px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', transition: 'transform 0.2s', boxShadow: '0 4px 15px rgba(0, 230, 118, 0.2)' }}
            onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
          >
            Go to Dashboard
          </button>
        ) : (
          <>
            <span 
              onClick={() => setActivePage('login')}
              style={{ color: '#fff', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
            >
              Log in
            </span>
            <button 
              onClick={() => setActivePage('register')}
              style={{ background: '#fff', color: '#050505', border: 'none', borderRadius: '24px', padding: '8px 16px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', transition: 'transform 0.2s' }}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
            >
              Sign up
            </button>
          </>
        )}
      </div>
    </div>
  );

  const AbstractLandscape = () => (
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '200px', overflow: 'hidden', pointerEvents: 'none' }}>
      <svg viewBox="0 0 800 200" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
        <path d="M0,150 C150,200 250,50 400,100 C550,150 650,80 800,120 L800,200 L0,200 Z" fill="rgba(16, 185, 129, 0.1)" />
        <path d="M0,170 C200,220 300,90 500,140 C650,180 750,120 800,150 L800,200 L0,200 Z" fill="rgba(0, 230, 118, 0.15)" />
        <path d="M0,200 C250,250 350,130 550,170 C700,200 750,160 800,180 L800,200 L0,200 Z" fill="rgba(0, 230, 118, 0.2)" />
      </svg>
    </div>
  );

  // --- PAGE VIEWS ---
  const AboutView = () => (
    <>
      <div style={{ flex: 1, padding: '80px 60px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <h1 style={{ fontSize: '48px', fontWeight: '800', color: '#fff', letterSpacing: '-1.5px', lineHeight: '1.1', marginBottom: '24px' }}>
          Spatial liquidity <br/>is one scan away.
        </h1>
        <p style={{ fontSize: '16px', color: '#888', fontWeight: '500', lineHeight: '1.6', maxWidth: '400px', marginBottom: '40px' }}>
          Street AI maps the unbanked economy. Deploy intelligence agents to track informal cash velocity, vendor density, and commodity supply chains in real-time.
        </p>
        <div>
          {!onReturnToDashboard && (
            <button 
              onClick={() => setActivePage('register')}
              style={{ background: '#fff', color: '#050505', border: 'none', borderRadius: '30px', padding: '14px 28px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 15px rgba(255,255,255,0.1)' }}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
            >
              Start for free
            </button>
          )}
        </div>
      </div>
      <div style={{ flex: 1, background: '#121214', position: 'relative', borderLeft: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
         <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px', width: '320px', zIndex: 10, backdropFilter: 'blur(10px)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #00e676 0%, #10b981 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#050505" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle></svg>
              </div>
              <div>
                <div style={{ color: '#fff', fontSize: '15px', fontWeight: '700' }}>Wuse Market</div>
                <div style={{ color: '#888', fontSize: '12px', fontWeight: '500' }}>4,218 active nodes</div>
              </div>
            </div>
            <div style={{ background: '#050505', borderRadius: '8px', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <span style={{ color: '#888', fontSize: '12px', fontWeight: '600' }}>Live Velocity</span>
               <span style={{ color: '#00e676', fontSize: '14px', fontWeight: '800' }}>+18.4%</span>
            </div>
         </div>
         <AbstractLandscape />
      </div>
    </>
  );

  const AuthView = ({ isLogin }) => (
    <>
      <div style={{ flex: 1, padding: '80px 60px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <h1 style={{ fontSize: '36px', fontWeight: '800', color: '#fff', letterSpacing: '-1px', marginBottom: '8px' }}>
          {isLogin ? 'Welcome back.' : 'Create your account.'}
        </h1>
        <p style={{ fontSize: '15px', color: '#888', fontWeight: '500', marginBottom: '40px' }}>
          {isLogin ? 'Enter your credentials to access the command deck.' : 'Join the intelligence network and map the unbanked economy.'}
        </p>
        <form onSubmit={(e) => { e.preventDefault(); if(onLoginSuccess) onLoginSuccess(); }} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '360px' }}>
          {!isLogin && <input type="text" placeholder="Full Name" required style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />}
          <input type="email" placeholder="Email address" required style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
          <input type="password" placeholder="Password" required style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
          <button type="submit" style={{ background: 'linear-gradient(135deg, #00e676 0%, #10b981 100%)', color: '#050505', border: 'none', borderRadius: '12px', padding: '14px', fontSize: '15px', fontWeight: '800', cursor: 'pointer', marginTop: '8px', transition: 'opacity 0.2s' }} onMouseEnter={(e)=>e.target.style.opacity=0.9} onMouseLeave={(e)=>e.target.style.opacity=1}>
            {isLogin ? 'Log into Command Deck' : 'Initialize Account'}
          </button>
        </form>
        <div style={{ marginTop: '24px', fontSize: '13px', color: '#666', fontWeight: '500' }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span onClick={() => setActivePage(isLogin ? 'register' : 'login')} style={{ color: '#00e676', cursor: 'pointer', fontWeight: '600' }}>
            {isLogin ? 'Sign up' : 'Log in'}
          </span>
        </div>
      </div>
      <div style={{ flex: 1, background: '#121214', position: 'relative', borderLeft: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
         <div style={{ textAlign: 'center', zIndex: 10, padding: '40px' }}>
           <div style={{ width: '60px', height: '60px', margin: '0 auto 20px auto', background: 'rgba(0, 230, 118, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(0, 230, 118, 0.3)' }}>
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00e676" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
           </div>
           <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>Secure Uplink</h3>
           <p style={{ color: '#888', fontSize: '14px', lineHeight: '1.5' }}>Enterprise-grade encryption for all <br/>spatial intelligence queries.</p>
         </div>
         <AbstractLandscape />
      </div>
    </>
  );

  const DocsView = () => (
    <div style={{ width: '100%', padding: '60px', overflowY: 'auto' }}>
      <h1 style={{ fontSize: '36px', fontWeight: '800', color: '#fff', letterSpacing: '-1px', marginBottom: '16px' }}>Documentation</h1>
      <p style={{ fontSize: '16px', color: '#888', fontWeight: '500', maxWidth: '600px', marginBottom: '40px' }}>Learn how to deploy agents, interpret S2 voxel grids, and integrate Street AI into your intelligence pipeline.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {[
          { title: 'Quick Start Guide', desc: 'Initialize your first spatial map.' },
          { title: 'API Reference', desc: 'Endpoints for automated extraction.' },
          { title: 'Data Provenance', desc: 'Understanding cellular RF intercept data.' },
          { title: 'Export Formats', desc: 'Formatting data for Carto and Mapbox.' }
        ].map((doc, i) => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px', cursor: 'pointer', transition: 'border-color 0.2s' }} onMouseEnter={(e)=>e.currentTarget.style.borderColor='rgba(0, 230, 118, 0.4)'} onMouseLeave={(e)=>e.currentTarget.style.borderColor='rgba(255,255,255,0.06)'}>
            <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>{doc.title}</h3>
            <p style={{ color: '#888', fontSize: '13px', fontWeight: '500' }}>{doc.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const SupportView = () => (
    <div style={{ width: '100%', padding: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '60px', height: '60px', marginBottom: '24px', background: 'rgba(0, 230, 118, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00e676" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
      </div>
      <h1 style={{ fontSize: '36px', fontWeight: '800', color: '#fff', letterSpacing: '-1px', marginBottom: '8px', textAlign: 'center' }}>How can we help?</h1>
      <p style={{ fontSize: '15px', color: '#888', fontWeight: '500', marginBottom: '40px', textAlign: 'center', maxWidth: '400px' }}>Our intelligence engineering team is available 24/7 for enterprise support.</p>
      <button style={{ background: '#fff', color: '#050505', border: 'none', borderRadius: '30px', padding: '14px 28px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>
        Contact Support Team
      </button>
    </div>
  );

  const inputStyle = {
    width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '14px 16px', color: '#fff', fontSize: '14px', outline: 'none', fontFamily: sans, transition: 'border 0.2s'
  };
  const handleFocus = (e) => e.target.style.border = '1px solid rgba(0, 230, 118, 0.5)';
  const handleBlur = (e) => e.target.style.border = '1px solid rgba(255,255,255,0.1)';

  return (
    <div style={{ background: '#050505', minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: sans }}>
      <WebsiteNav />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ 
          width: '100%', 
          maxWidth: '1080px', 
          height: '600px', 
          background: '#0a0a0c', 
          borderRadius: '32px', 
          border: '1px solid rgba(255,255,255,0.05)',
          boxShadow: '0 40px 80px rgba(0,0,0,0.8)',
          overflow: 'hidden',
          display: 'flex',
          position: 'relative'
        }}>
          {activePage === 'about' && <AboutView />}
          {activePage === 'login' && <AuthView isLogin={true} />}
          {activePage === 'register' && <AuthView isLogin={false} />}
          {activePage === 'docs' && <DocsView />}
          {activePage === 'support' && <SupportView />}
        </div>
      </div>
    </div>
  );
}
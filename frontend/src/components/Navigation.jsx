import React, { useState } from 'react';
import UserProfile from './UserProfile';

const sans = "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";

const NavItem = ({ icon, label, isActive, onClick, navExpanded }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        width: navExpanded ? 'auto' : '44px',
        height: '44px',
        padding: navExpanded ? '0 14px' : '0',
        margin: navExpanded ? '0 12px' : '0 auto', 
        justifyContent: navExpanded ? 'flex-start' : 'center',
        cursor: 'pointer',
        borderRadius: '12px',
        background: isActive 
          ? 'rgba(0, 230, 118, 0.08)' 
          : isHovered 
            ? 'rgba(255,255,255,0.03)' 
            : 'transparent',
        border: isActive ? '1px solid rgba(0, 230, 118, 0.3)' : '1px solid transparent',
        boxShadow: isActive ? '0 0 12px rgba(0, 230, 118, 0.1)' : 'none',
        color: isActive ? '#00e676' : isHovered ? '#fff' : '#a1a1aa',
        transition: 'all 0.2s ease',
        fontFamily: sans
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      
      {navExpanded && (
        <span style={{ 
          marginLeft: '14px', 
          fontSize: '13px', 
          fontWeight: isActive ? '700' : '600', 
          color: isActive ? '#fff' : 'inherit',
          whiteSpace: 'nowrap'
        }}>
          {label}
        </span>
      )}
    </div>
  );
};

export default function Navigation({ navExpanded, setNavExpanded, activePage, setActivePage, setCanvasMode }) {
  const [logoHovered, setLogoHovered] = useState(false);

  // Icons scaled down slightly (Primary: 20px, Resources: 18px)
  const icons = {
    command: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon><line x1="9" y1="3" x2="9" y2="18"></line><line x1="15" y1="6" x2="15" y2="21"></line></svg>,
    business: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>,
    export: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"></path><polyline points="8 12 12 16 16 12"></polyline><line x1="12" y1="8" x2="12" y2="16"></line></svg>,
    api: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="18" r="3"></circle><circle cx="6" cy="6" r="3"></circle><path d="M13 6h3a2 2 0 0 1 2 2v7"></path><line x1="6" y1="9" x2="6" y2="21"></line></svg>,
    about: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>,
    docs: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>,
    support: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="4"></circle><line x1="4.93" y1="4.93" x2="9.17" y2="9.17"></line><line x1="14.83" y1="14.83" x2="19.07" y2="19.07"></line><line x1="14.83" y1="9.17" x2="19.07" y2="4.93"></line><line x1="14.83" y1="9.17" x2="18.36" y2="5.64"></line><line x1="4.93" y1="19.07" x2="9.17" y2="14.83"></line></svg>,
    menu: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>,
    panelToggle: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
  };

  return (
    <div style={{ 
      width: navExpanded ? '260px' : '60px', 
      minWidth: navExpanded ? '260px' : '60px',
      background: 'rgba(5, 5, 7, 0.85)',
      backdropFilter: 'blur(20px)',
      borderRight: '1px solid rgba(255, 255, 255, 0.04)', 
      display: 'flex', 
      flexDirection: 'column', 
      transition: 'width 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)', 
      height: '100vh',
      overflow: 'hidden',
      paddingBottom: '20px', 
      zIndex: 50 
    }}>
      
      {/* 1. TOP HEADER */}
      <div 
        onClick={() => setNavExpanded(!navExpanded)}
        onMouseEnter={() => setLogoHovered(true)}
        onMouseLeave={() => setLogoHovered(false)}
        style={{ 
          height: '68px', 
          display: 'flex', 
          alignItems: 'center', 
          padding: navExpanded ? '0 20px' : '0 0', 
          justifyContent: navExpanded ? 'flex-start' : 'center',
          cursor: 'pointer',
          borderBottom: '1px solid rgba(255,255,255,0.03)',
          marginBottom: '24px'
        }}
      >
        <div style={{ position: 'relative', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', opacity: logoHovered ? 0 : 1, transition: 'opacity 0.2s', color: '#10b981' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="url(#logoGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <defs>
                <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00e676" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
              <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon>
              <line x1="9" y1="3" x2="9" y2="18"></line><line x1="15" y1="6" x2="15" y2="21"></line>
            </svg>
          </div>
          <div style={{ position: 'absolute', opacity: logoHovered ? 1 : 0, transition: 'opacity 0.2s', color: '#fff' }}>
            {navExpanded ? icons.panelToggle : icons.menu}
          </div>
        </div>

        {navExpanded && (
          <div style={{ marginLeft: '12px', fontSize: '15px', fontWeight: '800', letterSpacing: '-0.5px', color: '#fff', fontFamily: sans }}>
            Street AI
          </div>
        )}
      </div>

      {/* 2. PRIMARY NAVIGATION */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <NavItem icon={icons.command} label="Command Deck" isActive={activePage === 'Command'} onClick={() => { setActivePage('Command'); setCanvasMode('map'); }} navExpanded={navExpanded} />
        <NavItem icon={icons.business} label="Business Intel" isActive={activePage === 'Business'} onClick={() => setActivePage('Business')} navExpanded={navExpanded} />
        <NavItem icon={icons.export} label="Export Data" isActive={activePage === 'Export'} onClick={() => setActivePage('Export')} navExpanded={navExpanded} />
        <NavItem icon={icons.api} label="API Keys" isActive={activePage === 'API'} onClick={() => setActivePage('API')} navExpanded={navExpanded} />
      </div>

      <div style={{ flex: 1 }} />

      {/* 3. RESOURCES SECTION */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
        {navExpanded && (
          <div style={{ padding: '0 26px', fontSize: '10px', fontWeight: '700', color: '#555', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px', fontFamily: sans }}>
            Resources
          </div>
        )}
        <NavItem icon={icons.about} label="About Platform" isActive={activePage === 'About'} onClick={() => setActivePage('About')} navExpanded={navExpanded} />
        <NavItem icon={icons.docs} label="Documentation" isActive={activePage === 'Documentation'} onClick={() => setActivePage('Documentation')} navExpanded={navExpanded} />
        <NavItem icon={icons.support} label="Support" isActive={activePage === 'Support'} onClick={() => setActivePage('Support')} navExpanded={navExpanded} />
      </div>

      <div style={{ height: '1px', background: 'rgba(255,255,255,0.04)', margin: '0 12px 16px 12px' }} />
      <UserProfile navExpanded={navExpanded} />

    </div>
  );
}
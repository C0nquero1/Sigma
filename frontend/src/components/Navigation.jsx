import React, { useState } from 'react';
import UserProfile from './UserProfile';

// Ultimate Enterprise Font Stack matching the deep analysis aesthetic
const sans = "'SF Pro Display', 'Inter', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";
const mono = "'JetBrains Mono', 'Geist Mono', 'Fira Code', ui-monospace, monospace";

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
          whiteSpace: 'nowrap',
          letterSpacing: '0.2px'
        }}>
          {label}
        </span>
      )}
    </div>
  );
};

export default function Navigation({ navExpanded, setNavExpanded, activePage, setActivePage, setCanvasMode }) {
  const [logoHovered, setLogoHovered] = useState(false);

  // Icons scaled down slightly (Primary: 18px, Resources: 16px) for sleeker aesthetics
  const icons = {
    command: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3 2 7v14l7-4 7 4 7-4V3l-7 4-7-4z"/><path d="M9 3v14"/><path d="M16 7v14"/></svg>,
    business: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
    export: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m8 17 4 4 4-4"/></svg>,
    api: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 0 1 2 2v7"/><line x1="6" y1="9" x2="6" y2="21"/></svg>,
    about: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
    docs: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
    support: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="4.93" y1="4.93" x2="9.17" y2="9.17"/><line x1="14.83" y1="14.83" x2="19.07" y2="19.07"/><line x1="14.83" y1="9.17" x2="19.07" y2="4.93"/><line x1="14.83" y1="9.17" x2="18.36" y2="5.64"/></svg>,
    menu: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
    panelToggle: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
  };

  return (
    <div style={{
      width: navExpanded ? '260px' : '64px',
      minWidth: navExpanded ? '260px' : '64px',
      background: '#000000', // Pure black aesthetics
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
          <div style={{ position: 'absolute', opacity: logoHovered ? 0 : 1, transition: 'opacity 0.2s', color: '#00e676' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon>
              <line x1="9" y1="3" x2="9" y2="18"></line>
              <line x1="15" y1="6" x2="15" y2="21"></line>
            </svg>
          </div>
          <div style={{ position: 'absolute', opacity: logoHovered ? 1 : 0, transition: 'opacity 0.2s', color: '#fff' }}>
            {navExpanded ? icons.panelToggle : icons.menu}
          </div>
        </div>

        {navExpanded && (
          <div style={{ marginLeft: '12px', fontSize: '15px', fontWeight: '800', letterSpacing: '-0.5px', color: '#fff', fontFamily: mono, textTransform: 'uppercase' }}>
            Street AI
          </div>
        )}
      </div>

      {/* 2. PRIMARY NAVIGATION */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <NavItem icon={icons.command} label="Command Deck" isActive={activePage === 'Command'} onClick={() => { setActivePage('Command'); setCanvasMode('map'); }} navExpanded={navExpanded} />
        <NavItem icon={icons.business} label="Business Intel" isActive={activePage === 'Business'} onClick={() => setActivePage('Business')} navExpanded={navExpanded} />
        <NavItem icon={icons.export} label="Export Data" isActive={activePage === 'Export'} onClick={() => setActivePage('Export')} navExpanded={navExpanded} />
        <NavItem icon={icons.api} label="API Keys" isActive={activePage === 'API'} onClick={() => setActivePage('API')} navExpanded={navExpanded} />
      </div>

      {/* Spacer pushes Resources & User Profile to the bottom */}
      <div style={{ flex: 1 }} />

      {/* 3. RESOURCES SECTION (Anchored at the bottom) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
        {navExpanded && (
          <div style={{ padding: '0 26px', fontSize: '11px', fontWeight: '700', color: '#555', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '8px', fontFamily: mono }}>
            Resources
          </div>
        )}
        <NavItem icon={icons.about} label="About Platform" isActive={activePage === 'About'} onClick={() => setActivePage('About')} navExpanded={navExpanded} />
        <NavItem icon={icons.docs} label="Documentation" isActive={activePage === 'Documentation'} onClick={() => setActivePage('Documentation')} navExpanded={navExpanded} />
        <NavItem icon={icons.support} label="Support" isActive={activePage === 'Support'} onClick={() => setActivePage('Support')} navExpanded={navExpanded} />
      </div>

      <div style={{ height: '1px', background: 'rgba(255,255,255,0.04)', margin: '0 12px 16px 12px' }} />
      <UserProfile navExpanded={navExpanded} setActivePage={setActivePage} />

    </div>
  );
}
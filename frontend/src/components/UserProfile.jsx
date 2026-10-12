import React, { useState } from 'react';
import { createPortal } from 'react-dom';

const sans = "system-ui, -apple-system, sans-serif";

// Reusable Menu Item Component for the Pop-out
const MenuItem = ({ icon, label, rightText }) => {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        padding: '8px 12px',
        cursor: 'pointer', 
        borderRadius: '6px', 
        color: hover ? '#fff' : '#aaa',
        background: hover ? 'rgba(255,255,255,0.06)' : 'transparent',
        transition: 'all 0.2s ease', 
        fontSize: '13px', 
        fontWeight: '500'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {icon}
          <span>{label}</span>
      </div>
      {rightText && <span style={{ fontSize: '10px', color: '#666', fontWeight: '600' }}>{rightText}</span>}
    </div>
  );
};

export default function UserProfile({ navExpanded }) {
  const [isHovered, setIsHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Modern Feather Icons for the Pop-out Menu
  const icons = {
    user: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>,
    settings: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>,
    analytics: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>,
    logout: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
  };

  // The Pop-out menu that will be ported to the root of the document
  const popoutMenu = (
    <>
      {/* Invisible Overlay to close menu when clicking outside */}
      <div 
        onClick={() => setMenuOpen(false)} 
        style={{ position: 'fixed', inset: 0, zIndex: 9998 }} 
      />

      {/* The Floating Menu */}
      <div style={{
        position: 'fixed',
        bottom: '16px',
        left: navExpanded ? '272px' : '80px',
        width: '220px',
        background: '#121214', 
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '12px',
        padding: '6px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.8)',
        zIndex: 9999,
        fontFamily: sans,
        display: 'flex',
        flexDirection: 'column',
        animation: 'fadeIn 0.2s ease-out'
      }}>
        <MenuItem icon={icons.user} label="View profile" />
        <MenuItem icon={icons.settings} label="Account settings" />
        <MenuItem icon={icons.analytics} label="Analytics" />
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '4px 8px' }} />
        <MenuItem icon={icons.logout} label="Log out" rightText="v3.6" />
      </div>
    </>
  );

  return (
    <>
      {/* Render the menu completely outside the Navbar using a Portal */}
      {menuOpen && createPortal(popoutMenu, document.body)}

      {/* Main Profile Button */}
      <div 
        onClick={() => setMenuOpen(!menuOpen)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: navExpanded ? '8px 12px' : '0',
          margin: navExpanded ? '0 12px 16px 12px' : '0 auto 16px auto',
          width: navExpanded ? 'auto' : '40px',
          height: navExpanded ? 'auto' : '40px',
          justifyContent: navExpanded ? 'flex-start' : 'center',
          background: isHovered || menuOpen ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)',
          border: '1px solid',
          borderColor: isHovered || menuOpen ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.04)',
          borderRadius: navExpanded ? '12px' : '50%',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          fontFamily: sans,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ 
          position: 'relative',
          width: '32px', 
          height: '32px', 
          borderRadius: '50%', 
          background: 'linear-gradient(135deg, #00e676 0%, #10b981 100%)',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: isHovered || menuOpen ? '0 0 12px rgba(0, 230, 118, 0.3)' : 'none',
          transition: 'all 0.3s ease'
        }}>
          <span style={{ color: '#050505', fontSize: '12px', fontWeight: '800', letterSpacing: '-0.5px' }}>FD</span>
          <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '10px', height: '10px', background: '#10b981', border: '2px solid #0a0a0c', borderRadius: '50%' }} />
        </div>

        {navExpanded && (
          <div style={{ marginLeft: '12px', flex: 1, overflow: 'hidden', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ color: '#fff', fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap' }}>Founder</span>
              <span style={{ color: '#888', fontSize: '11px', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>admin@streetai.io</span>
            </div>
            
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isHovered || menuOpen ? '#fff' : '#666'} strokeWidth="2" style={{ transition: 'stroke 0.2s', flexShrink: 0 }}>
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="12" cy="5" r="1"></circle>
              <circle cx="12" cy="19" r="1"></circle>
            </svg>
          </div>
        )}
      </div>
    </>
  );
}
import React, { useState } from 'react';

const sans = "'SF Pro Display', 'Inter', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";
const mono = "'JetBrains Mono', 'Geist Mono', 'Fira Code', ui-monospace, monospace";

export default function UserProfile({ navExpanded, setActivePage }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      onClick={() => setActivePage('Settings')}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        padding: navExpanded ? '12px' : '10px', 
        margin: navExpanded ? '0 12px' : '0 auto',
        borderRadius: '16px', 
        background: isHovered ? 'rgba(255,255,255,0.04)' : 'transparent', 
        border: isHovered ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent',
        cursor: 'pointer', 
        transition: 'all 0.2s ease',
        width: navExpanded ? 'auto' : '44px',
        justifyContent: navExpanded ? 'flex-start' : 'center'
      }}
    >
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#00e676', color: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: '800', fontSize: '13px', fontFamily: sans }}>
          FD
        </div>
        {/* Green Online Dot */}
        <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '12px', height: '12px', borderRadius: '50%', background: '#00e676', border: '2px solid #000' }} />
      </div>

      {navExpanded && (
        <div style={{ marginLeft: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <span style={{ fontSize: '14px', fontWeight: '700', color: '#fff', fontFamily: sans, whiteSpace: 'nowrap' }}>Founder</span>
          <span style={{ fontSize: '11px', color: '#71717a', fontFamily: mono, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>admin@streetai.io</span>
        </div>
      )}
    </div>
  );
}
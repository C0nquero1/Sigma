import React from 'react';
import AccountSettings from './AccountSettings'; 

const mono = "ui-monospace, monospace";

export default function TelemetryPanel({ activePage, setActivePage, scanData, contextHub, executeIntelligenceScan }) {
  return (
    <div style={{ flex: 1, padding: '32px', color: '#fff', overflowY: 'auto' }}>
      
      {/* Back to Scan Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', paddingBottom: '16px', borderBottom: '1px solid #1a1a1a' }}>
        <button 
          onClick={() => setActivePage('Command')} 
          style={{ background: 'transparent', border: '1px solid #333', padding: '6px 14px', borderRadius: '16px', color: '#ededef', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'background 0.2s' }}
          onMouseEnter={(e)=>e.currentTarget.style.background='rgba(255,255,255,0.05)'} 
          onMouseLeave={(e)=>e.currentTarget.style.background='transparent'}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg> Return to Command
        </button>
        <div style={{ fontSize: '11px', color: '#00e676', fontFamily: mono, fontWeight: '700', letterSpacing: '1px' }}>
          SYSTEM D TELEMETRY SUITE
        </div>
      </div>

      {/* Dynamic Component Routing */}
      {activePage === 'Profile' && <AccountSettings />}
      
    </div>
  );
}
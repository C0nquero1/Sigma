import React, { useState } from 'react';

const sans = "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";

export default function AccountSettings() {
  const [activeTab, setActiveTab] = useState('Profile');
  const tabs = ['Profile', 'Account Settings', 'Analytics', 'Log out'];

  return (
    <div style={{ display: 'flex', gap: '40px', fontFamily: sans, height: '100%' }}>
      
      {/* Left Sidebar */}
      <div style={{ width: '240px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#fff', marginBottom: '16px', paddingLeft: '12px' }}>Settings</h2>
        {tabs.map(tab => (
          <div 
            key={tab}
            onClick={() => tab !== 'Log out' ? setActiveTab(tab) : alert('Logging out...')}
            style={{
              padding: '12px 16px',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              color: activeTab === tab ? '#00e676' : tab === 'Log out' ? '#ef4444' : '#888',
              background: activeTab === tab ? 'rgba(0, 230, 118, 0.1)' : 'transparent',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => { if(activeTab !== tab) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
            onMouseLeave={(e) => { if(activeTab !== tab) e.currentTarget.style.background = 'transparent' }}
          >
            {tab}
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, background: '#0a0a0c', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '24px', padding: '40px' }}>
        
        {activeTab === 'Profile' && (
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#fff', marginBottom: '24px' }}>Public Profile</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #00e676 0%, #10b981 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: '800', color: '#050505' }}>
                FD
              </div>
              <button style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Change Avatar</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#888', fontWeight: '600', marginBottom: '8px' }}>Display Name</label>
                <input type="text" defaultValue="Founder" style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: '12px', color: '#fff', outline: 'none', fontSize: '14px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#888', fontWeight: '600', marginBottom: '8px' }}>Email Address</label>
                <input type="email" defaultValue="admin@streetai.io" style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: '12px', color: '#fff', outline: 'none', fontSize: '14px' }} />
              </div>
              <button style={{ background: '#00e676', color: '#050505', border: 'none', padding: '12px', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', marginTop: '8px' }}>Save Changes</button>
            </div>
          </div>
        )}

        {activeTab === 'Account Settings' && (
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#fff', marginBottom: '24px' }}>Security & Preferences</h3>
            <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '20px', marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#fff', marginBottom: '4px' }}>Two-Factor Authentication</div>
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '16px' }}>Add an extra layer of security to your account.</div>
              <button style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Enable 2FA</button>
            </div>
          </div>
        )}

        {activeTab === 'Analytics' && (
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#fff', marginBottom: '24px' }}>Personal Analytics</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '20px' }}>
                <div style={{ fontSize: '12px', color: '#888', fontWeight: '600', marginBottom: '8px' }}>Total Scans Executed</div>
                <div style={{ fontSize: '32px', fontWeight: '800', color: '#fff' }}>142</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '20px' }}>
                <div style={{ fontSize: '12px', color: '#888', fontWeight: '600', marginBottom: '8px' }}>API Calls (This Month)</div>
                <div style={{ fontSize: '32px', fontWeight: '800', color: '#00e676' }}>8,492</div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
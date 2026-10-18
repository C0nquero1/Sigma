import React from 'react';
import { User, Settings, BarChart2, LogOut, Key, CreditCard, Shield, Zap } from 'lucide-react';

const sans = "'SF Pro Display', 'Inter', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";
const mono = "'JetBrains Mono', 'Geist Mono', 'Fira Code', ui-monospace, monospace";

export default function SettingsPage({ onNavigate }) {
  return (
    <div style={{ padding: '48px 5vw', maxWidth: '1200px', margin: '0 auto', fontFamily: sans }}>
      
      {/* Header */}
      <div style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '13px', color: '#00e676', fontFamily: mono, textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '700', marginBottom: '8px' }}>System Identity</h2>
        <h1 style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-1px', margin: 0 }}>Account Settings</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '32px' }}>
        
        {/* Profile Details (View Profile) */}
        <div style={{ background: '#050505', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <User size={18} color="#a1a1aa" />
            <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>Profile Information</h3>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#00e676', color: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '24px', fontWeight: '800', boxShadow: '0 0 20px rgba(0,230,118,0.2)' }}>
              FD
            </div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>Founder</div>
              <div style={{ fontSize: '14px', color: '#71717a', fontFamily: mono }}>admin@streetai.io</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#71717a', fontFamily: mono, textTransform: 'uppercase', marginBottom: '8px' }}>Full Name</label>
              <input type="text" defaultValue="Founder" style={{ width: '100%', background: '#000', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', outline: 'none', fontFamily: sans }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#71717a', fontFamily: mono, textTransform: 'uppercase', marginBottom: '8px' }}>Email Address</label>
              <input type="email" defaultValue="admin@streetai.io" style={{ width: '100%', background: '#000', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', outline: 'none', fontFamily: sans }} />
            </div>
            <button style={{ background: '#fff', color: '#000', border: 'none', padding: '12px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', marginTop: '8px', transition: 'opacity 0.2s' }} className="btn-hover">
              Save Changes
            </button>
          </div>
        </div>

        {/* Analytics & Compute */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          <div style={{ background: '#050505', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <BarChart2 size={18} color="#a1a1aa" />
              <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>System Analytics</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ background: '#000', border: '1px solid rgba(255,255,255,0.06)', padding: '16px', borderRadius: '12px' }}>
                <div style={{ fontSize: '11px', color: '#71717a', fontFamily: mono, textTransform: 'uppercase', marginBottom: '8px' }}>Active Scans</div>
                <div style={{ fontSize: '24px', fontWeight: '800', fontFamily: mono }}>1,402</div>
              </div>
              <div style={{ background: '#000', border: '1px solid rgba(255,255,255,0.06)', padding: '16px', borderRadius: '12px' }}>
                <div style={{ fontSize: '11px', color: '#71717a', fontFamily: mono, textTransform: 'uppercase', marginBottom: '8px' }}>Compute Credits</div>
                <div style={{ fontSize: '24px', fontWeight: '800', fontFamily: mono, color: '#00e676', display: 'flex', alignItems: 'center', gap: '8px' }}><Zap size={16} /> 124</div>
              </div>
            </div>
          </div>

          <div style={{ background: '#050505', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <Shield size={18} color="#a1a1aa" />
              <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>Security</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', transition: 'background 0.2s' }} className="btn-hover-outline">
                <Key size={16} /> Change Password
              </button>
              <button style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', transition: 'background 0.2s' }} className="btn-hover-outline">
                <CreditCard size={16} /> Billing Methods
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Danger Zone: Log Out */}
      <div style={{ marginTop: '32px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
        <button 
          onClick={() => onNavigate('landing')} 
          style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '12px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
          className="btn-danger"
        >
          <LogOut size={16} /> Terminate Session
        </button>
      </div>

      <style>{`
        .btn-hover:hover { opacity: 0.8; }
        .btn-hover-outline:hover { background: rgba(255,255,255,0.05) !important; border-color: rgba(255,255,255,0.2) !important; }
        .btn-danger:hover { background: rgba(239, 68, 68, 0.2) !important; box-shadow: 0 0 12px rgba(239, 68, 68, 0.2); }
      `}</style>
    </div>
  );
}
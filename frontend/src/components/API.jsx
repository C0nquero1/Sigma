import React, { useState } from 'react';

const sans = "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";
const mono = "'JetBrains Mono', 'ui-monospace', monospace";

export default function API() {
  const [activeTab, setActiveTab] = useState('API Keys');

  const tabs = ['Overview', 'Settings', 'Security', 'API Keys', 'Logs', 'Load Summary'];

  const apiKeys = [
    { label: 'Production Navitare', key: 'pk_live_f8e9...3985', date: 'Just now', status: 'Active', color: '#00e676' },
    { label: 'Docs API Key', key: 'pk_test_a7c2...3568', date: '1 hour ago', status: 'Pending', color: '#f59e0b' },
    { label: 'Identity Key', key: 'sk_live_b4d1...55h4', date: 'Yesterday', status: 'Active', color: '#00e676' },
    { label: 'Remote Interface', key: 'sk_test_e9f3...3985', date: 'Feb 2, 2026', status: 'Revoked', color: '#ef4444' }
  ];

  const activities = [
    { text: 'You fixed a bug.', time: 'Just now', type: 'fix' },
    { text: 'New user registered.', time: '59 minutes ago', type: 'user' },
    { text: 'Modified A data in Page X.', time: 'Today, 11:59 AM', type: 'edit' },
    { text: 'Deleted a page in Project X.', time: 'Feb 2, 2026', type: 'delete' }
  ];

  return (
    <div style={{ display: 'flex', gap: '32px', fontFamily: sans, height: '100%' }}>
      
      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        
        {/* Top Tabs */}
        <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '32px' }}>
          {tabs.map(tab => (
            <div 
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{ 
                paddingBottom: '12px', 
                color: activeTab === tab ? '#fff' : '#888', 
                fontWeight: activeTab === tab ? '700' : '500', 
                fontSize: '14px', 
                cursor: 'pointer',
                borderBottom: activeTab === tab ? '2px solid #00e676' : '2px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              {tab}
            </div>
          ))}
        </div>

        {activeTab === 'API Keys' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>API Overview</h2>
                <p style={{ fontSize: '13px', color: '#888' }}>Manage your secret keys and developer webhooks.</p>
              </div>
              <button style={{ background: '#00e676', color: '#050505', border: 'none', borderRadius: '8px', padding: '10px 16px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0, 230, 118, 0.2)' }}>
                + Generate Key
              </button>
            </div>

            {/* API Keys Table */}
            <div style={{ background: '#0a0a0c', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#666', fontSize: '12px', textTransform: 'uppercase' }}>
                    <th style={{ padding: '16px 24px', fontWeight: '600' }}>Label</th>
                    <th style={{ padding: '16px 24px', fontWeight: '600' }}>API Key</th>
                    <th style={{ padding: '16px 24px', fontWeight: '600' }}>Created</th>
                    <th style={{ padding: '16px 24px', fontWeight: '600' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {apiKeys.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: idx === apiKeys.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.03)', color: '#ccc', fontSize: '13px' }}>
                      <td style={{ padding: '16px 24px', fontWeight: '600', color: '#fff' }}>{item.label}</td>
                      <td style={{ padding: '16px 24px', fontFamily: mono, color: '#888' }}>{item.key}</td>
                      <td style={{ padding: '16px 24px' }}>{item.date}</td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: item.color }} />
                          <span style={{ color: item.color, fontWeight: '600' }}>{item.status}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Load Summary Metrics (From Image 22) */}
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', marginTop: '16px' }}>Load Summary</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
              {[
                { label: 'Max Users', value: '21 VU', icon: '👤' },
                { label: 'Avg. Throughput', value: '18.31 /s', icon: '⚡' },
                { label: 'Response Time', value: '1.82 s', icon: '⏱️' },
                { label: 'Errors', value: '0.12 %', icon: '⚠️' }
              ].map((metric, idx) => (
                <div key={idx} style={{ background: '#0a0a0c', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '20px' }}>
                  <div style={{ fontSize: '12px', color: '#888', fontWeight: '600', marginBottom: '8px' }}>{metric.label}</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: '#fff' }}>{metric.value}</div>
                </div>
              ))}
            </div>

          </div>
        )}
      </div>

      {/* Right Sidebar: Notifications / Activities */}
      <div style={{ width: '280px', background: '#0a0a0c', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '24px', padding: '24px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#fff', marginBottom: '20px' }}>Activities & Logs</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {activities.map((act, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: act.type === 'delete' ? '#ef4444' : '#00e676', marginTop: '6px' }} />
              <div>
                <div style={{ fontSize: '13px', color: '#fff', fontWeight: '500', lineHeight: '1.4' }}>{act.text}</div>
                <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>{act.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
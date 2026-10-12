import React, { useState } from 'react';

const sans = "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";

export default function ExportData() {
  const [filterOpen, setFilterOpen] = useState(false);

  const datasets = [
    { id: '1', tag: 'Airbnb Spatial', date: 'December 23, 2026 2:31 AM', status: 'Ready', size: '866 MB' },
    { id: '2', tag: 'Logistics Map', date: 'December 22, 2026 4:15 PM', status: 'Processing', size: '--' },
    { id: '3', tag: 'Fintech Liquidity', date: 'December 20, 2026 9:00 AM', status: 'Ready', size: '1.2 GB' },
    { id: '4', tag: 'Vendor Density', date: 'December 18, 2026 1:12 PM', status: 'Failed', size: '0 MB' }
  ];

  return (
    <div style={{ fontFamily: sans, height: '100%', position: 'relative' }}>
      
      {/* Top Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#fff' }}>Export Center</h2>
        
        <button style={{ background: '#fff', color: '#050505', border: 'none', borderRadius: '12px', padding: '10px 16px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          Export
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
        </button>
      </div>

      {/* Toolbar (Search, Filter, Sort) */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginBottom: '16px', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', background: '#0a0a0c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 12px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input type="text" placeholder="Search" style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '13px', outline: 'none', marginLeft: '8px', width: '120px' }} />
        </div>

        <div style={{ position: 'relative' }}>
          <button 
            onClick={() => setFilterOpen(!filterOpen)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: filterOpen ? 'rgba(0, 230, 118, 0.1)' : 'transparent', border: 'none', color: filterOpen ? '#00e676' : '#888', fontSize: '13px', fontWeight: '600', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
            Filter
          </button>

          {/* Floating Filter Popup (From Image 23) */}
          {filterOpen && (
            <div style={{ position: 'absolute', top: '40px', right: '0', background: '#121214', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '16px', width: '220px', zIndex: 50, boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#fff', marginBottom: '12px' }}>Add Filter</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {[
                  { icon: '📅', label: 'Date' }, { icon: '🏷️', label: 'Tag' },
                  { icon: '📊', label: 'Status' }, { icon: '💾', label: 'Size' }
                ].map((f, i) => (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onMouseEnter={(e)=>e.currentTarget.style.background='rgba(0, 230, 118, 0.1)'} onMouseLeave={(e)=>e.currentTarget.style.background='rgba(255,255,255,0.03)'}>
                    <span style={{ fontSize: '18px' }}>{f.icon}</span>
                    <span style={{ fontSize: '11px', color: '#ccc', fontWeight: '600' }}>{f.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <button style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', color: '#888', fontSize: '13px', fontWeight: '600', padding: '8px 12px', cursor: 'pointer' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="21" y1="10" x2="3" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="21" y1="18" x2="3" y2="18"></line></svg>
          Sort
        </button>
      </div>

      {/* Table */}
      <div style={{ background: '#0a0a0c', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#666', fontSize: '12px', textTransform: 'uppercase' }}>
              <th style={{ padding: '16px 24px', width: '40px' }}><input type="checkbox" style={{ accentColor: '#00e676' }}/></th>
              <th style={{ padding: '16px 24px', fontWeight: '600' }}>Tag</th>
              <th style={{ padding: '16px 24px', fontWeight: '600' }}>Date</th>
              <th style={{ padding: '16px 24px', fontWeight: '600' }}>Status</th>
              <th style={{ padding: '16px 24px', fontWeight: '600' }}>Size</th>
            </tr>
          </thead>
          <tbody>
            {datasets.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: idx === datasets.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.03)', color: '#ccc', fontSize: '13px' }}>
                <td style={{ padding: '16px 24px' }}><input type="checkbox" style={{ accentColor: '#00e676' }}/></td>
                <td style={{ padding: '16px 24px', fontWeight: '600', color: '#fff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#ef4444' }} />
                    {item.tag}
                  </div>
                </td>
                <td style={{ padding: '16px 24px', color: '#888' }}>{item.date}</td>
                <td style={{ padding: '16px 24px' }}>
                  <span style={{ 
                    background: item.status === 'Ready' ? 'rgba(0, 230, 118, 0.1)' : item.status === 'Processing' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                    color: item.status === 'Ready' ? '#00e676' : item.status === 'Processing' ? '#f59e0b' : '#ef4444', 
                    padding: '4px 10px', 
                    borderRadius: '8px', 
                    fontSize: '11px', 
                    fontWeight: '700' 
                  }}>
                    {item.status}
                  </span>
                </td>
                <td style={{ padding: '16px 24px', fontFamily: "'JetBrains Mono', monospace" }}>{item.size}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
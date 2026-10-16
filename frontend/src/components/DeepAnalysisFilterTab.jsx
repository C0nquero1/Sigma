import React from 'react';

const mono = "ui-monospace, monospace";

export default function DeepAnalysisFilterTab() {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: '#050507', animation: 'fadeIn 0.3s ease-out', borderRight: '1px solid #1a1a1c' }}>
      <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)', backdropFilter: 'blur(10px)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(60, 160, 150, 0.1)', border: '1px solid rgba(60, 160, 150, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3ca096', boxShadow: '0 4px 12px rgba(60, 160, 150, 0.1)' }}>
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
          </div>
          <span style={{ fontSize: '13px', color: '#fff', fontWeight: '800', letterSpacing: '1px' }}>DEEP FILTERS</span>
        </div>
        <button style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: '#aaa', padding: '6px 12px', fontSize: '10px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }} onMouseEnter={(e)=>{e.currentTarget.style.background='rgba(255,255,255,0.08)'; e.currentTarget.style.color='#fff'}} onMouseLeave={(e)=>{e.currentTarget.style.background='rgba(255,255,255,0.03)'; e.currentTarget.style.color='#aaa'}}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg> Reset
        </button>
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
         <div>
           <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#666', textTransform: 'uppercase', fontWeight: '700', marginBottom: '16px', letterSpacing: '1px' }}>
             <span>Data Domain</span><span>−</span>
           </div>
           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
             <button style={{ background: 'linear-gradient(135deg, rgba(60,160,150,0.15) 0%, rgba(60,160,150,0.05) 100%)', border: '1px solid rgba(60, 160, 150, 0.4)', color: '#3ca096', padding: '12px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)' }}>Verified Nodes</button>
             <button style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', color: '#888', padding: '12px', borderRadius: '8px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={(e)=>e.currentTarget.style.background='rgba(255,255,255,0.05)'} onMouseLeave={(e)=>e.currentTarget.style.background='rgba(255,255,255,0.02)'}>Dark Liquidity</button>
             <button style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', color: '#888', padding: '12px', borderRadius: '8px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={(e)=>e.currentTarget.style.background='rgba(255,255,255,0.05)'} onMouseLeave={(e)=>e.currentTarget.style.background='rgba(255,255,255,0.02)'}>High Friction</button>
             <button style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', color: '#888', padding: '12px', borderRadius: '8px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={(e)=>e.currentTarget.style.background='rgba(255,255,255,0.05)'} onMouseLeave={(e)=>e.currentTarget.style.background='rgba(255,255,255,0.02)'}>Anomalies</button>
           </div>
         </div>

         <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '24px' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#666', textTransform: 'uppercase', fontWeight: '700', marginBottom: '24px', letterSpacing: '1px' }}>
             <span>Capital Velocity Range</span><span>−</span>
           </div>
           <div style={{ padding: '0 8px' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#fff', marginBottom: '16px', fontWeight: '700', fontFamily: mono }}>
               <span style={{ background: 'rgba(255,255,255,0.05)', padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}>₦10,000</span>
               <span style={{ background: 'rgba(255,255,255,0.05)', padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}>₦2,500,000+</span>
             </div>
             <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', position: 'relative', marginTop: '16px' }}>
               <div style={{ position: 'absolute', left: '15%', right: '25%', height: '100%', background: 'linear-gradient(90deg, #28648c, #3ca096)', borderRadius: '3px', boxShadow: '0 0 10px rgba(60, 160, 150, 0.4)' }} />
               <div style={{ position: 'absolute', left: '15%', top: '50%', transform: 'translate(-50%, -50%)', width: '18px', height: '18px', background: '#fff', border: '3px solid #3ca096', borderRadius: '50%', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.8)' }} />
               <div style={{ position: 'absolute', right: '25%', top: '50%', transform: 'translate(50%, -50%)', width: '18px', height: '18px', background: '#fff', border: '3px solid #3ca096', borderRadius: '50%', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.8)' }} />
             </div>
           </div>
         </div>

         <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '24px' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#666', textTransform: 'uppercase', fontWeight: '700', marginBottom: '20px', letterSpacing: '1px' }}>
             <span>Node Sub-sectors</span><span>−</span>
           </div>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
             {[
               { label: 'Commodity Trading', count: 142, active: true },
               { label: 'Mobile Money Agents', count: 89, active: true },
               { label: 'Informal Logistics', count: 54, active: false },
               { label: 'Wholesale Hubs', count: 12, active: false }
             ].map((s) => (
               <label key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: s.active ? 'rgba(60, 160, 150, 0.05)' : 'rgba(255,255,255,0.02)', border: s.active ? '1px solid rgba(60, 160, 150, 0.2)' : '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                   <div style={{ width: '18px', height: '18px', borderRadius: '4px', border: s.active ? 'none' : '1px solid #444', background: s.active ? '#3ca096' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     {s.active && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#050507" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                   </div>
                   <span style={{ fontSize: '12px', color: s.active ? '#fff' : '#888', fontWeight: s.active ? '700' : '500' }}>{s.label}</span>
                 </div>
                 <span style={{ fontSize: '10px', color: s.active ? '#3ca096' : '#555', fontFamily: mono, fontWeight: '600' }}>{s.count}</span>
               </label>
             ))}
           </div>
         </div>
         
         <button style={{ marginTop: 'auto', background: 'linear-gradient(135deg, #3ca096 0%, #28648c 100%)', color: '#fff', border: 'none', padding: '16px', borderRadius: '10px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', boxShadow: '0 8px 24px rgba(60, 160, 150, 0.3)', transition: 'transform 0.1s' }} onMouseDown={(e)=>e.currentTarget.style.transform='scale(0.98)'} onMouseUp={(e)=>e.currentTarget.style.transform='scale(1)'}>
           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="5 12 10 17 19 8"></polyline></svg>
           Apply Parameters
         </button>
      </div>
    </div>
  );
}
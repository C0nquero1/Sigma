import React, { useState } from 'react';
import { 
  Bell, Search, Settings, Plus, Map as MapIcon, Database, 
  CheckCircle2, ChevronRight, RefreshCw, Download, FileText, 
  FileJson, FileSpreadsheet, Calendar, CheckSquare, Square, PieChart as PieChartIcon, 
  FileArchive, Clock, Activity, ShieldAlert, Cpu
} from "lucide-react";

// Ultimate Enterprise Font Stack
const sans = "'SF Pro Display', 'Inter', 'Geist', -apple-system, BlinkMacSystemFont, sans-serif";
const mono = "'JetBrains Mono', 'Geist Mono', 'Fira Code', ui-monospace, monospace";

// ==========================================
// MOCK DATA: EXPORT HISTORY
// ==========================================
const mockHistory = [
  { id: 'EXP-092', date: 'Today, 10:15 AM', modules: 'Velocity, Demand', format: 'CSV', size: '2.4 MB', status: 'completed' },
  { id: 'EXP-091', date: 'Yesterday, 18:00 PM', modules: 'Full Telemetry', format: 'PDF', size: '14.1 MB', status: 'completed' },
  { id: 'EXP-090', date: 'Oct 14, 09:00 AM', modules: 'Market Share', format: 'JSON', size: '840 KB', status: 'completed' },
  { id: 'EXP-089', date: 'Oct 10, 12:30 PM', modules: 'Full Telemetry', format: 'XLSX', size: '4.2 MB', status: 'completed' }
];

export default function ExportDataView() {
  const [timeRange, setTimeRange] = useState('7D');
  const [selectedFormat, setSelectedFormat] = useState('CSV');
  const [selectedModules, setSelectedModules] = useState(['velocity', 'demand', 'market', 'actions']);
  const [exportState, setExportState] = useState('idle'); // idle | loading | success
  const [credits, setCredits] = useState(23);

  const toggleModule = (id) => {
    if (selectedModules.includes(id)) {
      setSelectedModules(selectedModules.filter(m => m !== id));
    } else {
      setSelectedModules([...selectedModules, id]);
    }
  };

  const handleExport = () => {
    if (exportState !== 'idle' || selectedModules.length === 0) return;
    setExportState('loading');
    
    // Simulate generation delay
    setTimeout(() => {
      setExportState('success');
      setTimeout(() => {
        setExportState('idle');
      }, 3000);
    }, 2500);
  };

  return (
    <div style={{ flex: 1, background: '#050505', color: '#e4e4e7', padding: '40px 5vw', overflowY: 'auto', fontFamily: sans, position: 'relative', minHeight: '100vh' }}>
      
      {/* Background Mesh */}
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse at top right, rgba(0, 229, 255, 0.05), transparent 50%), radial-gradient(ellipse at bottom left, rgba(0, 230, 118, 0.03), transparent 50%)', zIndex: 0, pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '40px', paddingBottom: '100px' }}>
        
        {/* ========================================== */}
        {/* GLOBAL HERO & NAV (Shared Component Design) */}
        {/* ========================================== */}
        <header className="responsive-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', animation: 'fadeIn 0.8s ease-out' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: 'linear-gradient(145deg, #18181b, #000000)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.08), 0 8px 30px rgba(0,229,255,0.15)', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at top left, rgba(0,229,255,0.3), transparent 70%)' }} />
              <span style={{ fontSize: '28px', fontWeight: '800', color: '#fff', fontFamily: sans, zIndex: 1 }}>A<span style={{color: '#00e5ff'}}>.</span></span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
               <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#ffffff', fontFamily: sans, letterSpacing: '-0.5px', margin: 0, lineHeight: 1 }}>Acme FMCG Logistics</h1>
               <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                 <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#a1a1aa', fontFamily: sans, fontWeight: '500' }}>
                   <MapIcon size={14} strokeWidth={2} color="#71717a" /> Abuja, FCT
                 </span>
                 <span style={{ color: '#27272a' }}>|</span>
                 <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#00e5ff', fontFamily: mono, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                   <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00e5ff', boxShadow: '0 0 8px rgba(0,229,255,0.8)' }} /> Data Extraction Node
                 </span>
               </div>
            </div>
          </div>

          <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '10px 16px', width: '260px' }}>
              <Search size={14} color="#71717a" />
              <input type="text" placeholder="Search parameters..." style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '13px', width: '100%', outline: 'none', fontFamily: sans }} />
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', color: '#a1a1aa', fontFamily: mono }}>⌘K</div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '100px', padding: '6px', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.02)', backdropFilter: 'blur(10px)' }}>
               <div style={{ padding: '4px 20px 4px 12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                 <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00e676', boxShadow: '0 0 8px rgba(0,230,118,0.6)' }} />
                 <div style={{ display: 'flex', gap: '10px', alignItems: 'baseline' }}>
                   <span style={{ fontSize: '11px', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: mono, fontWeight: '700' }}>Credits</span>
                   <span style={{ fontSize: '15px', color: '#fff', fontWeight: '800', fontFamily: mono }}>{credits}</span>
                 </div>
               </div>
               <div className="btn-hover" style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(255,255,255,0.2)' }}>
                 <Plus size={18} color="#000" strokeWidth={2.5} />
               </div>
            </div>

            <div className="btn-hover" style={{ position: 'relative', cursor: 'pointer', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Bell size={18} color="#a1a1aa" />
              <div style={{ position: 'absolute', top: '10px', right: '10px', width: '6px', height: '6px', background: '#ef4444', borderRadius: '50%' }} />
            </div>
            <div className="btn-hover" style={{ cursor: 'pointer', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Settings size={18} color="#a1a1aa" />
            </div>
          </div>
        </header>

        <div style={{ animation: 'fadeIn 0.8s ease-out 0.1s backwards' }}>
          <div style={{ fontSize: '11px', color: '#00e5ff', fontFamily: mono, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontWeight: '700' }}>System Telemetry</div>
          <h2 style={{ fontSize: '36px', fontWeight: '800', color: '#fff', margin: '0 0 8px 0', letterSpacing: '-1px' }}>Export Intelligence Reports</h2>
          <p style={{ fontSize: '15px', color: '#a1a1aa', margin: '0 0 24px 0', fontFamily: sans }}>Extract historical data arrays and raw engine analytics for external processing.</p>
        </div>

        {/* ========================================== */}
        {/* SPLIT VIEW ARCHITECTURE */}
        {/* ========================================== */}
        <div className="grid-split" style={{ gap: '40px', animation: 'fadeIn 0.8s ease-out 0.2s backwards' }}>
          
          {/* LEFT: Configuration Terminal */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* 1. Time Horizon Selection */}
            <div style={{ background: 'rgba(15,15,18,0.6)', borderRadius: '24px', padding: '32px', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(40px)', boxShadow: '0 20px 40px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                <Calendar size={18} color="#00e5ff" strokeWidth={2} />
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#fff', fontFamily: sans, letterSpacing: '-0.2px', margin: 0 }}>Extraction Time Horizon</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                {[
                  { id: '24H', label: 'Last 24 Hours' },
                  { id: '7D', label: 'Trailing 7 Days' },
                  { id: '30D', label: 'Last 30 Days' },
                  { id: 'ALL', label: 'All Time' }
                ].map((range) => {
                  const isActive = timeRange === range.id;
                  return (
                    <div 
                      key={range.id} onClick={() => setTimeRange(range.id)}
                      style={{ 
                        padding: '16px', borderRadius: '12px', cursor: 'pointer', textAlign: 'center',
                        background: isActive ? '#fff' : 'rgba(255,255,255,0.03)',
                        color: isActive ? '#000' : '#a1a1aa',
                        border: `1px solid ${isActive ? '#fff' : 'rgba(255,255,255,0.08)'}`,
                        transition: 'all 0.2s', fontWeight: '700', fontFamily: mono, fontSize: '12px'
                      }}
                      className={!isActive ? "btn-hover" : ""}
                    >
                      {range.label}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 2. Telemetry Modules Selection */}
            <div style={{ background: 'rgba(15,15,18,0.6)', borderRadius: '24px', padding: '32px', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(40px)', boxShadow: '0 20px 40px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                <Database size={18} color="#00e676" strokeWidth={2} />
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#fff', fontFamily: sans, letterSpacing: '-0.2px', margin: 0 }}>Data Modules Included</h3>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { id: 'velocity', icon: Activity, title: 'Cash Velocity & Liquidity Metrics', desc: 'Spatial heatmaps, zone flow, modality splits, and ATV records.' },
                  { id: 'demand', icon: Activity, title: 'Demand & Surge Telemetry', desc: 'Predictive matrix, unfulfilled gaps, and business demand rankings.', color: '#f59e0b' },
                  { id: 'market', icon: PieChartIcon, title: 'Market Share & Competitor Analysis', desc: 'Informal dominance tracking, defection logs, and pricing deltas.', color: '#00e5ff' },
                  { id: 'actions', icon: ShieldAlert, title: 'AI Synthesis & Execution Logs', desc: 'Master execution history and detailed AI logic blueprints.', color: '#ef4444' }
                ].map((mod) => {
                  const isChecked = selectedModules.includes(mod.id);
                  const Icon = mod.icon;
                  return (
                    <div 
                      key={mod.id} onClick={() => toggleModule(mod.id)}
                      style={{ 
                        padding: '20px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '20px', cursor: 'pointer',
                        background: isChecked ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.3)',
                        border: `1px solid ${isChecked ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.04)'}`,
                        transition: 'all 0.2s'
                      }}
                      className="card-hover"
                    >
                      <div style={{ color: isChecked ? '#00e676' : '#555', transition: 'color 0.2s' }}>
                        {isChecked ? <CheckSquare size={24} /> : <Square size={24} />}
                      </div>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: isChecked ? `${mod.color || '#00e676'}15` : 'rgba(255,255,255,0.03)', color: isChecked ? (mod.color || '#00e676') : '#71717a', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <Icon size={16} strokeWidth={2} />
                      </div>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: '700', color: isChecked ? '#fff' : '#a1a1aa', fontFamily: sans, marginBottom: '4px' }}>{mod.title}</div>
                        <div style={{ fontSize: '13px', color: '#71717a', fontFamily: sans }}>{mod.desc}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 3. Export Format & Execution */}
            <div style={{ background: 'rgba(15,15,18,0.6)', borderRadius: '24px', padding: '32px', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(40px)', boxShadow: '0 20px 40px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                <FileArchive size={18} color="#f59e0b" strokeWidth={2} />
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#fff', fontFamily: sans, letterSpacing: '-0.2px', margin: 0 }}>Payload Format</h3>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '40px' }}>
                {[
                  { id: 'CSV', icon: FileText, label: 'CSV File', desc: 'Raw Tables' },
                  { id: 'XLSX', icon: FileSpreadsheet, label: 'Excel', desc: 'Formatted' },
                  { id: 'JSON', icon: FileJson, label: 'JSON Array', desc: 'Dev Matrix' },
                  { id: 'PDF', icon: FileText, label: 'PDF Brief', desc: 'Exec Summary' }
                ].map((fmt) => {
                  const isActive = selectedFormat === fmt.id;
                  const Icon = fmt.icon;
                  return (
                    <div 
                      key={fmt.id} onClick={() => setSelectedFormat(fmt.id)}
                      style={{ 
                        padding: '24px 16px', borderRadius: '16px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center',
                        background: isActive ? 'rgba(0,229,255,0.05)' : 'rgba(0,0,0,0.3)',
                        border: `1px solid ${isActive ? '#00e5ff' : 'rgba(255,255,255,0.04)'}`,
                        boxShadow: isActive ? '0 0 20px rgba(0,229,255,0.1)' : 'none',
                        transition: 'all 0.2s'
                      }}
                      className={!isActive ? "card-hover" : ""}
                    >
                      <Icon size={24} color={isActive ? '#00e5ff' : '#71717a'} strokeWidth={1.5} />
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: isActive ? '#fff' : '#a1a1aa', fontFamily: sans }}>{fmt.label}</div>
                        <div style={{ fontSize: '11px', color: '#71717a', fontFamily: mono, marginTop: '4px' }}>{fmt.desc}</div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* EXECUTE BUTTON */}
              <button 
                onClick={handleExport}
                style={{ 
                  width: '100%', padding: '20px', borderRadius: '16px', border: 'none', cursor: selectedModules.length === 0 ? 'not-allowed' : 'pointer',
                  background: exportState === 'success' ? '#00e676' : exportState === 'idle' && selectedModules.length > 0 ? '#fff' : '#27272a',
                  color: exportState === 'success' ? '#000' : exportState === 'idle' && selectedModules.length > 0 ? '#000' : '#71717a',
                  fontSize: '16px', fontWeight: '800', fontFamily: sans, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px',
                  boxShadow: exportState === 'success' ? '0 0 30px rgba(0,230,118,0.5)' : exportState === 'idle' && selectedModules.length > 0 ? '0 10px 30px rgba(255,255,255,0.2)' : 'none',
                  transition: 'all 0.3s'
                }}
                className={exportState === 'idle' && selectedModules.length > 0 ? "btn-execute" : ""}
              >
                {exportState === 'idle' && (
                  <>
                    <Download size={20} strokeWidth={2.5} />
                    Extract Engine Telemetry
                  </>
                )}
                {exportState === 'loading' && (
                  <>
                    <RefreshCw size={20} className="spin-anim" />
                    Compiling Data Arrays...
                  </>
                )}
                {exportState === 'success' && (
                  <>
                    <CheckCircle2 size={20} strokeWidth={2.5} />
                    Export Transmitted Successfully
                  </>
                )}
              </button>
              {selectedModules.length === 0 && (
                <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '12px', color: '#ef4444', fontFamily: mono }}>* Please select at least one data module to export.</div>
              )}
            </div>

          </div>

          {/* RIGHT: Export History Log */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ background: 'rgba(15,15,18,0.6)', borderRadius: '24px', padding: '32px', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(40px)', position: 'sticky', top: '24px', minHeight: '600px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <Clock size={18} color="#a1a1aa" strokeWidth={2} />
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#fff', fontFamily: sans, letterSpacing: '-0.2px', margin: 0 }}>Transmission History</h3>
              </div>
              <p style={{ fontSize: '13px', color: '#71717a', margin: '0 0 32px 0', fontFamily: sans }}>Record of recent telemetry extractions</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {exportState === 'success' && (
                  <div style={{ background: 'rgba(0,230,118,0.05)', border: '1px solid rgba(0,230,118,0.2)', borderRadius: '16px', padding: '24px', display: 'flex', alignItems: 'center', gap: '20px', animation: 'fadeIn 0.4s ease-out' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(0,230,118,0.1)', color: '#00e676', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
                      <FileText size={20} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '15px', fontWeight: '700', color: '#fff', fontFamily: sans }}>EXP-{Math.floor(100 + Math.random() * 900)}</span>
                        <span style={{ fontSize: '11px', color: '#00e676', fontFamily: mono, fontWeight: '700' }}>JUST NOW</span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#a1a1aa', fontFamily: sans, marginBottom: '12px' }}>Custom Selection • {selectedFormat}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', color: '#71717a', fontFamily: mono }}>{(Math.random() * 5 + 1).toFixed(1)} MB</span>
                        <span style={{ fontSize: '12px', color: '#fff', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>Download <Download size={12} /></span>
                      </div>
                    </div>
                  </div>
                )}

                {mockHistory.map((log, i) => (
                  <div key={i} className="card-hover" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '16px', padding: '24px', display: 'flex', alignItems: 'center', gap: '20px', transition: 'all 0.2s', cursor: 'pointer' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', color: '#a1a1aa', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
                      {log.format === 'JSON' ? <FileJson size={20} /> : log.format === 'XLSX' ? <FileSpreadsheet size={20} /> : <FileText size={20} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '15px', fontWeight: '700', color: '#fff', fontFamily: sans }}>{log.id}</span>
                        <span style={{ fontSize: '11px', color: '#71717a', fontFamily: mono }}>{log.date}</span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#a1a1aa', fontFamily: sans, marginBottom: '12px' }}>{log.modules} • {log.format}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', color: '#555', fontFamily: mono }}>{log.size}</span>
                        <span style={{ fontSize: '12px', color: '#71717a', fontWeight: '600', transition: 'color 0.2s' }} className="download-text">Download <Download size={12} style={{display: 'inline', marginBottom: '-2px'}}/></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); filter: blur(4px); } to { opacity: 1; transform: translateY(0); filter: blur(0); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin-anim { animation: spin 1s linear infinite; }
        
        .btn-hover:hover { transform: scale(1.05); background: rgba(255,255,255,0.08) !important; }
        .btn-execute:hover { transform: translateY(-2px); box-shadow: 0 16px 40px rgba(255,255,255,0.3) !important; }
        .card-hover:hover { background: rgba(255,255,255,0.06) !important; border-color: rgba(255,255,255,0.1) !important; }
        .card-hover:hover .download-text { color: #fff !important; }

        .grid-split { display: grid; grid-template-columns: 1fr 1fr; }
        @media (max-width: 1200px) {
          .grid-split { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) {
          .responsive-header { flex-direction: column; align-items: flex-start !important; gap: 24px; }
          .header-actions { width: 100%; justify-content: flex-start; flex-wrap: wrap; }
        }
        
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
}
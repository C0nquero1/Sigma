import React, { useState, useEffect } from 'react';
import { 
  Bell, Search, Settings, Plus, Map as MapIcon, 
  Terminal, Sparkles, CheckCircle2, ChevronRight, ShieldAlert, RefreshCw, 
  Key, Webhook, Code2, Copy, Check, EyeOff, Eye, Server, Activity, ArrowUpRight
} from "lucide-react";

// Ultimate Enterprise Font Stack
const sans = "'SF Pro Display', 'Inter', 'Geist', -apple-system, BlinkMacSystemFont, sans-serif";
const mono = "'JetBrains Mono', 'Geist Mono', 'Fira Code', ui-monospace, monospace";

// ==========================================
// MOCK DATA: API KEYS & LOGS
// ==========================================
const initialKeys = [
  { id: 'key_1', name: 'Production Core Node', token: 'acme_live_8f92jxn94m29nx81', created: 'Oct 01, 2026', lastUsed: 'Just now', type: 'Live' },
  { id: 'key_2', name: 'Staging Environment', token: 'acme_test_39fjd820cnmwe92', created: 'Oct 14, 2026', lastUsed: '2 hours ago', type: 'Test' }
];

const mockWebhooks = [
  { id: 'wh_1', url: 'https://api.acmelogistics.com/v1/hooks/velocity', events: ['velocity.spike', 'velocity.drop'], status: 'Healthy' },
  { id: 'wh_2', url: 'https://internal.acme.corp/sync/market', events: ['market.shift', 'vendor.churn'], status: 'Healthy' }
];

const mockLogs = [
  { id: 1, method: 'GET', endpoint: '/v1/velocity/heatmap', status: 200, ms: 42, time: '15:45:02' },
  { id: 2, method: 'POST', endpoint: '/v1/demand/surge-predict', status: 200, ms: 115, time: '15:44:58' },
  { id: 3, method: 'GET', endpoint: '/v1/market/competitors', status: 200, ms: 38, time: '15:44:12' },
  { id: 4, method: 'GET', endpoint: '/v1/velocity/nodes', status: 429, ms: 12, time: '15:43:05' },
  { id: 5, method: 'GET', endpoint: '/v1/velocity/heatmap', status: 200, ms: 45, time: '15:42:11' },
  { id: 6, method: 'POST', endpoint: '/v1/actions/execute', status: 201, ms: 210, time: '15:40:00' }
];

// ==========================================
// MAIN COMPONENT
// ==========================================
export default function APIView() {
  const [keys, setKeys] = useState(initialKeys);
  const [logs, setLogs] = useState(mockLogs);
  const [copiedId, setCopiedId] = useState(null);
  const [visibleKey, setVisibleKey] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [credits, setCredits] = useState(23);

  // Simulate incoming API logs
  useEffect(() => {
    const interval = setInterval(() => {
      const endpoints = ['/v1/velocity/heatmap', '/v1/demand/nodes', '/v1/market/share'];
      const newLog = {
        id: Math.random(),
        method: 'GET',
        endpoint: endpoints[Math.floor(Math.random() * endpoints.length)],
        status: Math.random() > 0.95 ? 429 : 200,
        ms: Math.floor(Math.random() * 80) + 20,
        time: new Date().toLocaleTimeString('en-GB', { hour12: false })
      };
      setLogs(prev => [newLog, ...prev].slice(0, 8)); // Keep last 8 logs
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleCopy = (id, token) => {
    navigator.clipboard.writeText(token);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleVisibility = (id) => {
    setVisibleKey(visibleKey === id ? null : id);
  };

  const generateKey = () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setTimeout(() => {
      const newKey = {
        id: `key_${Math.random()}`,
        name: 'New Integration Token',
        token: `acme_live_${Math.random().toString(36).substr(2, 16)}`,
        created: 'Just now',
        lastUsed: 'Never',
        type: 'Live'
      };
      setKeys([newKey, ...keys]);
      setIsGenerating(false);
    }, 1500);
  };

  return (
    <div style={{ flex: 1, background: '#050505', color: '#e4e4e7', padding: '40px 5vw', overflowY: 'auto', fontFamily: sans, position: 'relative', minHeight: '100vh' }}>
      
      {/* Background Mesh */}
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse at top right, rgba(0, 230, 118, 0.04), transparent 50%), radial-gradient(ellipse at bottom left, rgba(0, 229, 255, 0.03), transparent 50%)', zIndex: 0, pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '40px', paddingBottom: '100px' }}>
        
        {/* ========================================== */}
        {/* GLOBAL HERO & NAV */}
        {/* ========================================== */}
        <header className="responsive-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', animation: 'fadeIn 0.8s ease-out' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: 'linear-gradient(145deg, #18181b, #000000)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.08), 0 8px 30px rgba(0,230,118,0.15)', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at top left, rgba(0,230,118,0.3), transparent 70%)' }} />
              <span style={{ fontSize: '28px', fontWeight: '800', color: '#fff', fontFamily: sans, zIndex: 1 }}>A<span style={{color: '#00e676'}}>.</span></span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
               <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#ffffff', fontFamily: sans, letterSpacing: '-0.5px', margin: 0, lineHeight: 1 }}>Acme FMCG Logistics</h1>
               <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                 <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#a1a1aa', fontFamily: sans, fontWeight: '500' }}>
                   <MapIcon size={14} strokeWidth={2} color="#71717a" /> Abuja, FCT
                 </span>
                 <span style={{ color: '#27272a' }}>|</span>
                 <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#00e676', fontFamily: mono, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                   <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00e676', boxShadow: '0 0 8px rgba(0,230,118,0.8)' }} /> API & Webhooks
                 </span>
               </div>
            </div>
          </div>

          <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '10px 16px', width: '260px' }}>
              <Search size={14} color="#71717a" />
              <input type="text" placeholder="Search documentation..." style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '13px', width: '100%', outline: 'none', fontFamily: sans }} />
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

        {/* ========================================== */}
        {/* PAGE HEADER */}
        {/* ========================================== */}
        <div style={{ animation: 'fadeIn 0.8s ease-out 0.1s backwards' }}>
          <div style={{ fontSize: '11px', color: '#00e676', fontFamily: mono, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontWeight: '700' }}>Developer Console</div>
          <h2 style={{ fontSize: '36px', fontWeight: '800', color: '#fff', margin: '0 0 8px 0', letterSpacing: '-1px' }}>System Integration & Keys</h2>
          <p style={{ fontSize: '15px', color: '#a1a1aa', margin: '0 0 24px 0', fontFamily: sans }}>Manage authentication tokens, configure webhooks, and monitor live API telemetry.</p>
        </div>

        {/* ========================================== */}
        {/* TOP METRICS GRID */}
        {/* ========================================== */}
        <div className="grid-4" style={{ gap: '20px', animation: 'fadeIn 0.8s ease-out 0.15s backwards' }}>
          {[
            { l: 'Total Requests (24h)', v: '1.24M', sub: '+12% vs yesterday', c: '#fff', ic: Server, color: '#a1a1aa' },
            { l: 'Avg Latency', v: '42ms', sub: 'Optimal performance', c: '#00e676', ic: Activity, color: '#00e676' },
            { l: 'Error Rate', v: '0.04%', sub: '24 rate limits hit', c: '#ef4444', ic: ShieldAlert, color: '#ef4444' },
            { l: 'Active Webhooks', v: '2', sub: '100% Delivery rate', c: '#fff', ic: Webhook, color: '#00e5ff' }
          ].map((m, i) => {
            const Icon = m.ic;
            return (
              <div key={i} style={{ padding: '24px', background: 'rgba(12,12,14,0.6)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.02)', backdropFilter: 'blur(20px)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ fontSize: '11px', color: '#71717a', fontFamily: mono, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{m.l}</span>
                  <Icon size={16} color={m.color} />
                </div>
                <div style={{ fontSize: '32px', color: m.c, fontWeight: '800', fontFamily: mono, letterSpacing: '-1px' }}>{m.v}</div>
                <div style={{ fontSize: '13px', color: '#a1a1aa', fontFamily: sans, marginTop: '8px', fontWeight: '500' }}>{m.sub}</div>
              </div>
            )
          })}
        </div>

        {/* ========================================== */}
        {/* SPLIT VIEW ARCHITECTURE */}
        {/* ========================================== */}
        <div className="grid-split" style={{ gap: '40px', animation: 'fadeIn 0.8s ease-out 0.2s backwards' }}>
          
          {/* LEFT COLUMN: Keys & Webhooks */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* 1. API KEYS MODULE */}
            <div style={{ background: 'rgba(15,15,18,0.6)', borderRadius: '24px', padding: '32px', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(40px)', boxShadow: '0 20px 40px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Key size={20} color="#00e676" strokeWidth={2} />
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', fontFamily: sans, letterSpacing: '-0.2px', margin: 0 }}>API Tokens</h3>
                </div>
                <button 
                  onClick={generateKey}
                  style={{ background: '#fff', color: '#000', border: 'none', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', fontFamily: sans, cursor: isGenerating ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(255,255,255,0.2)' }}
                  className="btn-execute"
                >
                  {isGenerating ? <RefreshCw size={14} className="spin-anim" /> : <Plus size={16} strokeWidth={2.5} />}
                  Generate Token
                </button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {keys.map((key) => {
                  const isVisible = visibleKey === key.id;
                  const isCopied = copiedId === key.id;
                  const displayToken = isVisible ? key.token : key.token.replace(/(acme_(live|test)_)(.*)/, '$1••••••••••••••••••••••••');
                  
                  return (
                    <div key={key.id} style={{ padding: '20px', borderRadius: '16px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', gap: '16px', transition: 'all 0.2s' }} className="card-hover">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '15px', fontWeight: '700', color: '#fff', fontFamily: sans }}>{key.name}</span>
                          <span style={{ fontSize: '10px', background: key.type === 'Live' ? 'rgba(0,230,118,0.1)' : 'rgba(245,158,11,0.1)', color: key.type === 'Live' ? '#00e676' : '#f59e0b', padding: '4px 8px', borderRadius: '4px', fontFamily: mono, fontWeight: '700', textTransform: 'uppercase' }}>
                            {key.type}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#71717a', fontFamily: sans, fontWeight: '500' }}>Created {key.created}</div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#000', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <span style={{ flex: 1, fontSize: '13px', color: '#00e676', fontFamily: mono, letterSpacing: '0.5px' }}>{displayToken}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button onClick={() => toggleVisibility(key.id)} style={{ background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }} className="icon-hover">
                            {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                          <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.1)' }} />
                          <button onClick={() => handleCopy(key.id, key.token)} style={{ background: 'transparent', border: 'none', color: isCopied ? '#00e676' : '#a1a1aa', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', gap: '6px' }} className="icon-hover">
                            {isCopied ? <Check size={16} /> : <Copy size={16} />}
                            <span style={{ fontSize: '12px', fontFamily: sans, fontWeight: '600', width: '48px', textAlign: 'left' }}>{isCopied ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                      </div>

                      <div style={{ fontSize: '11px', color: '#71717a', fontFamily: mono }}>Last used: {key.lastUsed}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 2. WEBHOOKS MODULE */}
            <div style={{ background: 'rgba(15,15,18,0.6)', borderRadius: '24px', padding: '32px', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(40px)', boxShadow: '0 20px 40px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Webhook size={20} color="#00e5ff" strokeWidth={2} />
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', fontFamily: sans, letterSpacing: '-0.2px', margin: 0 }}>Registered Webhooks</h3>
                </div>
                <button style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', fontFamily: sans, cursor: 'pointer', transition: 'all 0.2s' }} className="btn-hover">
                  Add Endpoint
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {mockWebhooks.map((hook) => (
                  <div key={hook.id} style={{ padding: '20px', borderRadius: '16px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', gap: '16px', transition: 'all 0.2s' }} className="card-hover">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ fontSize: '13px', color: '#e4e4e7', fontFamily: mono, wordBreak: 'break-all' }}>{hook.url}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#00e676', fontFamily: mono, fontWeight: '700', background: 'rgba(0,230,118,0.1)', padding: '4px 8px', borderRadius: '6px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00e676' }} /> {hook.status}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {hook.events.map(ev => (
                        <span key={ev} style={{ fontSize: '11px', color: '#a1a1aa', fontFamily: mono, border: '1px solid rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '4px' }}>{ev}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT: LIVE TERMINAL / LOGS */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ background: 'rgba(10,10,12,0.9)', borderRadius: '24px', padding: '0', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(40px)', position: 'sticky', top: '24px', minHeight: '600px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.6)' }}>
              
              {/* Terminal Header */}
              <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Code2 size={16} color="#71717a" strokeWidth={2} />
                  <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#fff', fontFamily: mono, textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>Live Request Logs</h3>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#00e676', fontFamily: mono, fontWeight: '700' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00e676', animation: 'pulseLive 1.5s infinite', boxShadow: '0 0 8px rgba(0,230,118,0.8)' }} />
                  LISTENING
                </div>
              </div>
              
              {/* Terminal Output */}
              <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
                {logs.map((log) => {
                  const isError = log.status >= 400;
                  const statusColor = isError ? '#ef4444' : log.status === 201 ? '#00e5ff' : '#00e676';
                  const methodColor = log.method === 'GET' ? '#3b82f6' : log.method === 'POST' ? '#f59e0b' : '#a1a1aa';

                  return (
                    <div key={log.id} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', fontFamily: mono, fontSize: '12px', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '12px' }}>
                      <div style={{ color: '#71717a', flexShrink: 0 }}>{log.time}</div>
                      <div style={{ display: 'flex', flex: 1, gap: '12px', alignItems: 'center' }}>
                        <span style={{ color: methodColor, fontWeight: '700', width: '40px' }}>{log.method}</span>
                        <span style={{ color: '#e4e4e7', flex: 1, wordBreak: 'break-all' }}>{log.endpoint}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexShrink: 0 }}>
                        <span style={{ color: statusColor, fontWeight: '700', width: '32px', textAlign: 'right' }}>{log.status}</span>
                        <span style={{ color: '#71717a', width: '40px', textAlign: 'right' }}>{log.ms}ms</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Terminal Footer */}
              <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#71717a', fontFamily: mono }}>
                <span>Environment: Production</span>
                <span style={{ cursor: 'pointer', color: '#fff' }} className="icon-hover">Clear Logs</span>
              </div>
            </div>
          </div>
          
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); filter: blur(4px); } to { opacity: 1; transform: translateY(0); filter: blur(0); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulseLive { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.2); opacity: 0.5; } 100% { transform: scale(1); opacity: 1; } }
        .spin-anim { animation: spin 1s linear infinite; }
        
        .btn-hover:hover { transform: scale(1.05); background: rgba(255,255,255,0.08) !important; }
        .btn-execute:hover { transform: translateY(-2px); box-shadow: 0 12px 30px rgba(255,255,255,0.3) !important; }
        .card-hover:hover { background: rgba(255,255,255,0.06) !important; border-color: rgba(255,255,255,0.1) !important; }
        .icon-hover:hover { color: #fff !important; }

        .grid-split { display: grid; grid-template-columns: 1.5fr 1fr; }
        .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); }
        
        @media (max-width: 1200px) {
          .grid-split { grid-template-columns: 1fr; }
          .grid-4 { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 768px) {
          .responsive-header { flex-direction: column; align-items: flex-start !important; gap: 24px; }
          .header-actions { width: 100%; justify-content: flex-start; flex-wrap: wrap; }
          .grid-4 { grid-template-columns: 1fr; }
        }
        
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
}
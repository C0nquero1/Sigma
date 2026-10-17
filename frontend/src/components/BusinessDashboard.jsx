import React, { useState, useEffect } from 'react';
import { 
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, 
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip
} from "recharts";
import { 
  Bell, Search, Settings, Plus, Map as MapIcon, CreditCard, 
  X, Info, MousePointer2, Radio, Activity, ArrowUpRight, ArrowDownRight, 
  Terminal, Sparkles, Cpu, ChevronRight, Database, ShieldAlert, PieChart as PieChartIcon,
  Play, RefreshCw, CheckCircle2, CheckCircle, TrendingUp
} from "lucide-react";

// ==========================================
// ULTIMATE ENTERPRISE FONT STACK
// ==========================================
const sans = "'SF Pro Display', 'Inter', 'Geist', -apple-system, BlinkMacSystemFont, sans-serif";
const mono = "'JetBrains Mono', 'Geist Mono', 'Fira Code', ui-monospace, monospace";

// ==========================================
// MOCK DATA SETS
// ==========================================
const dailyCashData = [
  { day: 'Sun', value: 8.4 }, { day: 'Mon', value: 12.1 }, { day: 'Tue', value: 11.5 },
  { day: 'Wed', value: 14.2 }, { day: 'Thu', value: 13.8 }, { day: 'Fri', value: 21.7 },
  { day: 'Today', value: 15.07 }
];

const dailyCashData24H = [
  { day: '00:00', value: 2.1 }, { day: '04:00', value: 1.5 }, { day: '08:00', value: 5.4 },
  { day: '12:00', value: 9.8 }, { day: '16:00', value: 12.2 }, { day: '20:00', value: 7.5 },
  { day: 'Now', value: 15.07 }
];

const modalityData = [
  { name: 'Cash', value: 50, fill: '#00e676' },
  { name: 'Mobile money', value: 35, fill: '#00e5ff' },
  { name: 'Bank transfer', value: 15, fill: '#3b82f6' }
];

const hourlyPulseData = [
  { time: '06:00', val: 20 }, { time: '09:00', val: 65 }, { time: '12:00', val: 110 },
  { time: '15:00', val: 85 }, { time: '18:00', val: 40 }, { time: '21:00', val: 15 }
];

const demandTrendData7D = [
  { time: 'Mon', today: 30, avg: 40 }, { time: 'Tue', today: 60, avg: 55 },
  { time: 'Wed', today: 95, avg: 84 }, { time: 'Thu', today: 70, avg: 75 },
  { time: 'Fri', today: 85, avg: 60 }, { time: 'Sat', today: 110, avg: 90 },
  { time: 'Sun', today: 62, avg: 51 }
];

const demandTrendData24H = [
  { time: '06:00', today: 30, avg: 40 }, { time: '09:00', today: 60, avg: 55 },
  { time: '12:00', today: 95, avg: 84 }, { time: '15:00', today: 70, avg: 75 },
  { time: '18:00', today: 85, avg: 60 }, { time: '21:00', today: 40, avg: 45 }
];

const marketShareData = [
  { name: 'Tunde Electronics', value: 13.0, fill: '#00e676' },
  { name: 'Ada Provisions', value: 12.7, fill: '#3b82f6' },
  { name: "Bola's Kitchen", value: 11.8, fill: '#f59e0b' },
  { name: 'Chidi Phones', value: 10.7, fill: '#00e5ff' },
  { name: 'Others', value: 51.9, fill: '#27272a' }
];

const radarData = [
  { subject: 'Stock', A: 85, B: 65 },
  { subject: 'Sales', A: 90, B: 70 },
  { subject: 'Velocity', A: 75, B: 85 },
  { subject: 'Price edge', A: 60, B: 90 },
  { subject: 'Demand', A: 80, B: 60 }
];

// ==========================================
// ELITE MICRO-COMPONENTS
// ==========================================
const LiveNumber = ({ base, format = 'number', prefix = '', suffix = '' }) => {
  const [val, setVal] = useState(base);
  useEffect(() => {
    const int = setInterval(() => setVal(base + (base * 0.01 * (Math.random() - 0.5))), 3000);
    return () => clearInterval(int);
  }, [base]);
  return <span>{prefix}{format === 'currency' ? val.toLocaleString('en-NG', { maximumFractionDigits: 2 }) : val.toFixed(1)}{suffix}</span>;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'rgba(15,15,18,0.95)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.08)', padding: '16px', borderRadius: '12px', boxShadow: '0 20px 40px rgba(0,0,0,0.8)' }}>
        <p style={{ margin: '0 0 12px 0', fontSize: '11px', color: '#a1a1aa', fontWeight: '700', fontFamily: mono, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
        {payload.map((entry, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: index === payload.length - 1 ? 0 : '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: entry.color, boxShadow: `0 0 12px ${entry.color}80` }} />
              <span style={{ fontSize: '12px', color: '#e4e4e7', fontFamily: sans, fontWeight: '500' }}>{entry.name}</span>
            </div>
            <span style={{ fontSize: '14px', color: '#fff', fontWeight: '700', fontFamily: mono, marginLeft: 'auto' }}>{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const SectionAISynthesis = ({ title, overview, action }) => (
  <div style={{ marginTop: '24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', padding: '32px', display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '40px' }}>
    <div>
      <div style={{ fontSize: '11px', color: '#00e5ff', fontFamily: mono, textTransform: 'uppercase', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '1px', fontWeight: '700' }}>
        <Sparkles size={16} color="#00e5ff" /> {title} AI SYNTHESIS
      </div>
      <div style={{ fontSize: '15px', color: '#d4d4d8', lineHeight: '1.8', fontFamily: sans, fontWeight: '400', letterSpacing: '0.2px' }}>{overview}</div>
    </div>
    <div style={{ borderLeft: '1px solid rgba(255,255,255,0.05)', paddingLeft: '40px' }}>
      <div style={{ fontSize: '11px', color: '#00e676', fontFamily: mono, textTransform: 'uppercase', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '1px', fontWeight: '700' }}>
        <Terminal size={16} color="#00e676" /> IMMEDIATE ACTION PROTOCOL
      </div>
      <div style={{ fontSize: '15px', color: '#fff', lineHeight: '1.8', fontFamily: sans, fontWeight: '600' }}>{action}</div>
    </div>
  </div>
);

const TimeToggle = ({ active, onChange }) => (
  <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
    <div onClick={() => onChange('24H')} style={{ padding: '6px 14px', fontSize: '11px', fontFamily: mono, fontWeight: '700', cursor: 'pointer', borderRadius: '6px', background: active === '24H' ? '#fff' : 'transparent', color: active === '24H' ? '#000' : '#71717a', transition: 'all 0.2s' }}>24H</div>
    <div onClick={() => onChange('7D')} style={{ padding: '6px 14px', fontSize: '11px', fontFamily: mono, fontWeight: '700', cursor: 'pointer', borderRadius: '6px', background: active === '7D' ? '#fff' : 'transparent', color: active === '7D' ? '#000' : '#71717a', transition: 'all 0.2s' }}>7D</div>
  </div>
);

// ==========================================
// VIEWS: SETUP & DIAGNOSTIC
// ==========================================
const EngineSetupView = ({ onComplete }) => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#000000', padding: '40px' }}>
    <div style={{ width: '800px', background: '#0a0a0c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '48px', boxShadow: '0 40px 100px rgba(0,0,0,0.8)' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '32px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
          <Database color="#fff" size={20} />
        </div>
        <div>
          <h2 style={{ fontSize: '24px', color: '#fff', fontWeight: '700', fontFamily: sans, margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>Intelligence Engine Initialization</h2>
          <p style={{ fontSize: '13px', color: '#a1a1aa', margin: 0, fontFamily: sans }}>Please provide core logistical parameters to calibrate the AI diagnostic models.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', color: '#71717a', fontFamily: mono, fontWeight: '600', textTransform: 'uppercase', marginBottom: '8px' }}>Registered Business Entity</label>
            <input type="text" defaultValue="Acme FMCG Logistics" style={{ width: '100%', background: '#000', border: '1px solid rgba(255,255,255,0.1)', padding: '16px', borderRadius: '12px', color: '#fff', fontSize: '14px', fontFamily: sans, outline: 'none', transition: 'border 0.2s' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '11px', color: '#71717a', fontFamily: mono, fontWeight: '600', textTransform: 'uppercase', marginBottom: '8px' }}>Primary Operating Hubs (Zones)</label>
            <input type="text" defaultValue="Central Wholesale, Retail Alley, Transit Perimeter" style={{ width: '100%', background: '#000', border: '1px solid rgba(255,255,255,0.1)', padding: '16px', borderRadius: '12px', color: '#fff', fontSize: '14px', fontFamily: sans, outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '11px', color: '#71717a', fontFamily: mono, fontWeight: '600', textTransform: 'uppercase', marginBottom: '8px' }}>Fleet / Node Capacity</label>
            <input type="text" defaultValue="142 Active Nodes / 38 Logistics Vehicles" style={{ width: '100%', background: '#000', border: '1px solid rgba(255,255,255,0.1)', padding: '16px', borderRadius: '12px', color: '#fff', fontSize: '14px', fontFamily: sans, outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '11px', color: '#71717a', fontFamily: mono, fontWeight: '600', textTransform: 'uppercase', marginBottom: '8px' }}>Primary Modality Split</label>
            <input type="text" defaultValue="60% Cash / 40% Digital Transfers" style={{ width: '100%', background: '#000', border: '1px solid rgba(255,255,255,0.1)', padding: '16px', borderRadius: '12px', color: '#fff', fontSize: '14px', fontFamily: sans, outline: 'none' }} />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', color: '#71717a', fontFamily: mono, fontWeight: '600', textTransform: 'uppercase', marginBottom: '8px' }}>Average Daily Volume Target (₦)</label>
            <input type="text" defaultValue="₦15,000,000" style={{ width: '100%', background: '#000', border: '1px solid rgba(255,255,255,0.1)', padding: '16px', borderRadius: '12px', color: '#fff', fontSize: '14px', fontFamily: sans, outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '11px', color: '#71717a', fontFamily: mono, fontWeight: '600', textTransform: 'uppercase', marginBottom: '8px' }}>Key Competitors (Comma separated)</label>
            <input type="text" defaultValue="Tunde Electronics, Ada Provisions, Bola's Kitchen" style={{ width: '100%', background: '#000', border: '1px solid rgba(255,255,255,0.1)', padding: '16px', borderRadius: '12px', color: '#fff', fontSize: '14px', fontFamily: sans, outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '11px', color: '#71717a', fontFamily: mono, fontWeight: '600', textTransform: 'uppercase', marginBottom: '8px' }}>Supply Chain Friction Points</label>
            <input type="text" defaultValue="North Gate congestion, Weekend restocking delays" style={{ width: '100%', background: '#000', border: '1px solid rgba(255,255,255,0.1)', padding: '16px', borderRadius: '12px', color: '#fff', fontSize: '14px', fontFamily: sans, outline: 'none' }} />
          </div>
          
          <button onClick={onComplete} style={{ marginTop: 'auto', width: '100%', background: '#fff', color: '#000', border: 'none', padding: '18px', borderRadius: '12px', fontSize: '14px', fontWeight: '700', fontFamily: sans, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', transition: 'all 0.2s', boxShadow: '0 4px 20px rgba(255,255,255,0.2)' }}>
            Commence Diagnostic Run <ChevronRight size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  </div>
);

const EngineDiagnosticLoader = () => {
  const [logs, setLogs] = useState([]);
  useEffect(() => {
    const steps = [
      "Establishing secure connection to regional logistics nodes...",
      "Aggregating 7-day trailing velocity matrices...",
      "Mapping spatial demand vectors across FCT sectors...",
      "Analyzing informal sector competitor telemetry...",
      "Synthesizing Master Execution Plan..."
    ];
    let i = 0;
    const interval = setInterval(() => {
      setLogs(prev => [...prev, steps[i]]);
      i++;
      if (i >= steps.length) clearInterval(interval);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#000000' }}>
      <div style={{ width: '600px', background: '#0a0a0c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '48px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '2px', background: 'linear-gradient(90deg, transparent, #fff, transparent)', animation: 'shimmer 1.5s infinite linear' }} />
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '40px' }}>
          <Cpu size={48} color="#fff" style={{ animation: 'pulseLive 1s infinite' }} strokeWidth={1} />
          <h2 style={{ fontSize: '18px', color: '#fff', fontWeight: '700', fontFamily: mono, marginTop: '24px', letterSpacing: '1px', textTransform: 'uppercase' }}>Processing Telemetry</h2>
        </div>

        <div style={{ background: '#000', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', minHeight: '200px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {logs.map((log, index) => (
            <div key={index} style={{ fontSize: '12px', color: '#a1a1aa', fontFamily: mono, display: 'flex', gap: '12px' }}>
              <span style={{ color: '#fff' }}>{`[${new Date().toISOString().substring(11, 19)}]`}</span> {log}
            </div>
          ))}
          {logs.length < 5 && <div style={{ fontSize: '12px', color: '#71717a', fontFamily: mono, animation: 'pulseLive 1s infinite' }}>_</div>}
        </div>
      </div>
      <style>{`@keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }`}</style>
    </div>
  );
};


// ==========================================
// SECTION COMPONENTS (For Continuous Scroll)
// ==========================================
const CashVelocitySection = () => {
  const [timeRange, setTimeRange] = useState('7D');
  const data = timeRange === '7D' ? dailyCashData : dailyCashData24H;

  return (
    <section id="sec-velocity" style={{ scrollMarginTop: '180px', marginBottom: '64px', animation: 'fadeIn 0.6s ease-out' }}>
      <div style={{ fontSize: '11px', color: '#00e676', fontFamily: mono, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px', fontWeight: '700' }}>01 / Cash Velocity</div>
      <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#fff', margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>Where the money is moving</h2>
      <p style={{ fontSize: '14px', color: '#a1a1aa', margin: '0 0 24px 0' }}>How much cash is flowing, where, and who profits from it.</p>

      <div className="grid-split" style={{ gap: '16px', marginBottom: '16px' }}>
        {/* Daily Cash Velocity Chart */}
        <div style={{ background: '#121214', borderRadius: '24px', padding: '32px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }} className="responsive-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '14px', fontWeight: '600' }}><CreditCard size={14} color="#00e676" /> Daily cash velocity <Info size={12} color="#71717a" /></div>
              <div style={{ fontSize: '12px', color: '#71717a', marginTop: '4px' }}>Tracking {timeRange === '7D' ? '7 days' : '24 hours'} of money moving through the market</div>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <TimeToggle active={timeRange} onChange={setTimeRange} />
              <div style={{ background: 'rgba(0,230,118,0.1)', color: '#00e676', padding: '6px 12px', borderRadius: '16px', fontSize: '11px', fontFamily: mono, fontWeight: '700' }}>+15.3%</div>
            </div>
          </div>
          <div style={{ fontSize: '12px', color: '#a1a1aa' }}>Today so far</div>
          <div style={{ fontSize: '40px', fontWeight: '800', color: '#fff', fontFamily: mono, letterSpacing: '-1.5px', marginBottom: '24px' }}>₦<LiveNumber base={15.07} format="currency" />M</div>
          
          <div style={{ height: '180px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 11, fontFamily: mono }} dy={10} />
                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="value" radius={[8, 8, 8, 8]}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === data.length - 1 ? '#00e676' : 'rgba(255,255,255,0.08)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* How Buyers Pay */}
        <div style={{ background: '#121214', borderRadius: '24px', padding: '32px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '14px', fontWeight: '600' }}><PieChartIcon size={14} color="#00e5ff" /> How buyers pay <Info size={12} color="#71717a" /></div>
          <div style={{ fontSize: '12px', color: '#71717a', marginTop: '4px' }}>Avg. basket ₦2.5K & ATV metrics</div>
          
          <div style={{ position: 'relative', width: '100%', height: '180px', margin: '24px 0' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={modalityData} innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="value" stroke="none">
                  {modalityData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} style={{ filter: `drop-shadow(0 0 8px ${entry.fill}40)` }} />)}
                </Pie>
                <RechartsTooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
               <div style={{ fontSize: '10px', color: '#71717a', fontFamily: sans, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Today</div>
               <div style={{ fontSize: '18px', fontWeight: '800', color: '#fff', fontFamily: mono }}>₦15.07M</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: 'auto' }}>
            {modalityData.map((d, i) => (
               <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                   <div style={{ width: '6px', height: '12px', borderRadius: '3px', background: d.fill }} />
                   <span style={{ fontSize: '13px', color: '#e4e4e7', fontFamily: sans, fontWeight: '500' }}>{d.name}</span>
                 </div>
                 <span style={{ fontSize: '14px', fontWeight: '700', color: '#fff', fontFamily: mono }}>{d.value}%</span>
               </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
        {/* Heatmap Grid */}
        <div style={{ background: '#121214', borderRadius: '24px', padding: '24px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}><MapIcon size={14} color="#00e676" /> Cash velocity heatmap <Info size={12} color="#71717a" /></div>
          <div style={{ fontSize: '12px', color: '#71717a', marginBottom: '20px' }}>Hottest right now: Central Stalls</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {[
              { n: 'North Gate', v: '₦115K/hr', bg: 'rgba(0,230,118,0.1)' }, { n: 'Textile Lane', v: '₦142K/hr', bg: 'rgba(0,230,118,0.2)' },
              { n: 'Craft Alley', v: '₦54.8K/hr', bg: 'rgba(255,255,255,0.03)' }, { n: 'Central Stalls', v: '₦328K/hr', bg: 'rgba(0,230,118,0.4)' },
              { n: 'East Wing', v: '₦93.3K/hr', bg: 'rgba(255,255,255,0.03)' }, { n: 'Transport Hub', v: '₦281K/hr', bg: 'rgba(0,230,118,0.3)' }
            ].map((z, i) => (
              <div key={i} style={{ background: z.bg, padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid rgba(255,255,255,0.02)' }}>
                <span style={{ fontSize: '12px', color: '#fff', fontWeight: '600' }}>{z.n}</span>
                <span style={{ fontSize: '14px', color: '#fff', fontFamily: mono, fontWeight: '800' }}>{z.v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hour-by-hour pulse */}
        <div style={{ background: '#121214', borderRadius: '24px', padding: '24px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}><Activity size={14} color="#00e5ff" /> Hour-by-hour pulse <Info size={12} color="#71717a" /></div>
          <div style={{ fontSize: '12px', color: '#71717a', marginBottom: '24px' }}>Cash moved in each trading hour today</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div><div style={{ fontSize: '10px', color: '#71717a', fontFamily: mono, textTransform: 'uppercase' }}>[₦] Live rate</div><div style={{ fontSize: '18px', fontWeight: '800', color: '#fff', fontFamily: mono }}>₦1.6M/hr</div></div>
            <div style={{ textAlign: 'right' }}><div style={{ fontSize: '10px', color: '#71717a', fontFamily: mono, textTransform: 'uppercase' }}>[#] Sales/min</div><div style={{ fontSize: '18px', fontWeight: '800', color: '#fff', fontFamily: mono }}>139</div></div>
          </div>
          <div style={{ height: '140px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyPulseData}>
                <Bar dataKey="val" fill="rgba(255,255,255,0.9)" radius={[4, 4, 0, 0]} barSize={6} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Profitable Businesses */}
        <div style={{ background: '#121214', borderRadius: '24px', padding: '24px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}><TrendingUp size={14} color="#00e676" /> Most profitable businesses <Info size={12} color="#71717a" /></div>
          <div style={{ fontSize: '12px', color: '#71717a', marginBottom: '24px' }}>Profit earned from today's cash flow</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { n: "Bola's Kitchen", m: '33% margin', v: '₦243K' },
              { n: 'Musa Snacks', m: '31% margin', v: '₦185K' },
              { n: 'Tunde Electronics', m: '22% margin', v: '₦176K' },
              { n: 'Chidi Phones', m: '26% margin', v: '₦172K' }
            ].map((b, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingBottom: '16px', borderBottom: i === 3 ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: i === 0 ? '#00e676' : 'rgba(255,255,255,0.05)', color: i === 0 ? '#000' : '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '12px', fontWeight: '800', fontFamily: mono }}>{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#fff' }}>{b.n}</div>
                  <div style={{ fontSize: '12px', color: '#71717a' }}>{b.m}</div>
                </div>
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#fff', fontFamily: mono }}>{b.v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <SectionAISynthesis 
        title="Velocity"
        overview="Telemetry detects a highly concentrated liquidity vortex in Central Market. Ecosystem retention remains strong at 42.5 hours before cash physically exits the geofence."
        action="Deploy rapid-response digital POS terminals to Central Wholesale Hub immediately to prevent cash saturation."
      />
    </section>
  );
};

const DemandSection = () => {
  const [timeRange, setTimeRange] = useState('7D');
  const data = timeRange === '7D' ? demandTrendData7D : demandTrendData24H;

  return (
    <section id="sec-demand" style={{ scrollMarginTop: '180px', marginBottom: '64px', animation: 'fadeIn 0.6s ease-out' }}>
      <div style={{ fontSize: '11px', color: '#f59e0b', fontFamily: mono, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px', fontWeight: '700' }}>02 / Demand</div>
      <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#fff', margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>What buyers want, and when</h2>
      <p style={{ fontSize: '14px', color: '#a1a1aa', margin: '0 0 24px 0' }}>Today's demand compared to historical, where it's concentrated, and surge predictors.</p>

      <div className="grid-split" style={{ gap: '16px', marginBottom: '16px' }}>
        
        {/* Demand vs TimeChart */}
        <div style={{ background: '#121214', borderRadius: '24px', padding: '32px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="responsive-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '14px', fontWeight: '600' }}><Activity size={14} color="#f59e0b" /> Demand today vs. avg <Info size={12} color="#71717a" /></div>
              <div style={{ fontSize: '12px', color: '#71717a', marginTop: '4px' }}>How busy buyers are {timeRange === '7D' ? 'day by day' : 'hour by hour'}</div>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <TimeToggle active={timeRange} onChange={setTimeRange} />
              <div style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', padding: '6px 12px', borderRadius: '16px', fontSize: '11px', fontFamily: mono, fontWeight: '700' }}>+11.0%</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px', marginBottom: '32px' }}>
            <div style={{ fontSize: '40px', fontWeight: '800', color: '#fff', fontFamily: mono, letterSpacing: '-1.5px' }}>62%</div>
            <div style={{ fontSize: '14px', color: '#a1a1aa' }}>Today is running <span style={{color: '#f59e0b', fontWeight: '700'}}>11% above</span> a normal cycle.</div>
          </div>
          
          <div style={{ height: '160px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/><stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="1 4" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 11, fontFamily: mono, fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 11, fontFamily: mono, fontWeight: 600 }} dx={-10} />
                <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)' }} />
                <Area type="monotone" dataKey="avg" name="Historical avg" stroke="#71717a" strokeWidth={1.5} fill="none" strokeDasharray="4 4" />
                <Area type="monotone" dataKey="today" name="Live Demand" stroke="#f59e0b" strokeWidth={2.5} fillOpacity={1} fill="url(#colorDemand)" activeDot={{ r: 5, fill: '#f59e0b', stroke: '#000', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Demand Heatmap Grid */}
        <div style={{ background: '#121214', borderRadius: '24px', padding: '32px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}><MapIcon size={14} color="#f59e0b" /> Demand heatmap <Info size={12} color="#71717a" /></div>
          <div style={{ fontSize: '12px', color: '#71717a', marginBottom: '24px' }}>Highest demand right now: Food Court</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {[
              { n: 'North Gate', v: '40%', tag: 'MODERATE', bg: 'rgba(245,158,11,0.15)' },
              { n: 'Textile Lane', v: '61%', tag: 'MODERATE', bg: 'rgba(245,158,11,0.25)' },
              { n: 'Electronics', v: '66%', tag: 'MODERATE', bg: 'rgba(245,158,11,0.35)' },
              { n: 'Craft Alley', v: '18%', tag: 'MILD', bg: 'rgba(255,255,255,0.03)' },
              { n: 'Central Stalls', v: '76%', tag: 'HIGH', bg: 'rgba(245,158,11,0.6)' },
              { n: 'Food Court', v: '80%', tag: 'HIGH', bg: 'rgba(245,158,11,0.8)' }
            ].map((z, i) => (
              <div key={i} style={{ background: z.bg, padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px', border: '1px solid rgba(255,255,255,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '12px', color: '#fff', fontWeight: '600', lineHeight: 1.2 }}>{z.n}</span>
                  {z.tag !== 'MILD' && <span style={{ fontSize: '9px', background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '4px 6px', borderRadius: '4px', fontFamily: mono, fontWeight: '700' }}>{z.tag}</span>}
                </div>
                <span style={{ fontSize: '24px', color: '#fff', fontFamily: mono, fontWeight: '800' }}>{z.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid-split" style={{ gap: '16px' }}>
        {/* Surge Predictor */}
        <div style={{ background: '#121214', borderRadius: '24px', padding: '32px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '40px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}><Activity size={14} color="#f59e0b" /> Surge predictor <Info size={12} color="#71717a" /></div>
            <div style={{ fontSize: '12px', color: '#71717a', marginBottom: '32px' }}>When demand will spike this week and why</div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'auto repeat(12, 1fr)', gap: '8px', alignItems: 'center' }}>
              {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day => (
                <React.Fragment key={day}>
                  <span style={{ fontSize: '11px', color: day === 'Sat' ? '#fff' : '#71717a', fontFamily: mono, width: '28px', fontWeight: day === 'Sat' ? '700' : '500' }}>{day}</span>
                  {[...Array(12)].map((_, i) => {
                    const isHigh = day === 'Sat' && (i > 4 && i < 10);
                    const isMod = (day === 'Fri' || day === 'Sat') && !isHigh;
                    return <div key={i} style={{ width: '14px', height: '14px', borderRadius: '50%', background: isHigh ? '#f59e0b' : isMod ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.05)', boxShadow: isHigh ? '0 0 8px rgba(245,158,11,0.5)' : 'none' }} />
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
          <div style={{ width: '240px', borderLeft: '1px solid rgba(255,255,255,0.05)', paddingLeft: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ fontSize: '16px', fontWeight: '800', color: '#fff', fontFamily: sans }}>Sat - busiest day</div>
            <div style={{ display: 'flex', gap: '24px' }}>
              <div><div style={{ fontSize: '11px', color: '#71717a', fontFamily: mono, textTransform: 'uppercase', marginBottom: '4px' }}>Starts</div><div style={{ fontSize: '16px', color: '#fff', fontWeight: '800', fontFamily: mono }}>09:00</div></div>
              <div><div style={{ fontSize: '11px', color: '#71717a', fontFamily: mono, textTransform: 'uppercase', marginBottom: '4px' }}>Peaks</div><div style={{ fontSize: '16px', color: '#fff', fontWeight: '800', fontFamily: mono }}>16:00</div></div>
            </div>
            <div><div style={{ fontSize: '11px', color: '#71717a', fontFamily: mono, marginBottom: '6px', textTransform: 'uppercase' }}>Where</div><div style={{ fontSize: '15px', color: '#fff', fontWeight: '700' }}>Central Stalls</div></div>
            <div style={{ fontSize: '13px', color: '#00e676', lineHeight: '1.6', background: 'rgba(0,230,118,0.05)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(0,230,118,0.1)' }}>
              <span style={{fontWeight: '800'}}>Why:</span> Main market day: families do their weekly shop and buses arrive full.
            </div>
          </div>
        </div>

        {/* Top Demanded Businesses */}
        <div style={{ background: '#121214', borderRadius: '24px', padding: '32px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}><TrendingUp size={14} color="#f59e0b" /> Top demanded <Info size={12} color="#71717a" /></div>
          <div style={{ fontSize: '12px', color: '#71717a', marginBottom: '32px' }}>Who buyers are queuing for right now</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>Bola's Kitchen</div>
              <div style={{ fontSize: '12px', color: '#71717a' }}>Food Court - Food</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#fff', fontFamily: mono, letterSpacing: '-1px' }}>79%</div>
              <div style={{ fontSize: '11px', color: '#f59e0b', fontFamily: mono, fontWeight: '700' }}>High Conv.</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', height: '100px' }}>
            {[79, 65, 60, 55, 40, 35, 20, 15].map((h, i) => (
              <div key={i} style={{ flex: 1, background: i === 0 ? '#f59e0b' : 'rgba(255,255,255,0.1)', height: `${h}%`, borderRadius: '4px 4px 0 0', boxShadow: i === 0 ? '0 0 12px rgba(245,158,11,0.4)' : 'none', transition: 'all 0.3s' }} />
            ))}
          </div>
        </div>
      </div>

      <SectionAISynthesis 
        title="Demand"
        overview="Advanced predictive heatmaps indicate a massive 45% surge in aggregate demand compared to our historical baselines. This surge consistently originates from the Transit Perimeter starting precisely at 08:00 AM, eventually collapsing into the Central Wholesale hub by 14:00. While the inventory burn rate has hit a critical 1.8x threshold, Demand-to-Sale conversion remains remarkably steady at 64.2%."
        action="Execute emergency inventory restock for Apex Suppliers before 14:00 to prevent stock-out. Divert idle logistics assets from North Zone to Core."
      />
    </section>
  );
};

const MarketSection = () => (
  <section id="sec-market" style={{ scrollMarginTop: '180px', marginBottom: '64px', animation: 'fadeIn 0.6s ease-out' }}>
    <div style={{ fontSize: '11px', color: '#00e5ff', fontFamily: mono, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px', fontWeight: '700' }}>03 / Market</div>
    <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#fff', margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>Who is winning the competition</h2>
    <p style={{ fontSize: '14px', color: '#a1a1aa', margin: '0 0 24px 0' }}>Informal market share, the live factors behind it, and head-to-head comparisons.</p>

    <div className="grid-split" style={{ gap: '16px', gridTemplateColumns: '1fr 1.2fr 1fr' }}>
      
      {/* Market Share Donut */}
      <div style={{ background: '#121214', borderRadius: '24px', padding: '32px', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}><PieChartIcon size={14} color="#00e5ff" /> Informal market share <Info size={12} color="#71717a" /></div>
        <div style={{ fontSize: '12px', color: '#71717a', marginBottom: '32px' }}>Who is winning the buyers' money today</div>
        
        <div style={{ position: 'relative', width: '100%', height: '180px', marginBottom: '32px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={marketShareData} innerRadius={65} outerRadius={85} paddingAngle={4} dataKey="value" stroke="none">
                {marketShareData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} style={{ filter: `drop-shadow(0 0 8px ${entry.fill}40)` }} />)}
              </Pie>
              <RechartsTooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
             <div style={{ fontSize: '11px', color: '#71717a', fontFamily: sans, textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>Total sales</div>
             <div style={{ fontSize: '20px', fontWeight: '800', color: '#fff', fontFamily: mono }}>₦7.2M</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {marketShareData.map((d, i) => (
             <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                 <div style={{ width: '6px', height: '12px', borderRadius: '3px', background: d.fill }} />
                 <span style={{ fontSize: '13px', color: '#e4e4e7', fontFamily: sans, fontWeight: '500' }}>{d.name}</span>
               </div>
               <span style={{ fontSize: '14px', fontWeight: '800', color: '#fff', fontFamily: mono }}>{d.value}%</span>
             </div>
          ))}
        </div>
      </div>

      {/* What's moving market share */}
      <div style={{ background: '#121214', borderRadius: '24px', padding: '32px', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}><Activity size={14} color="#00e5ff" /> What's moving market share <Info size={12} color="#71717a" /></div>
        <div style={{ fontSize: '12px', color: '#71717a', marginBottom: '32px' }}>Live factors, ranked by how much they matter</div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {[
            { n: 'Price competitiveness', v: 92, w: '92%', sub: 'Undercutting in groceries' },
            { n: 'Stall location', v: 73, w: '73%', sub: 'Gate-facing stalls win' },
            { n: 'Stock availability', v: 61, w: '61%', sub: '3 stalls running low' },
            { n: 'Customer loyalty', v: 49, w: '49%', sub: 'Repeat buyers stable' },
            { n: 'Mobile-money acceptance', v: 47, w: '47%', sub: 'Cashless buyers growing' }
          ].map((f, i) => (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#fff', fontFamily: sans }}>{f.n}</span>
                <span style={{ fontSize: '14px', fontWeight: '800', color: '#fff', fontFamily: mono }}>{f.v}</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', marginBottom: '8px' }}>
                <div style={{ width: f.w, height: '100%', background: '#00e5ff', borderRadius: '3px', boxShadow: '0 0 8px rgba(0,229,255,0.5)' }} />
              </div>
              <div style={{ fontSize: '12px', color: '#71717a', fontFamily: sans }}>{f.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Head to head Radar */}
      <div style={{ background: '#121214', borderRadius: '24px', padding: '32px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}><Activity size={14} color="#00e5ff" /> Head-to-head <Info size={12} color="#71717a" /></div>
        <div style={{ fontSize: '12px', color: '#71717a', marginBottom: '32px' }}>Compare any two businesses</div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#fff', background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '8px', fontWeight: '600' }}><div style={{width:'8px',height:'8px',borderRadius:'50%',background:'#00e676'}}/> Ada Prov.</div>
          <div style={{ fontSize: '12px', color: '#71717a', display: 'flex', alignItems: 'center' }}>vs</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#fff', background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '8px', fontWeight: '600' }}><div style={{width:'8px',height:'8px',borderRadius:'50%',background:'#3b82f6'}}/> Ngozi Whole.</div>
        </div>

        <div style={{ height: '220px', width: '100%', margin: '0 auto' }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart outerRadius={80} data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#71717a', fontSize: 11, fontFamily: sans, fontWeight: 600 }} />
              <Radar name="Ada" dataKey="A" stroke="#00e676" strokeWidth={2.5} fill="#00e676" fillOpacity={0.15} />
              <Radar name="Ngozi" dataKey="B" stroke="#3b82f6" strokeWidth={2.5} fill="#3b82f6" fillOpacity={0.15} />
              <RechartsTooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ marginTop: 'auto', background: 'rgba(0,230,118,0.05)', border: '1px solid rgba(0,230,118,0.1)', padding: '16px', borderRadius: '12px', fontSize: '12px', color: '#00e676', textAlign: 'center', fontWeight: '600', lineHeight: '1.5' }}>
          Ada Provisions leads on 4 of 5 measures right now.
        </div>
      </div>
    </div>
    <SectionAISynthesis 
      title="Market"
      overview="Informal networks are actively capturing 68% of the total market share, heavily subsidized and driven by localized zero-KYC credit lines. While formal networks are currently stalling at 21% due to onboarding friction, overall competitor capital drain has decreased."
      action="Target defecting vendors from Rival Logistics with a zero-fee onboarding campaign. Maintain current pricing delta (-2.4%) to accelerate competitor churn."
    />
  </section>
);

const ActionPlanSection = () => {
  const [tasks, setTasks] = useState([
    { id: 'TSK-01', source: 'Velocity AI', title: 'Restock Riverside Fish Co. before the 17:00 rush', desc: 'Stock is at 35% while demand in its zone is 13%. Running out at peak would hand buyers to competitors.', priority: 'High', tag: 'Demand', val: '+₦72.1K', pColor: '#f59e0b', pBg: 'rgba(245,158,11,0.1)', state: 'idle', expanded: true },
    { id: 'TSK-02', source: 'Demand AI', title: 'Add staff to Central Stalls', desc: 'Foot traffic predicted to increase by 45% based on historic Saturday data.', priority: 'High', tag: 'Cash', val: '+₦172K', pColor: '#f59e0b', pBg: 'rgba(245,158,11,0.1)', state: 'idle', expanded: false },
    { id: 'TSK-03', source: 'Market AI', title: 'Promote mobile-money payments', desc: 'Cashless buyers growing. Provide a 2% discount incentive.', priority: 'Medium', tag: 'Market', val: '+₦550K', pColor: '#00e5ff', pBg: 'rgba(0,229,255,0.1)', state: 'idle', expanded: false },
    { id: 'TSK-04', source: 'Velocity AI', title: 'Run a flash promotion in Riverside', desc: 'Low demand detected in this sector. Price elasticity allows for safe markup cuts.', priority: 'Low', tag: 'Demand', val: '+₦48.0K', pColor: '#71717a', pBg: 'rgba(255,255,255,0.05)', state: 'idle', expanded: false }
  ]);

  const executeTask = (index) => {
    const newTasks = [...tasks];
    newTasks[index].state = 'loading';
    setTasks([...newTasks]);
    
    setTimeout(() => {
      const updated = [...tasks];
      updated[index].state = 'done';
      updated[index].expanded = false;
      setTasks(updated);
    }, 2000);
  };

  const toggleExpand = (index) => {
    const newTasks = [...tasks];
    if (newTasks[index].state !== 'done') {
      newTasks[index].expanded = !newTasks[index].expanded;
      setTasks(newTasks);
    }
  };

  return (
    <section id="sec-actions" style={{ scrollMarginTop: '180px', marginBottom: '64px', animation: 'fadeIn 0.6s ease-out' }}>
      <div style={{ fontSize: '11px', color: '#00e676', fontFamily: mono, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px', fontWeight: '700' }}>04 / Actions</div>
      <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#fff', margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>What to do next</h2>
      <p style={{ fontSize: '14px', color: '#a1a1aa', margin: '0 0 24px 0' }}>AI recommendations built from everything above, plus a live feed of every change.</p>

      <div className="grid-split" style={{ gap: '16px' }}>
        
        {/* AI Action Plan */}
        <div style={{ background: '#121214', borderRadius: '24px', padding: '32px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}><Sparkles size={14} color="#00e676" /> AI action plan <Info size={12} color="#71717a" /></div>
          <div style={{ fontSize: '12px', color: '#71717a', marginBottom: '32px' }}>What to do next, based on live cash, demand and market signals</div>

          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '24px', marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#71717a', textTransform: 'uppercase', fontFamily: mono, marginBottom: '8px', fontWeight: '600', letterSpacing: '0.5px' }}>Value captured</div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#fff', fontFamily: mono, letterSpacing: '-1px' }}>₦0 <span style={{fontSize:'16px', color:'#71717a'}}>/ ₦918K potential</span></div>
            </div>
            <div style={{ color: '#00e676', fontSize: '16px', fontWeight: '800', fontFamily: mono }}>{tasks.filter(t => t.state === 'done').length}/{tasks.length} done</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {tasks.map((act, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: act.state === 'done' ? '1px solid rgba(0,230,118,0.3)' : '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '24px', transition: 'all 0.3s', opacity: act.state === 'done' ? 0.6 : 1 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: act.state === 'done' ? '2px solid #00e676' : '2px solid #555', flexShrink: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '2px', background: act.state === 'done' ? 'rgba(0,230,118,0.2)' : 'transparent' }}>
                    {act.state === 'done' && <CheckCircle2 size={14} color="#00e676" />}
                  </div>
                  
                  <div style={{ flex: 1, cursor: act.state === 'done' ? 'default' : 'pointer' }} onClick={() => toggleExpand(i)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ fontSize: '16px', fontWeight: '700', color: act.state === 'done' ? '#00e676' : '#fff', textDecoration: act.state === 'done' ? 'line-through' : 'none', fontFamily: sans }}>{act.title}</div>
                      
                      {act.state === 'idle' && (
                        <button onClick={(e) => { e.stopPropagation(); executeTask(i); }} className="btn-execute" style={{ background: '#fff', color: '#000', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: '800', fontFamily: sans, cursor: 'pointer', boxShadow: '0 4px 12px rgba(255,255,255,0.2)' }}>Execute</button>
                      )}
                      {act.state === 'loading' && <RefreshCw size={18} color="#a1a1aa" className="spin-anim" />}
                      {act.state === 'done' && <span style={{fontSize: '12px', color: '#00e676', fontWeight: '700', fontFamily: sans}}>Executed</span>}
                    </div>

                    <div style={{ display: 'flex', gap: '8px', fontFamily: mono, fontSize: '11px', fontWeight: '700' }}>
                      <span style={{ background: act.pBg, color: act.pColor, padding: '4px 10px', borderRadius: '6px', textTransform: 'uppercase' }}>{act.priority}</span>
                      <span style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#a1a1aa', padding: '4px 10px', borderRadius: '6px' }}>{act.tag}</span>
                      <span style={{ color: '#00e676', display: 'flex', alignItems: 'center' }}>{act.val}</span>
                    </div>
                  </div>
                </div>
                
                {act.expanded && act.state !== 'done' && (
                  <div style={{ marginLeft: '40px', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '14px', color: '#a1a1aa', lineHeight: '1.6', fontFamily: sans }}>
                    {act.desc}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px', color: '#00e676', fontWeight: '500' }}>
                      <div style={{ display: 'flex', gap: '10px' }}><span style={{fontWeight:'800'}}>1.</span> Call the supplier for a same-day drop</div>
                      <div style={{ display: 'flex', gap: '10px' }}><span style={{fontWeight:'800'}}>2.</span> Move the best sellers to the front of the stall</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Live Signal Feed */}
        <div style={{ background: '#121214', borderRadius: '24px', padding: '32px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '14px', fontWeight: '600' }}><Activity size={14} color="#00e676" /> Live signal feed <Info size={12} color="#71717a" /></div>
              <div style={{ fontSize: '12px', color: '#71717a', marginTop: '4px' }}>Every notable change, as it happens</div>
            </div>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00e676', animation: 'pulseLive 1.5s infinite', boxShadow: '0 0 8px rgba(0,230,118,0.8)' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto' }}>
            {[
              { t: '₦35K sale recorded at Obi Footwear', time: '15:49', tag: 'Cash', icon: CreditCard, c: '#00e676' },
              { t: '₦47K sale recorded at Ngozi Wholesale', time: '15:48', tag: 'Cash', icon: CreditCard, c: '#00e676' },
              { t: 'Demand at Central Stalls down 1% in the last 15 min', time: '15:47', tag: 'Demand', icon: Activity, c: '#f59e0b' },
              { t: '₦63K sale recorded at Ngozi Wholesale', time: '15:45', tag: 'Cash', icon: CreditCard, c: '#00e676' },
              { t: 'Obi Footwear lost 1.4 pts of market share', time: '15:44', tag: 'Market', icon: PieChartIcon, c: '#3b82f6' }
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '20px', display: 'flex', gap: '16px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${s.c}15`, color: s.c, display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
                    <Icon size={16} strokeWidth={2} />
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#fff', marginBottom: '6px', lineHeight: '1.4', fontFamily: sans }}>{s.t}</div>
                    <div style={{ fontSize: '11px', color: '#71717a', fontFamily: mono, fontWeight: '600' }}>{s.time} · {s.tag}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        
      </div>
    </section>
  );
};

// ==========================================
// MAIN APP COMPONENT
// ==========================================
export default function BusinessDashboard() {
  const [engineState, setEngineState] = useState('setup'); // 'setup' | 'running' | 'dashboard'
  const [activeTab, setActiveTab] = useState('velocity');
  const [showGuide, setShowGuide] = useState(true);
  
  // Floating Update Button State
  const [updateStatus, setUpdateStatus] = useState('idle'); // idle | loading | success
  const [credits, setCredits] = useState(24);
  const [lastSync, setLastSync] = useState('10:19 AM');

  const runInitialDiagnostic = () => {
    setEngineState('running');
    setTimeout(() => {
      setLastSync(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setEngineState('dashboard');
    }, 4500);
  };

  const triggerUpdate = () => {
    if (updateStatus !== 'idle' || credits <= 0) return;
    setUpdateStatus('loading');
    setCredits(prev => prev - 1);
    setTimeout(() => {
      setUpdateStatus('success');
      setLastSync(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setTimeout(() => {
        setUpdateStatus('idle');
      }, 3000);
    }, 2000);
  };

  const scrollToSection = (id) => {
    setActiveTab(id);
    const el = document.getElementById(`sec-${id}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (engineState === 'setup') return <EngineSetupView onComplete={runInitialDiagnostic} />;
  if (engineState === 'running') return <EngineDiagnosticLoader />;

  const tabs = [
    { id: 'velocity', label: 'Cash Velocity', val: '₦142.5M', icon: TrendingUp },
    { id: 'demands', label: 'Demands', val: '57%', icon: Activity },
    { id: 'market', label: 'Market leader', val: 'Tunde Elec.', icon: PieChartIcon },
    { id: 'actions', label: 'Actions', val: '5 ready', icon: ShieldAlert }
  ];

  return (
    <div style={{ flex: 1, background: '#050505', color: '#e4e4e7', padding: '40px 5vw', overflowY: 'auto', fontFamily: sans, position: 'relative', minHeight: '100vh' }}>
      
      {/* Background Mesh */}
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse at top, rgba(0, 230, 118, 0.03), transparent 60%)', zIndex: 0, pointerEvents: 'none' }} />

      {/* FLOATING UPDATE BUTTON */}
      <div 
        onClick={triggerUpdate}
        style={{ 
          position: 'fixed', bottom: '40px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999,
          background: updateStatus === 'success' ? 'rgba(0, 230, 118, 0.15)' : 'rgba(20, 20, 24, 0.85)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          border: updateStatus === 'success' ? '1px solid rgba(0, 230, 118, 0.5)' : '1px solid rgba(0, 230, 118, 0.3)',
          padding: updateStatus === 'success' ? '12px 24px' : '16px 32px',
          borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '12px',
          boxShadow: updateStatus === 'success' ? '0 0 30px rgba(0, 230, 118, 0.4)' : '0 20px 40px rgba(0,0,0,0.8)',
          cursor: updateStatus === 'idle' ? 'pointer' : 'default',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        className="floating-btn"
      >
        {updateStatus === 'idle' && (
          <>
            <Play size={18} color="#00e676" fill="#00e676" />
            <span style={{ fontSize: '14px', color: '#fff', fontWeight: '700', fontFamily: sans, letterSpacing: '0.5px' }}>Run Live Update</span>
            <span style={{ fontSize: '11px', color: '#00e676', fontFamily: mono, borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: '12px', marginLeft: '4px' }}>1 CR</span>
          </>
        )}
        {updateStatus === 'loading' && (
          <>
            <RefreshCw size={18} color="#00e5ff" className="spin-anim" />
            <span style={{ fontSize: '14px', color: '#00e5ff', fontWeight: '700', fontFamily: sans, letterSpacing: '0.5px' }}>Processing Telemetry...</span>
          </>
        )}
        {updateStatus === 'success' && (
          <>
            <CheckCircle size={18} color="#00e676" />
            <span style={{ fontSize: '14px', color: '#00e676', fontWeight: '700', fontFamily: sans, letterSpacing: '0.5px' }}>Updated to real-time</span>
          </>
        )}
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '40px', paddingBottom: '100px' }}>
        
        {/* GLOBAL HERO & NAV */}
        <header className="responsive-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', animation: 'fadeIn 0.8s ease-out' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: 'linear-gradient(145deg, #18181b, #000000)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.08), 0 8px 30px rgba(0,230,118,0.2)', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
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
                   <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00e676', boxShadow: '0 0 8px rgba(0,230,118,0.8)' }} /> Live Sync
                 </span>
               </div>
            </div>
          </div>

          <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '10px 16px', width: '260px' }}>
              <Search size={14} color="#71717a" />
              <input type="text" placeholder="Search systems..." style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '13px', width: '100%', outline: 'none', fontFamily: sans }} />
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', color: '#a1a1aa', fontFamily: mono }}>⌘K</div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '100px', padding: '6px', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.02)', backdropFilter: 'blur(10px)' }}>
               <div style={{ padding: '4px 20px 4px 12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                 <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00e5ff', boxShadow: '0 0 8px rgba(0,229,255,0.6)' }} />
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

        <div>
          <div style={{ fontSize: '10px', color: '#71717a', fontFamily: mono, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Live Market Intelligence</div>
          <h2 style={{ fontSize: '32px', fontWeight: '700', color: '#fff', margin: '0 0 24px 0', letterSpacing: '-0.5px' }}>Good morning. Here's your market, right now.</h2>
        </div>

        {/* GUIDE BANNER */}
        {showGuide && (
          <div style={{ background: '#121214', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.06)', padding: '24px', display: 'flex', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '24px', right: '24px', cursor: 'pointer' }} onClick={() => setShowGuide(false)}><X size={16} color="#71717a" /></div>
            <div style={{ flex: 1, display: 'flex', gap: '16px', paddingRight: '24px', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(0,229,255,0.1)', color: '#00e5ff', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}><Cpu size={14} /></div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#fff', marginBottom: '4px' }}>It runs on your command</div>
                <div style={{ fontSize: '13px', color: '#a1a1aa', lineHeight: '1.5' }}>Click the update module below to run a fresh AI pulse. Last run: {lastSync}.</div>
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex', gap: '16px', padding: '0 24px', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(0,230,118,0.1)', color: '#00e676', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}><MousePointer2 size={14} /></div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#fff', marginBottom: '4px' }}>Hover, tap, navigate</div>
                <div style={{ fontSize: '13px', color: '#a1a1aa', lineHeight: '1.5' }}>Click any of the top 4 cards below to fast-scroll to that specific data section.</div>
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex', gap: '16px', paddingLeft: '24px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}><Info size={14} /></div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#fff', marginBottom: '4px' }}>AI Synthesis Included</div>
                <div style={{ fontSize: '13px', color: '#a1a1aa', lineHeight: '1.5', paddingRight: '20px' }}>Every section ends with an AI breakdown and an actionable directive.</div>
              </div>
            </div>
          </div>
        )}

        {/* ACTIVE NAVIGATION RIBBON */}
        <div className="grid-4" style={{ gap: '24px', position: 'sticky', top: '24px', zIndex: 10, animation: 'fadeIn 0.8s ease-out 0.1s backwards' }}>
          {tabs.map(card => {
            const isActive = activeTab === card.id;
            const Icon = card.icon;
            return (
              <div 
                key={card.id} onClick={() => scrollToSection(card.id)} className="nav-card"
                style={{ 
                  background: isActive ? 'rgba(0, 230, 118, 0.05)' : 'rgba(18, 18, 20, 0.85)', 
                  padding: '24px', borderRadius: '20px', cursor: 'pointer', 
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)', 
                  border: `1px solid ${isActive ? 'rgba(0, 230, 118, 0.4)' : 'rgba(255,255,255,0.08)'}`, 
                  display: 'flex', flexDirection: 'column', gap: '16px', 
                  boxShadow: isActive ? '0 20px 40px rgba(0,0,0,0.6), inset 0 1px 1px rgba(0,230,118,0.1)' : 'none', 
                  backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
                  opacity: isActive ? 1 : 0.6,
                  filter: isActive ? 'grayscale(0%)' : 'grayscale(50%)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: isActive ? '#00e676' : '#a1a1aa', fontFamily: mono, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700' }}>{card.label}</span>
                  <Icon size={18} color={isActive ? '#00e676' : '#71717a'} strokeWidth={2} />
                </div>
                <div style={{ fontSize: '32px', fontWeight: '800', color: '#fff', fontFamily: mono, letterSpacing: '-1px' }}>{card.val}</div>
              </div>
            );
          })}
        </div>

        <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '16px 0' }} />

        {/* ========================================== */}
        {/* CONTINUOUS SCROLL CONTENT */}
        {/* ========================================== */}
        <CashVelocitySection />
        <DemandSection />
        <MarketSection />
        <ActionPlanSection />

      </div>

      {/* RESPONSIVE STYLES INJECTED */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); filter: blur(4px); } to { opacity: 1; transform: translateY(0); filter: blur(0); } }
        @keyframes pulseLive { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.1); opacity: 0.5; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        
        .spin-anim { animation: spin 1s linear infinite; }
        .data-pill:hover { transform: translateY(-4px); border-color: rgba(255,255,255,0.2) !important; background: rgba(20,20,24,0.8) !important; }
        .btn-execute:hover { transform: scale(1.05); }
        .btn-hover:hover { transform: scale(1.05); background: rgba(255,255,255,0.08) !important; }
        .setup-input:focus { border-color: #00e676 !important; background: rgba(0,230,118,0.05) !important; }
        .nav-card:hover { opacity: 1 !important; filter: grayscale(0%) !important; }
        .action-hover:hover { background: rgba(255,255,255,0.06) !important; border-color: rgba(255,255,255,0.1) !important; }
        .floating-btn:hover { transform: translateX(-50%) scale(1.05) !important; border-color: rgba(0,230,118,0.8) !important; }

        /* Responsive Grid System */
        .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); }
        .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); }
        .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); }
        .grid-split { display: grid; grid-template-columns: 2fr 1fr; }

        @media (max-width: 1200px) {
          .grid-4 { grid-template-columns: repeat(2, 1fr); }
          .grid-3 { grid-template-columns: repeat(2, 1fr); }
          .grid-split { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) {
          .responsive-header { flex-direction: column; align-items: flex-start !important; gap: 24px; }
          .header-actions { width: 100%; justify-content: flex-start; flex-wrap: wrap; }
          .grid-2 { grid-template-columns: 1fr; }
          .grid-3 { grid-template-columns: 1fr; }
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
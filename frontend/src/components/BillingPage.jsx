import React, { useState } from 'react';
import { 
  Bell, Search, Settings, Plus, Map as MapIcon, CreditCard, 
  Zap, Check, X, ArrowUpRight, FileText, Download, 
  RefreshCw, CheckCircle2, ShieldCheck, Cpu, Activity,
  Package, Server, Terminal, Sparkles
} from "lucide-react";

// Ultimate Enterprise Font Stack
const sans = "'SF Pro Display', 'Inter', 'Geist', -apple-system, BlinkMacSystemFont, sans-serif";
const mono = "'JetBrains Mono', 'Geist Mono', 'Fira Code', ui-monospace, monospace";

// ==========================================
// MOCK DATA: BILLING HISTORY
// ==========================================
const billingHistory = [
  { id: 'INV-2026-089', date: 'Oct 17, 2026', desc: 'Pro Plan - Monthly', amount: '$89.00', status: 'Paid', credits: '+500 CR' },
  { id: 'INV-2026-088', date: 'Oct 12, 2026', desc: 'Compute Top-Up (100 Pack)', amount: '$15.00', status: 'Paid', credits: '+100 CR' },
  { id: 'INV-2026-042', date: 'Sep 17, 2026', desc: 'Pro Plan - Monthly', amount: '$89.00', status: 'Paid', credits: '+500 CR' },
  { id: 'INV-2026-015', date: 'Aug 17, 2026', desc: 'Starter Plan - Monthly', amount: '$29.00', status: 'Paid', credits: '+100 CR' }
];

// ==========================================
// MAIN APP COMPONENT
// ==========================================
export default function BillingPage() {
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'yearly'
  const [selectedPack, setSelectedPack] = useState(100);
  const [isProcessing, setIsProcessing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [credits, setCredits] = useState(124);

  const handlePurchase = () => {
    if (isProcessing) return;
    setIsProcessing(true);
    // Simulate network transaction
    setTimeout(() => {
      setIsProcessing(false);
      setPurchaseSuccess(true);
      setCredits(prev => prev + selectedPack);
      setTimeout(() => setPurchaseSuccess(false), 3000);
    }, 2000);
  };

  return (
    <div style={{ flex: 1, background: '#050505', color: '#e4e4e7', padding: '40px 5vw', overflowY: 'auto', fontFamily: sans, position: 'relative', minHeight: '100vh' }}>
      
      {/* Background Mesh */}
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse at top right, rgba(0, 230, 118, 0.04), transparent 50%), radial-gradient(ellipse at bottom left, rgba(245, 158, 11, 0.03), transparent 50%)', zIndex: 0, pointerEvents: 'none' }} />

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
                   <CreditCard size={14} strokeWidth={2} color="#71717a" /> Billing & Compute
                 </span>
                 <span style={{ color: '#27272a' }}>|</span>
                 <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#00e676', fontFamily: mono, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                   <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00e676', boxShadow: '0 0 8px rgba(0,230,118,0.8)' }} /> Pro Plan Active
                 </span>
               </div>
            </div>
          </div>

          <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
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
            </div>
            <div className="btn-hover" style={{ cursor: 'pointer', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Settings size={18} color="#a1a1aa" />
            </div>
          </div>
        </header>

        {/* ========================================== */}
        {/* CURRENT BALANCE & QUICK TOP-UP */}
        {/* ========================================== */}
        <div className="grid-split" style={{ gap: '24px', animation: 'fadeIn 0.8s ease-out 0.1s backwards' }}>
          
          {/* Balance Card & Cost Ledger */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: 'rgba(15,15,18,0.6)', borderRadius: '24px', padding: '40px', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(40px)', position: 'relative', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
              <div style={{ position: 'absolute', top: 0, right: 0, width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(0,230,118,0.1) 0%, transparent 70%)', filter: 'blur(40px)', transform: 'translate(30%, -30%)' }} />
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', position: 'relative', zIndex: 1 }}>
                <Cpu size={18} color="#00e676" strokeWidth={2} />
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#fff', fontFamily: sans, letterSpacing: '-0.2px', margin: 0 }}>Engine Compute Credits</h3>
              </div>

              <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'flex-end', gap: '16px', marginBottom: '32px' }}>
                <div style={{ fontSize: '64px', fontWeight: '800', color: '#fff', fontFamily: mono, letterSpacing: '-3px', lineHeight: 1 }}>{credits}</div>
                <div style={{ paddingBottom: '8px', color: '#a1a1aa', fontFamily: mono, fontSize: '14px', fontWeight: '600' }}>CR</div>
              </div>

              <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden', marginBottom: '16px' }}>
                <div style={{ width: `${(credits / 500) * 100}%`, height: '100%', background: credits < 50 ? '#ef4444' : '#00e676', borderRadius: '3px', boxShadow: `0 0 10px ${credits < 50 ? '#ef4444' : '#00e676'}` }} />
              </div>
              
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#71717a', fontFamily: sans }}>
                <span>{Math.max(0, 500 - credits)} credits used this cycle</span>
                <span>Resets in 14 days</span>
              </div>
            </div>

            {/* Compute Costs Ledger */}
            <div style={{ background: 'rgba(10,10,12,0.8)', borderRadius: '20px', padding: '24px', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Activity size={14} color="#00e5ff" />
                <span style={{ fontSize: '14px', color: '#a1a1aa', fontFamily: sans, fontWeight: '500' }}>Dashboard Live Sync</span>
              </div>
              <span style={{ fontSize: '13px', color: '#00e5ff', fontFamily: mono, fontWeight: '700' }}>- 10 CR</span>
            </div>
            
            <div className="grid-2" style={{ gap: '16px' }}>
              <div style={{ background: 'rgba(10,10,12,0.8)', borderRadius: '20px', padding: '24px', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Sparkles size={14} color="#f59e0b" />
                  <span style={{ fontSize: '14px', color: '#a1a1aa', fontFamily: sans, fontWeight: '500' }}>AI Map Chat</span>
                </div>
                <span style={{ fontSize: '13px', color: '#f59e0b', fontFamily: mono, fontWeight: '700' }}>- 5 CR</span>
              </div>
              <div style={{ background: 'rgba(10,10,12,0.8)', borderRadius: '20px', padding: '24px', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <FileText size={14} color="#71717a" />
                  <span style={{ fontSize: '14px', color: '#a1a1aa', fontFamily: sans, fontWeight: '500' }}>Deep Export</span>
                </div>
                <span style={{ fontSize: '13px', color: '#fff', fontFamily: mono, fontWeight: '700' }}>- 5 CR</span>
              </div>
            </div>
          </div>

          {/* Quick Top-Up Widget */}
          <div style={{ background: 'rgba(15,15,18,0.6)', borderRadius: '24px', padding: '40px', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(40px)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <Zap size={18} color="#f59e0b" strokeWidth={2} />
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#fff', fontFamily: sans, letterSpacing: '-0.2px', margin: 0 }}>Instant Top-Up</h3>
            </div>
            <p style={{ fontSize: '14px', color: '#a1a1aa', marginBottom: '24px', fontFamily: sans }}>Need more compute power immediately? Purchase a raw credit pack.</p>

            <div className="grid-3" style={{ gap: '12px', marginBottom: '32px' }}>
              {[
                { cr: 100, price: '$15.00' },
                { cr: 500, price: '$49.00' },
                { cr: 1500, price: '$99.00' }
              ].map(pack => (
                <div 
                  key={pack.cr} onClick={() => setSelectedPack(pack.cr)}
                  style={{ 
                    border: selectedPack === pack.cr ? '1px solid #f59e0b' : '1px solid rgba(255,255,255,0.08)',
                    background: selectedPack === pack.cr ? 'rgba(245,158,11,0.05)' : 'rgba(0,0,0,0.4)',
                    padding: '20px 16px', borderRadius: '16px', cursor: 'pointer', transition: 'all 0.2s',
                    boxShadow: selectedPack === pack.cr ? '0 0 20px rgba(245,158,11,0.1)' : 'none',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center'
                  }}
                  className="card-hover"
                >
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#fff', fontFamily: mono, marginBottom: '6px', letterSpacing: '-0.5px' }}>{pack.cr} <span style={{fontSize:'11px', color:'#71717a'}}>CR</span></div>
                  <div style={{ fontSize: '13px', color: selectedPack === pack.cr ? '#f59e0b' : '#a1a1aa', fontFamily: sans, fontWeight: '600' }}>{pack.price}</div>
                </div>
              ))}
            </div>

            <button 
              onClick={handlePurchase}
              className="btn-execute"
              style={{ 
                marginTop: 'auto', width: '100%', padding: '18px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                background: purchaseSuccess ? '#00e676' : '#fff', color: '#000',
                fontSize: '15px', fontWeight: '800', fontFamily: sans, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px',
                boxShadow: purchaseSuccess ? '0 0 30px rgba(0,230,118,0.4)' : '0 10px 30px rgba(255,255,255,0.2)', transition: 'all 0.3s'
              }}
            >
              {isProcessing ? (
                <><RefreshCw size={18} className="spin-anim" /> Processing Payment...</>
              ) : purchaseSuccess ? (
                <><CheckCircle2 size={18} /> Top-Up Successful</>
              ) : (
                <><CreditCard size={18} strokeWidth={2.5} /> Purchase {selectedPack} Credits</>
              )}
            </button>
          </div>
        </div>

        {/* ========================================== */}
        {/* SUBSCRIPTION TIERS */}
        {/* ========================================== */}
        <div style={{ animation: 'fadeIn 0.8s ease-out 0.2s backwards' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#fff', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>Engine Subscriptions</h2>
              <p style={{ fontSize: '14px', color: '#a1a1aa', margin: 0, fontFamily: sans }}>Upgrade your monthly baseline allowance to unlock automated API pulses and higher limits.</p>
            </div>
            
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', borderRadius: '100px', padding: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div onClick={() => setBillingCycle('monthly')} style={{ padding: '8px 16px', fontSize: '13px', fontFamily: sans, fontWeight: '600', cursor: 'pointer', borderRadius: '100px', background: billingCycle === 'monthly' ? '#fff' : 'transparent', color: billingCycle === 'monthly' ? '#000' : '#71717a', transition: 'all 0.2s' }}>Monthly</div>
              <div onClick={() => setBillingCycle('yearly')} style={{ padding: '8px 16px', fontSize: '13px', fontFamily: sans, fontWeight: '600', cursor: 'pointer', borderRadius: '100px', background: billingCycle === 'yearly' ? '#fff' : 'transparent', color: billingCycle === 'yearly' ? '#000' : '#71717a', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px' }}>Yearly <span style={{background: 'rgba(0,230,118,0.2)', color: '#00e676', padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontFamily: mono, textTransform: 'uppercase'}}>Save 20%</span></div>
            </div>
          </div>

          <div className="grid-3" style={{ gap: '24px' }}>
            {/* Starter Plan */}
            <div style={{ background: 'rgba(15,15,18,0.4)', borderRadius: '24px', padding: '40px', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '13px', color: '#a1a1aa', fontFamily: mono, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700', marginBottom: '16px' }}>Starter</div>
              <div style={{ fontSize: '40px', fontWeight: '800', color: '#fff', fontFamily: mono, letterSpacing: '-1px', marginBottom: '8px' }}>{billingCycle === 'monthly' ? '$29' : '$290'}</div>
              <div style={{ fontSize: '13px', color: '#71717a', fontFamily: sans, marginBottom: '32px' }}>per {billingCycle === 'monthly' ? 'month' : 'year, billed annually'}</div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: '#e4e4e7' }}><Check size={16} color="#00e676" /> <strong style={{color: '#fff'}}>100 Base Credits</strong> / mo</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: '#e4e4e7' }}><Check size={16} color="#00e676" /> Manual Diagnostics Only</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: '#e4e4e7' }}><Check size={16} color="#00e676" /> 7-Day Data Retention</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: '#71717a' }}><X size={16} /> API Access Locked</div>
              </div>
              
              <button style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#fff', fontSize: '14px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }} className="btn-hover">
                Downgrade
              </button>
            </div>

            {/* Pro Plan (Active) */}
            <div style={{ background: 'rgba(20,20,24,0.8)', borderRadius: '24px', padding: '40px', border: '1px solid #00e676', position: 'relative', overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.6), inset 0 0 40px rgba(0,230,118,0.05)' }}>
              <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', background: '#00e676', color: '#000', padding: '4px 16px', borderBottomRadius: '8px', fontSize: '11px', fontFamily: mono, fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Current Plan</div>
              <div style={{ fontSize: '13px', color: '#00e676', fontFamily: mono, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '800', marginBottom: '16px', marginTop: '16px' }}>Professional</div>
              <div style={{ fontSize: '40px', fontWeight: '800', color: '#fff', fontFamily: mono, letterSpacing: '-1px', marginBottom: '8px' }}>{billingCycle === 'monthly' ? '$89' : '$890'}</div>
              <div style={{ fontSize: '13px', color: '#a1a1aa', fontFamily: sans, marginBottom: '32px' }}>per {billingCycle === 'monthly' ? 'month' : 'year, billed annually'}</div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: '#e4e4e7' }}><Check size={16} color="#00e676" /> <strong style={{color: '#fff'}}>500 Base Credits</strong> / mo</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: '#e4e4e7' }}><Check size={16} color="#00e676" /> Automated Hourly Pulses</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: '#e4e4e7' }}><Check size={16} color="#00e676" /> 30-Day Data Retention</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: '#e4e4e7' }}><Terminal size={16} color="#00e5ff" /> <strong style={{color: '#fff'}}>Standard API & Webhooks</strong></div>
              </div>
              
              <button style={{ width: '100%', padding: '16px', borderRadius: '12px', border: 'none', background: 'rgba(0,230,118,0.1)', color: '#00e676', fontSize: '14px', fontWeight: '800', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={18} /> Active Subscription
              </button>
            </div>

            {/* Enterprise Plan */}
            <div style={{ background: 'rgba(15,15,18,0.4)', borderRadius: '24px', padding: '40px', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '13px', color: '#a1a1aa', fontFamily: mono, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700', marginBottom: '16px' }}>Enterprise</div>
              <div style={{ fontSize: '40px', fontWeight: '800', color: '#fff', fontFamily: mono, letterSpacing: '-1px', marginBottom: '8px' }}>{billingCycle === 'monthly' ? '$399' : '$3,990'}</div>
              <div style={{ fontSize: '13px', color: '#71717a', fontFamily: sans, marginBottom: '32px' }}>per {billingCycle === 'monthly' ? 'month' : 'year, billed annually'}</div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: '#e4e4e7' }}><Check size={16} color="#00e676" /> <strong style={{color: '#fff'}}>5,000 Base Credits</strong> / mo</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: '#e4e4e7' }}><Server size={16} color="#f59e0b" /> <strong style={{color: '#fff'}}>High-Volume API Nodes</strong></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: '#e4e4e7' }}><Check size={16} color="#00e676" /> Unlimited Data Retention</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: '#e4e4e7' }}><Check size={16} color="#00e676" /> Dedicated Account Manager</div>
              </div>
              
              <button style={{ width: '100%', padding: '16px', borderRadius: '12px', border: 'none', background: '#fff', color: '#000', fontSize: '15px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 14px rgba(255,255,255,0.2)' }} className="btn-execute">
                Upgrade to Enterprise
              </button>
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* BILLING HISTORY */}
        {/* ========================================== */}
        <div style={{ background: 'rgba(15,15,18,0.6)', borderRadius: '24px', padding: '40px', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(40px)', marginTop: '24px', animation: 'fadeIn 0.8s ease-out 0.3s backwards' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', fontFamily: sans, margin: 0 }}>Transaction History</h3>
            <button style={{ background: 'transparent', border: 'none', color: '#a1a1aa', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: '600' }} className="icon-hover">
              <Download size={14} /> Download Ledger
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', overflowX: 'auto' }}>
            <div style={{ minWidth: '800px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr 1fr', padding: '0 24px 16px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '11px', color: '#71717a', fontFamily: mono, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>
                <span>Invoice</span>
                <span>Description</span>
                <span>Amount (USD)</span>
                <span>Credits Added</span>
                <span style={{ textAlign: 'right' }}>Status</span>
              </div>

              {billingHistory.map((invoice, i) => (
                <div key={i} className="card-hover" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr 1fr', padding: '24px', borderBottom: i === billingHistory.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.03)', alignItems: 'center', transition: 'all 0.2s', cursor: 'pointer', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '14px', color: '#fff', fontWeight: '600', fontFamily: sans }}>{invoice.id}</span>
                    <span style={{ fontSize: '12px', color: '#71717a', fontFamily: mono }}>{invoice.date}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      {invoice.desc.includes('Top-Up') ? <Zap size={16} color="#f59e0b" /> : <Package size={16} color="#00e5ff" />}
                    </div>
                    <span style={{ fontSize: '15px', color: '#e4e4e7', fontFamily: sans, fontWeight: '500' }}>{invoice.desc}</span>
                  </div>
                  <div style={{ fontSize: '15px', color: '#fff', fontFamily: mono, fontWeight: '700' }}>{invoice.amount}</div>
                  <div style={{ fontSize: '14px', color: '#00e676', fontFamily: mono, fontWeight: '700' }}>{invoice.credits}</div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px' }}>
                    <span style={{ background: 'rgba(0,230,118,0.1)', color: '#00e676', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontFamily: mono, fontWeight: '700', textTransform: 'uppercase' }}>{invoice.status}</span>
                    <FileText size={18} color="#71717a" className="icon-hover" />
                  </div>
                </div>
              ))}
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
        .card-hover:hover { background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.08); }
        .icon-hover:hover { color: #fff !important; }

        .grid-split { display: grid; grid-template-columns: 1fr 1fr; }
        .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); }
        .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); }
        
        @media (max-width: 1200px) {
          .grid-split { grid-template-columns: 1fr; }
        }
        @media (max-width: 1024px) {
          .grid-3 { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) {
          .responsive-header { flex-direction: column; align-items: flex-start !important; gap: 24px; }
          .header-actions { width: 100%; justify-content: flex-start; flex-wrap: wrap; }
          .grid-2 { grid-template-columns: 1fr; }
        }
        
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
}
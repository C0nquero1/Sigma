import React, { useState, useEffect } from 'react';
import { 
  Command, ArrowRight, Menu, X, Activity, 
  Database, ShieldCheck, ChevronDown,TrendingUp, Check, Globe
} from 'lucide-react';

const sans = "'SF Pro Display', 'Inter', 'Geist', -apple-system, BlinkMacSystemFont, sans-serif";
const mono = "'JetBrains Mono', 'Geist Mono', 'Fira Code', ui-monospace, monospace";

const faqs = [
  {
    q: "How exactly does the AI track cash velocity?",
    a: "Our intelligence engine integrates with existing POS systems, mobile money APIs, and ground-fleet telemetry. It aggregates this data in real-time, mapping transaction densities to specific spatial zones to calculate exact cash flow per hour."
  },
  {
    q: "Do I need technical knowledge to use the dashboard?",
    a: "No. The Business Dashboard is designed for logistics executives and operators. The AI synthesizes complex data arrays into plain-English 'Master Execution Plans'. However, a Developer API is available for your engineering teams."
  },
  {
    q: "How accurate are the demand surge predictions?",
    a: "Our predictive models operate at a 94.2% accuracy rate for 24-hour windows. By analyzing trailing 7-day historical baselines, competitor stock levels, and local friction points, the engine predicts surges before inventory depletes."
  },
  {
    q: "What is the pricing model?",
    a: "We operate on a Hybrid Compute model. You pay a base subscription which includes an allowance of Compute Credits. Running live updates, AI chats, and deep exports consume credits. You can top-up instantly at any time."
  }
];

const MatrixGrid = () => {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '900px', zIndex: 0, pointerEvents: 'none', display: 'flex', justifyContent: 'center', overflow: 'hidden' }}>
      <div style={{ 
        width: '100%', maxWidth: '1400px', height: '100%', 
        display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gridTemplateRows: 'repeat(8, 100px)',
        borderLeft: '1px solid rgba(255,255,255,0.06)', borderTop: '1px solid rgba(255,255,255,0.06)'
      }}>
        {[...Array(96)].map((_, i) => {
          let glow = null;
          if (i === 10) glow = 'linear-gradient(90deg, transparent, #012a14, #02401f)';
          if (i === 11) glow = 'linear-gradient(90deg, #02401f, transparent)';
          if (i === 21) glow = 'linear-gradient(90deg, transparent, #011a0c, #034a26)';
          if (i === 22) glow = 'linear-gradient(90deg, #034a26, #02401f, #011a0c)';
          if (i === 23) glow = 'linear-gradient(90deg, #011a0c, transparent)';
          if (i === 33) glow = 'linear-gradient(90deg, transparent, #02401f)';
          if (i === 34) glow = 'linear-gradient(90deg, #02401f, #011a0c)';
          if (i === 45) glow = 'linear-gradient(90deg, transparent, #034a26)';
          if (i === 46) glow = 'linear-gradient(90deg, #034a26, #012a14)';
          if (i === 47) glow = 'linear-gradient(90deg, #012a14, transparent)';

          return (
            <div key={i} style={{ borderRight: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'relative' }}>
              {glow && (
                <div style={{ 
                  position: 'absolute', inset: '1px', background: glow, 
                  opacity: 0.8, filter: 'blur(8px)', animation: 'pulseSlow 4s ease-in-out infinite alternate' 
                }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function Website({ onNavigate }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Safe navigation handler
  const handleNav = (route) => {
    if (onNavigate) onNavigate(route);
  };

  return (
    <div style={{ background: '#000000', height: '100vh', color: '#fff', fontFamily: sans, position: 'relative', overflowX: 'hidden', overflowY: 'auto' }}>
      
      <MatrixGrid />

      <nav style={{ 
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? 'rgba(0,0,0,0.85)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent',
        transition: 'all 0.3s ease'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px 5vw', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => handleNav('landing')}>
            <div style={{ width: '28px', height: '28px', border: '1px solid #fff', borderRadius: '6px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff' }}>
              <Command size={14} strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '-0.5px' }}>Platform</span>
          </div>

          <div className="desktop-nav" style={{ display: 'flex', gap: '40px', alignItems: 'center' }}>
            {['About', 'Docs', 'Support'].map(link => (
              <a key={link} href={`#${link.toLowerCase()}`} style={{ fontSize: '14px', color: '#a1a1aa', textDecoration: 'none', fontWeight: '500', transition: 'color 0.2s' }} className="nav-link-hover">
                {link}
              </a>
            ))}
          </div>

          <div className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <button onClick={() => handleNav('login')} style={{ background: 'transparent', border: 'none', fontSize: '14px', color: '#fff', textDecoration: 'none', fontWeight: '600', cursor: 'pointer' }} className="nav-link-hover">
              Log in
            </button>
            <button onClick={() => handleNav('signup')} style={{ background: '#fff', color: '#000', border: 'none', padding: '10px 24px', borderRadius: '100px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', transition: 'transform 0.2s' }} className="btn-scale">
              Get Started
            </button>
          </div>

          <button className="mobile-nav-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      <main style={{ position: 'relative', zIndex: 1, maxWidth: '1400px', margin: '0 auto', padding: '160px 5vw 120px 5vw', display: 'flex', flexDirection: 'column' }}>
        <div style={{ maxWidth: '600px', paddingTop: '80px', animation: 'fadeInUp 0.8s ease-out backwards' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px' }}>
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '4px', borderRadius: '4px' }}>
              <Command size={12} color="#a1a1aa" />
            </div>
            <span style={{ fontSize: '13px', color: '#e4e4e7', fontFamily: sans, fontWeight: '500' }}>
              Command Engine is live now. <span onClick={() => handleNav('signup')} style={{ color: '#a1a1aa', textDecoration: 'underline', cursor: 'pointer' }} className="nav-link-hover">Try the first intelligence agent.</span>
            </span>
          </div>

          <h1 style={{ fontSize: 'clamp(48px, 6vw, 72px)', fontWeight: '800', lineHeight: '1.05', letterSpacing: '-0.04em', marginBottom: '24px', color: '#fff' }}>
            Business intelligence in real-time.
          </h1>

          <p style={{ fontSize: 'clamp(16px, 2vw, 18px)', color: '#a1a1aa', lineHeight: '1.6', marginBottom: '48px', fontWeight: '400', maxWidth: '500px' }}>
            The most powerful serverless platform for tracking physical cash velocity and mapping supply chain liquidity. Build. Deploy. Scale.
          </p>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => handleNav('signup')} style={{ background: '#fff', color: '#000', border: 'none', padding: '14px 28px', borderRadius: '100px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'transform 0.2s' }} className="btn-scale">
              <Command size={16} /> Get Started
            </button>
            <button style={{ background: '#000', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '14px 28px', borderRadius: '100px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }} className="btn-outline">
              Explore docs
            </button>
          </div>
        </div>
      </main>

      <section id="about" style={{ position: 'relative', zIndex: 1, background: '#000', borderTop: '1px solid rgba(255,255,255,0.08)', padding: '120px 5vw' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ marginBottom: '80px', maxWidth: '600px' }}>
            <h3 style={{ fontSize: '40px', fontWeight: '800', color: '#fff', letterSpacing: '-0.03em', margin: '0 0 16px 0', lineHeight: 1.1 }}>Not just a dashboard.<br/>An autonomous brain.</h3>
            <p style={{ fontSize: '16px', color: '#a1a1aa', lineHeight: '1.6' }}>The platform pulls live signals from your infrastructure to map exact liquidity flow, predict demand surges, and execute commands.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
            <div className="feature-block">
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '24px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <Activity size={20} />
              </div>
              <h4 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', marginBottom: '12px', letterSpacing: '-0.5px' }}>Real-Time Telemetry</h4>
              <p style={{ fontSize: '14px', color: '#a1a1aa', lineHeight: '1.6' }}>The engine pulls live signals from POS terminals, dispatch riders, and digital transfers to map exact liquidity flow per minute.</p>
            </div>
            
            <div className="feature-block">
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(2, 51, 27, 0.4)', color: '#00e676', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '24px', border: '1px solid rgba(4, 92, 50, 0.5)' }}>
                <TrendingUp size={20} />
              </div>
              <h4 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', marginBottom: '12px', letterSpacing: '-0.5px' }}>Predictive Surge Analysis</h4>
              <p style={{ fontSize: '14px', color: '#a1a1aa', lineHeight: '1.6' }}>By mapping historical matrices against live friction points, the AI predicts demand spikes before your inventory burns out.</p>
            </div>
            
            <div className="feature-block">
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '24px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <ShieldCheck size={20} />
              </div>
              <h4 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', marginBottom: '12px', letterSpacing: '-0.5px' }}>Execution Protocol</h4>
              <p style={{ fontSize: '14px', color: '#a1a1aa', lineHeight: '1.6' }}>The AI synthesizes raw data into a Master Action Plan, telling you exactly where to reroute fleets or adjust pricing.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="velocity" style={{ position: 'relative', zIndex: 1, padding: '120px 5vw', background: '#050505', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px', alignItems: 'center' }} className="grid-split">
          
          <div>
            <h3 style={{ fontSize: '40px', fontWeight: '800', color: '#fff', letterSpacing: '-0.03em', margin: '0 0 24px 0', lineHeight: 1.1 }}>See exactly where<br/>the money is moving.</h3>
            <p style={{ fontSize: '16px', color: '#a1a1aa', lineHeight: '1.6', marginBottom: '32px' }}>
              Stop guessing where your capital is locked. The Cash Velocity matrix maps highest density zones, tracks modality splits (Cash vs. Digital), and calculates average transaction values in real-time.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {['Spot liquidity vortexes instantly', 'Monitor live digital conversion rates', 'Deploy capital to the most profitable sectors'].map((item, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '15px', color: '#e4e4e7', fontWeight: '500' }}>
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Check size={10} strokeWidth={3} /></div>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div style={{ background: '#000', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', padding: '32px', boxShadow: '0 40px 100px rgba(0,0,0,0.8), inset 0 1px 1px rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '14px', fontWeight: '600' }}><Globe size={16} /> Cash velocity heatmap</div>
              <div style={{ border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '4px 10px', borderRadius: '16px', fontSize: '11px', fontFamily: mono, fontWeight: '700' }}>LIVE</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                { n: 'Central Wholesale', v: '$428K/hr', bg: 'rgba(2, 51, 27, 0.6)', b: 'rgba(4, 92, 50, 0.8)', c: '#fff' },
                { n: 'Retail Alley', v: '$142K/hr', bg: 'rgba(2, 51, 27, 0.3)', b: 'rgba(4, 92, 50, 0.4)', c: '#fff' },
                { n: 'Transit Hub', v: '$281K/hr', bg: 'rgba(2, 51, 27, 0.4)', b: 'rgba(4, 92, 50, 0.5)', c: '#fff' },
                { n: 'North Gate', v: '$54K/hr', bg: 'rgba(255,255,255,0.03)', b: 'rgba(255,255,255,0.05)', c: '#a1a1aa' },
              ].map((z, i) => (
                <div key={i} style={{ background: z.bg, padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px', border: `1px solid ${z.b}` }}>
                  <span style={{ fontSize: '12px', color: z.c, fontWeight: '600' }}>{z.n}</span>
                  <span style={{ fontSize: '16px', color: '#fff', fontFamily: mono, fontWeight: '800' }}>{z.v}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      <section id="docs" style={{ position: 'relative', zIndex: 1, background: '#000', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '120px 5vw' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
          <h3 style={{ fontSize: '40px', fontWeight: '800', color: '#fff', letterSpacing: '-0.03em', marginBottom: '24px' }}>Pipe intelligence directly into your ERP.</h3>
          <p style={{ fontSize: '16px', color: '#a1a1aa', lineHeight: '1.6', marginBottom: '48px', maxWidth: '600px', margin: '0 auto 48px auto' }}>
            Build custom supply chain routing algorithms or financial triggers using our robust, sub-50ms REST API and live Webhook architecture.
          </p>

          <div style={{ background: '#050505', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '32px', fontFamily: mono, fontSize: '14px', lineHeight: '1.8', textAlign: 'left', maxWidth: '700px', margin: '0 auto' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
            </div>
            <div style={{ color: '#71717a', marginBottom: '8px' }}>// Listen for predictive demand surges via Webhook</div>
            <div style={{ color: '#e4e4e7' }}>engine.on(<span style={{ color: '#fff' }}>'surge_detected'</span>, (data) =&gt; {'{'}</div>
            <div style={{ color: '#e4e4e7', paddingLeft: '20px' }}>
              console.log(<span style={{ color: '#fff' }}>`Surge at {"${data.zone}"}: {"${data.intensity}"}`</span>);
            </div>
            <div style={{ color: '#e4e4e7', paddingLeft: '20px' }}>
              <span style={{ color: '#71717a' }}>// Automatically trigger SAP inventory transfer</span>
            </div>
            <div style={{ color: '#e4e4e7', paddingLeft: '20px' }}>erp.executeTransfer(data.recommendedAction);</div>
            <div style={{ color: '#e4e4e7' }}>{'});'}</div>
          </div>
        </div>
      </section>

      <section id="support" style={{ position: 'relative', zIndex: 1, padding: '120px 5vw', background: '#050505' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h3 style={{ fontSize: '40px', fontWeight: '800', color: '#fff', letterSpacing: '-0.03em', marginBottom: '16px' }}>Support & FAQ</h3>
            <p style={{ fontSize: '16px', color: '#a1a1aa' }}>Everything you need to know about the Intelligence Engine.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {faqs.map((faq, i) => (
              <div 
                key={i} 
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{ background: '#000', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px', cursor: 'pointer', transition: 'all 0.3s' }}
                className="faq-block"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#fff', margin: 0 }}>{faq.q}</h4>
                  <ChevronDown size={20} color="#71717a" style={{ transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.3s' }} />
                </div>
                {openFaq === i && (
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '15px', color: '#a1a1aa', lineHeight: '1.6' }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.1)', background: '#000', padding: '64px 5vw', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '48px' }}>
          <div className="grid-split" style={{ gap: '64px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{ width: '24px', height: '24px', border: '1px solid #fff', borderRadius: '6px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff' }}>
                  <Command size={14} strokeWidth={2.5} />
                </div>
                <span style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '-0.5px' }}>Platform</span>
              </div>
              <p style={{ fontSize: '14px', color: '#71717a', maxWidth: '300px', lineHeight: '1.6' }}>
                The most powerful serverless platform for building business intelligence agents.
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '64px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <span style={{ fontSize: '12px', color: '#fff', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Platform</span>
                {['Dashboard', 'API Keys', 'Webhooks', 'Compute Billing'].map(link => <a key={link} href="#" style={{ fontSize: '14px', color: '#a1a1aa', textDecoration: 'none' }} className="nav-link-hover">{link}</a>)}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <span style={{ fontSize: '12px', color: '#fff', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Resources</span>
                {['Documentation', 'API Reference', 'Case Studies', 'Support'].map(link => <a key={link} href="#" style={{ fontSize: '14px', color: '#a1a1aa', textDecoration: 'none' }} className="nav-link-hover">{link}</a>)}
              </div>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes pulseSlow { 0% { opacity: 0.5; filter: blur(8px); transform: scale(0.95); } 100% { opacity: 0.9; filter: blur(12px); transform: scale(1.05); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); filter: blur(4px); } to { opacity: 1; transform: translateY(0); filter: blur(0); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }

        .nav-link-hover:hover { color: #fff !important; text-shadow: 0 0 10px rgba(255,255,255,0.3); }
        .btn-scale:hover { transform: scale(1.03); }
        .btn-outline:hover { background: rgba(255,255,255,0.05) !important; border-color: rgba(255,255,255,0.3) !important; }
        
        .feature-block { padding: 32px; border-radius: 20px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); transition: all 0.3s; cursor: default; }
        .feature-block:hover { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.1); transform: translateY(-4px); }

        .faq-block:hover { background: rgba(255,255,255,0.03) !important; border-color: rgba(255,255,255,0.15) !important; }

        .grid-split { display: grid; grid-template-columns: 1fr 1fr; }
        .mobile-nav-toggle { display: none; }

        @media (max-width: 900px) { .grid-split { grid-template-columns: 1fr !important; } }
        @media (max-width: 768px) { .desktop-nav { display: none !important; } .mobile-nav-toggle { display: block; } }

        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.4); }
      `}</style>
    </div>
  );
}
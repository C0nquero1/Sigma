import React, { useState } from 'react';
import { Command, Mail, Lock, Building, ArrowRight } from 'lucide-react';

const sans = "'SF Pro Display', 'Inter', 'Geist', -apple-system, BlinkMacSystemFont, sans-serif";
const mono = "'JetBrains Mono', 'Geist Mono', 'Fira Code', ui-monospace, monospace";

const AuthGrid = () => (
  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
    <div style={{ width: '100%', height: '100%', display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gridAutoRows: '100px', borderLeft: '1px solid rgba(255,255,255,0.04)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
      {[...Array(64)].map((_, i) => (
        <div key={i} style={{ borderRight: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)', position: 'relative' }}>
          {(i === 11 || i === 20 || i === 36) && (
             <div style={{ position: 'absolute', inset: '1px', background: 'linear-gradient(135deg, rgba(2, 51, 27, 0.4), transparent)', opacity: 0.6, filter: 'blur(4px)' }} />
          )}
        </div>
      ))}
    </div>
  </div>
);

export default function AuthPage({ initialMode = 'login', onNavigate }) {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');

  return (
    <div style={{ background: '#000000', minHeight: '100vh', color: '#fff', fontFamily: sans, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
      <AuthGrid />
      
      {/* Back to Home Logo */}
      <button onClick={() => onNavigate('landing')} style={{ position: 'absolute', top: '40px', left: '5vw', display: 'flex', alignItems: 'center', gap: '12px', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', zIndex: 10 }}>
        <div style={{ width: '28px', height: '28px', border: '1px solid #fff', borderRadius: '6px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Command size={14} strokeWidth={2.5} />
        </div>
        <span style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '-0.5px' }}>Platform</span>
      </button>

      {/* Auth Card */}
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '440px', background: 'rgba(10,10,12,0.8)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '40px', boxShadow: '0 40px 80px rgba(0,0,0,0.8), inset 0 1px 1px rgba(255,255,255,0.05)', animation: 'fadeInUp 0.6s ease-out' }}>
        
        <h2 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px', marginBottom: '8px', color: '#fff', textAlign: 'center' }}>
          {isLogin ? 'Welcome back' : 'Create your account'}
        </h2>
        <p style={{ fontSize: '14px', color: '#a1a1aa', textAlign: 'center', marginBottom: '32px' }}>
          {isLogin ? 'Enter your details to access the dashboard.' : 'Start building intelligence in one line of code.'}
        </p>

        {/* SSO Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
          <button className="auth-btn-secondary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continue with Google
          </button>
          
          <button className="auth-btn-secondary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z"/>
            </svg>
            Continue with GitHub
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
          <span style={{ fontSize: '12px', color: '#71717a', fontFamily: mono, textTransform: 'uppercase' }}>Or continue with email</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
        </div>

        {/* Auth Form */}
        <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} onSubmit={(e) => { e.preventDefault(); onNavigate('platform'); }}>
          {!isLogin && (
            <div className="input-group">
              <Building size={16} color="#71717a" className="input-icon" />
              <input type="text" placeholder="Workspace Name" className="auth-input" />
            </div>
          )}
          <div className="input-group">
            <Mail size={16} color="#71717a" className="input-icon" />
            <input type="email" placeholder="Work Email" className="auth-input" />
          </div>
          <div className="input-group">
            <Lock size={16} color="#71717a" className="input-icon" />
            <input type="password" placeholder="Password" className="auth-input" />
          </div>
          
          <button type="submit" className="auth-btn-primary" style={{ marginTop: '16px' }}>
            {isLogin ? 'Log in to Platform' : 'Create Account'} <ArrowRight size={16} />
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '32px', fontSize: '13px', color: '#a1a1aa' }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span onClick={() => setIsLogin(!isLogin)} style={{ color: '#fff', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' }}>
            {isLogin ? 'Sign up' : 'Log in'}
          </span>
        </div>

      </div>

      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); filter: blur(4px); } to { opacity: 1; transform: translateY(0); filter: blur(0); } }
        
        .auth-btn-secondary {
          width: 100%; background: transparent; border: 1px solid rgba(255,255,255,0.15); color: #fff;
          padding: 12px; border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer;
          display: flex; justify-content: center; align-items: center; gap: 10px; transition: all 0.2s;
        }
        .auth-btn-secondary:hover { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.3); }

        .input-group { position: relative; width: 100%; }
        .input-icon { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); pointer-events: none; transition: color 0.2s; }
        
        .auth-input {
          width: 100%; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); color: #fff;
          padding: 14px 16px 14px 44px; border-radius: 12px; font-size: 14px; outline: none; transition: all 0.2s;
          box-sizing: border-box;
        }
        .auth-input:focus { border-color: #fff; background: rgba(255,255,255,0.05); }
        .auth-input:focus + .input-icon { color: #fff; }

        .auth-btn-primary {
          width: 100%; background: #fff; color: #000; border: none; padding: 14px; border-radius: 12px;
          font-size: 15px; font-weight: 700; cursor: pointer; display: flex; justify-content: center;
          align-items: center; gap: 8px; transition: transform 0.2s;
        }
        .auth-btn-primary:hover { transform: scale(1.02); }
      `}</style>
    </div>
  );
}
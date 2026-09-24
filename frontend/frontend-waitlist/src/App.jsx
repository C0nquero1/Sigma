import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function TerminalWaitlist() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); 
  const [timeLeft, setTimeLeft] = useState({ days: 20, hours: 0, minutes: 0, seconds: 0 });

  // 20-Day Countdown Logic (Target: Oct 12, 2026)
  useEffect(() => {
    const targetDate = new Date("2026-10-12T00:00:00Z").getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (time) => time.toString().padStart(2, '0');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setStatus('error');
      return;
    }

    setStatus('loading');

    try {
      const { error } = await supabase
        .from('waitlist')
        .insert([{ email: email.trim().toLowerCase() }]);

      if (error && error.code !== '23505') throw error;
      setStatus('success');
      setEmail('');
    } catch (err) {
      console.error('Database connection failed:', err);
      setStatus('error');
    }
  };

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      backgroundColor: '#050508',
      color: '#ffffff',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      
      {/* Background Stars */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.03) 1px, transparent 1px), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.03) 1px, transparent 1px), radial-gradient(circle at 40% 80%, rgba(255,255,255,0.02) 1px, transparent 1px)',
        backgroundSize: '100px 100px',
        zIndex: 0
      }} />

      {/* Planetary Horizon Glow */}
      <div style={{
        position: 'absolute',
        top: '75%',
        left: '-50%',
        width: '200%',
        height: '100%',
        background: 'radial-gradient(ellipse at top, #162235 0%, #050508 60%)',
        borderRadius: '50%',
        borderTop: '1px solid rgba(255, 255, 255, 0.15)',
        boxShadow: '0 -20px 80px rgba(150, 200, 255, 0.15)',
        zIndex: 1
      }} />

      {/* Content Container */}
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', maxWidth: '600px', padding: '0 24px', marginTop: '-10vh' }}>
        
        {/* Pill Badge */}
        <div style={{
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '100px',
          padding: '6px 16px',
          fontSize: '11px',
          letterSpacing: '0.05em',
          color: 'rgba(255,255,255,0.7)',
          marginBottom: '32px',
          background: 'rgba(255,255,255,0.03)',
          backdropFilter: 'blur(10px)'
        }}>
          SIGMA TELEMETRY SUITE
        </div>

        {/* Hero Copy */}
        <h1 style={{ 
          fontSize: '52px', 
          fontWeight: '500', 
          letterSpacing: '-0.02em', 
          marginBottom: '16px', 
          lineHeight: '1.1' 
        }}>
          Mapping the <br />
          <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontWeight: '400' }}>
            Invisible Architecture.
          </span>
        </h1>
        
        <p style={{ 
          fontSize: '15px', 
          color: 'rgba(255,255,255,0.6)', 
          marginBottom: '48px', 
          lineHeight: '1.6',
          maxWidth: '400px'
        }}>
          Revealing the hidden structural reality of the $10 trillion informal economy through chaotic systems modeling.
        </p>

        {/* Input Form */}
        {status === 'success' ? (
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '16px 32px',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '14px',
            fontWeight: '500',
            letterSpacing: '0.02em',
            width: '100%',
            maxWidth: '380px'
          }}>
            You've been added to the waitlist.
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '380px' }}>
            <div style={{ 
              display: 'flex', 
              background: 'rgba(255,255,255,0.03)', 
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '4px',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.4)'
            }}>
              <input
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status === 'loading'}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  color: '#ffffff',
                  padding: '12px 16px',
                  fontSize: '14px',
                  fontFamily: 'inherit'
                }}
              />
              <button
                type="submit"
                disabled={status === 'loading' || !email}
                style={{
                  background: '#ffffff',
                  color: '#000000',
                  border: 'none',
                  padding: '0 24px',
                  borderRadius: '6px',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: email ? 'pointer' : 'default',
                  transition: 'opacity 0.2s',
                  opacity: (!email || status === 'loading') ? 0.8 : 1
                }}
              >
                {status === 'loading' ? 'Joining...' : 'Get Notified'}
              </button>
            </div>
            
            {status === 'error' && (
              <div style={{ color: '#ff6b6b', fontSize: '12px', marginTop: '12px', opacity: 0.8 }}>
                Connection failed. Please try again.
              </div>
            )}
          </form>
        )}

        {/* Anticipation & Countdown Section */}
        <div style={{ marginTop: '64px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          
          <p style={{
            fontSize: '13px',
            color: 'rgba(255,255,255,0.4)',
            marginBottom: '24px',
            lineHeight: '1.6',
            maxWidth: '380px',
            textAlign: 'center',
            letterSpacing: '0.02em'
          }}>
            The first satellite inference engine for the informal economy goes live soon. Secure your coordinate before the spatial dashboard unlocks.
          </p>

          {/* Live Timer */}
          <div style={{ display: 'flex', gap: '12px' }}>
            {Object.entries(timeLeft).map(([unit, value]) => (
              <div key={unit} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '6px',
                  padding: '12px 0',
                  fontSize: '22px',
                  fontWeight: '300',
                  fontFamily: 'monospace',
                  color: '#fff',
                  backdropFilter: 'blur(10px)',
                  width: '64px',
                  textAlign: 'center'
                }}>
                  {formatTime(value)}
                </div>
                <span style={{ 
                  fontSize: '9px', 
                  textTransform: 'uppercase', 
                  color: 'rgba(255,255,255,0.3)', 
                  marginTop: '8px', 
                  letterSpacing: '0.1em' 
                }}>
                  {unit}
                </span>
              </div>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
}
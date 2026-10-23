import { useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFillDemo = () => {
    setEmail('fleetuser@gmail.com');
    setPassword('Demo12345');
    setError(null);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) setError(err.message === 'Invalid login credentials' ? 'Email or password is incorrect.' : err.message);
    setBusy(false);
  };

  return (
    <div className="login" style={{ display: 'flex', minHeight: '100vh', background: '#0b131b', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Dynamic Animated Inline CSS */}
      <style>{`
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.3; stroke-dashoffset: 0; }
          50% { opacity: 0.8; stroke-dashoffset: -40; }
        }
        @keyframes line-flow {
          to { stroke-dashoffset: -120; }
        }
        @keyframes ping-radar {
          0% { transform: scale(1); opacity: 1; }
          75%, 100% { transform: scale(2.8); opacity: 0; }
        }
        .route-glow-anim {
          animation: pulse-glow 3s ease-in-out infinite;
        }
        .route-line-anim {
          stroke-dasharray: 8, 8;
          animation: line-flow 4s linear infinite;
        }
        .radar-ping {
          transform-origin: 540px 90px;
          animation: ping-radar 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}</style>

      {/* Left Hero Panel with Animated Map Graphics */}
      <section className="login-hero" style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '48px', background: 'radial-gradient(circle at 30% 40%, #132a3e 0%, #0b131b 80%)' }} aria-hidden="true">
        
        {/* Animated Background Route & Grid */}
        <svg viewBox="0 0 600 700" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.75 }}>
          <g fill="none" stroke="#38bdf8" strokeOpacity=".08" strokeWidth="1">
            {Array.from({ length: 14 }, (_, i) => <path key={i} d={`M0 ${i * 52} L600 ${i * 52 - 40}`} />)}
            {Array.from({ length: 12 }, (_, i) => <path key={`v${i}`} d={`M${i * 56} 0 L${i * 56 + 30} 700`} />)}
          </g>

          {/* Animated Route Glow Casing */}
          <path className="route-glow-anim" d="M60 580 C 140 470, 120 400, 220 360 S 330 300, 360 220 S 470 140, 540 90" stroke="#3ddc97" strokeWidth="6" fill="none" style={{ filter: 'blur(8px)' }} />
          
          {/* Animated Moving Route Line */}
          <path className="route-line-anim" d="M60 580 C 140 470, 120 400, 220 360 S 330 300, 360 220 S 470 140, 540 90" stroke="#3ddc97" strokeWidth="3" fill="none" />
          
          {/* Start Point */}
          <circle cx="60" cy="580" r="7" fill="#ffffff" />
          
          {/* End Destination Radar Wave Animation */}
          <circle className="radar-ping" cx="540" cy="90" r="10" fill="rgba(61, 220, 151, 0.4)" />
          <circle cx="540" cy="90" r="9" fill="#3ddc97" style={{ filter: 'drop-shadow(0 0 10px #3ddc97)' }} />
        </svg>

        <div className="login-hero-copy" style={{ position: 'relative', zIndex: 2, maxWidth: '440px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '20px', background: 'rgba(61, 220, 151, 0.1)', border: '1px solid rgba(61, 220, 151, 0.25)', color: '#3ddc97', fontSize: '13px', fontWeight: 600, marginBottom: '20px', backdropFilter: 'blur(4px)' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3ddc97', boxShadow: '0 0 8px #3ddc97' }}></span>
            Real-time Fleet Intelligence
          </div>
          
          <h1 style={{ fontSize: '44px', fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 16px 0', background: 'linear-gradient(135deg, #ffffff 0%, #94a3b8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Fleetwatch
          </h1>
          
          <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#94a3b8', margin: 0 }}>
            Know where every vehicle is, monitor real-time routes, and keep your logistics seamless.
          </p>
        </div>
      </section>

      {/* Right Login Card */}
      <section className="login-form-wrap" style={{ width: '100%', maxWidth: '480px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', background: '#0f1722', borderLeft: '1px solid rgba(255, 255, 255, 0.05)' }}>
        <div style={{ width: '100%', maxWidth: '380px' }}>
          <form className="login-form" onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h2 style={{ fontSize: '26px', fontWeight: 700, margin: '0 0 6px 0', color: '#ffffff' }}>Welcome back</h2>
              <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>Enter your credentials to access operations.</p>
            </div>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', fontWeight: 500, color: '#cbd5e1' }}>
              Work email
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', background: '#1e293b', border: '1px solid #334155', color: '#ffffff', fontSize: '14px', outline: 'none' }}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', fontWeight: 500, color: '#cbd5e1' }}>
              Password
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', background: '#1e293b', border: '1px solid #334155', color: '#ffffff', fontSize: '14px', outline: 'none' }}
              />
            </label>

            {error && (
              <p className="form-error" role="alert" style={{ margin: 0, padding: '10px 14px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171', fontSize: '13px' }}>
                {error}
              </p>
            )}

            <button
              className="btn-primary"
              type="submit"
              disabled={busy}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                background: '#2563eb',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '14px',
                border: 'none',
                cursor: busy ? 'not-allowed' : 'pointer',
                opacity: busy ? 0.7 : 1,
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                transition: 'all 0.2s'
              }}
            >
              {busy ? 'Signing in…' : 'Sign in to Dashboard'}
            </button>
          </form>

          {/* Quick Demo Access Card */}
          <div style={{ marginTop: '32px', padding: '18px', borderRadius: '12px', background: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(8px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#38bdf8' }}>Demo Access</span>
              <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8' }}>Quick Fill</span>
            </div>

            <div style={{ display: 'grid', gap: '6px', fontSize: '13px', color: '#94a3b8', marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Email:</span>
                <code style={{ color: '#f1f5f9', background: '#0f172a', padding: '2px 6px', borderRadius: '4px' }}>fleetuser@gmail.com</code>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Password:</span>
                <code style={{ color: '#f1f5f9', background: '#0f172a', padding: '2px 6px', borderRadius: '4px' }}>Demo12345</code>
              </div>
            </div>

            <button
              type="button"
              onClick={handleFillDemo}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              ⚡ Auto-fill Demo Credentials
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
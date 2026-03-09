import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { Github, Mail, Lock, ArrowRight } from 'lucide-react';

export default function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) setError(error.message);
        else navigate('/dashboard');
        setLoading(false);
    };

    const handleOAuth = async (provider: 'google' | 'github') => {
        const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: window.location.origin + '/dashboard' } });
        if (error) setError(error.message);
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', background: '#020617' }}>
            {/* Left panel — branding */}
            <div className="auth-branding" style={{ flex: '0 0 45%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '64px 56px', position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #0B1120 0%, #020617 100%)' }}>
                <div style={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,92,255,0.08), transparent 70%)', pointerEvents: 'none' }} />
                <div style={{ position: 'relative', zIndex: 10 }}>
                    <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, color: 'white', background: 'linear-gradient(135deg, #7C5CFF, #5234cc)' }}>G</div>
                        <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.03em', color: '#f1f5f9' }}>GradeForge</span>
                    </Link>
                    <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.2, marginBottom: 16, color: '#f1f5f9' }}>
                        Welcome back.
                    </h1>
                    <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.7, maxWidth: 360 }}>
                        Pick up where you left off. Your grades, study partners, and materials are all waiting.
                    </p>
                    <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {[
                            { stat: '50+', label: 'Universities' },
                            { stat: '5,200+', label: 'Students' },
                            { stat: '99.9%', label: 'Uptime' },
                        ].map(s => (
                            <div key={s.label} style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                                <span style={{ fontSize: 20, fontWeight: 800, color: '#7C5CFF' }}>{s.stat}</span>
                                <span style={{ fontSize: 13, color: '#475569' }}>{s.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right panel — form */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
                <div className="auth-card gradient-border-top animate-scaleIn" style={{ width: '100%', maxWidth: 400, background: 'rgba(11,17,32,0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '36px 32px' }}>
                    <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 6 }}>Sign in</h2>
                    <p style={{ color: '#64748b', marginBottom: 28, fontSize: 14 }}>Enter your credentials to continue</p>

                    {error && (
                        <div style={{ fontSize: 13, padding: '10px 14px', borderRadius: 10, marginBottom: 20, border: '1px solid rgba(255,77,157,0.15)', background: 'rgba(255,77,157,0.06)', color: '#FF4D9D' }}>
                            {error}
                        </div>
                    )}

                    {/* OAuth first — reduce friction */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                        <button onClick={() => handleOAuth('google')} className="oauth-btn">
                            <svg viewBox="0 0 24 24" width="16" height="16"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                            Continue with Google
                        </button>
                        <button onClick={() => handleOAuth('github')} className="oauth-btn">
                            <Github size={16} /> Continue with GitHub
                        </button>
                    </div>

                    {/* Divider */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                        <span style={{ color: '#334155', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>or</span>
                        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                    </div>

                    <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>Email</label>
                            <div style={{ position: 'relative' }}>
                                <Mail style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#334155', pointerEvents: 'none' }} size={16} />
                                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-glass" style={{ paddingLeft: 40 }} placeholder="you@university.edu" required />
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>Password</label>
                            <div style={{ position: 'relative' }}>
                                <Lock style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#334155', pointerEvents: 'none' }} size={16} />
                                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-glass" style={{ paddingLeft: 40 }} placeholder="••••••••" required />
                            </div>
                        </div>
                        <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '12px 0', marginTop: 4, borderRadius: 10 }}>
                            {loading ? 'Signing in...' : 'Sign in'} {!loading && <ArrowRight size={14} />}
                        </button>
                    </form>

                    <p style={{ textAlign: 'center', color: '#475569', marginTop: 24, fontSize: 13 }}>
                        New here? <Link to="/signup" style={{ color: '#7C5CFF', fontWeight: 600 }}>Create an account</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

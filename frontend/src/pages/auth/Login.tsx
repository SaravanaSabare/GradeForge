import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { ArrowLeft, Github, Mail, Lock } from 'lucide-react';

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
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', background: 'linear-gradient(180deg, #020617, #0B1120)' }}>
            <div className="bg-grid-pattern" style={{ position: 'fixed', inset: 0, opacity: 0.3, pointerEvents: 'none' }} />
            <div className="glow-orb primary" style={{ width: 500, height: 500, top: '30%', left: '50%', transform: 'translate(-50%, -50%)' }} />

            <div className="glass-panel" style={{ width: '100%', maxWidth: 440, padding: 40, position: 'relative', zIndex: 10, overflow: 'hidden' }}>
                {/* Top accent */}
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 2, background: 'linear-gradient(90deg, #7C5CFF, #00E5FF)' }} />

                <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#64748b', marginBottom: 32, fontSize: 13, transition: 'color 0.2s' }}>
                    <ArrowLeft size={15} /> Back
                </Link>

                <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 8 }}>Welcome Back</h2>
                <p style={{ color: '#94a3b8', marginBottom: 32, fontSize: 14 }}>Sign in to continue to GradeForge.</p>

                {error && (
                    <div style={{ fontSize: 13, padding: 14, borderRadius: 12, marginBottom: 24, border: '1px solid rgba(255,77,157,0.2)', background: 'rgba(255,77,157,0.08)', color: '#FF4D9D' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 8 }}>Email</label>
                        <div style={{ position: 'relative' }}>
                            <Mail style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#475569', pointerEvents: 'none' }} size={17} />
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-glass" style={{ paddingLeft: 44 }} placeholder="name@university.edu" required />
                        </div>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 8 }}>Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#475569', pointerEvents: 'none' }} size={17} />
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-glass" style={{ paddingLeft: 44 }} placeholder="••••••••" required />
                        </div>
                    </div>
                    <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '14px 0', marginTop: 4 }}>
                        {loading ? 'Authenticating...' : 'Sign In'}
                    </button>
                </form>

                {/* Divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '28px 0' }}>
                    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                    <span style={{ color: '#475569', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5 }}>or</span>
                    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                </div>

                {/* OAuth Buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <button onClick={() => handleOAuth('google')} className="btn btn-secondary" style={{ padding: '12px 0', width: '100%', fontSize: 13 }}>
                        <svg viewBox="0 0 24 24" width="16" height="16"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                        Google
                    </button>
                    <button onClick={() => handleOAuth('github')} className="btn btn-secondary" style={{ padding: '12px 0', width: '100%', fontSize: 13 }}>
                        <Github size={16} /> GitHub
                    </button>
                </div>

                <p style={{ textAlign: 'center', color: '#64748b', marginTop: 28, fontSize: 13 }}>
                    Don't have an account?{' '}
                    <Link to="/signup" style={{ color: 'white', fontWeight: 500, transition: 'color 0.2s' }}>Sign up</Link>
                </p>
            </div>
        </div>
    );
}

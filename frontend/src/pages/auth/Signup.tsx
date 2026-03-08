import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { Mail, Lock, User as UserIcon, Building2, Book, Calendar, Github, ArrowRight } from 'lucide-react';

interface University { id: string; name: string; }
interface Department { id: string; name: string; }

export default function Signup() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [universityId, setUniversityId] = useState('');
    const [departmentId, setDepartmentId] = useState('');
    const [year, setYear] = useState('1');
    const [universities, setUniversities] = useState<University[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);

    useEffect(() => { supabase.from('universities').select('id, name').order('name').then(({ data }) => { if (data) setUniversities(data); }); }, []);
    useEffect(() => {
        if (!universityId) { setDepartments([]); return; }
        supabase.from('departments').select('id, name').eq('university_id', universityId).order('name').then(({ data }) => { if (data) { setDepartments(data); setDepartmentId(data.length > 0 ? data[0].id : ''); } });
    }, [universityId]);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault(); setLoading(true); setError(null);
        const { error: authError } = await supabase.auth.signUp({ email, password, options: { data: { name, university_id: universityId, department_id: departmentId, year: parseInt(year) } } });
        if (authError) { setError(authError.message); setLoading(false); } else navigate('/dashboard');
    };

    const handleOAuth = async (provider: 'google' | 'github') => {
        const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: window.location.origin + '/complete-profile' } });
        if (error) setError(error.message);
    };

    const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 6 };
    const iconStyle: React.CSSProperties = { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#334155', pointerEvents: 'none' };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', background: '#020617' }}>
            {/* Left branding */}
            <div className="auth-branding" style={{ flex: '0 0 45%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '64px 56px', position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #0B1120 0%, #020617 100%)' }}>
                <div style={{ position: 'absolute', bottom: -100, left: -100, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,229,255,0.06), transparent 70%)', pointerEvents: 'none' }} />
                <div style={{ position: 'relative', zIndex: 10 }}>
                    <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, color: 'white', background: 'linear-gradient(135deg, #7C5CFF, #5234cc)' }}>G</div>
                        <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.03em', color: '#f1f5f9' }}>GradeForge</span>
                    </Link>
                    <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.2, marginBottom: 16, color: '#f1f5f9' }}>
                        Join the community.
                    </h1>
                    <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.7, maxWidth: 360 }}>
                        Set up your academic profile and instantly connect with students at your university and GPA level.
                    </p>
                    <div style={{ marginTop: 48, padding: 20, borderRadius: 12, border: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.015)' }}>
                        <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.7, fontStyle: 'italic', marginBottom: 12 }}>
                            "GradeForge saved me hours every semester. No more Excel chaos."
                        </p>
                        <p style={{ fontSize: 12, color: '#475569' }}>— 3rd Year CSE, SRM University</p>
                    </div>
                </div>
            </div>

            {/* Right form */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, overflowY: 'auto' }}>
                <div className="auth-card" style={{ width: '100%', maxWidth: 420 }}>
                    <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 6 }}>Create account</h2>
                    <p style={{ color: '#64748b', marginBottom: 24, fontSize: 14 }}>Get started in under a minute</p>

                    {error && <div style={{ fontSize: 13, padding: '10px 14px', borderRadius: 10, marginBottom: 16, border: '1px solid rgba(255,77,157,0.15)', background: 'rgba(255,77,157,0.06)', color: '#FF4D9D' }}>{error}</div>}

                    {/* OAuth */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                        <button onClick={() => handleOAuth('google')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px 0', fontSize: 13, fontWeight: 600, borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: '#e2e8f0', cursor: 'pointer' }}>
                            <svg viewBox="0 0 24 24" width="15" height="15"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                            Google
                        </button>
                        <button onClick={() => handleOAuth('github')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px 0', fontSize: 13, fontWeight: 600, borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: '#e2e8f0', cursor: 'pointer' }}>
                            <Github size={15} /> GitHub
                        </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                        <span style={{ color: '#334155', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>or</span>
                        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                    </div>

                    <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div>
                            <label style={labelStyle}>Full Name</label>
                            <div style={{ position: 'relative' }}>
                                <UserIcon style={iconStyle} size={15} />
                                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-glass" style={{ paddingLeft: 38 }} placeholder="Your name" required />
                            </div>
                        </div>
                        <div>
                            <label style={labelStyle}>Email</label>
                            <div style={{ position: 'relative' }}>
                                <Mail style={iconStyle} size={15} />
                                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-glass" style={{ paddingLeft: 38 }} placeholder="you@university.edu" required />
                            </div>
                        </div>
                        <div>
                            <label style={labelStyle}>Password</label>
                            <div style={{ position: 'relative' }}>
                                <Lock style={iconStyle} size={15} />
                                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-glass" style={{ paddingLeft: 38 }} placeholder="Min 6 characters" required minLength={6} />
                            </div>
                        </div>

                        <div style={{ height: 1, background: 'rgba(255,255,255,0.04)', margin: '2px 0' }} />

                        <div>
                            <label style={labelStyle}>University</label>
                            <div style={{ position: 'relative' }}>
                                <Building2 style={iconStyle} size={15} />
                                <select title="University" value={universityId} onChange={(e) => setUniversityId(e.target.value)} className="input-glass" style={{ paddingLeft: 38, appearance: 'none' }} required>
                                    <option value="" disabled>Select university</option>
                                    {universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="dept-year-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <div>
                                <label style={labelStyle}>Department</label>
                                <div style={{ position: 'relative' }}>
                                    <Book style={iconStyle} size={15} />
                                    <select title="Department" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className="input-glass" style={{ paddingLeft: 38, appearance: 'none', opacity: (!universityId || departments.length === 0) ? 0.4 : 1 }} required disabled={!universityId || departments.length === 0}>
                                        <option value="" disabled>Select</option>
                                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label style={labelStyle}>Year</label>
                                <div style={{ position: 'relative' }}>
                                    <Calendar style={iconStyle} size={15} />
                                    <select title="Year" value={year} onChange={(e) => setYear(e.target.value)} className="input-glass" style={{ paddingLeft: 38, appearance: 'none' }} required>
                                        {[1, 2, 3, 4, 5, 6].map(y => <option key={y} value={y}>Year {y}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '12px 0', marginTop: 4, borderRadius: 10 }}>
                            {loading ? 'Creating...' : 'Create Account'} {!loading && <ArrowRight size={14} />}
                        </button>
                    </form>

                    <p style={{ textAlign: 'center', color: '#475569', marginTop: 20, fontSize: 13 }}>
                        Already have an account? <Link to="/login" style={{ color: '#7C5CFF', fontWeight: 600 }}>Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

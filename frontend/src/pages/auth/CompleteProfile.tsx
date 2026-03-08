import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Building2, Book, Calendar } from 'lucide-react';

interface University { id: string; name: string; }
interface Department { id: string; name: string; }

export default function CompleteProfile() {
    const navigate = useNavigate();
    const { user, profile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [universityId, setUniversityId] = useState('');
    const [departmentId, setDepartmentId] = useState('');
    const [year, setYear] = useState('1');
    const [universities, setUniversities] = useState<University[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);

    useEffect(() => { if (profile?.university_id) navigate('/dashboard'); }, [profile, navigate]);
    useEffect(() => { supabase.from('universities').select('id, name').order('name').then(({ data }) => { if (data) setUniversities(data); }); }, []);
    useEffect(() => {
        if (!universityId) { setDepartments([]); return; }
        supabase.from('departments').select('id, name').eq('university_id', universityId).order('name').then(({ data }) => {
            if (data) { setDepartments(data); setDepartmentId(data.length > 0 ? data[0].id : ''); }
        });
    }, [universityId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true); setError(null);
        const { error: updateError } = await supabase.from('users').update({ university_id: universityId, department_id: departmentId, year: parseInt(year) }).eq('id', user.id);
        if (updateError) { setError(updateError.message); setLoading(false); }
        else window.location.href = '/dashboard';
    };

    const iconStyle: React.CSSProperties = { position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#475569', pointerEvents: 'none' };
    const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 8 };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', position: 'relative', background: 'linear-gradient(180deg, #020617, #0B1120)' }}>
            <div className="bg-grid-pattern" style={{ position: 'fixed', inset: 0, opacity: 0.3, pointerEvents: 'none' }} />
            <div className="glow-orb secondary" style={{ width: 600, height: 600, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />

            <div className="glass-panel" style={{ width: '100%', maxWidth: 520, padding: '40px 44px', position: 'relative', zIndex: 10, overflow: 'hidden' }}>
                <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 8 }}>Almost There!</h2>
                <p style={{ color: '#94a3b8', marginBottom: 32, fontSize: 14, lineHeight: 1.7 }}>We need a few more details to set up your academic profile since you logged in with a third-party provider.</p>

                {error && <div style={{ fontSize: 13, padding: 14, borderRadius: 12, marginBottom: 24, border: '1px solid rgba(255,77,157,0.2)', background: 'rgba(255,77,157,0.08)', color: '#FF4D9D' }}>{error}</div>}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div>
                        <label style={labelStyle}>University</label>
                        <div style={{ position: 'relative' }}>
                            <Building2 style={iconStyle} size={16} />
                            <select title="University" value={universityId} onChange={(e) => setUniversityId(e.target.value)} className="input-glass" style={{ paddingLeft: 44, appearance: 'none' }} required>
                                <option value="" disabled>Select your university</option>
                                {universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </select>
                        </div>
                        {universities.length === 0 && <p style={{ fontSize: 11, color: '#00E5FF', marginTop: 6 }}>Loading universities from Supabase...</p>}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                            <label style={labelStyle}>Department</label>
                            <div style={{ position: 'relative' }}>
                                <Book style={iconStyle} size={16} />
                                <select title="Department" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className="input-glass" style={{ paddingLeft: 44, appearance: 'none', opacity: !universityId ? 0.5 : 1 }} required disabled={!universityId || departments.length === 0}>
                                    <option value="" disabled>Select</option>
                                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label style={labelStyle}>Year of Study</label>
                            <div style={{ position: 'relative' }}>
                                <Calendar style={iconStyle} size={16} />
                                <select title="Year" value={year} onChange={(e) => setYear(e.target.value)} className="input-glass" style={{ paddingLeft: 44, appearance: 'none' }} required>
                                    {[1, 2, 3, 4, 5, 6].map(y => <option key={y} value={y}>Year {y}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '14px 0', marginTop: 8 }}>
                        {loading ? 'Saving...' : 'Complete Profile'}
                    </button>
                </form>
            </div>
        </div>
    );
}

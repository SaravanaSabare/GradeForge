import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { supabase } from '../../services/supabase';
import { TrendingUp, Award, BookOpen, Layers, ArrowRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SemesterSummary {
    semester: number;
    gpa: number;
    credits: number;
    subjectCount: number;
}

export default function DashboardOverview() {
    const { user, profile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [cgpa, setCgpa] = useState(0);
    const [totalCredits, setTotalCredits] = useState(0);
    const [semesterCount, setSemesterCount] = useState(0);
    const [subjectCount, setSubjectCount] = useState(0);
    const [semesters, setSemesters] = useState<SemesterSummary[]>([]);

    useEffect(() => {
        if (!user) return;
        const loadStats = async () => {
            setLoading(true);
            const { data } = await supabase
                .from('semester_grades')
                .select('*')
                .eq('user_id', user.id)
                .order('semester');

            if (data && data.length > 0) {
                let tc = 0, ep = 0;
                const grouped: Record<number, typeof data> = {};

                data.forEach((row: Record<string, unknown>) => {
                    const cr = Number(row.credits) || 0;
                    const gp = Number(row.grade_points) || 0;
                    tc += cr;
                    ep += cr * gp;
                    const sem = row.semester as number;
                    if (!grouped[sem]) grouped[sem] = [];
                    grouped[sem].push(row);
                });

                const semSummaries: SemesterSummary[] = Object.entries(grouped).map(([sem, rows]) => {
                    let semTc = 0, semEp = 0;
                    rows.forEach((r: Record<string, unknown>) => {
                        const cr = Number(r.credits) || 0;
                        semTc += cr;
                        semEp += cr * (Number(r.grade_points) || 0);
                    });
                    return {
                        semester: Number(sem),
                        gpa: semTc > 0 ? Number((semEp / semTc).toFixed(2)) : 0,
                        credits: semTc,
                        subjectCount: rows.length,
                    };
                }).sort((a, b) => a.semester - b.semester);

                setCgpa(tc > 0 ? Number((ep / tc).toFixed(2)) : 0);
                setTotalCredits(tc);
                setSemesterCount(Object.keys(grouped).length);
                setSubjectCount(data.length);
                setSemesters(semSummaries);
            }
            setLoading(false);
        };
        loadStats();
    }, [user]);

    const stats = [
        { label: 'Current CGPA', value: loading ? '—' : cgpa > 0 ? cgpa.toFixed(2) : '—', icon: TrendingUp, color: '#7C5CFF' },
        { label: 'Credits Earned', value: loading ? '—' : totalCredits > 0 ? String(totalCredits) : '0', icon: Award, color: '#00E5FF' },
        { label: 'Subjects', value: loading ? '—' : String(subjectCount), icon: BookOpen, color: '#FF4D9D' },
        { label: 'Semesters Saved', value: loading ? '—' : String(semesterCount), icon: Layers, color: '#64748b' },
    ];

    const gradeColor = (gpa: number) => gpa >= 8.5 ? '#00E5FF' : gpa >= 7 ? '#7C5CFF' : gpa >= 5 ? '#FBBC05' : '#FF4D9D';

    return (
        <DashboardLayout>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28, maxWidth: 1100, margin: '0 auto' }}>

                {/* Welcome Banner */}
                <div className="glass-panel" style={{ padding: 32, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, right: 0, width: 300, height: 300, borderRadius: '50%', pointerEvents: 'none', background: '#7C5CFF', filter: 'blur(120px)', opacity: 0.12 }} />
                    <div style={{ position: 'relative', zIndex: 10 }}>
                        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 8 }}>
                            Welcome back, {profile?.name?.split(' ')[0] || user?.user_metadata?.name?.split(' ')[0] || 'Scholar'}!
                        </h1>
                        <p style={{ color: '#94a3b8', marginBottom: 24, maxWidth: 600, fontSize: 14, lineHeight: 1.7 }}>
                            {profile?.departments?.name
                                ? <>Year {profile?.year} • {profile?.departments?.name} • {profile?.universities?.name}</>
                                : 'Setup your academic profile to get started.'}
                        </p>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <Link to="/dashboard/calculator" className="btn btn-primary" style={{ fontSize: 13 }}>
                                <TrendingUp size={15} /> Open Calculator <ArrowRight size={14} />
                            </Link>
                            <Link to="/dashboard/materials" className="btn btn-secondary" style={{ fontSize: 13 }}>
                                <BookOpen size={15} /> Study Materials
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                    {stats.map((s, i) => (
                        <div key={s.label} className={`glass-card card-hover-glow animate-slideUp delay-${i + 1}`} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12, position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', right: -12, top: -12, width: 56, height: 56, borderRadius: '50%', pointerEvents: 'none', background: s.color, filter: 'blur(20px)', opacity: 0.1 }} />
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, fontWeight: 500, color: '#94a3b8' }}>
                                <s.icon size={16} style={{ color: s.color }} />
                                {s.label}
                            </div>
                            <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.04em' }}>
                                {loading ? <Loader2 size={24} className="animate-spin" style={{ color: '#475569' }} /> : s.value}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bottom Row */}
                <div className="dash-bottom-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
                    {/* Semester Breakdown */}
                    <div className="glass-panel" style={{ padding: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h3 style={{ fontSize: 15, fontWeight: 600 }}>Semester Performance</h3>
                            <Link to="/dashboard/calculator" style={{ fontSize: 12, fontWeight: 500, color: '#7C5CFF' }}>Edit Grades →</Link>
                        </div>

                        {semesters.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {semesters.map(s => (
                                    <div key={s.semester} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.015)' }}>
                                        <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, background: `${gradeColor(s.gpa)}15`, color: gradeColor(s.gpa) }}>
                                            {s.semester}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                                <span style={{ fontSize: 13, fontWeight: 500 }}>Semester {s.semester}</span>
                                                <span style={{ fontSize: 14, fontWeight: 700, color: gradeColor(s.gpa) }}>{s.gpa.toFixed(2)}</span>
                                            </div>
                                            <div style={{ width: '100%', height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                                                <div style={{ height: '100%', borderRadius: 2, width: `${(s.gpa / 10) * 100}%`, background: gradeColor(s.gpa), transition: 'width 0.6s ease' }} />
                                            </div>
                                            <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 11, color: '#64748b' }}>
                                                <span>{s.subjectCount} subjects</span>
                                                <span>{s.credits} credits</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: 13, border: '2px dashed rgba(255,255,255,0.06)', borderRadius: 12, minHeight: 180, background: 'rgba(255,255,255,0.01)', flexDirection: 'column', gap: 12 }}>
                                <TrendingUp size={24} style={{ color: '#334155' }} />
                                <p>No grades saved yet.</p>
                                <Link to="/dashboard/calculator" style={{ color: '#7C5CFF', fontWeight: 500, fontSize: 12 }}>Add your first semester →</Link>
                            </div>
                        )}
                    </div>

                    {/* Quick Info */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {/* CGPA Card */}
                        <div className="glass-card" style={{ padding: 24, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                            {cgpa > 0 && <div style={{ position: 'absolute', inset: 0, background: gradeColor(cgpa), opacity: 0.04, pointerEvents: 'none' }} />}
                            <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Overall CGPA</p>
                            <div style={{
                                fontSize: 56, fontWeight: 900, letterSpacing: '-0.04em',
                                background: cgpa > 0 ? `linear-gradient(135deg, ${gradeColor(cgpa)}, #7C5CFF)` : 'linear-gradient(135deg, #334155, #475569)',
                                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                            }}>
                                {loading ? '—' : cgpa > 0 ? cgpa.toFixed(2) : '—'}
                            </div>
                            {cgpa > 0 && (
                                <div style={{ width: '100%', height: 6, borderRadius: 4, background: 'rgba(255,255,255,0.05)', overflow: 'hidden', marginTop: 16 }}>
                                    <div style={{ height: '100%', borderRadius: 4, width: `${(cgpa / 10) * 100}%`, background: `linear-gradient(90deg, ${gradeColor(cgpa)}, #7C5CFF)`, transition: 'width 0.7s ease' }} />
                                </div>
                            )}
                        </div>

                        {/* Profile Card */}
                        <div className="glass-card" style={{ padding: 20 }}>
                            <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Your Profile</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {[
                                    { label: 'University', value: profile?.universities?.name },
                                    { label: 'Department', value: profile?.departments?.name },
                                    { label: 'Year', value: profile?.year ? `Year ${profile?.year}` : null },
                                    { label: 'Email', value: user?.email },
                                ].map(({ label, value }) => (
                                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                        <span style={{ color: '#64748b' }}>{label}</span>
                                        <span style={{ fontWeight: 500, color: '#cbd5e1', maxWidth: '60%', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value || '—'}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

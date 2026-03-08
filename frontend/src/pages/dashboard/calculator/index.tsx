import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../services/supabase';
import { Calculator as CalcIcon, Save, Plus, Trash2, Target, Check, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

interface GradeRow {
    id: string;
    subject_name: string;
    subject_code: string;
    credits: number;
    grade: string;
    grade_points: number;
    isNew?: boolean;
    isModified?: boolean;
}

const GRADE_MAP: Record<string, number> = {
    'O': 10, 'A+': 9, 'A': 8, 'B+': 7, 'B': 6, 'C': 5, 'F': 0
};

export default function CGPACalculator() {
    const { user, profile } = useAuth();
    const [semester, setSemester] = useState(1);
    const [rows, setRows] = useState<GradeRow[]>([]);
    const [allSemesterData, setAllSemesterData] = useState<Record<number, GradeRow[]>>({});
    const [targetCgpa, setTargetCgpa] = useState(9.0);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // Load all grades from Supabase on mount
    useEffect(() => {
        if (!user) return;
        const loadGrades = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('semester_grades')
                .select('*')
                .eq('user_id', user.id)
                .order('semester')
                .order('created_at');

            if (!error && data) {
                const grouped: Record<number, GradeRow[]> = {};
                data.forEach((row: any) => {
                    const sem = row.semester;
                    if (!grouped[sem]) grouped[sem] = [];
                    grouped[sem].push({
                        id: row.id,
                        subject_name: row.subject_name,
                        subject_code: row.subject_code || '',
                        credits: Number(row.credits),
                        grade: row.grade,
                        grade_points: Number(row.grade_points),
                    });
                });
                setAllSemesterData(grouped);
                setRows(grouped[1] || [emptyRow()]);
            } else {
                setRows([emptyRow()]);
            }
            setLoading(false);
        };
        loadGrades();
    }, [user]);

    // When semester changes, load that semester's data
    useEffect(() => {
        const semData = allSemesterData[semester];
        setRows(semData && semData.length > 0 ? semData : [emptyRow()]);
        setHasChanges(false);
        setSaved(false);
    }, [semester, allSemesterData]);

    const emptyRow = (): GradeRow => ({
        id: crypto.randomUUID(),
        subject_name: '',
        subject_code: '',
        credits: 3,
        grade: 'A',
        grade_points: GRADE_MAP['A'],
        isNew: true,
    });

    const addRow = () => {
        setRows([...rows, emptyRow()]);
        setHasChanges(true);
    };

    const removeRow = (id: string) => {
        if (rows.length <= 1) return;
        setRows(rows.filter(r => r.id !== id));
        setHasChanges(true);
    };

    const updateRow = (id: string, field: keyof GradeRow, value: string | number) => {
        setRows(rows.map(r => {
            if (r.id !== id) return r;
            const updated = { ...r, [field]: value, isModified: true };
            if (field === 'grade') {
                updated.grade_points = GRADE_MAP[value as string] ?? 0;
            }
            return updated;
        }));
        setHasChanges(true);
        setSaved(false);
    };

    // Save to Supabase
    const saveGrades = useCallback(async () => {
        if (!user) return;
        setSaving(true);

        // Delete existing rows for this semester, then upsert new ones
        await supabase
            .from('semester_grades')
            .delete()
            .eq('user_id', user.id)
            .eq('semester', semester);

        const validRows = rows.filter(r => r.subject_name.trim() !== '');
        if (validRows.length > 0) {
            const payload = validRows.map(r => ({
                user_id: user.id,
                semester,
                subject_name: r.subject_name.trim(),
                subject_code: r.subject_code.trim(),
                credits: r.credits,
                grade: r.grade,
                grade_points: r.grade_points,
            }));

            const { error } = await supabase.from('semester_grades').insert(payload);
            if (error) {
                console.error('Save error:', error);
                setSaving(false);
                return;
            }
        }

        // Reload to get fresh IDs
        const { data } = await supabase
            .from('semester_grades')
            .select('*')
            .eq('user_id', user.id)
            .order('semester')
            .order('created_at');

        if (data) {
            const grouped: Record<number, GradeRow[]> = {};
            data.forEach((row: any) => {
                const sem = row.semester;
                if (!grouped[sem]) grouped[sem] = [];
                grouped[sem].push({
                    id: row.id,
                    subject_name: row.subject_name,
                    subject_code: row.subject_code || '',
                    credits: Number(row.credits),
                    grade: row.grade,
                    grade_points: Number(row.grade_points),
                });
            });
            setAllSemesterData(grouped);
        }

        setSaving(false);
        setSaved(true);
        setHasChanges(false);
        setTimeout(() => setSaved(false), 3000);
    }, [user, rows, semester]);

    // Calculate semester GPA
    const semesterGpa = (() => {
        let tc = 0, ep = 0;
        rows.forEach(r => {
            if (!r.subject_name.trim()) return;
            const cr = Number(r.credits) || 0;
            tc += cr;
            ep += cr * (r.grade_points || 0);
        });
        return tc > 0 ? Number((ep / tc).toFixed(2)) : 0;
    })();

    // Calculate cumulative CGPA across all semesters
    const cumulativeCgpa = (() => {
        let totalCredits = 0, totalEarned = 0;
        // Use saved data for other semesters
        Object.entries(allSemesterData).forEach(([sem, semRows]) => {
            if (Number(sem) === semester) return; // Skip current (use live rows instead)
            semRows.forEach(r => {
                if (!r.subject_name.trim()) return;
                const cr = Number(r.credits) || 0;
                totalCredits += cr;
                totalEarned += cr * (r.grade_points || 0);
            });
        });
        // Add current semester's live data
        rows.forEach(r => {
            if (!r.subject_name.trim()) return;
            const cr = Number(r.credits) || 0;
            totalCredits += cr;
            totalEarned += cr * (r.grade_points || 0);
        });
        return totalCredits > 0 ? Number((totalEarned / totalCredits).toFixed(2)) : 0;
    })();

    const semesterCredits = rows.reduce((a, r) => a + (r.subject_name.trim() ? Number(r.credits) || 0 : 0), 0);
    const totalCreditsAll = Object.values(allSemesterData).flat().reduce((a, r) => a + (Number(r.credits) || 0), 0);
    const semesters = Array.from({ length: 8 }, (_, i) => i + 1);
    const semestersWithData = new Set(Object.keys(allSemesterData).map(Number));
    const isOnTrack = cumulativeCgpa >= targetCgpa;

    const cellInput: React.CSSProperties = { width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '10px 12px', outline: 'none', fontSize: 13, color: 'white', transition: 'border-color 0.2s' };
    const cellSelect: React.CSSProperties = { width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '10px 12px', outline: 'none', fontSize: 13, color: 'white', appearance: 'none' as const, cursor: 'pointer' };

    if (loading) {
        return (
            <DashboardLayout>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 12, color: '#64748b' }}>
                    <Loader2 size={20} className="animate-spin" /> Loading your grades...
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                            <CalcIcon size={22} style={{ color: '#7C5CFF' }} /> CGPA Simulator
                        </h1>
                        <p style={{ fontSize: 13, color: '#94a3b8' }}>
                            {profile?.universities?.grading_system || '10-point'} scale • {profile?.universities?.name || 'Your University'}
                        </p>
                    </div>
                    <button
                        onClick={saveGrades}
                        disabled={saving || !hasChanges}
                        className="btn btn-primary"
                        style={{ fontSize: 13, gap: 8, opacity: (!hasChanges && !saved) ? 0.5 : 1, transition: 'all 0.2s' }}
                    >
                        {saving ? <><Loader2 size={15} className="animate-spin" /> Saving...</> :
                            saved ? <><Check size={15} /> Saved!</> :
                                <><Save size={15} /> Save Semester</>}
                    </button>
                </div>

                {/* Semester Tabs */}
                <div className="glass-panel" style={{ padding: 8, display: 'flex', gap: 4, alignItems: 'center' }}>
                    <button
                        onClick={() => setSemester(s => Math.max(1, s - 1))}
                        disabled={semester <= 1}
                        style={{ padding: '8px 10px', borderRadius: 8, border: 'none', background: 'transparent', color: semester <= 1 ? '#334155' : '#94a3b8', cursor: semester <= 1 ? 'not-allowed' : 'pointer' }}
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <div style={{ display: 'flex', gap: 4, flex: 1 }}>
                        {semesters.map(s => {
                            const isActive = s === semester;
                            const hasData = semestersWithData.has(s) || (s === semester && rows.some(r => r.subject_name.trim()));
                            return (
                                <button
                                    key={s}
                                    onClick={() => setSemester(s)}
                                    style={{
                                        flex: 1,
                                        padding: '10px 0',
                                        borderRadius: 8,
                                        border: 'none',
                                        fontSize: 12,
                                        fontWeight: isActive ? 600 : 500,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        position: 'relative',
                                        background: isActive ? 'rgba(124,92,255,0.15)' : 'transparent',
                                        color: isActive ? '#7C5CFF' : hasData ? '#cbd5e1' : '#475569',
                                    }}
                                >
                                    Sem {s}
                                    {hasData && !isActive && (
                                        <div style={{ position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)', width: 4, height: 4, borderRadius: '50%', background: '#00E5FF' }} />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                    <button
                        onClick={() => setSemester(s => Math.min(8, s + 1))}
                        disabled={semester >= 8}
                        style={{ padding: '8px 10px', borderRadius: 8, border: 'none', background: 'transparent', color: semester >= 8 ? '#334155' : '#94a3b8', cursor: semester >= 8 ? 'not-allowed' : 'pointer' }}
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
                    {/* Calculator Table */}
                    <div className="glass-panel" style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#cbd5e1' }}>
                                Semester {semester} Courses
                            </h3>
                            <button onClick={addRow} style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px', borderRadius: 8, background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.2)', cursor: 'pointer', color: '#00E5FF', transition: 'all 0.2s' }}>
                                <Plus size={14} /> Add Subject
                            </button>
                        </div>

                        <div style={{ flex: 1, overflowX: 'auto' }}>
                            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                        <th style={{ paddingBottom: 10, fontSize: 11, fontWeight: 500, color: '#64748b', width: '40%' }}>Subject Name</th>
                                        <th style={{ paddingBottom: 10, fontSize: 11, fontWeight: 500, color: '#64748b', paddingLeft: 8, width: '12%' }}>Code</th>
                                        <th style={{ paddingBottom: 10, fontSize: 11, fontWeight: 500, color: '#64748b', paddingLeft: 8, width: '12%' }}>Credits</th>
                                        <th style={{ paddingBottom: 10, fontSize: 11, fontWeight: 500, color: '#64748b', paddingLeft: 8, width: '18%' }}>Grade</th>
                                        <th style={{ paddingBottom: 10, fontSize: 11, fontWeight: 500, color: '#64748b', paddingLeft: 8, width: '10%', textAlign: 'center' }}>Pts</th>
                                        <th style={{ paddingBottom: 10, width: 36 }} />
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row) => (
                                        <tr key={row.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                            <td style={{ padding: '6px 8px 6px 0' }}>
                                                <input type="text" value={row.subject_name} onChange={(e) => updateRow(row.id, 'subject_name', e.target.value)} placeholder="e.g., Data Structures" style={cellInput} />
                                            </td>
                                            <td style={{ padding: '6px 8px' }}>
                                                <input type="text" value={row.subject_code} onChange={(e) => updateRow(row.id, 'subject_code', e.target.value)} placeholder="CS201" style={{ ...cellInput, textAlign: 'center', textTransform: 'uppercase' }} maxLength={8} />
                                            </td>
                                            <td style={{ padding: '6px 8px' }}>
                                                <select title="Credits" value={row.credits} onChange={(e) => updateRow(row.id, 'credits', parseInt(e.target.value))} style={{ ...cellSelect, textAlign: 'center' }}>
                                                    {[0, 1, 1.5, 2, 3, 4, 5, 6].map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            </td>
                                            <td style={{ padding: '6px 8px' }}>
                                                <select title="Grade" value={row.grade} onChange={(e) => updateRow(row.id, 'grade', e.target.value)} style={{ ...cellSelect, fontWeight: 600 }}>
                                                    {Object.entries(GRADE_MAP).map(([g, p]) => (
                                                        <option key={g} value={g}>{g} ({p})</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td style={{ padding: '6px 8px', textAlign: 'center', fontSize: 14, fontWeight: 700, color: row.grade_points >= 8 ? '#00E5FF' : row.grade_points >= 6 ? '#7C5CFF' : '#FF4D9D' }}>
                                                {row.grade_points}
                                            </td>
                                            <td style={{ padding: '6px 0', textAlign: 'right' }}>
                                                <button onClick={() => removeRow(row.id)} disabled={rows.length === 1} style={{ padding: 6, borderRadius: 8, background: 'transparent', border: 'none', cursor: rows.length === 1 ? 'not-allowed' : 'pointer', color: '#475569', opacity: rows.length === 1 ? 0.3 : 1 }}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b' }}>
                            <span>Semester Credits: <strong style={{ color: '#cbd5e1' }}>{semesterCredits}</strong></span>
                            <span>
                                Semester GPA: <strong style={{ color: semesterGpa >= 8 ? '#00E5FF' : '#7C5CFF', fontSize: 13 }}>{semesterGpa.toFixed(2)}</strong>
                            </span>
                        </div>
                    </div>

                    {/* Results Sidebar */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {/* Cumulative CGPA Card */}
                        <div className="glass-card" style={{
                            padding: 24,
                            display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
                            position: 'relative', overflow: 'hidden',
                            borderColor: isOnTrack ? 'rgba(0,229,255,0.3)' : undefined,
                            boxShadow: isOnTrack ? '0 0 40px -10px rgba(0,229,255,0.4)' : undefined,
                        }}>
                            {isOnTrack && <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: '#00E5FF', opacity: 0.04 }} />}
                            <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500, marginBottom: 6, letterSpacing: 1, textTransform: 'uppercase' }}>Cumulative CGPA</p>
                            <div style={{ fontSize: 52, fontWeight: 900, letterSpacing: '-0.04em', marginBottom: 12, background: isOnTrack ? 'linear-gradient(135deg, #00E5FF, #7C5CFF)' : 'linear-gradient(135deg, #7C5CFF, #FF4D9D)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                {cumulativeCgpa.toFixed(2)}
                            </div>
                            <div style={{ width: '100%', height: 6, borderRadius: 4, background: 'rgba(255,255,255,0.05)', overflow: 'hidden', marginBottom: 12 }}>
                                <div style={{ height: '100%', borderRadius: 4, transition: 'width 0.7s ease', width: `${Math.min((cumulativeCgpa / 10) * 100, 100)}%`, background: isOnTrack ? 'linear-gradient(90deg, #00E5FF, #7C5CFF)' : 'linear-gradient(90deg, #7C5CFF, #FF4D9D)' }} />
                            </div>
                            <p style={{ fontSize: 11, color: '#64748b' }}>
                                {totalCreditsAll > 0 ? `Across ${semestersWithData.size} semester${semestersWithData.size > 1 ? 's' : ''} • ${totalCreditsAll} credits` : 'Start entering grades'}
                            </p>
                        </div>

                        {/* Semester GPA Mini Card */}
                        <div className="glass-card" style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <p style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>Semester {semester} GPA</p>
                                <p style={{ fontSize: 24, fontWeight: 700 }}>{semesterGpa.toFixed(2)}</p>
                            </div>
                            <div style={{ fontSize: 11, textAlign: 'right', color: '#64748b' }}>
                                <p>{rows.filter(r => r.subject_name.trim()).length} subjects</p>
                                <p>{semesterCredits} credits</p>
                            </div>
                        </div>

                        {/* Target Tracker */}
                        <div className="glass-card" style={{ padding: 20 }}>
                            <h3 style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                                <Target size={15} style={{ color: '#FF4D9D' }} /> Target CGPA
                            </h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                                <input type="range" min="5" max="10" step="0.1" value={targetCgpa} onChange={(e) => setTargetCgpa(parseFloat(e.target.value))} style={{ flex: 1, accentColor: '#FF4D9D' }} />
                                <span style={{ fontWeight: 700, fontSize: 18, minWidth: '3ch', textAlign: 'right', color: '#FF4D9D' }}>{targetCgpa.toFixed(1)}</span>
                            </div>
                            <div style={{ padding: 12, borderRadius: 10, fontSize: 12, lineHeight: 1.7, border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(11,15,26,0.7)' }}>
                                {isOnTrack ? (
                                    <p style={{ color: '#00E5FF' }}>✨ On track! You're meeting your target CGPA.</p>
                                ) : cumulativeCgpa > 0 ? (
                                    <p style={{ color: '#94a3b8' }}>
                                        Need <strong style={{ color: 'white' }}>{(targetCgpa - cumulativeCgpa).toFixed(2)}</strong> more points. Focus on heavy-credit courses.
                                    </p>
                                ) : (
                                    <p style={{ color: '#94a3b8' }}>Enter your grades to see how you track against your target.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

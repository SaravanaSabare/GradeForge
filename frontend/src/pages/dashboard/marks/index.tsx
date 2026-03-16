import { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import { useAuth } from '../../../contexts/AuthContext';
import {
    Plus,
    Trash2,
    Save,
    Award,
    AlertCircle,
    Loader2,
    ChevronDown,
    ChevronUp,
    Sparkles,
} from 'lucide-react';
import type {
    SubjectMarks,
} from '../../../services/marks';
import {
    fetchAllSubjectsMarks,
    addMarkComponent,
    updateMarkComponent,
    deleteMarkComponent,
} from '../../../services/marks';

export default function MarkCalculator() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [allSubjects, setAllSubjects] = useState<SubjectMarks[]>([]);
    const [selectedSubject, setSelectedSubject] = useState('');
    const [showAddComponent, setShowAddComponent] = useState(false);
    const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
    const [targetMarks, setTargetMarks] = useState<Record<string, number>>({});

    // Form state for new component
    const [newComponent, setNewComponent] = useState({
        component_type: 'Quiz',
        max_marks: 10,
        weight: 10,
        obtained_marks: '',
    });

    // Load all marks on mount
    useEffect(() => {
        if (!user) return;
        loadAllMarks();
    }, [user]);

    const loadAllMarks = async () => {
        if (!user) return;
        setLoading(true);
        const subjects = await fetchAllSubjectsMarks(user.id);
        setAllSubjects(subjects);
        if (subjects.length > 0) {
            setSelectedSubject(subjects[0].subject_name);
            setExpandedSubject(subjects[0].subject_name);
        }
        setLoading(false);
    };

    const handleAddComponent = async () => {
        if (!user || !selectedSubject) {
            alert('Please select a subject');
            return;
        }

        if (!newComponent.component_type || !newComponent.max_marks) {
            alert('Please fill all required fields');
            return;
        }

        setSaving(true);
        try {
            const result = await addMarkComponent(
                user.id,
                selectedSubject,
                newComponent.component_type,
                Number(newComponent.max_marks),
                Number(newComponent.weight),
                newComponent.obtained_marks ? Number(newComponent.obtained_marks) : null
            );

            if (result) {
                setNewComponent({
                    component_type: 'Quiz',
                    max_marks: 10,
                    weight: 10,
                    obtained_marks: '',
                });
                setShowAddComponent(false);
                await loadAllMarks();
            }
        } catch (error) {
            console.error('Error adding component:', error);
            alert('Failed to add component');
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateMarks = async (componentId: string, obtainedMarks: number) => {
        if (!user) return;
        setSaving(true);
        try {
            await updateMarkComponent(componentId, { obtained_marks: obtainedMarks });
            await loadAllMarks();
        } catch (error) {
            console.error('Error updating marks:', error);
            alert('Failed to update marks');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteComponent = async (componentId: string) => {
        if (!window.confirm('Delete this component?')) return;
        setSaving(true);
        try {
            const success = await deleteMarkComponent(componentId);
            if (success) {
                await loadAllMarks();
            }
        } catch (error) {
            console.error('Error deleting component:', error);
            alert('Failed to delete component');
        } finally {
            setSaving(false);
        }
    };

    const calculateRequiredMarks = (subject: SubjectMarks): number | null => {
        if (!targetMarks[subject.subject_name]) return null;

        const target = targetMarks[subject.subject_name];
        const targetScore = (target / 100) * subject.total_max;
        const remaining = targetScore - subject.total_obtained;
        return Math.max(0, remaining);
    };

    const canAchieveTarget = (subject: SubjectMarks): boolean => {
        if (!targetMarks[subject.subject_name]) return true;
        const required = calculateRequiredMarks(subject);
        return required !== null && required <= subject.total_max - subject.total_obtained;
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
                    <Loader2 style={{ width: 32, height: 32, animation: 'spin 1s linear infinite', color: '#3b82f6' }} />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div style={{ minHeight: '100vh', background: '#0f172a', padding: '1rem 2rem' }}>
                <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
                    {/* Header */}
                    <div style={{ marginBottom: '3rem' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                    <div style={{ padding: '0.75rem', background: 'linear-gradient(to bottom right, #f59e0b, #ea580c)', borderRadius: '0.75rem' }}>
                                        <Award style={{ width: 24, height: 24, color: 'white' }} />
                                    </div>
                                    <h1 style={{ fontSize: '2.25rem', fontWeight: 900, color: 'white', margin: 0 }}>Mark Calculator</h1>
                                </div>
                                <p style={{ color: '#9ca3af', fontSize: '1.125rem', margin: 0 }}>Track and analyze your internal marks with weighted grading</p>
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    {allSubjects.length > 0 && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                            <div style={{ position: 'relative', background: '#1e293b', borderRadius: '1.5rem', padding: '1.5rem', border: '1px solid rgba(71, 85, 105, 0.5)', cursor: 'pointer', transition: 'all 0.3s ease' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)'} onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(71, 85, 105, 0.5)'}>
                                <div style={{ position: 'absolute', inset: 0, background: 'rgba(59, 130, 246, 0.1)', borderRadius: '1.5rem', opacity: 0, transition: 'opacity 0.3s ease' }} />
                                <div style={{ position: 'relative' }}>
                                    <p style={{ color: '#9ca3af', fontSize: '0.875rem', fontWeight: 500, margin: 0, marginBottom: '0.25rem' }}>Total Subjects</p>
                                    <p style={{ fontSize: '2rem', fontWeight: 900, color: '#60a5fa', margin: 0 }}>{allSubjects.length}</p>
                                </div>
                            </div>

                            <div style={{ position: 'relative', background: '#1e293b', borderRadius: '1.5rem', padding: '1.5rem', border: '1px solid rgba(71, 85, 105, 0.5)', cursor: 'pointer', transition: 'all 0.3s ease' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.5)'} onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(71, 85, 105, 0.5)'}>
                                <div style={{ position: 'absolute', inset: 0, background: 'rgba(168, 85, 247, 0.1)', borderRadius: '1.5rem', opacity: 0, transition: 'opacity 0.3s ease' }} />
                                <div style={{ position: 'relative' }}>
                                    <p style={{ color: '#9ca3af', fontSize: '0.875rem', fontWeight: 500, margin: 0, marginBottom: '0.25rem' }}>Average %</p>
                                    <p style={{ fontSize: '2rem', fontWeight: 900, color: '#c084fc', margin: 0 }}>
                                        {(allSubjects.reduce((sum, s) => sum + s.percentage, 0) / allSubjects.length).toFixed(1)}%
                                    </p>
                                </div>
                            </div>

                            <div style={{ position: 'relative', background: '#1e293b', borderRadius: '1.5rem', padding: '1.5rem', border: '1px solid rgba(71, 85, 105, 0.5)', cursor: 'pointer', transition: 'all 0.3s ease' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(74, 222, 128, 0.5)'} onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(71, 85, 105, 0.5)'}>
                                <div style={{ position: 'absolute', inset: 0, background: 'rgba(74, 222, 128, 0.1)', borderRadius: '1.5rem', opacity: 0, transition: 'opacity 0.3s ease' }} />
                                <div style={{ position: 'relative' }}>
                                    <p style={{ color: '#9ca3af', fontSize: '0.875rem', fontWeight: 500, margin: 0, marginBottom: '0.25rem' }}>Highest</p>
                                    <p style={{ fontSize: '2rem', fontWeight: 900, color: '#4ade80', margin: 0 }}>
                                        {Math.max(...allSubjects.map(s => s.percentage)).toFixed(1)}%
                                    </p>
                                </div>
                            </div>

                            <div style={{ position: 'relative', background: '#1e293b', borderRadius: '1.5rem', padding: '1.5rem', border: '1px solid rgba(71, 85, 105, 0.5)', cursor: 'pointer', transition: 'all 0.3s ease' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(248, 113, 113, 0.5)'} onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(71, 85, 105, 0.5)'}>
                                <div style={{ position: 'absolute', inset: 0, background: 'rgba(248, 113, 113, 0.1)', borderRadius: '1.5rem', opacity: 0, transition: 'opacity 0.3s ease' }} />
                                <div style={{ position: 'relative' }}>
                                    <p style={{ color: '#9ca3af', fontSize: '0.875rem', fontWeight: 500, margin: 0, marginBottom: '0.25rem' }}>Lowest</p>
                                    <p style={{ fontSize: '2rem', fontWeight: 900, color: '#f87171', margin: 0 }}>
                                        {Math.min(...allSubjects.map(s => s.percentage)).toFixed(1)}%
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Subject Panel */}
                    <div style={{ display: 'grid', gridTemplateColumns: selectedSubject ? '1fr 1fr' : '1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                        <div style={{ background: '#1e293b', border: '1px solid rgba(71, 85, 105, 0.5)', borderRadius: '1.5rem', padding: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: 'white', margin: 0, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Select Subject</label>
                            <input
                                type="text"
                                placeholder="Type subject name..."
                                value={selectedSubject}
                                onChange={(e) => {
                                    setSelectedSubject(e.target.value);
                                    setNewComponent({ component_type: 'Quiz', max_marks: 10, weight: 10, obtained_marks: '' });
                                }}
                                style={{
                                    width: '100%',
                                    background: 'rgba(15, 23, 42, 0.5)',
                                    border: '1px solid #475569',
                                    borderRadius: '0.75rem',
                                    padding: '0.75rem 1rem',
                                    color: 'white',
                                    fontSize: '1rem',
                                    fontWeight: 500,
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                }}
                                list="subjects"
                            />
                            <datalist id="subjects">
                                {allSubjects.map(subject => (
                                    <option key={subject.subject_name} value={subject.subject_name} />
                                ))}
                            </datalist>
                        </div>

                        {selectedSubject && (
                            <div style={{ background: '#1e293b', border: '1px solid rgba(71, 85, 105, 0.5)', borderRadius: '1.5rem', padding: '1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: 'white', margin: 0, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Target %</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    placeholder="e.g., 85"
                                    value={targetMarks[selectedSubject] || ''}
                                    onChange={(e) =>
                                        setTargetMarks({ ...targetMarks, [selectedSubject]: Number(e.target.value) })
                                    }
                                    style={{
                                        width: '100%',
                                        background: 'rgba(15, 23, 42, 0.5)',
                                        border: '1px solid #475569',
                                        borderRadius: '0.75rem',
                                        padding: '0.75rem 1rem',
                                        color: 'white',
                                        fontSize: '1rem',
                                        fontWeight: 500,
                                        outline: 'none',
                                        boxSizing: 'border-box',
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Add Component Button */}
                    <div style={{ marginBottom: '2rem' }}>
                        <button
                            onClick={() => setShowAddComponent(!showAddComponent)}
                            style={{
                                width: '100%',
                                background: 'linear-gradient(to right, #2563eb, #1d4ed8)',
                                color: 'white',
                                fontWeight: 700,
                                padding: '1rem 1.5rem',
                                borderRadius: '1.5rem',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '1.125rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.75rem',
                                boxShadow: '0 4px 6px rgba(37, 99, 235, 0.2)',
                                transition: 'all 0.3s ease',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'linear-gradient(to right, #1d4ed8, #1e40af)';
                                e.currentTarget.style.boxShadow = '0 8px 12px rgba(37, 99, 235, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'linear-gradient(to right, #2563eb, #1d4ed8)';
                                e.currentTarget.style.boxShadow = '0 4px 6px rgba(37, 99, 235, 0.2)';
                            }}
                        >
                            <Plus style={{ width: 24, height: 24 }} />
                            Add Component
                        </button>
                    </div>

                    {/* Add Component Form */}
                    {showAddComponent && (
                        <div style={{ background: '#1e293b', border: '1px solid rgba(71, 85, 105, 0.5)', borderRadius: '1.5rem', padding: '2rem', marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white', margin: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Sparkles style={{ width: 20, height: 20, color: '#fbbf24' }} />
                                New Component
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '1rem' }}>
                                <input
                                    type="text"
                                    placeholder="Type"
                                    value={newComponent.component_type}
                                    onChange={(e) =>
                                        setNewComponent({ ...newComponent, component_type: e.target.value })
                                    }
                                    style={{
                                        background: 'rgba(15, 23, 42, 0.5)',
                                        border: '1px solid #475569',
                                        borderRadius: '0.75rem',
                                        padding: '0.75rem',
                                        color: 'white',
                                        fontSize: '1rem',
                                        fontWeight: 500,
                                        boxSizing: 'border-box',
                                    }}
                                />

                                <input
                                    type="number"
                                    placeholder="Max"
                                    value={newComponent.max_marks}
                                    onChange={(e) =>
                                        setNewComponent({ ...newComponent, max_marks: Number(e.target.value) })
                                    }
                                    style={{
                                        background: 'rgba(15, 23, 42, 0.5)',
                                        border: '1px solid #475569',
                                        borderRadius: '0.75rem',
                                        padding: '0.75rem',
                                        color: 'white',
                                        fontSize: '1rem',
                                        fontWeight: 500,
                                        boxSizing: 'border-box',
                                    }}
                                />

                                <input
                                    type="number"
                                    placeholder="Weight %"
                                    value={newComponent.weight}
                                    onChange={(e) =>
                                        setNewComponent({ ...newComponent, weight: Number(e.target.value) })
                                    }
                                    style={{
                                        background: 'rgba(15, 23, 42, 0.5)',
                                        border: '1px solid #475569',
                                        borderRadius: '0.75rem',
                                        padding: '0.75rem',
                                        color: 'white',
                                        fontSize: '1rem',
                                        fontWeight: 500,
                                        boxSizing: 'border-box',
                                    }}
                                />

                                <input
                                    type="number"
                                    placeholder="Got"
                                    value={newComponent.obtained_marks}
                                    onChange={(e) =>
                                        setNewComponent({ ...newComponent, obtained_marks: e.target.value })
                                    }
                                    style={{
                                        background: 'rgba(15, 23, 42, 0.5)',
                                        border: '1px solid #475569',
                                        borderRadius: '0.75rem',
                                        padding: '0.75rem',
                                        color: 'white',
                                        fontSize: '1rem',
                                        fontWeight: 500,
                                        boxSizing: 'border-box',
                                    }}
                                />

                                <button
                                    onClick={handleAddComponent}
                                    disabled={saving}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem',
                                        background: '#16a34a',
                                        color: 'white',
                                        fontWeight: 700,
                                        padding: '0.75rem',
                                        borderRadius: '0.75rem',
                                        border: 'none',
                                        cursor: saving ? 'not-allowed' : 'pointer',
                                        opacity: saving ? 0.6 : 1,
                                        transition: 'all 0.3s ease',
                                    }}
                                    onMouseEnter={(e) => !saving && (e.currentTarget.style.background = '#15803d')}
                                    onMouseLeave={(e) => !saving && (e.currentTarget.style.background = '#16a34a')}
                                >
                                    {saving ? <Loader2 style={{ width: 20, height: 20, animation: 'spin 1s linear infinite' }} /> : <Save style={{ width: 20, height: 20 }} />}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Subjects */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {allSubjects.length === 0 ? (
                            <div style={{ background: '#1e293b', border: '1px solid rgba(71, 85, 105, 0.5)', borderRadius: '1.5rem', padding: '3rem', textAlign: 'center' }}>
                                <AlertCircle style={{ width: 64, height: 64, color: '#64748b', margin: '0 auto 1rem', display: 'block' }} />
                                <p style={{ color: '#9ca3af', fontSize: '1.125rem', margin: 0 }}>No subjects yet. Add a component to get started!</p>
                            </div>
                        ) : (
                            allSubjects.map(subject => (
                                <div
                                    key={subject.subject_name}
                                    style={{ background: '#1e293b', border: '1px solid rgba(71, 85, 105, 0.5)', borderRadius: '1.5rem', overflow: 'hidden', transition: 'all 0.3s ease' }}
                                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(71, 85, 105, 0.8)'}
                                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(71, 85, 105, 0.5)'}
                                >
                                    <div
                                        onClick={() =>
                                            setExpandedSubject(expandedSubject === subject.subject_name ? null : subject.subject_name)
                                        }
                                        style={{
                                            padding: '1.5rem',
                                            cursor: 'pointer',
                                            background: '#1e293b',
                                            transition: 'background 0.2s ease',
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(30, 41, 59, 0.8)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = '#1e293b'}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                                                    <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white', margin: 0 }}>{subject.subject_name}</h3>
                                                    <span style={{
                                                        padding: '0.25rem 1rem',
                                                        borderRadius: '9999px',
                                                        fontSize: '0.875rem',
                                                        fontWeight: 700,
                                                        background: subject.grade === 'O' ? 'rgba(234, 88, 12, 0.2)' :
                                                            subject.grade === 'A+' ? 'rgba(220, 38, 38, 0.2)' :
                                                            subject.grade === 'A' ? 'rgba(168, 85, 247, 0.2)' :
                                                            subject.grade === 'B+' ? 'rgba(59, 130, 246, 0.2)' :
                                                            'rgba(100, 116, 139, 0.2)',
                                                        color: subject.grade === 'O' ? '#ea580c' :
                                                            subject.grade === 'A+' ? '#dc2626' :
                                                            subject.grade === 'A' ? '#a855f7' :
                                                            subject.grade === 'B+' ? '#3b82f6' :
                                                            '#64748b',
                                                    }}>
                                                        {subject.grade}
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#9ca3af', flexWrap: 'wrap' }}>
                                                    <span style={{ fontWeight: 600 }}>Marks: <span style={{ color: 'white' }}>{subject.total_obtained.toFixed(1)}/{subject.total_max}</span></span>
                                                    <span style={{ fontWeight: 600 }}>Score: <span style={{ color: 'white' }}>{subject.percentage.toFixed(1)}%</span></span>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
                                                {targetMarks[subject.subject_name] && (
                                                    <div style={{ textAlign: 'right', background: 'rgba(15, 23, 42, 0.5)', borderRadius: '0.75rem', padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                                                        <p style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, marginBottom: '0.25rem' }}>Target</p>
                                                        <p style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white', margin: 0 }}>{targetMarks[subject.subject_name]}%</p>
                                                        {canAchieveTarget(subject) ? (
                                                            <p style={{ fontSize: '0.75rem', color: '#4ade80', fontWeight: 700, marginTop: '0.25rem', margin: 0 }}>
                                                                Need: {calculateRequiredMarks(subject)?.toFixed(1)}
                                                            </p>
                                                        ) : (
                                                            <p style={{ fontSize: '0.75rem', color: '#f87171', fontWeight: 700, marginTop: '0.25rem', margin: 0 }}>Not achievable</p>
                                                        )}
                                                    </div>
                                                )}
                                                {expandedSubject === subject.subject_name ? (
                                                    <ChevronUp style={{ width: 24, height: 24, color: '#60a5fa', flexShrink: 0 }} />
                                                ) : (
                                                    <ChevronDown style={{ width: 24, height: 24, color: '#9ca3af', flexShrink: 0 }} />
                                                )}
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div style={{ height: '0.75rem', background: 'rgba(15, 23, 42, 0.5)', borderRadius: '9999px', overflow: 'hidden' }}>
                                            <div
                                                style={{
                                                    height: '100%',
                                                    background: 'linear-gradient(to right, #3b82f6, #06b6d4)',
                                                    width: `${Math.min(subject.percentage, 100)}%`,
                                                    transition: 'width 0.5s ease',
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Components List */}
                                    {expandedSubject === subject.subject_name && (
                                        <div style={{ background: 'rgba(15, 23, 42, 0.5)', borderTop: '1px solid rgba(71, 85, 105, 0.5)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            {subject.components.map(component => (
                                                <div
                                                    key={component.id}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '1rem',
                                                        background: 'rgba(30, 41, 59, 0.5)',
                                                        borderRadius: '0.75rem',
                                                        padding: '1rem',
                                                        border: '1px solid rgba(52, 65, 85, 0.5)',
                                                        transition: 'all 0.2s ease',
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.borderColor = 'rgba(52, 65, 85, 1)';
                                                        e.currentTarget.style.background = 'rgba(30, 41, 59, 0.8)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.borderColor = 'rgba(52, 65, 85, 0.5)';
                                                        e.currentTarget.style.background = 'rgba(30, 41, 59, 0.5)';
                                                    }}
                                                >
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <p style={{ fontWeight: 700, color: 'white', margin: 0, wordBreak: 'break-word' }}>{component.component_type}</p>
                                                        <p style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 500, margin: 0 }}>
                                                            Max: <span style={{ color: '#d1d5db' }}>{component.max_marks}</span> | Weight: <span style={{ color: '#d1d5db' }}>{component.weight}%</span>
                                                        </p>
                                                    </div>

                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max={component.max_marks}
                                                            value={component.obtained_marks || ''}
                                                            onChange={(e) =>
                                                                handleUpdateMarks(component.id, Number(e.target.value))
                                                            }
                                                            placeholder="0"
                                                            style={{
                                                                width: '80px',
                                                                background: 'rgba(15, 23, 42, 0.5)',
                                                                border: '1px solid rgba(71, 85, 105, 0.5)',
                                                                borderRadius: '0.5rem',
                                                                padding: '0.5rem',
                                                                color: 'white',
                                                                fontSize: '0.875rem',
                                                                textAlign: 'center',
                                                                fontWeight: 700,
                                                                boxSizing: 'border-box',
                                                            }}
                                                        />

                                                        {component.obtained_marks !== null && (
                                                            <span style={{ fontSize: '0.875rem', fontWeight: 900, color: '#60a5fa', minWidth: '48px', textAlign: 'right' }}>
                                                                {((component.obtained_marks / component.max_marks) * 100).toFixed(0)}%
                                                            </span>
                                                        )}

                                                        <button
                                                            onClick={() => handleDeleteComponent(component.id)}
                                                            disabled={saving}
                                                            style={{
                                                                padding: '0.5rem',
                                                                color: '#f87171',
                                                                background: 'transparent',
                                                                border: 'none',
                                                                cursor: saving ? 'not-allowed' : 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                transition: 'all 0.2s ease',
                                                                opacity: saving ? 0.5 : 1,
                                                            }}
                                                            onMouseEnter={(e) => !saving && (e.currentTarget.style.color = '#dc2626')}
                                                            onMouseLeave={(e) => !saving && (e.currentTarget.style.color = '#f87171')}
                                                        >
                                                            <Trash2 style={{ width: 20, height: 20 }} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}

                                            {subject.components.length === 0 && (
                                                <p style={{ textAlign: 'center', color: '#64748b', paddingTop: '1.5rem', paddingBottom: '1.5rem', fontWeight: 500, margin: 0 }}>No components added</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

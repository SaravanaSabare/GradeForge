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
import './styles.css';

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
                <div className="marks-container flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="marks-container">
                <div className="marks-wrapper">
                    {/* Header */}
                    <div className="marks-header">
                        <div className="marks-title">
                            <div className="marks-icon">
                                <Award className="w-6 h-6 text-white" />
                            </div>
                            <h1>Mark Calculator</h1>
                        </div>
                        <p className="marks-subtitle">Track and analyze your internal marks with weighted grading</p>
                    </div>

                    {/* Stats Grid */}
                    {allSubjects.length > 0 && (
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-label">Total Subjects</div>
                                <div className="stat-value blue">{allSubjects.length}</div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-label">Average %</div>
                                <div className="stat-value purple">
                                    {(allSubjects.reduce((sum, s) => sum + s.percentage, 0) / allSubjects.length).toFixed(1)}%
                                </div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-label">Highest</div>
                                <div className="stat-value green">
                                    {Math.max(...allSubjects.map(s => s.percentage)).toFixed(1)}%
                                </div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-label">Lowest</div>
                                <div className="stat-value red">
                                    {Math.min(...allSubjects.map(s => s.percentage)).toFixed(1)}%
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Subject Panel */}
                    <div className={`subject-panel ${selectedSubject ? 'two-col' : ''}`}>
                        <div className="form-group">
                            <label className="form-label">Select Subject</label>
                            <input
                                type="text"
                                placeholder="Type subject name..."
                                value={selectedSubject}
                                onChange={(e) => {
                                    setSelectedSubject(e.target.value);
                                    setNewComponent({ component_type: 'Quiz', max_marks: 10, weight: 10, obtained_marks: '' });
                                }}
                                className="form-input"
                                list="subjects"
                            />
                            <datalist id="subjects">
                                {allSubjects.map(subject => (
                                    <option key={subject.subject_name} value={subject.subject_name} />
                                ))}
                            </datalist>
                        </div>

                        {selectedSubject && (
                            <div className="form-group">
                                <label className="form-label">Target %</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    placeholder="e.g., 85"
                                    value={targetMarks[selectedSubject] || ''}
                                    onChange={(e) =>
                                        setTargetMarks({ ...targetMarks, [selectedSubject]: Number(e.target.value) })
                                    }
                                    className="form-input"
                                />
                            </div>
                        )}
                    </div>

                    {/* Add Component Button */}
                    <div style={{ marginBottom: '2rem' }}>
                        <button
                            onClick={() => setShowAddComponent(!showAddComponent)}
                            className="btn btn-primary"
                        >
                            <Plus className="w-6 h-6" />
                            Add Component
                        </button>
                    </div>

                    {/* Add Component Form */}
                    {showAddComponent && (
                        <div className="component-form">
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white', margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Sparkles className="w-5 h-5 text-amber-400" />
                                New Component
                            </h3>
                            <div className="component-grid">
                                <input
                                    type="text"
                                    placeholder="Type"
                                    value={newComponent.component_type}
                                    onChange={(e) =>
                                        setNewComponent({ ...newComponent, component_type: e.target.value })
                                    }
                                    className="form-input"
                                />

                                <input
                                    type="number"
                                    placeholder="Max"
                                    value={newComponent.max_marks}
                                    onChange={(e) =>
                                        setNewComponent({ ...newComponent, max_marks: Number(e.target.value) })
                                    }
                                    className="form-input"
                                />

                                <input
                                    type="number"
                                    placeholder="Weight %"
                                    value={newComponent.weight}
                                    onChange={(e) =>
                                        setNewComponent({ ...newComponent, weight: Number(e.target.value) })
                                    }
                                    className="form-input"
                                />

                                <input
                                    type="number"
                                    placeholder="Got"
                                    value={newComponent.obtained_marks}
                                    onChange={(e) =>
                                        setNewComponent({ ...newComponent, obtained_marks: e.target.value })
                                    }
                                    className="form-input"
                                />

                                <button
                                    onClick={handleAddComponent}
                                    disabled={saving}
                                    className="btn btn-save"
                                    style={{ opacity: saving ? 0.6 : 1, cursor: saving ? 'not-allowed' : 'pointer' }}
                                >
                                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Subjects */}
                    <div className="subject-list">
                        {allSubjects.length === 0 ? (
                            <div className="empty-state">
                                <AlertCircle className="empty-icon" />
                                <p className="empty-text">No subjects yet. Add a component to get started!</p>
                            </div>
                        ) : (
                            allSubjects.map(subject => (
                                <div key={subject.subject_name} className="subject-card">
                                    <div className="subject-header" onClick={() => setExpandedSubject(expandedSubject === subject.subject_name ? null : subject.subject_name)}>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                                                    <h3 className="subject-name">{subject.subject_name}</h3>
                                                    <span className={`grade-badge ${subject.grade}`}>
                                                        {subject.grade}
                                                    </span>
                                                </div>
                                                <div className="subject-info">
                                                    <span>Marks: <strong>{subject.total_obtained.toFixed(1)}/{subject.total_max}</strong></span>
                                                    <span>Score: <strong>{subject.percentage.toFixed(1)}%</strong></span>
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
                                                    <ChevronUp className="w-6 h-6 text-blue-400" />
                                                ) : (
                                                    <ChevronDown className="w-6 h-6 text-gray-500" />
                                                )}
                                            </div>
                                        </div>

                                        <div className="progress-bar">
                                            <div
                                                className="progress-fill"
                                                style={{ width: `${Math.min(subject.percentage, 100)}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Components List */}
                                    {expandedSubject === subject.subject_name && (
                                        <div className="components-list">
                                            {subject.components.map(component => (
                                                <div key={component.id} className="component-item">
                                                    <div className="component-details">
                                                        <p className="component-type">{component.component_type}</p>
                                                        <p className="component-meta">
                                                            Max: <strong>{component.max_marks}</strong> | Weight: <strong>{component.weight}%</strong>
                                                        </p>
                                                    </div>

                                                    <div className="component-controls">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max={component.max_marks}
                                                            value={component.obtained_marks || ''}
                                                            onChange={(e) =>
                                                                handleUpdateMarks(component.id, Number(e.target.value))
                                                            }
                                                            placeholder="0"
                                                            className="marks-input"
                                                        />

                                                        {component.obtained_marks !== null && (
                                                            <span className="marks-percentage">
                                                                {((component.obtained_marks / component.max_marks) * 100).toFixed(0)}%
                                                            </span>
                                                        )}

                                                        <button
                                                            onClick={() => handleDeleteComponent(component.id)}
                                                            disabled={saving}
                                                            className="btn-delete"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}

                                            {subject.components.length === 0 && (
                                                <p style={{ textAlign: 'center', color: '#64748b', padding: '1.5rem', fontWeight: 500, margin: 0 }}>No components added</p>
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

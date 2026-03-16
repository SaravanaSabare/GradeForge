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
                <div className="flex items-center justify-center h-screen">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-8">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-2">
                            <Award className="w-8 h-8 text-amber-500" />
                            <h1 className="text-4xl font-bold text-white">Mark Calculator</h1>
                        </div>
                        <p className="text-gray-400">Track internal marks across subjects with weighted grading</p>
                    </div>

                    {/* Overall Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        <div className="backdrop-blur-md bg-slate-700/30 rounded-2xl border border-slate-600/50 p-6">
                            <p className="text-gray-400 text-sm mb-2">Total Subjects</p>
                            <p className="text-3xl font-bold text-white">{allSubjects.length}</p>
                        </div>

                        <div className="backdrop-blur-md bg-slate-700/30 rounded-2xl border border-slate-600/50 p-6">
                            <p className="text-gray-400 text-sm mb-2">Average Percentage</p>
                            <p className="text-3xl font-bold text-blue-400">
                                {allSubjects.length > 0
                                    ? (allSubjects.reduce((sum, s) => sum + s.percentage, 0) / allSubjects.length).toFixed(1)
                                    : 0}
                                %
                            </p>
                        </div>

                        <div className="backdrop-blur-md bg-slate-700/30 rounded-2xl border border-slate-600/50 p-6">
                            <p className="text-gray-400 text-sm mb-2">Highest Score</p>
                            <p className="text-3xl font-bold text-green-400">
                                {allSubjects.length > 0 ? Math.max(...allSubjects.map(s => s.percentage)).toFixed(1) : 0}%
                            </p>
                        </div>

                        <div className="backdrop-blur-md bg-slate-700/30 rounded-2xl border border-slate-600/50 p-6">
                            <p className="text-gray-400 text-sm mb-2">Lowest Score</p>
                            <p className="text-3xl font-bold text-red-400">
                                {allSubjects.length > 0 ? Math.min(...allSubjects.map(s => s.percentage)).toFixed(1) : 0}%
                            </p>
                        </div>
                    </div>

                    {/* Subject Selection and Add Component */}
                    <div className="backdrop-blur-md bg-slate-700/30 rounded-2xl border border-slate-600/50 p-6 mb-8">
                        <div className="flex flex-col sm:flex-row gap-4 mb-6">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-300 mb-2">Select Subject</label>
                                <input
                                    type="text"
                                    placeholder="Enter subject name"
                                    value={selectedSubject}
                                    onChange={(e) => {
                                        setSelectedSubject(e.target.value);
                                        setNewComponent({
                                            component_type: 'Quiz',
                                            max_marks: 10,
                                            weight: 10,
                                            obtained_marks: '',
                                        });
                                    }}
                                    className="w-full bg-slate-600/50 border border-slate-500 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    list="subjects"
                                />
                                <datalist id="subjects">
                                    {allSubjects.map(subject => (
                                        <option key={subject.subject_name} value={subject.subject_name} />
                                    ))}
                                </datalist>
                            </div>

                            {selectedSubject && (
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Target %</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        placeholder="e.g., 80"
                                        value={targetMarks[selectedSubject] || ''}
                                        onChange={(e) =>
                                            setTargetMarks({
                                                ...targetMarks,
                                                [selectedSubject]: Number(e.target.value),
                                            })
                                        }
                                        className="w-full bg-slate-600/50 border border-slate-500 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            )}

                            <div className="flex items-end">
                                <button
                                    onClick={() => setShowAddComponent(!showAddComponent)}
                                    className="w-full sm:w-auto flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg transition"
                                >
                                    <Plus className="w-5 h-5" />
                                    Add Component
                                </button>
                            </div>
                        </div>

                        {/* Add Component Form */}
                        {showAddComponent && (
                            <div className="bg-slate-600/30 rounded-lg p-4 border border-slate-500/50">
                                <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 mb-4">
                                    <input
                                        type="text"
                                        placeholder="Type (Quiz, Assignment...)"
                                        value={newComponent.component_type}
                                        onChange={(e) =>
                                            setNewComponent({ ...newComponent, component_type: e.target.value })
                                        }
                                        className="bg-slate-600/50 border border-slate-500 rounded-lg px-3 py-2 text-white text-sm"
                                    />

                                    <input
                                        type="number"
                                        placeholder="Max Marks"
                                        value={newComponent.max_marks}
                                        onChange={(e) =>
                                            setNewComponent({ ...newComponent, max_marks: Number(e.target.value) })
                                        }
                                        className="bg-slate-600/50 border border-slate-500 rounded-lg px-3 py-2 text-white text-sm"
                                    />

                                    <input
                                        type="number"
                                        placeholder="Weight %"
                                        value={newComponent.weight}
                                        onChange={(e) =>
                                            setNewComponent({ ...newComponent, weight: Number(e.target.value) })
                                        }
                                        className="bg-slate-600/50 border border-slate-500 rounded-lg px-3 py-2 text-white text-sm"
                                    />

                                    <input
                                        type="number"
                                        placeholder="Obtained"
                                        value={newComponent.obtained_marks}
                                        onChange={(e) =>
                                            setNewComponent({ ...newComponent, obtained_marks: e.target.value })
                                        }
                                        className="bg-slate-600/50 border border-slate-500 rounded-lg px-3 py-2 text-white text-sm"
                                    />

                                    <button
                                        onClick={handleAddComponent}
                                        disabled={saving}
                                        className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-medium px-4 py-2 rounded-lg transition text-sm"
                                    >
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Subjects Grid */}
                    <div className="space-y-4">
                        {allSubjects.map(subject => (
                            <div
                                key={subject.subject_name}
                                className="backdrop-blur-md bg-slate-700/30 rounded-2xl border border-slate-600/50 overflow-hidden hover:border-slate-500 transition"
                            >
                                {/* Subject Header */}
                                <div
                                    onClick={() =>
                                        setExpandedSubject(expandedSubject === subject.subject_name ? null : subject.subject_name)
                                    }
                                    className="p-6 cursor-pointer hover:bg-slate-600/20 transition"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-xl font-bold text-white">{subject.subject_name}</h3>
                                                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                                    subject.grade === 'O' ? 'bg-orange-500/20 text-orange-300' :
                                                    subject.grade === 'A+' ? 'bg-red-500/20 text-red-300' :
                                                    subject.grade === 'A' ? 'bg-purple-500/20 text-purple-300' :
                                                    subject.grade === 'B+' ? 'bg-blue-500/20 text-blue-300' :
                                                    'bg-gray-500/20 text-gray-300'
                                                }`}>
                                                    {subject.grade}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-gray-400">
                                                <span>Marks: {subject.total_obtained}/{subject.total_max}</span>
                                                <span>Percentage: {subject.percentage.toFixed(1)}%</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            {targetMarks[subject.subject_name] && (
                                                <div className="text-right">
                                                    <p className="text-xs text-gray-400">Target: {targetMarks[subject.subject_name]}%</p>
                                                    {canAchieveTarget(subject) ? (
                                                        <p className="text-xs text-green-400 font-semibold">
                                                            Need: {calculateRequiredMarks(subject)?.toFixed(1)} marks
                                                        </p>
                                                    ) : (
                                                        <p className="text-xs text-red-400 font-semibold">Not achievable</p>
                                                    )}
                                                </div>
                                            )}
                                            {expandedSubject === subject.subject_name ? (
                                                <ChevronUp className="w-5 h-5 text-blue-400" />
                                            ) : (
                                                <ChevronDown className="w-5 h-5 text-gray-500" />
                                            )}
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mt-4 h-2 bg-slate-600/50 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-linear-to-r from-blue-500 to-blue-400 transition-all"
                                            style={{ width: `${Math.min(subject.percentage, 100)}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Components List */}
                                {expandedSubject === subject.subject_name && (
                                    <div className="bg-slate-800/50 border-t border-slate-600/50 p-6">
                                        <div className="space-y-3">
                                            {subject.components.map(component => (
                                                <div
                                                    key={component.id}
                                                    className="flex items-center gap-4 bg-slate-700/30 rounded-lg p-4 border border-slate-600/30"
                                                >
                                                    <div className="flex-1">
                                                        <p className="font-semibold text-white">{component.component_type}</p>
                                                        <p className="text-sm text-gray-400">
                                                            Weight: {component.weight}% | Max: {component.max_marks}
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max={component.max_marks}
                                                            value={component.obtained_marks || ''}
                                                            onChange={(e) =>
                                                                handleUpdateMarks(component.id, Number(e.target.value))
                                                            }
                                                            placeholder="Marks"
                                                            className="w-20 bg-slate-600/50 border border-slate-500 rounded-lg px-3 py-2 text-white text-sm text-center"
                                                        />

                                                        {component.obtained_marks !== null && (
                                                            <span className="text-sm font-semibold text-blue-400 min-w-12">
                                                                {((component.obtained_marks / component.max_marks) * 100).toFixed(0)}%
                                                            </span>
                                                        )}

                                                        <button
                                                            onClick={() => handleDeleteComponent(component.id)}
                                                            disabled={saving}
                                                            className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition disabled:opacity-50"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {subject.components.length === 0 && (
                                            <p className="text-center text-gray-500 py-4">No components added yet</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}

                        {allSubjects.length === 0 && (
                            <div className="backdrop-blur-md bg-slate-700/30 rounded-2xl border border-slate-600/50 p-12 text-center">
                                <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                                <p className="text-gray-400">No subjects yet. Add a component to get started!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

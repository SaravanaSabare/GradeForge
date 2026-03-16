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
                <div className="flex items-center justify-center h-screen">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-slate-900 p-4 sm:p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-12">
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-3 bg-linear-to-br from-amber-500 to-orange-600 rounded-xl">
                                        <Award className="w-6 h-6 text-white" />
                                    </div>
                                    <h1 className="text-4xl font-black text-white">Mark Calculator</h1>
                                </div>
                                <p className="text-gray-400 text-lg">Track and analyze your internal marks with weighted grading</p>
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    {allSubjects.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                            <div className="group relative bg-linear-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700/50 hover:border-blue-500/50 transition">
                                <div className="absolute inset-0 bg-linear-to-br from-blue-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition" />
                                <div className="relative">
                                    <p className="text-gray-400 text-sm font-medium mb-1">Total Subjects</p>
                                    <p className="text-4xl font-black text-blue-400">{allSubjects.length}</p>
                                </div>
                            </div>

                            <div className="group relative bg-linear-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700/50 hover:border-purple-500/50 transition">
                                <div className="absolute inset-0 bg-linear-to-br from-purple-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition" />
                                <div className="relative">
                                    <p className="text-gray-400 text-sm font-medium mb-1">Average %</p>
                                    <p className="text-4xl font-black text-purple-400">
                                        {(allSubjects.reduce((sum, s) => sum + s.percentage, 0) / allSubjects.length).toFixed(1)}%
                                    </p>
                                </div>
                            </div>

                            <div className="group relative bg-linear-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700/50 hover:border-green-500/50 transition">
                                <div className="absolute inset-0 bg-linear-to-br from-green-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition" />
                                <div className="relative">
                                    <p className="text-gray-400 text-sm font-medium mb-1">Highest</p>
                                    <p className="text-4xl font-black text-green-400">
                                        {Math.max(...allSubjects.map(s => s.percentage)).toFixed(1)}%
                                    </p>
                                </div>
                            </div>

                            <div className="group relative bg-linear-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700/50 hover:border-red-500/50 transition">
                                <div className="absolute inset-0 bg-linear-to-br from-red-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition" />
                                <div className="relative">
                                    <p className="text-gray-400 text-sm font-medium mb-1">Lowest</p>
                                    <p className="text-4xl font-black text-red-400">
                                        {Math.min(...allSubjects.map(s => s.percentage)).toFixed(1)}%
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Subject Panel */}
                    <div className={`grid ${selectedSubject ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'} gap-6 mb-8`}>
                        <div className="lg:col-span-2 bg-linear-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700/50">
                            <label className="block text-sm font-bold text-white mb-3 uppercase tracking-wider">Select Subject</label>
                            <input
                                type="text"
                                placeholder="Type subject name..."
                                value={selectedSubject}
                                onChange={(e) => {
                                    setSelectedSubject(e.target.value);
                                    setNewComponent({ component_type: 'Quiz', max_marks: 10, weight: 10, obtained_marks: '' });
                                }}
                                className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-medium"
                                list="subjects"
                            />
                            <datalist id="subjects">
                                {allSubjects.map(subject => (
                                    <option key={subject.subject_name} value={subject.subject_name} />
                                ))}
                            </datalist>
                        </div>

                        {selectedSubject && (
                            <div className="bg-linear-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700/50">
                                <label className="block text-sm font-bold text-white mb-3 uppercase tracking-wider">Target %</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    placeholder="e.g., 85"
                                    value={targetMarks[selectedSubject] || ''}
                                    onChange={(e) =>
                                        setTargetMarks({ ...targetMarks, [selectedSubject]: Number(e.target.value) })
                                    }
                                    className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 text-lg font-medium"
                                />
                            </div>
                        )}
                    </div>

                    {/* Add Component Button */}
                    <div className="mb-8">
                        <button
                            onClick={() => setShowAddComponent(!showAddComponent)}
                            className="group w-full bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold px-6 py-4 rounded-2xl transition shadow-lg hover:shadow-blue-500/20 flex items-center justify-center gap-3 text-lg"
                        >
                            <Plus className="w-6 h-6 group-hover:scale-110 transition" />
                            Add Component
                        </button>
                    </div>

                    {/* Add Component Form */}
                    {showAddComponent && (
                        <div className="bg-linear-to-br from-slate-800 to-slate-900 rounded-2xl p-8 border border-slate-700/50 mb-8">
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-amber-400" />
                                New Component
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                                <input
                                    type="text"
                                    placeholder="Type"
                                    value={newComponent.component_type}
                                    onChange={(e) =>
                                        setNewComponent({ ...newComponent, component_type: e.target.value })
                                    }
                                    className="bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                />

                                <input
                                    type="number"
                                    placeholder="Max"
                                    value={newComponent.max_marks}
                                    onChange={(e) =>
                                        setNewComponent({ ...newComponent, max_marks: Number(e.target.value) })
                                    }
                                    className="bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                />

                                <input
                                    type="number"
                                    placeholder="Weight %"
                                    value={newComponent.weight}
                                    onChange={(e) =>
                                        setNewComponent({ ...newComponent, weight: Number(e.target.value) })
                                    }
                                    className="bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                />

                                <input
                                    type="number"
                                    placeholder="Got"
                                    value={newComponent.obtained_marks}
                                    onChange={(e) =>
                                        setNewComponent({ ...newComponent, obtained_marks: e.target.value })
                                    }
                                    className="bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                />

                                <button
                                    onClick={handleAddComponent}
                                    disabled={saving}
                                    className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold px-6 py-3 rounded-xl transition shadow-lg hover:shadow-green-500/20"
                                >
                                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Subjects */}
                    <div className="space-y-4">
                        {allSubjects.length === 0 ? (
                            <div className="bg-linear-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700/50 p-12 text-center">
                                <AlertCircle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                                <p className="text-gray-400 text-lg">No subjects yet. Add a component to get started!</p>
                            </div>
                        ) : (
                            allSubjects.map(subject => (
                                <div
                                    key={subject.subject_name}
                                    className="group bg-linear-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700/50 overflow-hidden hover:border-slate-600 transition"
                                >
                                    {/* Subject Header */}
                                    <div
                                        onClick={() =>
                                            setExpandedSubject(expandedSubject === subject.subject_name ? null : subject.subject_name)
                                        }
                                        className="p-6 cursor-pointer hover:bg-slate-700/30 transition"
                                    >
                                        <div className="flex items-center justify-between gap-4 mb-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-3 flex-wrap">
                                                    <h3 className="text-2xl font-black text-white truncate">{subject.subject_name}</h3>
                                                    <span className={`px-4 py-1 rounded-full text-sm font-bold ${
                                                        subject.grade === 'O' ? 'bg-orange-500/20 text-orange-300' :
                                                        subject.grade === 'A+' ? 'bg-red-500/20 text-red-300' :
                                                        subject.grade === 'A' ? 'bg-purple-500/20 text-purple-300' :
                                                        subject.grade === 'B+' ? 'bg-blue-500/20 text-blue-300' :
                                                        'bg-gray-500/20 text-gray-300'
                                                    }`}>
                                                        {subject.grade}
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                                                    <span className="font-semibold">Marks: <span className="text-white">{subject.total_obtained.toFixed(1)}/{subject.total_max}</span></span>
                                                    <span className="font-semibold">Score: <span className="text-white">{subject.percentage.toFixed(1)}%</span></span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                {targetMarks[subject.subject_name] && (
                                                    <div className="text-right bg-slate-700/30 rounded-xl px-4 py-3 min-w-max">
                                                        <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Target</p>
                                                        <p className="text-xl font-black text-white">{targetMarks[subject.subject_name]}%</p>
                                                        {canAchieveTarget(subject) ? (
                                                            <p className="text-xs text-green-400 font-bold mt-1">
                                                                Need: {calculateRequiredMarks(subject)?.toFixed(1)} more
                                                            </p>
                                                        ) : (
                                                            <p className="text-xs text-red-400 font-bold mt-1">Not achievable</p>
                                                        )}
                                                    </div>
                                                )}
                                                {expandedSubject === subject.subject_name ? (
                                                    <ChevronUp className="w-6 h-6 text-blue-400 shrink-0" />
                                                ) : (
                                                    <ChevronDown className="w-6 h-6 text-gray-500 shrink-0" />
                                                )}
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="h-3 bg-slate-700/50 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-linear-to-r from-blue-500 to-cyan-400 transition-all duration-500"
                                                style={{ width: `${Math.min(subject.percentage, 100)}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Components List */}
                                    {expandedSubject === subject.subject_name && (
                                        <div className="bg-slate-900/50 border-t border-slate-700/50 p-6 space-y-3">
                                            {subject.components.map(component => (
                                                <div
                                                    key={component.id}
                                                    className="flex items-center gap-4 bg-slate-700/30 rounded-xl p-4 border border-slate-600/30 hover:border-slate-500 transition group"
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-white truncate">{component.component_type}</p>
                                                        <p className="text-xs text-gray-400 font-medium">
                                                            Max: <span className="text-gray-300">{component.max_marks}</span> | Weight: <span className="text-gray-300">{component.weight}%</span>
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max={component.max_marks}
                                                                value={component.obtained_marks || ''}
                                                                onChange={(e) =>
                                                                    handleUpdateMarks(component.id, Number(e.target.value))
                                                                }
                                                                placeholder="0"
                                                                className="w-20 bg-slate-600/50 border border-slate-500 rounded-lg px-3 py-2 text-white text-sm text-center font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            />

                                                            {component.obtained_marks !== null && (
                                                                <span className="text-sm font-black text-blue-400 min-w-12 text-right">
                                                                    {((component.obtained_marks / component.max_marks) * 100).toFixed(0)}%
                                                                </span>
                                                            )}
                                                        </div>

                                                        <button
                                                            onClick={() => handleDeleteComponent(component.id)}
                                                            disabled={saving}
                                                            className="p-2.5 text-red-400 hover:bg-red-500/20 rounded-lg transition disabled:opacity-50 hover:scale-110"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}

                                            {subject.components.length === 0 && (
                                                <p className="text-center text-gray-500 py-6 font-medium">No components added</p>
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

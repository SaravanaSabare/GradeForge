import { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import {
    Calculator,
    TrendingUp,
} from 'lucide-react';
import {
    calculateGradeResult,
    calculateRequiredESE,
    validateComponentMarks,
    getAvailableGrades,
    type ComponentMarks,
    type GradeResult,
} from '../../../services/srmCalculator';
import './styles.css';

export default function MarkCalculator() {
    // Component marks (continuous evaluation)
    const [components, setComponents] = useState<ComponentMarks>({
        cycleTest1: 0,
        cycleTest2: 0,
        assignmentQuiz: 0,
        attendance: 0,
    });
    
    // ESE marks
    const [eseMarks, setESEMarks] = useState<number>(0);
    
    // Target grade for "what if" calculation
    const [targetGrade, setTargetGrade] = useState<string>('A+');
    
    // Validation errors
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    
    // Grade result
    const [gradeResult, setGradeResult] = useState<GradeResult | null>(null);
    
    // Recalculate whenever inputs change
    useEffect(() => {
        const { isValid, errors } = validateComponentMarks(components);
        setValidationErrors(errors);
        
        if (isValid) {
            const result = calculateGradeResult(components, eseMarks);
            setGradeResult(result);
        } else {
            setGradeResult(null);
        }
    }, [components, eseMarks]);
    
    const handleComponentChange = (key: keyof ComponentMarks, value: number) => {
        setComponents(prev => ({
            ...prev,
            [key]: Math.max(0, value),
        }));
    };
    
    const handleESEChange = (value: number) => {
        setESEMarks(Math.max(0, Math.min(40, value)));
    };
    
    const requiredESE = gradeResult ? calculateRequiredESE(components, targetGrade) : null;

    return (
        <DashboardLayout>
            <div className="marks-container">
                <div className="marks-wrapper">
                    {/* Header */}
                    <div className="marks-header">
                        <div className="marks-title">
                            <div className="marks-icon">
                                <Calculator className="w-6 h-6 text-white" />
                            </div>
                            <h1>SRM Grade Calculator</h1>
                        </div>
                        <p className="marks-subtitle">Calculate your internal marks and predict final grade (60-40 system)</p>
                    </div>

                    {/* Validation Errors */}
                    {validationErrors.length > 0 && (
                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1.5rem' }}>
                            {validationErrors.map((error, idx) => (
                                <p key={idx} style={{ color: '#fca5a5', fontSize: '0.875rem', margin: '0.25rem 0' }}>
                                    • {error}
                                </p>
                            ))}
                        </div>
                    )}

                    {/* Input Section */}
                    <div className="form-group" style={{ marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white', marginBottom: '1.5rem', margin: 0 }}>Internal Marks (60)</h2>
                        
                        {/* Cycle Tests */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div>
                                <label className="form-label">Cycle Test 1 (out of 20)</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input
                                        type="number"
                                        min="0"
                                        max="20"
                                        value={components.cycleTest1}
                                        onChange={(e) => handleComponentChange('cycleTest1', parseFloat(e.target.value) || 0)}
                                        className="form-input"
                                        style={{ flex: 1 }}
                                    />
                                    <span style={{ color: '#9ca3af', minWidth: '60px', textAlign: 'right' }}>/ 20</span>
                                </div>
                            </div>

                            <div>
                                <label className="form-label">Cycle Test 2 (out of 20)</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input
                                        type="number"
                                        min="0"
                                        max="20"
                                        value={components.cycleTest2}
                                        onChange={(e) => handleComponentChange('cycleTest2', parseFloat(e.target.value) || 0)}
                                        className="form-input"
                                        style={{ flex: 1 }}
                                    />
                                    <span style={{ color: '#9ca3af', minWidth: '60px', textAlign: 'right' }}>/ 20</span>
                                </div>
                            </div>
                        </div>

                        {/* Assignments & Attendance */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label className="form-label">Assignments / Quiz (out of 10)</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input
                                        type="number"
                                        min="0"
                                        max="10"
                                        value={components.assignmentQuiz}
                                        onChange={(e) => handleComponentChange('assignmentQuiz', parseFloat(e.target.value) || 0)}
                                        className="form-input"
                                        style={{ flex: 1 }}
                                    />
                                    <span style={{ color: '#9ca3af', minWidth: '60px', textAlign: 'right' }}>/ 10</span>
                                </div>
                            </div>

                            <div>
                                <label className="form-label">Attendance (out of 5)</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input
                                        type="number"
                                        min="0"
                                        max="5"
                                        step="0.5"
                                        value={components.attendance}
                                        onChange={(e) => handleComponentChange('attendance', parseFloat(e.target.value) || 0)}
                                        className="form-input"
                                        style={{ flex: 1 }}
                                    />
                                    <span style={{ color: '#9ca3af', minWidth: '60px', textAlign: 'right' }}>/ 5</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ESE Input */}
                    <div className="form-group" style={{ marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white', marginBottom: '1.5rem', margin: 0 }}>End Semester Exam (40)</h2>
                        <div>
                            <label className="form-label">ESE Marks (out of 40)</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input
                                    type="number"
                                    min="0"
                                    max="40"
                                    value={eseMarks}
                                    onChange={(e) => handleESEChange(parseFloat(e.target.value) || 0)}
                                    className="form-input"
                                    style={{ flex: 1, maxWidth: '300px' }}
                                />
                                <span style={{ color: '#9ca3af', minWidth: '60px', textAlign: 'right' }}>/ 40</span>
                            </div>
                        </div>
                    </div>

                    {/* Results */}
                    {gradeResult && (
                        <div>
                            {/* Grade Results */}
                            <div className="stats-grid" style={{ marginBottom: '2rem' }}>
                                <div className="stat-card">
                                    <div className="stat-label">Internal Marks</div>
                                    <div className="stat-value blue">{gradeResult.internalMarks}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>out of 60</div>
                                </div>

                                <div className="stat-card">
                                    <div className="stat-label">ESE Marks</div>
                                    <div className="stat-value purple">{gradeResult.eseMarks}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>out of 40</div>
                                </div>

                                <div className="stat-card">
                                    <div className="stat-label">Total Marks</div>
                                    <div className="stat-value green">{gradeResult.totalMarks}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>out of 100</div>
                                </div>

                                <div className="stat-card">
                                    <div className="stat-label">Grade</div>
                                    <div style={{ fontSize: '2rem', fontWeight: 900, color: '#f59e0b', margin: 0 }}>{gradeResult.grade}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>({gradeResult.percentage.toFixed(1)}%)</div>
                                </div>
                            </div>

                            {/* What if Calculation */}
                            <div className="form-group">
                                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'white', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <TrendingUp className="w-5 h-5 text-blue-400" />
                                    What if I want to achieve...
                                </h3>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'flex-end' }}>
                                    <div>
                                        <label className="form-label">Target Grade</label>
                                        <select
                                            value={targetGrade}
                                            onChange={(e) => setTargetGrade(e.target.value)}
                                            className="form-input"
                                            style={{ cursor: 'pointer' }}
                                        >
                                            {getAvailableGrades().map(grade => (
                                                <option key={grade} value={grade}>{grade}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <div style={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '0.75rem', padding: '0.75rem 1rem', textAlign: 'center' }}>
                                            {requiredESE === null ? (
                                                <div>
                                                    <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: '0 0 0.25rem 0' }}>ESE Required</p>
                                                    <p style={{ color: '#f87171', fontSize: '1.25rem', fontWeight: 900, margin: 0 }}>Not Achievable</p>
                                                </div>
                                            ) : requiredESE <= 0 ? (
                                                <div>
                                                    <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: '0 0 0.25rem 0' }}>ESE Required</p>
                                                    <p style={{ color: '#4ade80', fontSize: '1.25rem', fontWeight: 900, margin: 0 }}>Already Achieved! ✓</p>
                                                </div>
                                            ) : (
                                                <div>
                                                    <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: '0 0 0.25rem 0' }}>ESE Required</p>
                                                    <p style={{ color: '#60a5fa', fontSize: '1.25rem', fontWeight: 900, margin: 0 }}>{requiredESE.toFixed(1)} / 40</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}

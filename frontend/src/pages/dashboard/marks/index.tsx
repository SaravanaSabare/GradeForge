import { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import {
    Calculator,
    Zap,
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
            <div className="calc-wrapper">
                {/* Header */}
                <div className="calc-header glass-panel">
                    <div className="calc-title">
                        <div className="calc-icon">
                            <Calculator className="w-6 h-6" />
                        </div>
                        <div>
                            <h1>SRM Grade Calculator</h1>
                            <p>60-40 Internal & External Evaluation System</p>
                        </div>
                    </div>
                </div>

                <div className="calc-grid">
                    {/* Left Column - Inputs */}
                    <div className="calc-inputs">
                        {/* Validation Errors */}
                        {validationErrors.length > 0 && (
                            <div className="error-banner">
                                {validationErrors.map((error, idx) => (
                                    <p key={idx}>• {error}</p>
                                ))}
                            </div>
                        )}

                        {/* Internal Marks Section */}
                        <div className="input-section glass-card">
                            <div className="section-header">
                                <h2>Internal Marks</h2>
                                <span className="section-max">/ 60</span>
                            </div>
                            <p className="section-desc">Continuous Evaluation</p>
                            
                            <div className="input-grid">
                                <div className="input-group">
                                    <label>Cycle Test 1</label>
                                    <div className="input-wrapper">
                                        <input
                                            type="number"
                                            min="0"
                                            max="20"
                                            value={components.cycleTest1}
                                            onChange={(e) => handleComponentChange('cycleTest1', parseFloat(e.target.value) || 0)}
                                            className="input-glass"
                                        />
                                        <span className="input-max">20</span>
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label>Cycle Test 2</label>
                                    <div className="input-wrapper">
                                        <input
                                            type="number"
                                            min="0"
                                            max="20"
                                            value={components.cycleTest2}
                                            onChange={(e) => handleComponentChange('cycleTest2', parseFloat(e.target.value) || 0)}
                                            className="input-glass"
                                        />
                                        <span className="input-max">20</span>
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label>Assignments / Quiz</label>
                                    <div className="input-wrapper">
                                        <input
                                            type="number"
                                            min="0"
                                            max="10"
                                            value={components.assignmentQuiz}
                                            onChange={(e) => handleComponentChange('assignmentQuiz', parseFloat(e.target.value) || 0)}
                                            className="input-glass"
                                        />
                                        <span className="input-max">10</span>
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label>Attendance</label>
                                    <div className="input-wrapper">
                                        <input
                                            type="number"
                                            min="0"
                                            max="5"
                                            step="0.5"
                                            value={components.attendance}
                                            onChange={(e) => handleComponentChange('attendance', parseFloat(e.target.value) || 0)}
                                            className="input-glass"
                                        />
                                        <span className="input-max">5</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ESE Section */}
                        <div className="input-section glass-card">
                            <div className="section-header">
                                <h2>End Semester Exam</h2>
                                <span className="section-max">/ 40</span>
                            </div>
                            <p className="section-desc">Final Examination</p>
                            
                            <div className="input-group">
                                <label>ESE Marks Scored</label>
                                <div className="input-wrapper">
                                    <input
                                        type="number"
                                        min="0"
                                        max="40"
                                        value={eseMarks}
                                        onChange={(e) => handleESEChange(parseFloat(e.target.value) || 0)}
                                        className="input-glass"
                                    />
                                    <span className="input-max">40</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Results */}
                    <div className="calc-results">
                        {gradeResult && (
                            <>
                                {/* Grade Result Card */}
                                <div className="result-card glass-card result-grade">
                                    <div style={{ position: 'absolute', top: '-20px', right: '20px', width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #7C5CFF, #00E5FF)', filter: 'blur(40px)', opacity: 0.1 }} />
                                    <div style={{ position: 'relative', zIndex: 10 }}>
                                        <p className="result-label">Your Grade</p>
                                        <div className="grade-display">
                                            <span className="grade-letter">{gradeResult.grade}</span>
                                            <span className="grade-percentage">{gradeResult.percentage.toFixed(1)}%</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Marks Breakdown */}
                                <div className="result-card glass-card">
                                    <p className="result-label">Marks Breakdown</p>
                                    <div className="marks-breakdown">
                                        <div className="breakdown-item">
                                            <span className="breakdown-label">Internal</span>
                                            <div className="breakdown-value cyan">{gradeResult.internalMarks.toFixed(1)}<span>/60</span></div>
                                        </div>
                                        <div className="breakdown-item">
                                            <span className="breakdown-label">ESE</span>
                                            <div className="breakdown-value purple">{gradeResult.eseMarks.toFixed(1)}<span>/40</span></div>
                                        </div>
                                        <div className="breakdown-item">
                                            <span className="breakdown-label">Total</span>
                                            <div className="breakdown-value gold">{gradeResult.totalMarks.toFixed(1)}<span>/100</span></div>
                                        </div>
                                    </div>
                                </div>

                                {/* What If Section */}
                                <div className="result-card glass-card whatif-card">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                        <Zap size={16} style={{ color: '#00E5FF' }} />
                                        <p className="result-label">What If?</p>
                                    </div>
                                    
                                    <label className="whatif-label">Target Grade</label>
                                    <select
                                        value={targetGrade}
                                        onChange={(e) => setTargetGrade(e.target.value)}
                                        className="input-glass"
                                        style={{ marginBottom: '1rem' }}
                                    >
                                        {getAvailableGrades().map(grade => (
                                            <option key={grade} value={grade}>{grade}</option>
                                        ))}
                                    </select>

                                    <div className="whatif-result">
                                        {requiredESE === null ? (
                                            <>
                                                <p className="whatif-label">ESE Required</p>
                                                <p className="whatif-value not-achievable">Not Achievable</p>
                                            </>
                                        ) : requiredESE <= 0 ? (
                                            <>
                                                <p className="whatif-label">Status</p>
                                                <p className="whatif-value achieved">✓ Already Achieved!</p>
                                            </>
                                        ) : (
                                            <>
                                                <p className="whatif-label">ESE Score Needed</p>
                                                <p className="whatif-value needed">{requiredESE.toFixed(1)} / 40</p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

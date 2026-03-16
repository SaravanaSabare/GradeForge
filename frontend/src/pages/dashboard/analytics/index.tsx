import { useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import { supabase } from '../../../services/supabase';
import { TrendingUp, BarChart3, Activity, Target, Award, Zap, AlertCircle } from 'lucide-react';
import { Line, Bar, Radar, Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    RadarController,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    RadarController,
    Tooltip,
    Legend,
    Filler
);

interface SemesterData {
    semester: number;
    gpa: number;
    credits: number;
    subjects: number;
}

interface SubjectAnalytics {
    subject_name: string;
    grade_points: number;
    credits: number;
    semester: number;
}

export default function Analytics() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [semesters, setSemesters] = useState<SemesterData[]>([]);
    const [subjects, setSubjects] = useState<SubjectAnalytics[]>([]);
    const [cgpa, setCgpa] = useState(0);
    const [highestSem, setHighestSem] = useState(0);
    const [lowestSem, setLowestSem] = useState(0);
    const [avgGpa, setAvgGpa] = useState(0);
    const [improvement, setImprovement] = useState(0);
    const [gpaProjection, setGpaProjection] = useState(0);

    useEffect(() => {
        if (!user) return;
        loadAnalytics();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const loadAnalytics = async () => {
        setLoading(true);
        try {
            const { data: gradeData, error } = await supabase
                .from('semester_grades')
                .select('*')
                .eq('user_id', user!.id)
                .order('semester');

            if (error || !gradeData) {
                setLoading(false);
                return;
            }

            // Process semester data
            const semesterMap: Record<number, SemesterData> = {};
            let totalCredits = 0;
            let totalPoints = 0;

            gradeData.forEach((row) => {
                const sem = row.semester;
                const credits = Number(row.credits) || 0;
                const gp = Number(row.grade_points) || 0;

                totalCredits += credits;
                totalPoints += credits * gp;

                if (!semesterMap[sem]) {
                    semesterMap[sem] = { semester: sem, gpa: 0, credits: 0, subjects: 0 };
                }

                semesterMap[sem].credits += credits;
                semesterMap[sem].gpa += gp * credits;
                semesterMap[sem].subjects += 1;
            });

            // Calculate GPA for each semester
            const semesterArray = Object.values(semesterMap).map((s) => ({
                ...s,
                gpa: s.credits > 0 ? Number((s.gpa / s.credits).toFixed(2)) : 0,
            }));

            setSemesters(semesterArray);
            setSubjects(gradeData as SubjectAnalytics[]);

            // Calculate metrics
            const overallCgpa = totalCredits > 0 ? Number((totalPoints / totalCredits).toFixed(2)) : 0;
            setCgpa(overallCgpa);

            if (semesterArray.length > 0) {
                const gpas = semesterArray.map((s) => s.gpa);
                const highest = Math.max(...gpas);
                const lowest = Math.min(...gpas);
                const avg = Number((gpas.reduce((a, b) => a + b, 0) / gpas.length).toFixed(2));

                setHighestSem(highest);
                setLowestSem(lowest);
                setAvgGpa(avg);

                // Improvement: trend from first to last semester
                if (semesterArray.length > 1) {
                    const firstGpa = semesterArray[0].gpa;
                    const lastGpa = semesterArray[semesterArray.length - 1].gpa;
                    setImprovement(Number((lastGpa - firstGpa).toFixed(2)));
                }

                // Simple GPA projection for next semester
                if (semesterArray.length > 1) {
                    const recentGpas = semesterArray.slice(-3).map((s) => s.gpa);
                    const trend = recentGpas[recentGpas.length - 1] - recentGpas[0];
                    const projected = Number((semesterArray[semesterArray.length - 1].gpa + trend * 0.5).toFixed(2));
                    setGpaProjection(Math.min(10, Math.max(0, projected)));
                }
            }
        } catch (err) {
            console.error('Error loading analytics:', err);
        } finally {
            setLoading(false);
        }
    };

    // Chart data
    const gpaTrendData = {
        labels: semesters.map((s) => `Sem ${s.semester}`),
        datasets: [
            {
                label: 'GPA Trend',
                data: semesters.map((s) => s.gpa),
                borderColor: '#7C5CFF',
                backgroundColor: 'rgba(124, 92, 255, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 6,
                pointBackgroundColor: '#7C5CFF',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
            },
        ],
    };

    const creditsDistribution = {
        labels: semesters.map((s) => `Sem ${s.semester}`),
        datasets: [
            {
                label: 'Credits',
                data: semesters.map((s) => s.credits),
                backgroundColor: '#00E5FF',
                borderColor: '#00E5FF',
                borderWidth: 2,
            },
        ],
    };

    const subjectPerformance = {
        labels: subjects
            .slice(0, 8)
            .map((s) => s.subject_name.substring(0, 12)),
        datasets: [
            {
                label: 'Grade Points',
                data: subjects.slice(0, 8).map((s) => s.grade_points),
                backgroundColor: [
                    '#7C5CFF',
                    '#00E5FF',
                    '#FF4D9D',
                    '#FBBC05',
                    '#10B981',
                    '#F59E0B',
                    '#8B5CF6',
                    '#EC4899',
                ],
                borderWidth: 0,
            },
        ],
    };

    const skillRadar = {
        labels: ['Consistency', 'Improvement', 'Performance', 'Workload', 'Recent Trend'],
        datasets: [
            {
                label: 'Your Profile',
                data: [
                    (avgGpa / 10) * 100,
                    Math.max(0, improvement + 5) * 10,
                    (cgpa / 10) * 100,
                    (semesters.length / 8) * 100,
                    Math.max(0, (semesters[semesters.length - 1]?.gpa || 0) / 10) * 100,
                ],
                borderColor: '#7C5CFF',
                backgroundColor: 'rgba(124, 92, 255, 0.2)',
                pointBackgroundColor: '#7C5CFF',
                borderWidth: 2,
            },
        ],
    };

    const gpaDistribution = {
        labels: ['Excellent (8.5+)', 'Good (7-8.5)', 'Average (5-7)', 'Below Avg (<5)'],
        datasets: [
            {
                data: [
                    semesters.filter((s) => s.gpa >= 8.5).length,
                    semesters.filter((s) => s.gpa >= 7 && s.gpa < 8.5).length,
                    semesters.filter((s) => s.gpa >= 5 && s.gpa < 7).length,
                    semesters.filter((s) => s.gpa < 5).length,
                ],
                backgroundColor: ['#00E5FF', '#7C5CFF', '#FBBC05', '#FF4D9D'],
                borderWidth: 0,
            },
        ],
    };

    const metricCard = (icon: React.ReactNode, label: string, value: string | number, color: string) => (
        <div className="glass-card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ color, fontSize: 20 }}>{icon}</div>
                <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>{label}</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em' }}>{value}</div>
        </div>
    );

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: {
                labels: {
                    color: '#cbd5e1',
                    font: { size: 12, weight: 500 as const },
                    padding: 15,
                },
            },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                titleColor: '#fff',
                bodyColor: '#cbd5e1',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1,
                padding: 12,
                titleFont: { size: 13, weight: 'bold' as const },
                bodyFont: { size: 12 },
            },
        },
        scales: {
            y: {
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                ticks: { color: '#94a3b8', font: { size: 11 } },
            },
            x: {
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                ticks: { color: '#94a3b8', font: { size: 11 } },
            },
        },
    } as const;

    if (loading) {
        return (
            <DashboardLayout>
                <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                    Loading analytics...
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32, maxWidth: 1400, margin: '0 auto' }}>
                {/* Header */}
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <BarChart3 size={28} style={{ color: '#7C5CFF' }} /> Analytics Dashboard
                    </h1>
                    <p style={{ color: '#94a3b8', fontSize: 14 }}>
                        Comprehensive analysis of your academic performance and trends
                    </p>
                </div>

                {/* Key Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                    {metricCard(<TrendingUp size={20} />, 'Overall CGPA', cgpa.toFixed(2), '#7C5CFF')}
                    {metricCard(<Target size={20} />, 'Average GPA', avgGpa.toFixed(2), '#00E5FF')}
                    {metricCard(<Award size={20} />, 'Highest Semester', highestSem.toFixed(2), '#10B981')}
                    {metricCard(<AlertCircle size={20} />, 'Lowest Semester', lowestSem.toFixed(2), '#FF4D9D')}
                    {metricCard(
                        <Zap size={20} />,
                        'Improvement',
                        improvement > 0 ? `+${improvement.toFixed(2)}` : `${improvement.toFixed(2)}`,
                        improvement > 0 ? '#10B981' : '#FF4D9D'
                    )}
                    {metricCard(<Activity size={20} />, 'Projected Next Sem', gpaProjection.toFixed(2), '#FBBC05')}
                </div>

                {/* Charts Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: 24 }}>
                    {/* GPA Trend */}
                    <div className="glass-panel" style={{ padding: 24 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>📈 GPA Trend Over Time</h3>
                        <Line data={gpaTrendData} options={chartOptions as any} height={300} />
                    </div>

                    {/* Credits Distribution */}
                    <div className="glass-panel" style={{ padding: 24 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>📊 Credits per Semester</h3>
                        <Bar data={creditsDistribution} options={chartOptions as any} height={300} />
                    </div>

                    {/* Subject Performance */}
                    <div className="glass-panel" style={{ padding: 24 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>🎯 Top Subject Performance</h3>
                        <Bar
                            data={subjectPerformance}
                            options={{
                                ...chartOptions,
                                indexAxis: 'y' as const,
                            } as any}
                            height={300}
                        />
                    </div>

                    {/* Skill Radar */}
                    <div className="glass-panel" style={{ padding: 24 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>🎪 Performance Radar</h3>
                        <Radar data={skillRadar} options={chartOptions as any} height={300} />
                    </div>

                    {/* GPA Distribution */}
                    <div className="glass-panel" style={{ padding: 24 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>🍰 GPA Distribution</h3>
                        <Doughnut data={gpaDistribution} options={chartOptions as any} height={300} />
                    </div>

                    {/* Detailed Stats */}
                    <div className="glass-panel" style={{ padding: 24 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>📋 Detailed Statistics</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <span style={{ color: '#94a3b8' }}>Total Semesters</span>
                                <span style={{ fontWeight: 600, color: '#cbd5e1' }}>{semesters.length}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <span style={{ color: '#94a3b8' }}>Total Subjects</span>
                                <span style={{ fontWeight: 600, color: '#cbd5e1' }}>{subjects.length}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <span style={{ color: '#94a3b8' }}>Total Credits Earned</span>
                                <span style={{ fontWeight: 600, color: '#cbd5e1' }}>
                                    {semesters.reduce((sum, s) => sum + s.credits, 0)}
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '10px 0' }}>
                                <span style={{ color: '#94a3b8' }}>Grade Consistency</span>
                                <span style={{ fontWeight: 600, color: '#cbd5e1' }}>
                                    {(((highestSem - lowestSem) / 10) * 100).toFixed(0)}% variance
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Insights */}
                <div className="glass-panel" style={{ padding: 24 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>💡 Key Insights</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {improvement > 0 && (
                            <p style={{ fontSize: 13, color: '#10B981' }}>
                                ✅ <strong>Great improvement!</strong> Your GPA has improved by {improvement.toFixed(2)} points overall.
                            </p>
                        )}
                        {improvement < 0 && (
                            <p style={{ fontSize: 13, color: '#FF4D9D' }}>
                                📉 <strong>Attention needed.</strong> Your GPA has declined by {Math.abs(improvement).toFixed(2)} points. Consider focusing on weak areas.
                            </p>
                        )}
                        {avgGpa >= 8.5 && (
                            <p style={{ fontSize: 13, color: '#00E5FF' }}>
                                🌟 <strong>Excellent performance!</strong> Your average GPA of {avgGpa.toFixed(2)} is outstanding.
                            </p>
                        )}
                        <p style={{ fontSize: 13, color: '#94a3b8' }}>
                            📊 Based on your recent trend, your GPA for the next semester is projected to be around <strong>{gpaProjection.toFixed(2)}</strong>.
                        </p>
                        <p style={{ fontSize: 13, color: '#94a3b8' }}>
                            💪 You have completed <strong>{semesters.length} semesters</strong> with <strong>{subjects.length} subjects</strong>.
                        </p>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

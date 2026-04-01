import { GraduationCap } from 'lucide-react';

interface Props {
    name: string;
    department_name: string;
    year: number;
    cgpa: number;
    total_credits: number;
    connectionStatus?: 'none' | 'pending_sent' | 'accepted';
    onConnect: () => void;
}

const gradeColor = (gpa: number) =>
    gpa >= 8.5 ? '#00E5FF' : gpa >= 7 ? '#7C5CFF' : gpa >= 5 ? '#FBBC05' : '#FF4D9D';

export default function SMProfileCard({
    name,
    department_name,
    year,
    cgpa,
    total_credits,
    connectionStatus = 'none',
    onConnect,
}: Props) {
    const color = gradeColor(cgpa);

    return (
        <div
            className="glass-card card-hover-glow"
            style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
        >
            {/* Top gradient strip */}
            <div style={{
                height: 6,
                background: `linear-gradient(90deg, ${color}, #7C5CFF)`,
            }} />

            <div style={{ padding: '20px 20px 18px' }}>
                {/* Avatar + Name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    <div style={{
                        width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                        background: `linear-gradient(135deg, ${color}55, #7C5CFF55)`,
                        border: `2px solid ${color}40`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <GraduationCap size={20} color={color} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                        <p style={{ fontWeight: 700, fontSize: 14, color: 'white', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {name}
                        </p>
                        <p style={{ fontSize: 11, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {department_name} · Year {year}
                        </p>
                    </div>
                </div>

                {/* CGPA + Credits row */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                    <div style={{
                        flex: 1, padding: '8px 10px', borderRadius: 10,
                        background: `${color}10`, border: `1px solid ${color}25`,
                        textAlign: 'center',
                    }}>
                        <p style={{ fontSize: 10, color: '#64748b', marginBottom: 2 }}>CGPA</p>
                        <p style={{ fontSize: 18, fontWeight: 800, color, letterSpacing: '-0.03em' }}>
                            {cgpa.toFixed(2)}
                        </p>
                    </div>
                    <div style={{
                        flex: 1, padding: '8px 10px', borderRadius: 10,
                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                        textAlign: 'center',
                    }}>
                        <p style={{ fontSize: 10, color: '#64748b', marginBottom: 2 }}>Credits</p>
                        <p style={{ fontSize: 18, fontWeight: 800, color: '#e2e8f0', letterSpacing: '-0.03em' }}>
                            {total_credits}
                        </p>
                    </div>
                </div>

                {/* Connect button */}
                {connectionStatus === 'none' && (
                    <button onClick={onConnect} className="btn btn-primary" style={{ width: '100%', fontSize: 13 }}>
                        Connect
                    </button>
                )}
                {connectionStatus === 'pending_sent' && (
                    <div style={{
                        width: '100%', padding: '10px', borderRadius: 10, textAlign: 'center',
                        background: 'rgba(251,188,5,0.08)', border: '1px solid rgba(251,188,5,0.2)',
                        fontSize: 13, fontWeight: 600, color: '#FBBC05',
                    }}>
                        Request Sent
                    </div>
                )}
                {connectionStatus === 'accepted' && (
                    <div style={{
                        width: '100%', padding: '10px', borderRadius: 10, textAlign: 'center',
                        background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
                        fontSize: 13, fontWeight: 600, color: '#10B981',
                    }}>
                        Connected ✓
                    </div>
                )}
            </div>
        </div>
    );
}

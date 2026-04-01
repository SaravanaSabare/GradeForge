import { Check, X, GraduationCap, Clock } from 'lucide-react';

export interface RequestItem {
    id: string;
    sender_id: string;
    sender_name: string;
    sender_department: string;
    sender_year: number;
    sender_cgpa: number;
    intro_note: string;
    created_at: string;
}

interface Props {
    request: RequestItem;
    onAccept: (id: string) => void;
    onDecline: (id: string) => void;
    loading?: boolean;
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}

export default function SMRequestCard({ request, onAccept, onDecline, loading = false }: Props) {
    return (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Top row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                    width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, #7C5CFF33, #00E5FF22)',
                    border: '2px solid rgba(124,92,255,0.35)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <GraduationCap size={20} color="#7C5CFF" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: 14, color: 'white', marginBottom: 2 }}>
                        {request.sender_name}
                    </p>
                    <p style={{ fontSize: 12, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {request.sender_department} · Year {request.sender_year} · CGPA {request.sender_cgpa.toFixed(2)}
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    <Clock size={11} color="#475569" />
                    <span style={{ fontSize: 11, color: '#475569' }}>{timeAgo(request.created_at)}</span>
                </div>
            </div>

            {/* Intro note */}
            {request.intro_note && (
                <div style={{
                    padding: '10px 12px', borderRadius: 10,
                    background: 'rgba(124,92,255,0.06)',
                    border: '1px solid rgba(124,92,255,0.15)',
                }}>
                    <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.5, fontStyle: 'italic' }}>
                        "{request.intro_note}"
                    </p>
                </div>
            )}

            {/* Accept / Decline */}
            <div style={{ display: 'flex', gap: 10 }}>
                <button
                    onClick={() => onDecline(request.id)}
                    disabled={loading}
                    className="btn btn-secondary"
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                    <X size={14} />
                    Decline
                </button>
                <button
                    onClick={() => onAccept(request.id)}
                    disabled={loading}
                    className="btn btn-primary"
                    style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                    <Check size={14} />
                    Accept
                </button>
            </div>
        </div>
    );
}

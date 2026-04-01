import { GraduationCap, ChevronRight } from 'lucide-react';

export interface ConnectionItem {
    id: string;
    partner_id: string;
    partner_name: string;
    partner_department: string;
    partner_year: number;
    partner_cgpa: number;
    connected_at: string;
}

interface Props {
    connection: ConnectionItem;
    onClick: () => void;
}

const gradeColor = (gpa: number) =>
    gpa >= 8.5 ? '#00E5FF' : gpa >= 7 ? '#7C5CFF' : gpa >= 5 ? '#FBBC05' : '#FF4D9D';

export default function SMConnectionCard({ connection, onClick }: Props) {
    const color = gradeColor(connection.partner_cgpa);

    return (
        <button
            onClick={onClick}
            className="glass-card card-hover-glow"
            style={{
                width: '100%', textAlign: 'left', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 14,
                background: 'none', border: undefined,
            }}
        >
            {/* Avatar */}
            <div style={{
                width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
                background: `linear-gradient(135deg, ${color}44, #7C5CFF33)`,
                border: `2px solid ${color}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <GraduationCap size={22} color={color} />
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 700, fontSize: 14, color: 'white', marginBottom: 3 }}>
                    {connection.partner_name}
                </p>
                <p style={{ fontSize: 12, color: '#64748b' }}>
                    {connection.partner_department} · Year {connection.partner_year}
                </p>
            </div>

            {/* CGPA pill */}
            <div style={{
                padding: '4px 10px', borderRadius: 20,
                background: `${color}15`, border: `1px solid ${color}30`,
                fontSize: 13, fontWeight: 700, color, flexShrink: 0,
            }}>
                {connection.partner_cgpa.toFixed(2)}
            </div>

            <ChevronRight size={16} color="#475569" style={{ flexShrink: 0 }} />
        </button>
    );
}

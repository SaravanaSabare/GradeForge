import { X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { GraduationCap } from 'lucide-react';

interface DiscoverUser {
    id: string;
    name: string;
    department_name: string;
    year: number;
    cgpa: number;
    total_credits: number;
}

interface Props {
    user: DiscoverUser | null;
    onClose: () => void;
    onSend: (note: string) => void;
    sending?: boolean;
}

export default function SMConnectModal({ user, onClose, onSend, sending = false }: Props) {
    const [note, setNote] = useState('');

    useEffect(() => {
        setNote('');
    }, [user]);

    if (!user) return null;

    const handleSend = () => {
        onSend(note.trim());
    };

    return (
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 50,
                background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 16px',
            }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                className="glass-panel"
                style={{ width: '100%', maxWidth: 460, position: 'relative' }}
            >
                {/* Close */}
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute', top: 16, right: 16,
                        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 8, padding: '4px 6px', cursor: 'pointer', display: 'flex',
                    }}
                >
                    <X size={16} color="#94a3b8" />
                </button>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
                    <div style={{
                        width: 50, height: 50, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #7C5CFF33, #00E5FF22)',
                        border: '2px solid rgba(124,92,255,0.35)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <GraduationCap size={22} color="#7C5CFF" />
                    </div>
                    <div>
                        <p style={{ fontWeight: 700, fontSize: 17, color: 'white', marginBottom: 3 }}>
                            Connect with {user.name}
                        </p>
                        <p style={{ fontSize: 13, color: '#64748b' }}>
                            {user.department_name} · Year {user.year} · CGPA {user.cgpa.toFixed(2)}
                        </p>
                    </div>
                </div>

                {/* Note input */}
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>
                    Intro note <span style={{ fontWeight: 400, color: '#475569' }}>(optional)</span>
                </label>
                <textarea
                    className="input-glass"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    maxLength={280}
                    rows={4}
                    placeholder={`Hi ${user.name.split(' ')[0]}, I'd love to study together!`}
                    style={{ width: '100%', resize: 'none', marginBottom: 6 }}
                />
                <p style={{ fontSize: 11, color: '#475569', textAlign: 'right', marginBottom: 20 }}>
                    {note.length}/280
                </p>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>
                        Cancel
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={sending}
                        className="btn btn-primary"
                        style={{ flex: 2, opacity: sending ? 0.7 : 1 }}
                    >
                        {sending ? 'Sending…' : 'Send Request'}
                    </button>
                </div>
            </div>
        </div>
    );
}

import { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../services/supabase';
import { Shield, FileText, CheckCircle, XCircle, Users, AlertCircle } from 'lucide-react';

interface Material {
    id: string;
    title: string;
    description: string;
    file_type: string;
    file_url: string;
    created_at: string;
    status: string;
    rejection_reason: string | null;
    year: number;
    exam: string;
    uploader: Array<{
        university_id: string;
        name: string;
        roll_number: string;
    }>;
}

interface UserRow {
    id: string;
    name: string;
    email: string;
    roll_number: string;
    role: 'student' | 'moderator' | 'admin';
    created_at: string;
}

export default function AdminDashboard() {
    const { profile } = useAuth();
    const [activeTab, setActiveTab] = useState<'materials' | 'users'>('materials');
    const [materials, setMaterials] = useState<Material[]>([]);
    const [usersList, setUsersList] = useState<UserRow[]>([]);
    const [loading, setLoading] = useState(true);

    const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
    const [selectedMaterialId, setSelectedMaterialId] = useState('');
    const [feedbackText, setFeedbackText] = useState('');

    const fetchData = async () => {
        if (!profile?.university_id) return;
        setLoading(true);

        try {
            if (activeTab === 'materials') {
                const { data, error } = await supabase
                    .from('materials')
                    .select(`
                        id, title, description, file_type, file_url, created_at, status, rejection_reason, year, exam,
                        uploader:users!inner(university_id, name, roll_number)
                    `)
                    .eq('uploader.university_id', profile.university_id)
                    .eq('status', 'pending')
                    .order('created_at', { ascending: false });
                
                if (!error && data) setMaterials(data as Material[]);
            } else if (activeTab === 'users' && profile.role === 'admin') {
                const { data, error } = await supabase
                    .from('users')
                    .select('id, name, email, roll_number, role, created_at')
                    .eq('university_id', profile.university_id)
                    .order('created_at', { ascending: false });
                
                if (!error && data) setUsersList(data as UserRow[]);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeTab, profile?.university_id]);

    const handleApprove = async (id: string) => {
        const { error } = await supabase.from('materials').update({ status: 'approved', rejection_reason: null }).eq('id', id);
        if (!error) fetchData();
    };

    const handleRejectClick = (id: string) => {
        setSelectedMaterialId(id);
        setFeedbackText('');
        setFeedbackModalOpen(true);
    };

    const confirmReject = async () => {
        if (!selectedMaterialId) return;
        const { error } = await supabase.from('materials').update({ status: 'rejected', rejection_reason: feedbackText }).eq('id', selectedMaterialId);
        if (!error) {
            setFeedbackModalOpen(false);
            fetchData();
        }
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        const { error } = await supabase.from('users').update({ role: newRole }).eq('id', userId);
        if (!error) fetchData();
    };

    if (profile?.role !== 'moderator' && profile?.role !== 'admin') {
        return (
            <DashboardLayout>
                <div style={{ padding: 40, textAlign: 'center' }}>
                    <Shield size={48} style={{ margin: '0 auto 16px', color: '#EF4444' }} />
                    <h2 style={{ fontSize: 20, fontWeight: 600 }}>Access Denied</h2>
                    <p style={{ color: '#94a3b8', marginTop: 8 }}>You do not have permission to view this page.</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 32 }}>
                
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                            <Shield size={22} style={{ color: '#FF4D9D' }} /> Moderation Panel
                        </h1>
                        <p style={{ fontSize: 13, color: '#94a3b8' }}>Review uploaded materials to ensure quality for {(profile as any)?.universities?.name}.</p>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="glass-panel" style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ display: 'flex', padding: 4, borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(11,15,26,0.7)' }}>
                        <button onClick={() => setActiveTab('materials')} style={{ padding: '8px 20px', borderRadius: 8, fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer', transition: 'all 0.2s', background: activeTab === 'materials' ? 'rgba(255,255,255,0.08)' : 'transparent', color: activeTab === 'materials' ? 'white' : '#64748b' }}>
                            <FileText size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }}/> Pending Materials
                        </button>
                        {profile?.role === 'admin' && (
                            <button onClick={() => setActiveTab('users')} style={{ padding: '8px 20px', borderRadius: 8, fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer', transition: 'all 0.2s', background: activeTab === 'users' ? 'rgba(255,255,255,0.08)' : 'transparent', color: activeTab === 'users' ? 'white' : '#64748b' }}>
                                <Users size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }}/> User Directory
                            </button>
                        )}
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading data...</div>
                ) : activeTab === 'materials' ? (
                    materials.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {materials.map((m) => (
                                <div key={m.id} className="glass-card" style={{ padding: 20, display: 'flex', gap: 20, alignItems: 'center' }}>
                                    <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(0,229,255,0.08)', color: '#00E5FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <FileText size={24} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{m.title}</h3>
                                        <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8 }}>{m.year} Year • {m.exam} • Uploaded by {m.uploader[0]?.name} ({m.uploader[0]?.roll_number})</p>
                                        <a href={m.file_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#7C5CFF', fontWeight: 500, textDecoration: 'underline' }}>View File</a>
                                    </div>
                                    <div style={{ display: 'flex', gap: 12 }}>
                                        <button onClick={() => handleApprove(m.id)} className="btn" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', fontSize: 12, padding: '8px 16px' }}>
                                            <CheckCircle size={16} /> Approve
                                        </button>
                                        <button onClick={() => handleRejectClick(m.id)} className="btn" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', fontSize: 12, padding: '8px 16px' }}>
                                            <XCircle size={16} /> Reject
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ padding: 60, textAlign: 'center', color: '#64748b', background: 'rgba(255,255,255,0.01)', borderRadius: 16, border: '1px dashed rgba(255,255,255,0.1)' }}>
                            <CheckCircle size={48} style={{ margin: '0 auto 16px', opacity: 0.5, color: '#10B981' }} />
                            <h3 style={{ fontSize: 16, color: '#cbd5e1', marginBottom: 8 }}>All caught up!</h3>
                            <p style={{ fontSize: 13, maxWidth: 400, margin: '0 auto' }}>There are no pending materials to review at this time.</p>
                        </div>
                    )
                ) : (
                    <div className="glass-panel" style={{ overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#94a3b8', textAlign: 'left' }}>
                                    <th style={{ padding: '16px 20px', fontWeight: 500 }}>Name</th>
                                    <th style={{ padding: '16px 20px', fontWeight: 500 }}>Roll Number</th>
                                    <th style={{ padding: '16px 20px', fontWeight: 500 }}>Joined</th>
                                    <th style={{ padding: '16px 20px', fontWeight: 500 }}>Role</th>
                                </tr>
                            </thead>
                            <tbody>
                                {usersList.map((usr) => (
                                    <tr key={usr.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                        <td style={{ padding: '16px 20px' }}>
                                            <div style={{ fontWeight: 500, color: '#cbd5e1' }}>{usr.name}</div>
                                            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{usr.email}</div>
                                        </td>
                                        <td style={{ padding: '16px 20px', color: '#94a3b8' }}>{usr.roll_number || 'N/A'}</td>
                                        <td style={{ padding: '16px 20px', color: '#94a3b8' }}>{new Date(usr.created_at).toLocaleDateString()}</td>
                                        <td style={{ padding: '16px 20px' }}>
                                            <select 
                                                value={usr.role || 'student'} 
                                                onChange={(e) => handleRoleChange(usr.id, e.target.value)}
                                                className="input-glass" 
                                                style={{ padding: '6px 12px', width: 'auto', minWidth: 120, fontSize: 12 }}
                                                disabled={usr.id === (profile as any)?.id}
                                            >
                                                <option value="student">Student</option>
                                                <option value="moderator">Moderator</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Feedback Modal */}
                {feedbackModalOpen && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'rgba(2, 6, 23, 0.8)', backdropFilter: 'blur(8px)' }}>
                        <div className="glass-panel" style={{ width: '100%', maxWidth: 400, overflow: 'hidden', position: 'relative', animation: 'scaleIn 0.2s' }}>
                            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                <h3 style={{ fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <AlertCircle size={18} style={{ color: '#EF4444' }}/> Reject Material
                                </h3>
                            </div>
                            <div style={{ padding: 24 }}>
                                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 500, color: '#cbd5e1' }}>Reason for rejection (sent to student)</label>
                                <textarea 
                                    value={feedbackText} 
                                    onChange={(e) => setFeedbackText(e.target.value)} 
                                    placeholder="e.g. Document is blurry, irrelevant, or violates guidelines..." 
                                    className="input-glass" 
                                    style={{ minHeight: 100, resize: 'vertical', marginBottom: 20 }}
                                />
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <button onClick={() => setFeedbackModalOpen(false)} className="btn btn-secondary" style={{ flex: 1, padding: '10px' }}>Cancel</button>
                                    <button onClick={confirmReject} disabled={!feedbackText.trim()} className="btn" style={{ flex: 1, padding: '10px', background: '#EF4444', color: 'white', border: 'none' }}>Reject</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

import { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import { useAuth } from '../../../contexts/AuthContext';
import { FileDown, Search, Filter, Upload, FileText, Star, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '../../../services/supabase';
import UploadMaterialModal from '../../../components/materials/UploadModal';

interface Material {
    id: string;
    title: string;
    description: string;
    file_type: string;
    file_url: string;
    downloads: number;
    rating: number;
    created_at: string;
    status: string;
    rejection_reason?: string;
    uploader_id: string;
    year: number;
    exam: string;
}

export default function StudyMaterials() {
    const { profile } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'browse' | 'my-uploads'>('browse');
    const [materials, setMaterials] = useState<Material[]>([]);
    const [loading, setLoading] = useState(true);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    const fetchMaterials = async () => {
        if (!profile?.university_id) return;
        setLoading(true);

        const query = supabase
            .from('materials')
            .select(`
                id, title, description, file_type, file_url, downloads, rating, created_at, status, rejection_reason, uploader_id, year, exam,
                uploader:users!inner(university_id)
            `)
            .eq('uploader.university_id', profile.university_id)
            .order('created_at', { ascending: false });

        const { data, error } = await query;
        if (!error && data) {
            setMaterials(data as unknown as Material[]);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchMaterials();
    }, [profile?.university_id]);

    const filteredMaterials = materials.filter(m => {
        const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              (m.exam && m.exam.toLowerCase().includes(searchQuery.toLowerCase())) ||
                              (m.year && m.year.toString().includes(searchQuery.toLowerCase()));
        
        if (activeTab === 'browse') {
            return matchesSearch && m.status === 'approved';
        } else {
            return matchesSearch && m.uploader_id === profile?.id;
        }
    });

    const getStatusBadge = (status: string, reason?: string) => {
        if (status === 'approved') return <span style={{ padding: '4px 8px', borderRadius: 6, background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', fontSize: 11, fontWeight: 600 }}>Approved</span>;
        if (status === 'rejected') return <span style={{ padding: '4px 8px', borderRadius: 6, background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', fontSize: 11, fontWeight: 600 }} title={reason}>Rejected</span>;
        return <span style={{ padding: '4px 8px', borderRadius: 6, background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', fontSize: 11, fontWeight: 600 }}>Pending Review</span>;
    };

    return (
        <DashboardLayout>
            <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 32 }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                            <FileDown size={22} style={{ color: '#00E5FF' }} /> Study Portal
                        </h1>
                        <p style={{ fontSize: 13, color: '#94a3b8' }}>Access and share vetted materials for {profile?.universities?.name || 'your university'}.</p>
                    </div>
                    <button onClick={() => setIsUploadModalOpen(true)} className="btn btn-secondary" style={{ color: '#00E5FF', borderColor: 'rgba(0,229,255,0.3)', fontSize: 13 }}>
                        <Upload size={16} /> Upload Material
                    </button>
                </div>

                {/* Toolbar */}
                <div className="glass-panel" style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 80, zIndex: 10 }}>
                    <div style={{ display: 'flex', padding: 4, borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(11,15,26,0.7)' }}>
                        {(['browse', 'my-uploads'] as const).map(key => (
                            <button key={key} onClick={() => setActiveTab(key)} style={{ padding: '8px 20px', borderRadius: 8, fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer', transition: 'all 0.2s', background: activeTab === key ? 'rgba(255,255,255,0.08)' : 'transparent', color: activeTab === key ? 'white' : '#64748b' }}>
                                {key === 'browse' ? 'Browse All' : 'My Uploads'}
                            </button>
                        ))}
                    </div>

                    <div style={{ flex: 1, maxWidth: 400, position: 'relative' }}>
                        <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569', pointerEvents: 'none' }} size={15} />
                        <input type="text" placeholder="Search by subject, code, or topic..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="input-glass" style={{ paddingLeft: 40, padding: '10px 12px 10px 40px', fontSize: 12 }} />
                    </div>

                    <button className="btn btn-secondary" style={{ padding: '10px 16px', fontSize: 12 }}>
                        <Filter size={14} /> Filters
                    </button>
                </div>

                {/* Materials Grid */}
                {loading ? (
                    <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading materials...</div>
                ) : filteredMaterials.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                        {filteredMaterials.map((m) => (
                            <a href={m.status === 'approved' || m.uploader_id === profile?.id ? m.file_url : '#'} target="_blank" rel="noopener noreferrer" key={m.id} className="glass-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', textDecoration: 'none', color: 'inherit' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,229,255,0.08)', color: '#00E5FF' }}>
                                        <FileText size={18} />
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        {activeTab === 'my-uploads' && getStatusBadge(m.status, m.rejection_reason)}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, padding: '4px 8px', borderRadius: 8, background: 'rgba(255,77,157,0.08)', color: '#FF4D9D' }}>
                                            <Star size={12} fill="currentColor" /> {m.rating}
                                        </div>
                                    </div>
                                </div>

                                <h3 style={{ fontWeight: 600, fontSize: 15, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {m.title}
                                </h3>
                                <p style={{ fontSize: 12, color: '#64748b', marginBottom: 12, fontWeight: 500 }}>{m.year} Year • {m.exam}</p>
                                <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6, marginBottom: 20, flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {m.description || 'No description provided.'}
                                </p>
                                
                                {m.status === 'rejected' && m.rejection_reason && (
                                    <div style={{ padding: 8, borderRadius: 8, background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', fontSize: 11, marginBottom: 12, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                                        <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 2 }} />
                                        <span>{m.rejection_reason}</span>
                                    </div>
                                )}

                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: '#64748b', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 12, marginTop: 'auto' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} /> {new Date(m.created_at).toLocaleDateString()}</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#cbd5e1', fontWeight: 500 }}><FileDown size={12} /> {m.downloads}</span>
                                </div>
                            </a>
                        ))}
                    </div>
                ) : (
                    <div style={{ padding: 60, textAlign: 'center', color: '#64748b', background: 'rgba(255,255,255,0.01)', borderRadius: 16, border: '1px dashed rgba(255,255,255,0.1)' }}>
                        <FileText size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                        <h3 style={{ fontSize: 16, color: '#cbd5e1', marginBottom: 8 }}>No materials found</h3>
                        <p style={{ fontSize: 13, maxWidth: 400, margin: '0 auto' }}>
                            {activeTab === 'browse' ? 'No approved materials match your search criteria.' : 'You haven\'t uploaded any materials yet.'}
                        </p>
                    </div>
                )}
            </div>
            <UploadMaterialModal 
                isOpen={isUploadModalOpen} 
                onClose={() => setIsUploadModalOpen(false)} 
                onUploadSuccess={fetchMaterials} 
            />
        </DashboardLayout>
    );
}

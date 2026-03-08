import { useState } from 'react';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import { useAuth } from '../../../contexts/AuthContext';
import { FileDown, Search, Filter, Upload, FileText, Star, Clock } from 'lucide-react';

export default function StudyMaterials() {
    const { profile } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'browse' | 'my-uploads'>('browse');

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
                    <button className="btn btn-secondary" style={{ color: '#00E5FF', borderColor: 'rgba(0,229,255,0.3)', fontSize: 13 }}>
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="glass-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', cursor: 'pointer' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,229,255,0.08)', color: '#00E5FF' }}>
                                    <FileText size={18} />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, padding: '4px 8px', borderRadius: 8, background: 'rgba(255,77,157,0.08)', color: '#FF4D9D' }}>
                                    <Star size={12} fill="currentColor" /> 4.{9 - i}
                                </div>
                            </div>

                            <h3 style={{ fontWeight: 600, fontSize: 15, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                Data Structures Midterm {2026 - i} Solutions
                            </h3>
                            <p style={{ fontSize: 12, color: '#64748b', marginBottom: 12, fontWeight: 500 }}>CS10{i} • Semester 3</p>
                            <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6, marginBottom: 20, flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                Comprehensive notes and solved previous year questions covering Trees, Graphs, and Dynamic Programming concepts.
                            </p>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: '#64748b', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 12, marginTop: 'auto' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} /> 2d ago</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#cbd5e1', fontWeight: 500 }}><FileDown size={12} /> 12{i}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}

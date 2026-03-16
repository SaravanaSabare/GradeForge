import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Calculator, BookOpen, Heart, Settings, LogOut, LayoutDashboard, Menu, X, Shield, BarChart3, BookMarked } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { profile, signOut } = useAuth();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const navItems = [
        { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
        { name: 'CGPA Calculator', path: '/dashboard/calculator', icon: Calculator },
        { name: 'Analytics', path: '/dashboard/analytics', icon: BarChart3 },
        { name: 'Study Notes', path: '/dashboard/notes', icon: BookMarked },
        { name: 'Study Materials', path: '/dashboard/materials', icon: BookOpen },
        { name: 'StudyMatch', path: '/dashboard/studymatch', icon: Heart },
    ];

    if (profile?.role === 'admin' || profile?.role === 'moderator') {
        navItems.push({ name: 'Admin Panel', path: '/dashboard/admin', icon: Shield });
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', background: '#020617' }}>

            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setSidebarOpen(false)}
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 90, display: 'none' }}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`dashboard-sidebar ${sidebarOpen ? 'open' : ''}`}
                style={{ width: 260, position: 'fixed', height: '100vh', zIndex: 100, display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,0.06)', background: 'rgba(11,17,32,0.95)', backdropFilter: 'blur(20px)' }}
            >
                <div style={{ padding: '24px 24px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Link to="/dashboard" className="text-gradient" style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.025em' }}>GradeForge</Link>
                    <button className="mobile-menu-btn" onClick={() => setSidebarOpen(false)} style={{ display: 'none', alignItems: 'center', justifyContent: 'center', padding: 6, borderRadius: 8, background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                        <X size={20} />
                    </button>
                </div>
                {profile?.universities?.name && (
                    <p style={{ fontSize: 11, color: '#64748b', padding: '0 24px', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile.universities.name}</p>
                )}

                <nav style={{ flex: 1, padding: '16px 12px 0', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.name}
                                to={item.path}
                                onClick={() => setSidebarOpen(false)}
                                className={`nav-item ${isActive ? 'nav-active' : ''}`}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 12,
                                    fontSize: 13, fontWeight: 500, textDecoration: 'none',
                                    color: isActive ? '#7C5CFF' : '#94a3b8',
                                }}
                            >
                                <Icon size={17} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div style={{ padding: '0 12px 8px', display: 'flex', flexDirection: 'column', gap: 2, marginTop: 'auto' }}>
                    <Link to="/dashboard/settings" onClick={() => setSidebarOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 12, fontSize: 13, fontWeight: 500, color: '#94a3b8', transition: 'all 0.2s' }}>
                        <Settings size={17} /> Settings
                    </Link>
                    <button onClick={() => signOut()} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 12, fontSize: 13, fontWeight: 500, color: 'rgba(255,77,157,0.7)', background: 'transparent', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', transition: 'all 0.2s' }}>
                        <LogOut size={17} /> Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="dashboard-main" style={{ marginLeft: 260, flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', minHeight: '100vh' }}>
                <div style={{ position: 'absolute', top: 0, left: '33%', width: 600, height: 300, borderRadius: '50%', pointerEvents: 'none', background: '#7C5CFF', filter: 'blur(180px)', opacity: 0.04 }} />

                {/* Header */}
                <header style={{ height: 64, borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', position: 'sticky', top: 0, zIndex: 10, background: 'rgba(2,6,23,0.6)', backdropFilter: 'blur(20px)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)} style={{ display: 'none', alignItems: 'center', justifyContent: 'center', padding: 6, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', cursor: 'pointer' }}>
                            <Menu size={18} />
                        </button>
                        <h2 style={{ fontSize: 14, fontWeight: 600, color: '#cbd5e1' }}>
                            {navItems.find(i => i.path === location.pathname)?.name || 'Dashboard'}
                        </h2>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, background: 'rgba(124,92,255,0.15)', border: '1px solid rgba(124,92,255,0.3)', color: '#7C5CFF' }}>
                            {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 500, color: '#cbd5e1' }}>{profile?.name || 'User'}</span>
                    </div>
                </header>

                <div style={{ flex: 1, padding: '24px 16px', position: 'relative', zIndex: 5 }}>
                    {children}
                </div>
            </main>
        </div>
    );
}

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Calculator, BookOpen, Heart, Settings, LogOut, LayoutDashboard } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { profile, signOut } = useAuth();
    const location = useLocation();

    const navItems = [
        { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
        { name: 'CGPA Calculator', path: '/dashboard/calculator', icon: Calculator },
        { name: 'Study Materials', path: '/dashboard/materials', icon: BookOpen },
        { name: 'StudyMatch', path: '/dashboard/studymatch', icon: Heart },
    ];

    return (
        <div style={{ minHeight: '100vh', display: 'flex', background: '#020617' }}>

            {/* Sidebar */}
            <aside style={{ width: 260, position: 'fixed', height: '100vh', zIndex: 20, display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,0.06)', background: 'rgba(11,17,32,0.85)', backdropFilter: 'blur(20px)' }}>
                <div style={{ padding: '24px 24px 8px' }}>
                    <Link to="/dashboard" className="text-gradient" style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.025em', display: 'block' }}>GradeForge</Link>
                    {profile?.universities?.name && (
                        <p style={{ fontSize: 11, color: '#64748b', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile.universities.name}</p>
                    )}
                </div>

                <nav style={{ flex: 1, padding: '16px 12px 0', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.name}
                                to={item.path}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 12,
                                    fontSize: 13, fontWeight: 500, textDecoration: 'none', transition: 'all 0.2s',
                                    color: isActive ? '#7C5CFF' : '#94a3b8',
                                    background: isActive ? 'rgba(124,92,255,0.12)' : 'transparent',
                                    boxShadow: isActive ? 'inset 3px 0 0 #7C5CFF' : 'none',
                                }}
                            >
                                <Icon size={17} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div style={{ padding: '0 12px 8px', display: 'flex', flexDirection: 'column', gap: 2, marginTop: 'auto' }}>
                    <Link to="/dashboard/settings" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 12, fontSize: 13, fontWeight: 500, color: '#94a3b8', transition: 'all 0.2s' }}>
                        <Settings size={17} /> Settings
                    </Link>
                    <button onClick={() => signOut()} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 12, fontSize: 13, fontWeight: 500, color: 'rgba(255,77,157,0.7)', background: 'transparent', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', transition: 'all 0.2s' }}>
                        <LogOut size={17} /> Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main style={{ marginLeft: 260, flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', minHeight: '100vh' }}>
                {/* Ambient glow */}
                <div style={{ position: 'absolute', top: 0, left: '33%', width: 600, height: 300, borderRadius: '50%', pointerEvents: 'none', background: '#7C5CFF', filter: 'blur(180px)', opacity: 0.04 }} />

                {/* Header */}
                <header style={{ height: 64, borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', position: 'sticky', top: 0, zIndex: 10, background: 'rgba(2,6,23,0.6)', backdropFilter: 'blur(20px)' }}>
                    <h2 style={{ fontSize: 14, fontWeight: 600, color: '#cbd5e1' }}>
                        {navItems.find(i => i.path === location.pathname)?.name || 'Dashboard'}
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, background: 'rgba(124,92,255,0.15)', border: '1px solid rgba(124,92,255,0.3)', color: '#7C5CFF' }}>
                            {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 500, color: '#cbd5e1' }}>{profile?.name || 'User'}</span>
                    </div>
                </header>

                {/* Content */}
                <div style={{ flex: 1, padding: 32, position: 'relative', zIndex: 5 }}>
                    {children}
                </div>
            </main>
        </div>
    );
}

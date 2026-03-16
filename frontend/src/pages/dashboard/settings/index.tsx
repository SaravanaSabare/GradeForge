import { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../services/supabase';
import { Save, Moon, Sun, Bell, Lock, User, Mail, LogOut, Heart } from 'lucide-react';

interface Settings {
    theme: 'dark' | 'light';
    emailNotifications: boolean;
    gpAAlerts: boolean;
    materialNotifications: boolean;
    studyMatchNotifications: boolean;
}

export default function Settings() {
    const { user, profile, signOut } = useAuth();
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [settings, setSettings] = useState<Settings>({
        theme: 'dark',
        emailNotifications: true,
        gpAAlerts: true,
        materialNotifications: true,
        studyMatchNotifications: true,
    });

    const [profileData, setProfileData] = useState({
        name: '',
        email: user?.email || '',
    });

    // Load settings from localStorage
    useEffect(() => {
        const savedSettings = localStorage.getItem('userSettings');
        if (savedSettings) {
            try {
                const parsed = JSON.parse(savedSettings);
                setSettings({ ...settings, ...parsed });
            } catch (e) {
                console.error('Failed to parse settings:', e);
            }
        }

        if (profile) {
            setProfileData({
                name: profile.name || '',
                email: user?.email || '',
            });
        }
    }, [profile]);

    // Apply theme changes
    useEffect(() => {
        const root = document.documentElement;
        if (settings.theme === 'light') {
            root.style.colorScheme = 'light';
            root.style.setProperty('--bg-primary', '#ffffff');
            root.style.setProperty('--bg-secondary', '#f8f9fa');
            root.style.setProperty('--text-primary', '#1a1a1a');
            root.style.setProperty('--text-secondary', '#64748b');
            document.body.style.background = '#ffffff';
        } else {
            root.style.colorScheme = 'dark';
            root.style.setProperty('--bg-primary', '#020617');
            root.style.setProperty('--bg-secondary', '#0f172a');
            root.style.setProperty('--text-primary', '#f1f5f9');
            root.style.setProperty('--text-secondary', '#94a3b8');
            document.body.style.background = '#020617';
        }
    }, [settings.theme]);

    const handleSettingChange = (key: keyof Settings, value: boolean | string) => {
        setSettings((prev) => ({ ...prev, [key]: value }));
    };

    const handleProfileChange = (field: string, value: string) => {
        setProfileData((prev) => ({ ...prev, [field]: value }));
    };

    const saveSettings = async () => {
        setSaving(true);
        setMessage('');

        try {
            // Save settings to localStorage (persists on this device)
            localStorage.setItem('userSettings', JSON.stringify(settings));

            // Save profile updates to database
            if (profileData.name !== profile?.name) {
                const { error } = await supabase
                    .from('users')
                    .update({ name: profileData.name })
                    .eq('id', user?.id);

                if (error) {
                    setMessage('Error saving profile: ' + error.message);
                    setSaving(false);
                    return;
                }
            }

            setMessage('✅ Settings saved successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setMessage('Error saving settings: ' + (err instanceof Error ? err.message : 'Unknown error'));
        } finally {
            setSaving(false);
        }
    };

    const settingCard = (
        icon: React.ReactNode,
        title: string,
        description: string,
        children: React.ReactNode
    ) => (
        <div
            style={{
                padding: 24,
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.02)',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 20,
            }}
        >
            <div style={{ display: 'flex', gap: 12, flex: 1 }}>
                <div style={{ color: '#7C5CFF', marginTop: 2 }}>{icon}</div>
                <div>
                    <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: '#cbd5e1' }}>{title}</h4>
                    <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{description}</p>
                </div>
            </div>
            <div>{children}</div>
        </div>
    );

    return (
        <DashboardLayout>
            <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px' }}>
                {/* Header */}
                <div style={{ marginBottom: 32 }}>
                    <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 8 }}>
                        Settings
                    </h1>
                    <p style={{ color: '#94a3b8', fontSize: 14 }}>
                        Manage your profile, preferences, and notifications
                    </p>
                </div>

                {/* Message */}
                {message && (
                    <div
                        style={{
                            padding: 12,
                            borderRadius: 8,
                            background: message.includes('Error') ? 'rgba(255,77,157,0.1)' : 'rgba(16,185,129,0.1)',
                            color: message.includes('Error') ? '#FF4D9D' : '#10B981',
                            marginBottom: 20,
                            fontSize: 13,
                        }}
                    >
                        {message}
                    </div>
                )}

                {/* Profile Section */}
                <div className="glass-panel" style={{ padding: 24, marginBottom: 24 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <User size={20} style={{ color: '#7C5CFF' }} /> Profile Information
                    </h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div>
                            <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 8 }}>
                                Name
                            </label>
                            <input
                                type="text"
                                value={profileData.name}
                                onChange={(e) => handleProfileChange('name', e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '10px 14px',
                                    borderRadius: 8,
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    background: 'rgba(255,255,255,0.02)',
                                    color: '#cbd5e1',
                                    fontSize: 14,
                                    transition: 'all 0.2s',
                                }}
                                onFocus={(e) => {
                                    e.currentTarget.style.borderColor = 'rgba(124,92,255,0.3)';
                                    e.currentTarget.style.background = 'rgba(124,92,255,0.05)';
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 8 }}>
                                Email
                            </label>
                            <input
                                type="email"
                                value={profileData.email}
                                disabled
                                style={{
                                    width: '100%',
                                    padding: '10px 14px',
                                    borderRadius: 8,
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    background: 'rgba(255,255,255,0.02)',
                                    color: '#64748b',
                                    fontSize: 14,
                                    cursor: 'not-allowed',
                                    opacity: 0.6,
                                }}
                            />
                            <p style={{ fontSize: 11, color: '#64748b', marginTop: 6 }}>
                                📧 To change your email, please contact support.
                            </p>
                        </div>

                        <div>
                            <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 8 }}>
                                University
                            </label>
                            <input
                                type="text"
                                value={profile?.universities?.name || ''}
                                disabled
                                style={{
                                    width: '100%',
                                    padding: '10px 14px',
                                    borderRadius: 8,
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    background: 'rgba(255,255,255,0.02)',
                                    color: '#64748b',
                                    fontSize: 14,
                                    cursor: 'not-allowed',
                                    opacity: 0.6,
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Theme Section */}
                <div className="glass-panel" style={{ padding: 24, marginBottom: 24 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                        {settings.theme === 'dark' ? <Moon size={20} style={{ color: '#7C5CFF' }} /> : <Sun size={20} style={{ color: '#FBBC05' }} />} Appearance
                    </h2>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
                        {/* Dark Theme */}
                        <div
                            onClick={() => handleSettingChange('theme', 'dark')}
                            style={{
                                padding: 16,
                                borderRadius: 10,
                                border: settings.theme === 'dark' ? '2px solid #7C5CFF' : '1px solid rgba(255,255,255,0.1)',
                                background: settings.theme === 'dark' ? 'rgba(124,92,255,0.1)' : 'rgba(255,255,255,0.02)',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 8,
                            }}
                            onMouseEnter={(e) => {
                                if (settings.theme !== 'dark') {
                                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,92,255,0.3)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (settings.theme !== 'dark') {
                                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)';
                                }
                            }}
                        >
                            <Moon size={24} style={{ color: settings.theme === 'dark' ? '#7C5CFF' : '#64748b' }} />
                            <span style={{ fontSize: 13, fontWeight: 600, color: settings.theme === 'dark' ? '#cbd5e1' : '#94a3b8' }}>
                                Dark Mode
                            </span>
                        </div>

                        {/* Light Theme */}
                        <div
                            onClick={() => handleSettingChange('theme', 'light')}
                            style={{
                                padding: 16,
                                borderRadius: 10,
                                border: settings.theme === 'light' ? '2px solid #FBBC05' : '1px solid rgba(255,255,255,0.1)',
                                background: settings.theme === 'light' ? 'rgba(251,188,5,0.1)' : 'rgba(255,255,255,0.02)',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 8,
                            }}
                            onMouseEnter={(e) => {
                                if (settings.theme !== 'light') {
                                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(251,188,5,0.3)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (settings.theme !== 'light') {
                                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)';
                                }
                            }}
                        >
                            <Sun size={24} style={{ color: settings.theme === 'light' ? '#FBBC05' : '#64748b' }} />
                            <span style={{ fontSize: 13, fontWeight: 600, color: settings.theme === 'light' ? '#cbd5e1' : '#94a3b8' }}>
                                Light Mode
                            </span>
                        </div>
                    </div>
                </div>

                {/* Notifications Section */}
                <div className="glass-panel" style={{ padding: 24, marginBottom: 24 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Bell size={20} style={{ color: '#7C5CFF' }} /> Notifications
                    </h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {settingCard(
                            <Mail size={18} />,
                            'Email Notifications',
                            'Receive email updates about your account activity',
                            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 8 }}>
                                <input
                                    type="checkbox"
                                    checked={settings.emailNotifications}
                                    onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                                    style={{ width: 18, height: 18, cursor: 'pointer' }}
                                />
                                <span style={{ fontSize: 12, color: '#94a3b8' }}>
                                    {settings.emailNotifications ? 'Enabled' : 'Disabled'}
                                </span>
                            </label>
                        )}

                        {settingCard(
                            <TrendingDown size={18} />,
                            'GPA Alerts',
                            'Get notified when your GPA drops below your target',
                            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 8 }}>
                                <input
                                    type="checkbox"
                                    checked={settings.gpAAlerts}
                                    onChange={(e) => handleSettingChange('gpAAlerts', e.target.checked)}
                                    style={{ width: 18, height: 18, cursor: 'pointer' }}
                                />
                                <span style={{ fontSize: 12, color: '#94a3b8' }}>
                                    {settings.gpAAlerts ? 'Enabled' : 'Disabled'}
                                </span>
                            </label>
                        )}

                        {settingCard(
                            <BookOpenIcon size={18} />,
                            'Material Updates',
                            'Notifications for new study materials in your department',
                            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 8 }}>
                                <input
                                    type="checkbox"
                                    checked={settings.materialNotifications}
                                    onChange={(e) => handleSettingChange('materialNotifications', e.target.checked)}
                                    style={{ width: 18, height: 18, cursor: 'pointer' }}
                                />
                                <span style={{ fontSize: 12, color: '#94a3b8' }}>
                                    {settings.materialNotifications ? 'Enabled' : 'Disabled'}
                                </span>
                            </label>
                        )}

                        {settingCard(
                            <Heart size={18} />,
                            'StudyMatch Notifications',
                            'Get notified about new study partner matches',
                            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 8 }}>
                                <input
                                    type="checkbox"
                                    checked={settings.studyMatchNotifications}
                                    onChange={(e) => handleSettingChange('studyMatchNotifications', e.target.checked)}
                                    style={{ width: 18, height: 18, cursor: 'pointer' }}
                                />
                                <span style={{ fontSize: 12, color: '#94a3b8' }}>
                                    {settings.studyMatchNotifications ? 'Enabled' : 'Disabled'}
                                </span>
                            </label>
                        )}
                    </div>
                </div>

                {/* Security Section */}
                <div className="glass-panel" style={{ padding: 24, marginBottom: 24 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Lock size={20} style={{ color: '#7C5CFF' }} /> Security
                    </h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>
                            🔒 Your password and account security settings are managed through your email provider. To change your password, please use the "Forgot Password" option on the login page or contact your provider.
                        </p>
                        <button
                            onClick={() => signOut()}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                                padding: '10px 16px',
                                borderRadius: 8,
                                border: '1px solid rgba(255,77,157,0.3)',
                                background: 'rgba(255,77,157,0.05)',
                                color: '#FF4D9D',
                                fontSize: 13,
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                                (e.currentTarget as HTMLElement).style.background = 'rgba(255,77,157,0.1)';
                            }}
                            onMouseLeave={(e) => {
                                (e.currentTarget as HTMLElement).style.background = 'rgba(255,77,157,0.05)';
                            }}
                        >
                            <LogOut size={16} /> Sign Out
                        </button>
                    </div>
                </div>

                {/* Save Button */}
                <button
                    onClick={saveSettings}
                    disabled={saving}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        padding: '12px 24px',
                        borderRadius: 8,
                        border: 'none',
                        background: saving ? 'rgba(124,92,255,0.5)' : 'linear-gradient(135deg, #7C5CFF 0%, #00E5FF 100%)',
                        color: '#fff',
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: saving ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                        width: '100%',
                    }}
                    onMouseEnter={(e) => {
                        if (!saving) {
                            (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                            (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 16px rgba(124,92,255,0.3)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                    }}
                >
                    <Save size={18} /> {saving ? 'Saving...' : 'Save Settings'}
                </button>
            </div>
        </DashboardLayout>
    );
}

// Icon components for notification types
const TrendingDown = (props: any) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
        <polyline points="17 18 23 18 23 12" />
    </svg>
);

const BookOpenIcon = (props: any) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
);

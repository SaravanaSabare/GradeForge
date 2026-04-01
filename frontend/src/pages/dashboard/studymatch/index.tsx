import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../services/supabase';
import { Users, UserCheck, Inbox, Sparkles, Loader2 } from 'lucide-react';

import SMBrowseGrid from './components/SMBrowseGrid';
import SMConnectModal from './components/SMConnectModal';
import SMRequestCard, { type RequestItem } from './components/SMRequestCard';
import SMConnectionCard, { type ConnectionItem } from './components/SMConnectionCard';
import SMWorkspace from './components/SMWorkspace';

interface DiscoverUser {
    id: string;
    name: string;
    department_name: string;
    year: number;
    cgpa: number;
    total_credits: number;
}

type Tab = 'browse' | 'requests' | 'connections';


export default function StudyMatch() {
    const { user, profile } = useAuth();
    const [tab, setTab] = useState<Tab>('browse');

    // Browse data
    const [discoverUsers, setDiscoverUsers] = useState<DiscoverUser[]>([]);
    const [loadingBrowse, setLoadingBrowse] = useState(true);

    // Sent/accepted IDs to drive card status in Browse
    const [sentIds, setSentIds] = useState<Set<string>>(new Set());
    const [acceptedIds, setAcceptedIds] = useState<Set<string>>(new Set());

    // Connect modal
    const [connectTarget, setConnectTarget] = useState<DiscoverUser | null>(null);
    const [sendingConnect, setSendingConnect] = useState(false);

    // Requests tab
    const [receivedRequests, setReceivedRequests] = useState<RequestItem[]>([]);
    const [loadingRequests, setLoadingRequests] = useState(false);
    const [requestAction, setRequestAction] = useState<string | null>(null);

    // Connections tab
    const [connections, setConnections] = useState<ConnectionItem[]>([]);
    const [loadingConnections, setLoadingConnections] = useState(false);

    // Workspace
    const [openConnection, setOpenConnection] = useState<ConnectionItem | null>(null);

    // ─── Loaders ────────────────────────────────────────────────────────────

    const loadDiscoverUsers = useCallback(async () => {
        if (!user || !profile?.university_id) return;
        setLoadingBrowse(true);
        const { data } = await supabase.rpc('get_discover_users', {
            current_user_id: user.id,
            user_university_id: profile.university_id,
        });
        if (data) setDiscoverUsers(data);
        setLoadingBrowse(false);
    }, [user, profile?.university_id]);

    const loadSentAndAccepted = useCallback(async () => {
        if (!user) return;
        const { data } = await supabase
            .from('connections')
            .select('receiver_id, status')
            .eq('sender_id', user.id);
        if (data) {
            const sent = new Set<string>();
            const accepted = new Set<string>();
            data.forEach((c: { receiver_id: string; status: string }) => {
                if (c.status === 'pending') sent.add(c.receiver_id);
                if (c.status === 'accepted') accepted.add(c.receiver_id);
            });
            setSentIds(sent);
            setAcceptedIds(accepted);
        }
    }, [user]);

    const loadReceivedRequests = useCallback(async () => {
        if (!user) return;
        setLoadingRequests(true);
        const { data } = await supabase
            .from('connections')
            .select(`
                id,
                sender_id,
                intro_note,
                created_at,
                sender:users!sender_id ( id, name, year, cgpa, departments ( name ) )
            `)
            .eq('receiver_id', user.id)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (data) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const items: RequestItem[] = (data as any[]).map((row) => ({
                id: row.id,
                sender_id: row.sender_id,
                sender_name: row.sender?.name ?? 'Unknown',
                sender_department: row.sender?.departments?.name ?? '—',
                sender_year: row.sender?.year ?? 0,
                sender_cgpa: row.sender?.cgpa ?? 0,
                intro_note: row.intro_note ?? '',
                created_at: row.created_at,
            }));
            setReceivedRequests(items);
        }
        setLoadingRequests(false);
    }, [user]);

    const loadConnections = useCallback(async () => {
        if (!user) return;
        setLoadingConnections(true);
        const { data } = await supabase
            .from('connections')
            .select(`
                id,
                sender_id,
                receiver_id,
                created_at,
                sender:users!sender_id ( id, name, year, cgpa, departments ( name ) ),
                receiver:users!receiver_id ( id, name, year, cgpa, departments ( name ) )
            `)
            .eq('status', 'accepted')
            .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
            .order('created_at', { ascending: false });

        if (data) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const items: ConnectionItem[] = (data as any[]).map((row) => {
                const isSender = row.sender_id === user.id;
                const partner = isSender ? row.receiver : row.sender;
                return {
                    id: row.id,
                    partner_id: partner?.id ?? '',
                    partner_name: partner?.name ?? 'Unknown',
                    partner_department: partner?.departments?.name ?? '—',
                    partner_year: partner?.year ?? 0,
                    partner_cgpa: partner?.cgpa ?? 0,
                    connected_at: row.created_at,
                };
            });
            setConnections(items);
        }
        setLoadingConnections(false);
    }, [user]);

    // ─── Mount + tab change ─────────────────────────────────────────────────

    useEffect(() => {
        loadDiscoverUsers();
        loadSentAndAccepted();
    }, [loadDiscoverUsers, loadSentAndAccepted]);

    useEffect(() => {
        if (tab === 'requests') loadReceivedRequests();
        if (tab === 'connections') loadConnections();
    }, [tab, loadReceivedRequests, loadConnections]);

    // ─── Actions ────────────────────────────────────────────────────────────

    const handleSendRequest = async (note: string) => {
        if (!connectTarget || !user) return;
        setSendingConnect(true);
        await supabase.from('connections').insert({
            sender_id: user.id,
            receiver_id: connectTarget.id,
            status: 'pending',
            intro_note: note,
        });
        setSentIds(prev => new Set(prev).add(connectTarget.id));
        setSendingConnect(false);
        setConnectTarget(null);
    };

    const handleAccept = async (id: string) => {
        setRequestAction(id);
        await supabase.from('connections').update({ status: 'accepted' }).eq('id', id);
        setReceivedRequests(prev => prev.filter(r => r.id !== id));
        setRequestAction(null);
        loadConnections();
    };

    const handleDecline = async (id: string) => {
        setRequestAction(id);
        await supabase.from('connections').update({ status: 'rejected' }).eq('id', id);
        setReceivedRequests(prev => prev.filter(r => r.id !== id));
        setRequestAction(null);
    };

    // ─── Nav ────────────────────────────────────────────────────────────────

    const navItems: { key: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
        { key: 'browse', label: 'Browse', icon: <Users size={15} /> },
        { key: 'requests', label: 'Requests', icon: <Inbox size={15} />, badge: receivedRequests.length },
        { key: 'connections', label: 'Connections', icon: <UserCheck size={15} /> },
    ];

    // ─── Workspace full-screen override ─────────────────────────────────────

    if (openConnection) {
        return (
            <DashboardLayout>
                <div style={{ maxWidth: 700, margin: '0 auto' }}>
                    <SMWorkspace
                        connection={openConnection}
                        currentUserId={user!.id}
                        onBack={() => setOpenConnection(null)}
                    />
                </div>
            </DashboardLayout>
        );
    }

    // ─── Main render ─────────────────────────────────────────────────────────

    return (
        <DashboardLayout>
            <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Page header */}
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <Sparkles size={22} style={{ color: '#FF4D9D' }} />
                        StudyMatch
                    </h1>
                    <p style={{ fontSize: 13, color: '#94a3b8' }}>
                        Browse study partners, send connection requests, and collaborate.
                    </p>
                </div>

                {/* Tab bar */}
                <div className="glass-panel" style={{ padding: '5px 5px', display: 'flex', gap: 4 }}>
                    {navItems.map(item => (
                        <button
                            key={item.key}
                            onClick={() => setTab(item.key)}
                            className={tab === item.key ? 'nav-item nav-active' : 'nav-item'}
                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '11px 0', fontSize: 13 }}
                        >
                            {item.icon}
                            {item.label}
                            {item.badge != null && item.badge > 0 && (
                                <span style={{ fontSize: 11, fontWeight: 700, background: item.key === 'requests' ? '#FF4D9D' : '#7C5CFF', color: 'white', borderRadius: 20, padding: '1px 7px', lineHeight: '18px' }}>
                                    {item.badge}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* ── BROWSE ── */}
                {tab === 'browse' && (
                    <SMBrowseGrid
                        users={discoverUsers}
                        loading={loadingBrowse}
                        sentIds={sentIds}
                        acceptedIds={acceptedIds}
                        onConnect={(u) => setConnectTarget(u)}
                    />
                )}

                {/* ── REQUESTS ── */}
                {tab === 'requests' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {loadingRequests ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 180, gap: 10, color: '#64748b' }}>
                                <Loader2 size={18} className="animate-spin" /> Loading requests…
                            </div>
                        ) : receivedRequests.length === 0 ? (
                            <div className="glass-panel" style={{ padding: '48px 24px', textAlign: 'center' }}>
                                <Inbox size={32} color="#334155" style={{ marginBottom: 12, display: 'block', margin: '0 auto 12px' }} />
                                <p style={{ fontWeight: 600, fontSize: 16, marginBottom: 6 }}>No pending requests</p>
                                <p style={{ fontSize: 13, color: '#64748b' }}>
                                    When someone sends you a connection request, it will appear here.
                                </p>
                            </div>
                        ) : (
                            receivedRequests.map(req => (
                                <SMRequestCard
                                    key={req.id}
                                    request={req}
                                    onAccept={handleAccept}
                                    onDecline={handleDecline}
                                    loading={requestAction === req.id}
                                />
                            ))
                        )}
                    </div>
                )}

                {/* ── CONNECTIONS ── */}
                {tab === 'connections' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {loadingConnections ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 180, gap: 10, color: '#64748b' }}>
                                <Loader2 size={18} className="animate-spin" /> Loading connections…
                            </div>
                        ) : connections.length === 0 ? (
                            <div className="glass-panel" style={{ padding: '48px 24px', textAlign: 'center' }}>
                                <UserCheck size={32} color="#334155" style={{ marginBottom: 12, display: 'block', margin: '0 auto 12px' }} />
                                <p style={{ fontWeight: 600, fontSize: 16, marginBottom: 6 }}>No connections yet</p>
                                <p style={{ fontSize: 13, color: '#64748b' }}>
                                    Accept a request or send one from Browse to get started.
                                </p>
                            </div>
                        ) : (
                            connections.map(conn => (
                                <SMConnectionCard
                                    key={conn.id}
                                    connection={conn}
                                    onClick={() => setOpenConnection(conn)}
                                />
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Connect modal (portal-like overlay) */}
            <SMConnectModal
                user={connectTarget}
                onClose={() => setConnectTarget(null)}
                onSend={handleSendRequest}
                sending={sendingConnect}
            />
        </DashboardLayout>
    );
}

import { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../services/supabase';
import { Heart, X, MessageCircle, Users, Loader2, Sparkles, GraduationCap, ArrowRight } from 'lucide-react';

interface DiscoverUser {
    id: string;
    name: string;
    department_name: string;
    year: number;
    cgpa: number;
    total_credits: number;
}

interface Match {
    id: string;
    name: string;
    department_name?: string;
    year?: number;
    cgpa?: number;
    connection_id: string;
    last_message?: string;
    unread?: number;
}

interface Message {
    id: string;
    sender_id: string;
    receiver_id: string;
    message: string;
    created_at: string;
}

type Tab = 'discover' | 'matches' | 'chat';

export default function StudyMatch() {
    const { user, profile } = useAuth();
    const [tab, setTab] = useState<Tab>('discover');
    const [loading, setLoading] = useState(true);
    const [discoverUsers, setDiscoverUsers] = useState<DiscoverUser[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [matches, setMatches] = useState<Match[]>([]);
    const [activeChat, setActiveChat] = useState<Match | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [animating, setAnimating] = useState<'like' | 'pass' | null>(null);
    const [matchPopup, setMatchPopup] = useState<string | null>(null);

    // Load discover users
    useEffect(() => {
        if (!user || !profile?.university_id) return;
        loadDiscoverUsers();
        loadMatches();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, profile?.university_id]);

    const loadDiscoverUsers = async () => {
        setLoading(true);
        const { data, error } = await supabase.rpc('get_discover_users', {
            current_user_id: user!.id,
            user_university_id: profile!.university_id,
        });
        if (!error && data) setDiscoverUsers(data);
        setLoading(false);
    };

    const loadMatches = async () => {
        if (!user) return;
        // Get accepted connections
        const { data: connections } = await supabase
            .from('connections')
            .select('*')
            .eq('status', 'accepted')
            .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

        if (!connections) return;

        const matchList: Match[] = [];
        for (const conn of connections) {
            const matchUserId = conn.sender_id === user.id ? conn.receiver_id : conn.sender_id;
            // Get user info via RPC or direct query
            const { data: userData } = await supabase
                .from('users')
                .select('id, name, year, departments(name)')
                .eq('id', matchUserId)
                .single();

            if (userData) {
                matchList.push({
                    id: userData.id,
                    name: userData.name,
                    department_name: (userData.departments as any)?.name,
                    year: userData.year,
                    connection_id: conn.id,
                });
            }
        }
        setMatches(matchList);
    };

    // Handle like
    const handleLike = async () => {
        const target = discoverUsers[currentIndex];
        if (!target || !user) return;

        setAnimating('like');
        setTimeout(async () => {
            // Check if they already liked us
            const { data: existing } = await supabase
                .from('connections')
                .select('id')
                .eq('sender_id', target.id)
                .eq('receiver_id', user.id)
                .eq('status', 'pending')
                .single();

            if (existing) {
                // It's a match! Update both to accepted
                await supabase.from('connections').update({ status: 'accepted' }).eq('id', existing.id);
                setMatchPopup(target.name);
                loadMatches();
                setTimeout(() => setMatchPopup(null), 3000);
            } else {
                // Send a like
                await supabase.from('connections').insert({ sender_id: user.id, receiver_id: target.id, status: 'pending' });
            }

            setCurrentIndex(i => i + 1);
            setAnimating(null);
        }, 300);
    };

    // Handle pass
    const handlePass = async () => {
        const target = discoverUsers[currentIndex];
        if (!target || !user) return;

        setAnimating('pass');
        setTimeout(async () => {
            await supabase.from('connections').insert({ sender_id: user.id, receiver_id: target.id, status: 'rejected' });
            setCurrentIndex(i => i + 1);
            setAnimating(null);
        }, 300);
    };

    // Chat functionality
    const openChat = async (match: Match) => {
        setActiveChat(match);
        setTab('chat');
        // Load messages
        const { data } = await supabase
            .from('direct_messages')
            .select('*')
            .or(`and(sender_id.eq.${user!.id},receiver_id.eq.${match.id}),and(sender_id.eq.${match.id},receiver_id.eq.${user!.id})`)
            .order('created_at', { ascending: true });

        if (data) setMessages(data);
    };

    // Realtime subscription for messages
    useEffect(() => {
        if (!activeChat || !user) return;
        const channel = supabase
            .channel(`dm-${[user.id, activeChat.id].sort().join('-')}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'direct_messages',
                filter: `receiver_id=eq.${user.id}`,
            }, (payload) => {
                if (payload.new && (payload.new as any).sender_id === activeChat.id) {
                    setMessages(prev => [...prev, payload.new as Message]);
                }
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [activeChat, user]);

    const sendMessage = async () => {
        if (!newMessage.trim() || !activeChat || !user) return;
        const msg = newMessage.trim();
        setNewMessage('');

        // Optimistic update
        const optimistic: Message = {
            id: crypto.randomUUID(),
            sender_id: user.id,
            receiver_id: activeChat.id,
            message: msg,
            created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, optimistic]);

        await supabase.from('direct_messages').insert({
            sender_id: user.id,
            receiver_id: activeChat.id,
            message: msg,
        });
    };

    const currentUser = discoverUsers[currentIndex];
    const gradeColor = (gpa: number) => gpa >= 8.5 ? '#00E5FF' : gpa >= 7 ? '#7C5CFF' : gpa >= 5 ? '#FBBC05' : '#FF4D9D';

    const tabStyle = (t: Tab): React.CSSProperties => ({
        flex: 1, padding: '12px 0', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: tab === t ? 600 : 500,
        cursor: 'pointer', transition: 'all 0.2s', background: tab === t ? 'rgba(124,92,255,0.15)' : 'transparent',
        color: tab === t ? '#7C5CFF' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    });

    return (
        <DashboardLayout>
            <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Header */}
                <div style={{ textAlign: 'center' }}>
                    <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 4 }}>
                        <Sparkles size={22} style={{ color: '#FF4D9D' }} /> StudyMatch
                    </h1>
                    <p style={{ fontSize: 13, color: '#94a3b8' }}>Find study partners at your academic level</p>
                </div>

                {/* Tabs */}
                <div className="glass-panel" style={{ padding: 6, display: 'flex', gap: 4 }}>
                    <button onClick={() => setTab('discover')} style={tabStyle('discover')}>
                        <Heart size={15} /> Discover
                    </button>
                    <button onClick={() => { setTab('matches'); loadMatches(); }} style={tabStyle('matches')}>
                        <Users size={15} /> Matches {matches.length > 0 && <span style={{ fontSize: 11, background: '#FF4D9D', color: 'white', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{matches.length}</span>}
                    </button>
                    <button onClick={() => setTab('chat')} style={tabStyle('chat')}>
                        <MessageCircle size={15} /> Chat
                    </button>
                </div>

                {/* Match Popup */}
                {matchPopup && (
                    <div style={{ padding: 20, borderRadius: 16, textAlign: 'center', background: 'linear-gradient(135deg, rgba(124,92,255,0.2), rgba(255,77,157,0.2))', border: '1px solid rgba(255,77,157,0.3)', animation: 'fadeIn 0.3s ease' }}>
                        <Sparkles size={28} style={{ color: '#FF4D9D', marginBottom: 8 }} />
                        <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>It's a Match! 🎉</h3>
                        <p style={{ color: '#94a3b8', fontSize: 13 }}>You and <strong style={{ color: 'white' }}>{matchPopup}</strong> liked each other. Start chatting!</p>
                    </div>
                )}

                {/* Discover Tab */}
                {tab === 'discover' && (
                    loading ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 12, color: '#64748b' }}>
                            <Loader2 size={20} className="animate-spin" /> Finding study partners...
                        </div>
                    ) : currentUser ? (
                        <div style={{ position: 'relative' }}>
                            <div className="glass-panel" style={{
                                padding: 0, overflow: 'hidden', transition: 'transform 0.3s ease, opacity 0.3s ease',
                                transform: animating === 'like' ? 'translateX(100px) rotate(5deg)' : animating === 'pass' ? 'translateX(-100px) rotate(-5deg)' : 'translateX(0)',
                                opacity: animating ? 0.5 : 1,
                            }}>
                                {/* Card Header Gradient */}
                                <div style={{ height: 120, background: `linear-gradient(135deg, ${gradeColor(currentUser.cgpa)}30, rgba(124,92,255,0.15))`, position: 'relative' }}>
                                    <div style={{ position: 'absolute', bottom: -32, left: '50%', transform: 'translateX(-50%)', width: 64, height: 64, borderRadius: '50%', border: '3px solid #0B1120', background: `linear-gradient(135deg, ${gradeColor(currentUser.cgpa)}, #7C5CFF)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <GraduationCap size={28} color="white" />
                                    </div>
                                </div>

                                <div style={{ padding: '44px 32px 32px', textAlign: 'center' }}>
                                    <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{currentUser.name}</h2>
                                    <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 20 }}>
                                        {currentUser.department_name} • Year {currentUser.year}
                                    </p>

                                    {/* CGPA Badge */}
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '12px 24px', borderRadius: 16, background: `${gradeColor(currentUser.cgpa)}15`, border: `1px solid ${gradeColor(currentUser.cgpa)}30`, marginBottom: 20 }}>
                                        <span style={{ fontSize: 12, color: '#94a3b8' }}>CGPA</span>
                                        <span style={{ fontSize: 28, fontWeight: 900, color: gradeColor(currentUser.cgpa), letterSpacing: '-0.04em' }}>
                                            {currentUser.cgpa.toFixed(2)}
                                        </span>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, fontSize: 11, color: '#64748b', marginBottom: 28 }}>
                                        <span>{currentUser.total_credits} credits earned</span>
                                        <span>•</span>
                                        <span>{profile?.universities?.name}</span>
                                    </div>

                                    {/* Action Buttons */}
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: 20 }}>
                                        <button onClick={handlePass} style={{
                                            width: 60, height: 60, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)',
                                            background: 'rgba(255,255,255,0.03)', cursor: 'pointer', color: '#94a3b8',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                                        }}>
                                            <X size={24} />
                                        </button>
                                        <button onClick={handleLike} style={{
                                            width: 72, height: 72, borderRadius: '50%', border: 'none',
                                            background: 'linear-gradient(135deg, #FF4D9D, #7C5CFF)', cursor: 'pointer', color: 'white',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                                            boxShadow: '0 4px 24px rgba(255,77,157,0.4)',
                                        }}>
                                            <Heart size={28} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <p style={{ textAlign: 'center', color: '#475569', fontSize: 11, marginTop: 12 }}>
                                {discoverUsers.length - currentIndex - 1} more students to discover
                            </p>
                        </div>
                    ) : (
                        <div className="glass-panel" style={{ padding: 48, textAlign: 'center' }}>
                            <Sparkles size={32} style={{ color: '#334155', marginBottom: 12 }} />
                            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No more students</h3>
                            <p style={{ color: '#64748b', fontSize: 13 }}>Check back later for new study partners, or look at your matches!</p>
                        </div>
                    )
                )}

                {/* Matches Tab */}
                {tab === 'matches' && (
                    matches.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {matches.map(m => (
                                <button key={m.id} onClick={() => openChat(m)} className="glass-card" style={{
                                    padding: 16, display: 'flex', alignItems: 'center', gap: 14,
                                    cursor: 'pointer', border: '1px solid rgba(255,255,255,0.06)',
                                    background: 'rgba(255,255,255,0.02)', width: '100%', textAlign: 'left',
                                    borderRadius: 14, transition: 'all 0.2s',
                                }}>
                                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #7C5CFF, #FF4D9D)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <GraduationCap size={20} color="white" />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>{m.name}</p>
                                        <p style={{ fontSize: 12, color: '#64748b' }}>{m.department_name} • Year {m.year}</p>
                                    </div>
                                    <ArrowRight size={16} style={{ color: '#475569' }} />
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="glass-panel" style={{ padding: 48, textAlign: 'center' }}>
                            <Users size={32} style={{ color: '#334155', marginBottom: 12 }} />
                            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No matches yet</h3>
                            <p style={{ color: '#64748b', fontSize: 13 }}>Keep swiping to find your study partners!</p>
                        </div>
                    )
                )}

                {/* Chat Tab */}
                {tab === 'chat' && (
                    activeChat ? (
                        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: 500, overflow: 'hidden' }}>
                            {/* Chat Header */}
                            <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
                                <button onClick={() => { setActiveChat(null); setTab('matches'); }} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}>
                                    ←
                                </button>
                                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #7C5CFF, #FF4D9D)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <GraduationCap size={16} color="white" />
                                </div>
                                <div>
                                    <p style={{ fontSize: 14, fontWeight: 600 }}>{activeChat.name}</p>
                                    <p style={{ fontSize: 11, color: '#64748b' }}>{activeChat.department_name}</p>
                                </div>
                            </div>

                            {/* Messages */}
                            <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {messages.length === 0 && (
                                    <div style={{ textAlign: 'center', color: '#475569', marginTop: 80, fontSize: 13 }}>
                                        <MessageCircle size={24} style={{ marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
                                        Say hi to your study partner!
                                    </div>
                                )}
                                {messages.map(msg => {
                                    const isMine = msg.sender_id === user?.id;
                                    return (
                                        <div key={msg.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                                            <div style={{
                                                maxWidth: '75%', padding: '10px 16px', borderRadius: 16,
                                                borderBottomRightRadius: isMine ? 4 : 16,
                                                borderBottomLeftRadius: isMine ? 16 : 4,
                                                background: isMine ? 'linear-gradient(135deg, #7C5CFF, #6B4FD4)' : 'rgba(255,255,255,0.06)',
                                                fontSize: 13, lineHeight: 1.5, color: 'white',
                                            }}>
                                                {msg.message}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Input */}
                            <div style={{ padding: 12, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 8 }}>
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={e => setNewMessage(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                                    placeholder="Type a message..."
                                    className="input-glass"
                                    style={{ flex: 1, fontSize: 13 }}
                                />
                                <button onClick={sendMessage} className="btn btn-primary" style={{ padding: '10px 16px' }} disabled={!newMessage.trim()}>
                                    Send
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="glass-panel" style={{ padding: 48, textAlign: 'center' }}>
                            <MessageCircle size={32} style={{ color: '#334155', marginBottom: 12 }} />
                            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Select a match</h3>
                            <p style={{ color: '#64748b', fontSize: 13 }}>Go to Matches tab and click on someone to start chatting.</p>
                        </div>
                    )
                )}
            </div>
        </DashboardLayout>
    );
}

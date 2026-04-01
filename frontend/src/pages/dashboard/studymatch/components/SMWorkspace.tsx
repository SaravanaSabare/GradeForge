import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, MessageCircle, Calendar, BookOpen, Send, Loader2 } from 'lucide-react';
import { supabase } from '../../../../services/supabase';
import type { ConnectionItem } from './SMConnectionCard';

interface Message {
    id: string;
    sender_id: string;
    receiver_id: string;
    message: string;
    created_at: string;
}

interface Props {
    connection: ConnectionItem;
    currentUserId: string;
    onBack: () => void;
}

type WorkspaceTab = 'messages' | 'sessions' | 'notes';

export default function SMWorkspace({ connection, currentUserId, onBack }: Props) {
    const [activeTab, setActiveTab] = useState<WorkspaceTab>('messages');
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loadingMessages, setLoadingMessages] = useState(true);
    const [sending, setSending] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    // Load messages
    useEffect(() => {
        setLoadingMessages(true);
        supabase
            .from('direct_messages')
            .select('*')
            .or(
                `and(sender_id.eq.${currentUserId},receiver_id.eq.${connection.partner_id}),` +
                `and(sender_id.eq.${connection.partner_id},receiver_id.eq.${currentUserId})`
            )
            .order('created_at', { ascending: true })
            .then(({ data }) => {
                if (data) setMessages(data);
                setLoadingMessages(false);
            });
    }, [connection.partner_id, currentUserId]);

    // Realtime subscription
    useEffect(() => {
        const channelName = `dm-${[currentUserId, connection.partner_id].sort().join('-')}`;
        const channel = supabase
            .channel(channelName)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'direct_messages',
                filter: `receiver_id=eq.${currentUserId}`,
            }, (payload) => {
                const msg = payload.new as Message;
                if (msg.sender_id === connection.partner_id) {
                    setMessages(prev => [...prev, msg]);
                }
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [currentUserId, connection.partner_id]);

    // Auto-scroll
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async () => {
        if (!newMessage.trim() || sending) return;
        const text = newMessage.trim();
        setNewMessage('');
        setSending(true);

        const optimistic: Message = {
            id: crypto.randomUUID(),
            sender_id: currentUserId,
            receiver_id: connection.partner_id,
            message: text,
            created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, optimistic]);

        await supabase.from('direct_messages').insert({
            sender_id: currentUserId,
            receiver_id: connection.partner_id,
            message: text,
        });
        setSending(false);
    };

    const tabItems: { key: WorkspaceTab; label: string; icon: React.ReactNode }[] = [
        { key: 'messages', label: 'Messages', icon: <MessageCircle size={14} /> },
        { key: 'sessions', label: 'Sessions', icon: <Calendar size={14} /> },
        { key: 'notes', label: 'Notes', icon: <BookOpen size={14} /> },
    ];

    return (
        <div className="glass-panel" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 540 }}>
            {/* Workspace header */}
            <div style={{
                padding: '14px 18px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', gap: 12,
            }}>
                <button
                    onClick={onBack}
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                    <ArrowLeft size={16} color="#94a3b8" />
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: 14, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {connection.partner_name}
                    </p>
                    <p style={{ fontSize: 11, color: '#64748b' }}>
                        {connection.partner_department} · Year {connection.partner_year}
                    </p>
                </div>
            </div>

            {/* Sub-tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 4px' }}>
                {tabItems.map(t => (
                    <button
                        key={t.key}
                        onClick={() => setActiveTab(t.key)}
                        style={{
                            flex: 1, padding: '12px 0', background: 'none', border: 'none', cursor: 'pointer',
                            fontSize: 13, fontWeight: activeTab === t.key ? 600 : 400,
                            color: activeTab === t.key ? '#7C5CFF' : '#64748b',
                            borderBottom: activeTab === t.key ? '2px solid #7C5CFF' : '2px solid transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            transition: 'all 0.18s',
                        }}
                    >
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            {/* Messages tab */}
            {activeTab === 'messages' && (
                <>
                    <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 8, minHeight: 380 }}>
                        {loadingMessages ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 10, color: '#64748b' }}>
                                <Loader2 size={18} className="animate-spin" /> Loading…
                            </div>
                        ) : messages.length === 0 ? (
                            <div style={{ textAlign: 'center', marginTop: 80, color: '#475569' }}>
                                <MessageCircle size={28} style={{ marginBottom: 10, display: 'block', margin: '0 auto 10px' }} />
                                <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Start the conversation</p>
                                <p style={{ fontSize: 12 }}>Say hi to {connection.partner_name.split(' ')[0]}!</p>
                            </div>
                        ) : (
                            messages.map(msg => {
                                const mine = msg.sender_id === currentUserId;
                                return (
                                    <div key={msg.id} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                                        <div style={{
                                            maxWidth: '74%', padding: '10px 14px', borderRadius: 16,
                                            borderBottomRightRadius: mine ? 4 : 16,
                                            borderBottomLeftRadius: mine ? 16 : 4,
                                            background: mine ? 'linear-gradient(135deg, #7C5CFF, #6B4FD4)' : 'rgba(255,255,255,0.06)',
                                            fontSize: 13, lineHeight: 1.5, color: 'white',
                                            wordBreak: 'break-word',
                                        }}>
                                            {msg.message}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {/* Input */}
                    <div style={{
                        padding: '12px 14px',
                        borderTop: '1px solid rgba(255,255,255,0.06)',
                        display: 'flex', gap: 10, alignItems: 'center',
                    }}>
                        <input
                            type="text"
                            className="input-glass"
                            value={newMessage}
                            onChange={e => setNewMessage(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                            placeholder="Type a message…"
                            style={{ flex: 1, fontSize: 13 }}
                        />
                        <button
                            onClick={sendMessage}
                            disabled={!newMessage.trim() || sending}
                            className="btn btn-primary"
                            style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 6, opacity: !newMessage.trim() || sending ? 0.5 : 1 }}
                        >
                            <Send size={15} />
                        </button>
                    </div>
                </>
            )}

            {/* Sessions tab – coming soon */}
            {activeTab === 'sessions' && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center' }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(124,92,255,0.08)', border: '1px solid rgba(124,92,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                        <Calendar size={28} color="#7C5CFF" />
                    </div>
                    <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Study Sessions</p>
                    <p style={{ fontSize: 13, color: '#64748b', maxWidth: 280 }}>
                        Schedule joint study sessions with your partner. <span style={{ color: '#7C5CFF' }}>Coming soon.</span>
                    </p>
                </div>
            )}

            {/* Notes tab – coming soon */}
            {activeTab === 'notes' && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center' }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                        <BookOpen size={28} color="#00E5FF" />
                    </div>
                    <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Shared Notes</p>
                    <p style={{ fontSize: 13, color: '#64748b', maxWidth: 280 }}>
                        Collaborate on notes in real-time with your partner. <span style={{ color: '#00E5FF' }}>Coming soon.</span>
                    </p>
                </div>
            )}
        </div>
    );
}

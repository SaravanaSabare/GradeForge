import { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../services/supabase';
import { generateNoteSummary, generateStudyQuestions, generateNoteTags } from '../../../services/notes';
import { Plus, Search, BookOpen, Lightbulb, Trash2, Edit2, X, Save, Loader, ChevronDown } from 'lucide-react';

interface Note {
    id: string;
    title: string;
    subject_name: string;
    content: string;
    summary?: string;
    tags: string[];
    created_at: string;
    updated_at: string;
}

interface Question {
    id: string;
    note_id: string;
    question: string;
    answer: string;
    created_at: string;
}

export default function Notes() {
    const { user } = useAuth();
    const [notes, setNotes] = useState<Note[]>([]);
    const [questions, setQuestions] = useState<Record<string, Question[]>>({});
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('All');
    const [subjects, setSubjects] = useState<string[]>([]);
    const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);
    const [processingNoteId, setProcessingNoteId] = useState<string | null>(null);
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ title: '', subject_name: '', content: '' });
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newNote, setNewNote] = useState({ title: '', subject_name: '', content: '' });
    const [creatingNote, setCreatingNote] = useState(false);

    // Load notes
    useEffect(() => {
        if (!user) return;
        loadNotes();
    }, [user]);

    const loadNotes = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('notes')
                .select('*')
                .eq('user_id', user!.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const notesData = (data || []) as Note[];
            setNotes(notesData);

            // Extract unique subjects
            const uniqueSubjects = [...new Set(notesData.map(n => n.subject_name))];
            setSubjects(uniqueSubjects);

            // Load questions for each note
            for (const note of notesData) {
                const { data: questionsData } = await supabase
                    .from('note_questions')
                    .select('*')
                    .eq('note_id', note.id);

                if (questionsData) {
                    setQuestions(prev => ({ ...prev, [note.id]: questionsData as Question[] }));
                }
            }
        } catch (err) {
            console.error('Error loading notes:', err);
        } finally {
            setLoading(false);
        }
    };

    const createNote = async () => {
        if (!user || !newNote.title || !newNote.subject_name || !newNote.content) {
            alert('Please fill in all fields');
            return;
        }

        setCreatingNote(true);
        try {
            const { data, error } = await supabase
                .from('notes')
                .insert([{
                    user_id: user.id,
                    title: newNote.title,
                    subject_name: newNote.subject_name,
                    content: newNote.content,
                    tags: [],
                }])
                .select()
                .single();

            if (error) throw error;

            setNotes([data as Note, ...notes]);
            setNewNote({ title: '', subject_name: '', content: '' });
            setShowCreateModal(false);

            // Auto-generate summary and tags
            generateNoteAI(data.id);
        } catch (err) {
            console.error('Error creating note:', err);
            alert('Failed to create note');
        } finally {
            setCreatingNote(false);
        }
    };

    const generateNoteAI = async (noteId: string) => {
        setProcessingNoteId(noteId);
        try {
            const note = notes.find(n => n.id === noteId);
            if (!note) return;

            // Generate summary
            const summary = await generateNoteSummary(note.content, note.subject_name);

            // Generate tags
            const tags = await generateNoteTags(note.content, note.title);

            // Update note
            await supabase
                .from('notes')
                .update({ summary, tags })
                .eq('id', noteId);

            // Generate questions
            const generatedQA = await generateStudyQuestions(
                note.content,
                note.title,
                note.subject_name,
                5
            );

            // Insert questions
            if (generatedQA.length > 0) {
                const questionsToInsert = generatedQA.map(qa => ({
                    note_id: noteId,
                    question: qa.question,
                    answer: qa.answer,
                }));

                await supabase
                    .from('note_questions')
                    .insert(questionsToInsert);
            }

            // Reload notes
            await loadNotes();
        } catch (err) {
            console.error('Error generating AI content:', err);
            alert('Failed to generate AI content');
        } finally {
            setProcessingNoteId(null);
        }
    };

    const updateNote = async (noteId: string) => {
        if (!editForm.title || !editForm.subject_name || !editForm.content) {
            alert('Please fill in all fields');
            return;
        }

        try {
            await supabase
                .from('notes')
                .update({
                    title: editForm.title,
                    subject_name: editForm.subject_name,
                    content: editForm.content,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', noteId);

            setNotes(notes.map(n => 
                n.id === noteId 
                    ? { ...n, ...editForm, updated_at: new Date().toISOString() }
                    : n
            ));
            setEditingNoteId(null);
        } catch (err) {
            console.error('Error updating note:', err);
            alert('Failed to update note');
        }
    };

    const deleteNote = async (noteId: string) => {
        if (!confirm('Are you sure you want to delete this note?')) return;

        try {
            await supabase.from('notes').delete().eq('id', noteId);
            setNotes(notes.filter(n => n.id !== noteId));
        } catch (err) {
            console.error('Error deleting note:', err);
            alert('Failed to delete note');
        }
    };

    // Filter notes
    const filteredNotes = notes.filter(note => {
        const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             note.content.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSubject = selectedSubject === 'All' || note.subject_name === selectedSubject;
        return matchesSearch && matchesSubject;
    });

    return (
        <DashboardLayout>
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
                    <div>
                        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                            <BookOpen size={28} style={{ color: '#7C5CFF' }} /> Study Notes
                        </h1>
                        <p style={{ color: '#94a3b8', fontSize: 14 }}>
                            AI-powered note-taking with automatic summarization and Q&A generation
                        </p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '10px 16px',
                            borderRadius: 8,
                            border: 'none',
                            background: 'linear-gradient(135deg, #7C5CFF 0%, #00E5FF 100%)',
                            color: '#fff',
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                            (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 16px rgba(124,92,255,0.3)';
                        }}
                        onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                            (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                        }}
                    >
                        <Plus size={16} /> New Note
                    </button>
                </div>

                {/* Search & Filter */}
                <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                        <input
                            type="text"
                            placeholder="Search notes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%',
                                paddingLeft: 40,
                                paddingRight: 14,
                                padding: '10px 14px 10px 40px',
                                borderRadius: 8,
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: 'rgba(255,255,255,0.02)',
                                color: '#cbd5e1',
                                fontSize: 14,
                            }}
                        />
                    </div>
                    <select
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        style={{
                            padding: '10px 14px',
                            borderRadius: 8,
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: 'rgba(255,255,255,0.02)',
                            color: '#cbd5e1',
                            fontSize: 14,
                            cursor: 'pointer',
                        }}
                    >
                        <option>All</option>
                        {subjects.map(subject => (
                            <option key={subject}>{subject}</option>
                        ))}
                    </select>
                </div>

                {/* Notes List */}
                {loading ? (
                    <div style={{ textAlign: 'center', color: '#64748b', padding: '40px 20px' }}>Loading notes...</div>
                ) : filteredNotes.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#64748b', padding: '40px 20px' }}>
                        {notes.length === 0 ? 'No notes yet. Create one to get started!' : 'No matching notes found.'}
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {filteredNotes.map(note => (
                            <div
                                key={note.id}
                                className="glass-panel"
                                style={{
                                    padding: 0,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    overflow: 'hidden',
                                }}
                            >
                                {/* Note Header */}
                                <div
                                    onClick={() => setExpandedNoteId(expandedNoteId === note.id ? null : note.id)}
                                    style={{
                                        padding: 24,
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        justifyContent: 'space-between',
                                        gap: 16,
                                        background: expandedNoteId === note.id ? 'rgba(124,92,255,0.05)' : 'transparent',
                                    }}
                                >
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#cbd5e1' }}>
                                                {note.title}
                                            </h3>
                                            {note.tags && note.tags.length > 0 && (
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    {note.tags.slice(0, 2).map((tag, i) => (
                                                        <span
                                                            key={i}
                                                            style={{
                                                                fontSize: 11,
                                                                padding: '4px 8px',
                                                                borderRadius: 4,
                                                                background: 'rgba(124,92,255,0.2)',
                                                                color: '#7C5CFF',
                                                            }}
                                                        >
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12 }}>
                                            {note.subject_name} • Updated {new Date(note.updated_at).toLocaleDateString()}
                                        </p>
                                        {note.summary && (
                                            <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.6 }}>
                                                {note.summary}
                                            </p>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <ChevronDown
                                            size={20}
                                            style={{
                                                color: '#94a3b8',
                                                transform: expandedNoteId === note.id ? 'rotate(180deg)' : 'rotate(0deg)',
                                                transition: 'transform 0.2s',
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Expanded Content */}
                                {expandedNoteId === note.id && (
                                    <div style={{ padding: '0 24px 24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                        {editingNoteId === note.id ? (
                                            // Edit Mode
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                                <input
                                                    type="text"
                                                    placeholder="Note title"
                                                    value={editForm.title}
                                                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                                    style={{
                                                        padding: '10px 14px',
                                                        borderRadius: 8,
                                                        border: '1px solid rgba(255,255,255,0.1)',
                                                        background: 'rgba(255,255,255,0.02)',
                                                        color: '#cbd5e1',
                                                        fontSize: 14,
                                                    }}
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Subject"
                                                    value={editForm.subject_name}
                                                    onChange={(e) => setEditForm({ ...editForm, subject_name: e.target.value })}
                                                    style={{
                                                        padding: '10px 14px',
                                                        borderRadius: 8,
                                                        border: '1px solid rgba(255,255,255,0.1)',
                                                        background: 'rgba(255,255,255,0.02)',
                                                        color: '#cbd5e1',
                                                        fontSize: 14,
                                                    }}
                                                />
                                                <textarea
                                                    placeholder="Note content"
                                                    value={editForm.content}
                                                    onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                                                    style={{
                                                        minHeight: 200,
                                                        padding: '10px 14px',
                                                        borderRadius: 8,
                                                        border: '1px solid rgba(255,255,255,0.1)',
                                                        background: 'rgba(255,255,255,0.02)',
                                                        color: '#cbd5e1',
                                                        fontSize: 14,
                                                        fontFamily: 'monospace',
                                                        resize: 'vertical',
                                                    }}
                                                />
                                                <div style={{ display: 'flex', gap: 12 }}>
                                                    <button
                                                        onClick={() => updateNote(note.id)}
                                                        style={{
                                                            flex: 1,
                                                            padding: '10px 16px',
                                                            borderRadius: 8,
                                                            border: 'none',
                                                            background: 'rgba(16,185,129,0.2)',
                                                            color: '#10B981',
                                                            fontSize: 13,
                                                            fontWeight: 600,
                                                            cursor: 'pointer',
                                                        }}
                                                    >
                                                        <Save size={14} style={{ display: 'inline', marginRight: 6 }} /> Save
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingNoteId(null)}
                                                        style={{
                                                            flex: 1,
                                                            padding: '10px 16px',
                                                            borderRadius: 8,
                                                            border: '1px solid rgba(255,255,255,0.1)',
                                                            background: 'transparent',
                                                            color: '#94a3b8',
                                                            fontSize: 13,
                                                            fontWeight: 600,
                                                            cursor: 'pointer',
                                                        }}
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            // View Mode
                                            <>
                                                <div style={{ marginBottom: 24 }}>
                                                    <h4 style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 12 }}>Content</h4>
                                                    <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.8, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                                                        {note.content}
                                                    </p>
                                                </div>

                                                {/* Study Questions */}
                                                {questions[note.id] && questions[note.id].length > 0 && (
                                                    <div style={{ marginBottom: 24 }}>
                                                        <h4 style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                                                            <Lightbulb size={16} /> Study Questions ({questions[note.id].length})
                                                        </h4>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                                            {questions[note.id].map((q, i) => (
                                                                <div
                                                                    key={q.id}
                                                                    style={{
                                                                        padding: 12,
                                                                        borderRadius: 8,
                                                                        background: 'rgba(124,92,255,0.1)',
                                                                        border: '1px solid rgba(124,92,255,0.2)',
                                                                    }}
                                                                >
                                                                    <p style={{ fontSize: 12, fontWeight: 600, color: '#7C5CFF', marginBottom: 6 }}>
                                                                        Q{i + 1}: {q.question}
                                                                    </p>
                                                                    <p style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.6 }}>
                                                                        {q.answer}
                                                                    </p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Action Buttons */}
                                                <div style={{ display: 'flex', gap: 12, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                                    {processingNoteId === note.id ? (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#7C5CFF', fontSize: 13 }}>
                                                            <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Generating AI content...
                                                        </div>
                                                    ) : !questions[note.id] || questions[note.id].length === 0 ? (
                                                        <button
                                                            onClick={() => generateNoteAI(note.id)}
                                                            style={{
                                                                flex: 1,
                                                                padding: '10px 16px',
                                                                borderRadius: 8,
                                                                border: '1px solid rgba(124,92,255,0.3)',
                                                                background: 'rgba(124,92,255,0.1)',
                                                                color: '#7C5CFF',
                                                                fontSize: 13,
                                                                fontWeight: 600,
                                                                cursor: 'pointer',
                                                            }}
                                                        >
                                                            <Lightbulb size={14} style={{ display: 'inline', marginRight: 6 }} /> Generate Q&A
                                                        </button>
                                                    ) : null}
                                                    <button
                                                        onClick={() => {
                                                            setEditingNoteId(note.id);
                                                            setEditForm({ title: note.title, subject_name: note.subject_name, content: note.content });
                                                        }}
                                                        style={{
                                                            flex: 1,
                                                            padding: '10px 16px',
                                                            borderRadius: 8,
                                                            border: '1px solid rgba(255,255,255,0.1)',
                                                            background: 'rgba(255,255,255,0.02)',
                                                            color: '#94a3b8',
                                                            fontSize: 13,
                                                            fontWeight: 600,
                                                            cursor: 'pointer',
                                                        }}
                                                    >
                                                        <Edit2 size={14} style={{ display: 'inline', marginRight: 6 }} /> Edit
                                                    </button>
                                                    <button
                                                        onClick={() => deleteNote(note.id)}
                                                        style={{
                                                            flex: 1,
                                                            padding: '10px 16px',
                                                            borderRadius: 8,
                                                            border: '1px solid rgba(255,77,157,0.3)',
                                                            background: 'rgba(255,77,157,0.05)',
                                                            color: '#FF4D9D',
                                                            fontSize: 13,
                                                            fontWeight: 600,
                                                            cursor: 'pointer',
                                                        }}
                                                    >
                                                        <Trash2 size={14} style={{ display: 'inline', marginRight: 6 }} /> Delete
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Create Note Modal */}
                {showCreateModal && (
                    <div
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0,0,0,0.7)',
                            zIndex: 50,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 20,
                        }}
                        onClick={() => setShowCreateModal(false)}
                    >
                        <div
                            className="glass-panel"
                            style={{ maxWidth: 600, width: '100%', padding: 32, maxHeight: '90vh', overflowY: 'auto' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#cbd5e1' }}>Create New Note</h2>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    style={{
                                        padding: 8,
                                        borderRadius: 8,
                                        border: 'none',
                                        background: 'rgba(255,255,255,0.05)',
                                        color: '#94a3b8',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div>
                                    <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 8 }}>
                                        Note Title
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g., Chapter 3: Photosynthesis"
                                        value={newNote.title}
                                        onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '10px 14px',
                                            borderRadius: 8,
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            background: 'rgba(255,255,255,0.02)',
                                            color: '#cbd5e1',
                                            fontSize: 14,
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 8 }}>
                                        Subject
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g., Biology"
                                        value={newNote.subject_name}
                                        onChange={(e) => setNewNote({ ...newNote, subject_name: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '10px 14px',
                                            borderRadius: 8,
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            background: 'rgba(255,255,255,0.02)',
                                            color: '#cbd5e1',
                                            fontSize: 14,
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 8 }}>
                                        Content
                                    </label>
                                    <textarea
                                        placeholder="Paste your notes here..."
                                        value={newNote.content}
                                        onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                                        style={{
                                            width: '100%',
                                            minHeight: 300,
                                            padding: '10px 14px',
                                            borderRadius: 8,
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            background: 'rgba(255,255,255,0.02)',
                                            color: '#cbd5e1',
                                            fontSize: 14,
                                            fontFamily: 'monospace',
                                            resize: 'vertical',
                                        }}
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: 12 }}>
                                    <button
                                        onClick={createNote}
                                        disabled={creatingNote}
                                        style={{
                                            flex: 1,
                                            padding: '12px 24px',
                                            borderRadius: 8,
                                            border: 'none',
                                            background: creatingNote ? 'rgba(124,92,255,0.5)' : 'linear-gradient(135deg, #7C5CFF 0%, #00E5FF 100%)',
                                            color: '#fff',
                                            fontSize: 14,
                                            fontWeight: 600,
                                            cursor: creatingNote ? 'not-allowed' : 'pointer',
                                        }}
                                    >
                                        {creatingNote ? 'Creating...' : 'Create Note'}
                                    </button>
                                    <button
                                        onClick={() => setShowCreateModal(false)}
                                        style={{
                                            flex: 1,
                                            padding: '12px 24px',
                                            borderRadius: 8,
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            background: 'transparent',
                                            color: '#94a3b8',
                                            fontSize: 14,
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

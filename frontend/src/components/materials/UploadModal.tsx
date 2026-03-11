import React, { useState, useEffect } from 'react';
import { X, UploadCloud, FileText, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface UploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUploadSuccess: () => void;
}

export default function UploadMaterialModal({ isOpen, onClose, onUploadSuccess }: UploadModalProps) {
    const { user, profile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [file, setFile] = useState<File | null>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [subjectId, setSubjectId] = useState('');
    const [subjects, setSubjects] = useState<{ id: string, subject_code: string, subject_name: string }[]>([]);

    useEffect(() => {
        if (!isOpen || !profile?.university_id) return;

        // Fetch subjects for the user's department/university
        const fetchSubjects = async () => {
            const { data } = await supabase
                .from('subjects')
                .select('id, subject_code, subject_name')
                .eq('department_id', profile.department_id)
                .order('semester');
            
            if (data) setSubjects(data);
        };
        fetchSubjects();
    }, [isOpen, profile]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !user || !subjectId || !title) return;

        setLoading(true);
        setError(null);

        try {
            // 1. Upload to Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
            const filePath = `${user.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('materials')
                .upload(filePath, file);

            if (uploadError) throw new Error(uploadError.message);

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('materials')
                .getPublicUrl(filePath);

            // 3. Create Database Record (status='pending' is default)
            const { error: dbError } = await supabase
                .from('materials')
                .insert({
                    subject_id: subjectId,
                    uploader_id: user.id,
                    file_url: publicUrl,
                    file_type: file.type || fileExt,
                    title,
                    description,
                });

            if (dbError) throw new Error(dbError.message);

            setSuccess(true);
            setTimeout(() => {
                onClose();
                onUploadSuccess();
                // Reset form
                setFile(null);
                setTitle('');
                setDescription('');
                setSubjectId('');
                setSuccess(false);
            }, 2000);

        } catch (err: any) {
            setError(err.message || 'Error uploading file');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'rgba(2, 6, 23, 0.8)', backdropFilter: 'blur(8px)' }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: 500, overflow: 'hidden', position: 'relative', animation: 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                {/* Header */}
                <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: 18, fontWeight: 600 }}>Upload Study Material</h3>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}>
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding: 24 }}>
                    {success ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '32px 0', color: '#10B981', textAlign: 'center' }}>
                            <CheckCircle2 size={48} />
                            <div>
                                <h4 style={{ fontSize: 18, fontWeight: 600, color: 'white', marginBottom: 8 }}>Upload Successful!</h4>
                                <p style={{ fontSize: 13, color: '#94a3b8' }}>Your material has been submitted for review by a moderator. It will appear on the portal once approved.</p>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            {error && (
                                <div style={{ padding: 12, borderRadius: 8, background: 'rgba(255,77,157,0.1)', color: '#FF4D9D', fontSize: 13, border: '1px solid rgba(255,77,157,0.2)' }}>
                                    {error}
                                </div>
                            )}

                            {/* File Drop Area */}
                            <div>
                                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 500, color: '#cbd5e1' }}>File</label>
                                <div style={{ 
                                    border: '1px dashed rgba(255,255,255,0.2)', 
                                    borderRadius: 12, 
                                    padding: '32px 24px', 
                                    textAlign: 'center',
                                    background: 'rgba(255,255,255,0.02)',
                                    cursor: 'pointer',
                                    position: 'relative',
                                    transition: 'all 0.2s'
                                }}
                                onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.background = 'rgba(124,92,255,0.1)'; e.currentTarget.style.borderColor = '#7C5CFF'; }}
                                onDragLeave={(e) => { e.preventDefault(); e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                                onDrop={(e) => { 
                                    e.preventDefault(); 
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) setFile(e.dataTransfer.files[0]);
                                }}
                                >
                                    <input 
                                        type="file" 
                                        onChange={handleFileChange} 
                                        style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 10 }}
                                        accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                                    />
                                    {file ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                                            <FileText size={32} style={{ color: '#00E5FF' }} />
                                            <p style={{ fontSize: 14, fontWeight: 500, color: '#cbd5e1' }}>{file.name}</p>
                                            <p style={{ fontSize: 12, color: '#64748b' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                                            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(124,92,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7C5CFF' }}>
                                                <UploadCloud size={24} />
                                            </div>
                                            <div>
                                                <p style={{ fontSize: 14, fontWeight: 500, color: '#cbd5e1', marginBottom: 4 }}>Click to upload or drag and drop</p>
                                                <p style={{ fontSize: 12, color: '#64748b' }}>PDF, DOCX, PPTX (Max 10MB)</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Title */}
                            <div>
                                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 500, color: '#cbd5e1' }}>Title</label>
                                <input 
                                    type="text" 
                                    value={title} 
                                    onChange={(e) => setTitle(e.target.value)} 
                                    placeholder="e.g. Data Structures Midterm Notes" 
                                    className="input-glass" 
                                    required 
                                />
                            </div>

                            {/* Subject */}
                            <div>
                                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 500, color: '#cbd5e1' }}>Subject</label>
                                <select 
                                    value={subjectId} 
                                    onChange={(e) => setSubjectId(e.target.value)} 
                                    className="input-glass" 
                                    style={{ appearance: 'none' }}
                                    required
                                >
                                    <option value="" disabled>Select subject</option>
                                    {subjects.map(sub => (
                                        <option key={sub.id} value={sub.id}>{sub.subject_code} - {sub.subject_name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Description */}
                            <div>
                                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 500, color: '#cbd5e1' }}>Description (Optional)</label>
                                <textarea 
                                    value={description} 
                                    onChange={(e) => setDescription(e.target.value)} 
                                    placeholder="Briefly describe what this material covers..." 
                                    className="input-glass" 
                                    style={{ minHeight: 80, resize: 'vertical' }}
                                />
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                                <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                                <button type="submit" disabled={loading || !file || !title || !subjectId} className="btn btn-primary" style={{ flex: 1 }}>
                                    {loading ? 'Uploading...' : 'Submit for Review'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

import { useState, useRef, useCallback } from 'react';
import { Camera, Upload, X, Check, Loader2, AlertTriangle, Trash2 } from 'lucide-react';
import { extractGradesFromImage, type ExtractedGrade } from '../../../services/gemini';

const GRADE_MAP: Record<string, number> = {
    'O': 10, 'A+': 9, 'A': 8, 'B+': 7, 'B': 6, 'C': 5, 'F': 0
};

interface Props {
    open: boolean;
    onClose: () => void;
    onImport: (grades: { subject_name: string; subject_code: string; credits: number; grade: string; grade_points: number }[]) => void;
}

type Stage = 'upload' | 'processing' | 'preview' | 'error';

export default function ScreenshotImportModal({ open, onClose, onImport }: Props) {
    const [stage, setStage] = useState<Stage>('upload');
    const [preview, setPreview] = useState<string | null>(null);
    const [extracted, setExtracted] = useState<ExtractedGrade[]>([]);
    const [error, setError] = useState<string>('');
    const [dragOver, setDragOver] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const reset = useCallback(() => {
        setStage('upload');
        setPreview(null);
        setExtracted([]);
        setError('');
    }, []);

    const handleClose = () => {
        reset();
        onClose();
    };

    const processFile = async (f: File) => {
        if (!f.type.startsWith('image/')) {
            setError('Please upload an image file (PNG, JPG, etc.)');
            setStage('error');
            return;
        }
        if (f.size > 10 * 1024 * 1024) {
            setError('Image must be under 10 MB');
            setStage('error');
            return;
        }

        setPreview(URL.createObjectURL(f));
        setStage('processing');

        try {
            const grades = await extractGradesFromImage(f);
            if (grades.length === 0) {
                setError('No grades could be detected in this image. Try a clearer screenshot of your grade report.');
                setStage('error');
                return;
            }
            setExtracted(grades);
            setStage('preview');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
            setError(errorMessage);
            setStage('error');
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const f = e.dataTransfer.files[0];
        if (f) processFile(f);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) processFile(f);
    };

    const handleConfirmImport = () => {
        const rows = extracted.map(g => ({
            subject_name: g.subject_name,
            subject_code: g.subject_code,
            credits: g.credits,
            grade: g.grade,
            grade_points: GRADE_MAP[g.grade] ?? 0,
        }));
        onImport(rows);
        handleClose();
    };

    const removeExtracted = (idx: number) => {
        setExtracted(extracted.filter((_, i) => i !== idx));
    };

    const updateExtracted = (idx: number, field: keyof ExtractedGrade, value: string | number) => {
        setExtracted(extracted.map((g, i) => i === idx ? { ...g, [field]: value } : g));
    };

    if (!open) return null;

    const overlayStyle: React.CSSProperties = {
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
    };

    const modalStyle: React.CSSProperties = {
        width: '100%', maxWidth: stage === 'preview' ? 700 : 500,
        maxHeight: '85vh', overflow: 'auto',
        background: '#0B1120',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 16,
        padding: 0,
        position: 'relative',
    };

    return (
        <div style={overlayStyle} onClick={handleClose}>
            <div style={modalStyle} onClick={e => e.stopPropagation()} className="gradient-border-top">

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Camera size={18} style={{ color: '#7C5CFF' }} />
                        <h3 style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em' }}>
                            {stage === 'upload' && 'Import from Screenshot'}
                            {stage === 'processing' && 'Analyzing Screenshot...'}
                            {stage === 'preview' && 'Review Extracted Grades'}
                            {stage === 'error' && 'Import Error'}
                        </h3>
                    </div>
                    <button onClick={handleClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4, borderRadius: 6 }}>
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding: '24px' }}>

                    {/* UPLOAD STAGE */}
                    {stage === 'upload' && (
                        <div
                            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={handleDrop}
                            onClick={() => fileRef.current?.click()}
                            style={{
                                border: `2px dashed ${dragOver ? '#7C5CFF' : 'rgba(255,255,255,0.08)'}`,
                                borderRadius: 12,
                                padding: '48px 24px',
                                textAlign: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.25s',
                                background: dragOver ? 'rgba(124,92,255,0.04)' : 'rgba(255,255,255,0.01)',
                            }}
                        >
                            <input ref={fileRef} type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />
                            <div style={{ width: 56, height: 56, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', background: 'rgba(124,92,255,0.1)', border: '1px solid rgba(124,92,255,0.15)' }}>
                                <Upload size={24} style={{ color: '#7C5CFF' }} />
                            </div>
                            <p style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 6 }}>
                                Drop your screenshot here
                            </p>
                            <p style={{ fontSize: 13, color: '#64748b' }}>
                                or click to browse • PNG, JPG up to 10 MB
                            </p>
                            <div style={{ marginTop: 20, padding: '12px 16px', borderRadius: 10, background: 'rgba(0,229,255,0.04)', border: '1px solid rgba(0,229,255,0.1)', fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>
                                💡 <strong style={{ color: '#00E5FF' }}>Tip:</strong> Screenshot your grades table from your university portal (e.g., SRM Academia, VIT VTOP). Works best with clear, full-table screenshots.
                            </div>
                        </div>
                    )}

                    {/* PROCESSING STAGE */}
                    {stage === 'processing' && (
                        <div style={{ textAlign: 'center', padding: '32px 0' }}>
                            {preview && (
                                <div style={{ marginBottom: 24, borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', maxHeight: 200 }}>
                                    <img src={preview} alt="Screenshot" style={{ width: '100%', objectFit: 'cover', display: 'block' }} />
                                </div>
                            )}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                                <Loader2 size={28} className="animate-spin" style={{ color: '#7C5CFF' }} />
                                <p style={{ fontSize: 14, color: '#94a3b8' }}>Gemini is reading your grades...</p>
                                <p style={{ fontSize: 12, color: '#475569' }}>This usually takes 3-5 seconds</p>
                            </div>
                        </div>
                    )}

                    {/* PREVIEW STAGE */}
                    {stage === 'preview' && (
                        <div>
                            {preview && (
                                <div style={{ marginBottom: 16, borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', maxHeight: 140 }}>
                                    <img src={preview} alt="Screenshot" style={{ width: '100%', objectFit: 'cover', display: 'block', opacity: 0.6 }} />
                                </div>
                            )}
                            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
                                Found <strong style={{ color: '#00E5FF' }}>{extracted.length}</strong> subject{extracted.length !== 1 ? 's' : ''}. Review and edit before importing:
                            </p>

                            {/* Table header */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 60px 70px 32px', gap: 6, padding: '0 4px', marginBottom: 6 }}>
                                <span style={{ fontSize: 10, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: 1 }}>Subject</span>
                                <span style={{ fontSize: 10, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: 1 }}>Code</span>
                                <span style={{ fontSize: 10, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: 1 }}>Credits</span>
                                <span style={{ fontSize: 10, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: 1 }}>Grade</span>
                                <span />
                            </div>

                            {/* Rows */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 280, overflowY: 'auto' }}>
                                {extracted.map((g, i) => (
                                    <div key={i} className="animate-slideUp" style={{ display: 'grid', gridTemplateColumns: '1fr 80px 60px 70px 32px', gap: 6, alignItems: 'center', animationDelay: `${i * 0.05}s` }}>
                                        <input
                                            value={g.subject_name}
                                            onChange={e => updateExtracted(i, 'subject_name', e.target.value)}
                                            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6, padding: '8px 10px', fontSize: 12, color: 'white', outline: 'none', width: '100%' }}
                                        />
                                        <input
                                            value={g.subject_code}
                                            onChange={e => updateExtracted(i, 'subject_code', e.target.value)}
                                            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6, padding: '8px 10px', fontSize: 12, color: '#94a3b8', outline: 'none', width: '100%' }}
                                        />
                                        <select
                                            title="Credits"
                                            value={g.credits}
                                            onChange={e => updateExtracted(i, 'credits', Number(e.target.value))}
                                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6, padding: '8px 6px', fontSize: 12, color: 'white', outline: 'none', appearance: 'none' as const, textAlign: 'center' }}
                                        >
                                            {[1, 2, 3, 4, 5, 6].map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                        <select
                                            title="Grade"
                                            value={g.grade}
                                            onChange={e => updateExtracted(i, 'grade', e.target.value)}
                                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6, padding: '8px 6px', fontSize: 12, color: '#7C5CFF', fontWeight: 600, outline: 'none', appearance: 'none' as const, textAlign: 'center' }}
                                        >
                                            {['O', 'A+', 'A', 'B+', 'B', 'C', 'F'].map(g => <option key={g} value={g}>{g}</option>)}
                                        </select>
                                        <button
                                            onClick={() => removeExtracted(i)}
                                            style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: 4, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
                                <button onClick={reset} style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', background: 'transparent', color: '#94a3b8', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                                    Try Another
                                </button>
                                <button
                                    onClick={handleConfirmImport}
                                    disabled={extracted.length === 0}
                                    className="btn btn-primary"
                                    style={{ padding: '10px 24px', fontSize: 13, borderRadius: 10, gap: 6 }}
                                >
                                    <Check size={14} /> Import {extracted.length} Subject{extracted.length !== 1 ? 's' : ''}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ERROR STAGE */}
                    {stage === 'error' && (
                        <div style={{ textAlign: 'center', padding: '24px 0' }}>
                            <div style={{ width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', background: 'rgba(255,77,157,0.1)', border: '1px solid rgba(255,77,157,0.15)' }}>
                                <AlertTriangle size={22} style={{ color: '#FF4D9D' }} />
                            </div>
                            <p style={{ fontSize: 14, color: '#e2e8f0', fontWeight: 600, marginBottom: 8 }}>Something went wrong</p>
                            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 24, lineHeight: 1.6, maxWidth: 360, margin: '0 auto 24px' }}>{error}</p>
                            <button onClick={reset} className="btn btn-primary" style={{ padding: '10px 24px', fontSize: 13, borderRadius: 10 }}>
                                Try Again
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

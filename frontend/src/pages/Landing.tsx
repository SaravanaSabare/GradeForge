import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Sparkles, Target, Zap, Star, ChevronRight, CheckCircle2, Users, BookOpen, Calculator, BarChart3, MessageSquare, Shield, Github } from 'lucide-react';

/* Lightweight scroll-reveal hook */
function useReveal() {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
        obs.observe(el);
        return () => obs.disconnect();
    }, []);
    return { ref, visible };
}

export default function Landing() {
    const features = useReveal();
    const howItWorks = useReveal();
    const cta = useReveal();

    return (
        <div style={{ minHeight: '100vh', color: 'white', position: 'relative', background: '#020617' }}>

            {/* Noise texture overlay for depth */}
            <div style={{ position: 'fixed', inset: 0, opacity: 0.03, zIndex: 0, pointerEvents: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")' }} />

            {/* Subtle gradient blobs */}
            <div style={{ position: 'fixed', top: -200, right: -100, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,92,255,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'fixed', bottom: -200, left: -100, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,229,255,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

            {/* Navigation */}
            <nav style={{ position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(2,6,23,0.8)', backdropFilter: 'blur(16px)' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, color: 'white', background: 'linear-gradient(135deg, #7C5CFF, #5234cc)' }}>G</div>
                        <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.03em' }}>GradeForge</span>
                    </Link>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Link to="/login" style={{ fontSize: 13, fontWeight: 500, color: '#94a3b8', padding: '8px 16px', borderRadius: 8, transition: 'color 0.2s' }}>Log in</Link>
                        <Link to="/signup" className="btn btn-primary" style={{ fontSize: 13, padding: '8px 18px', borderRadius: 10 }}>
                            Start Free <ArrowRight size={14} />
                        </Link>
                    </div>
                </div>
            </nav>

            {/* ═══════════════════════════════════════════ */}
            {/* HERO SECTION */}
            {/* ═══════════════════════════════════════════ */}
            <section style={{ position: 'relative', zIndex: 10, maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
                <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 80, alignItems: 'center', minHeight: 'calc(100vh - 64px)', paddingTop: 40, paddingBottom: 60 }}>

                    {/* Left */}
                    <div className="hero-left animate-slideUp" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        {/* Trust badge */}
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px 5px 5px', borderRadius: 9999, border: '1px solid rgba(124,92,255,0.2)', background: 'rgba(124,92,255,0.06)', marginBottom: 28 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                {[...Array(5)].map((_, i) => <Star key={i} size={11} fill="#FBBC05" color="#FBBC05" />)}
                            </div>
                            <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>Loved by 5,200+ students</span>
                        </div>

                        <h1 style={{ fontSize: 'clamp(2.5rem, 4.5vw, 4rem)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.08, marginBottom: 20, color: '#f1f5f9' }}>
                            Your grades<br />
                            deserve a<br />
                            <span style={{ color: '#7C5CFF' }}>better system.</span>
                        </h1>

                        <p style={{ fontSize: 16, color: '#64748b', lineHeight: 1.75, maxWidth: 440, marginBottom: 32 }}>
                            GradeForge helps engineering students at SRM, VIT and 50+ Indian universities track their CGPA, find study partners, and share resources — without the spreadsheet chaos.
                        </p>

                        <div className="hero-cta-row" style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40 }}>
                            <Link to="/signup" className="btn btn-primary" style={{ padding: '13px 28px', fontSize: 15, borderRadius: 12 }}>
                                Get Started — it's free <ArrowRight size={16} />
                            </Link>
                            <Link to="/login" style={{ fontSize: 14, fontWeight: 500, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6, transition: 'color 0.2s' }}>
                                I have an account <ChevronRight size={14} />
                            </Link>
                        </div>

                        {/* Quick bullets */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {['Calculate CGPA in seconds', 'Match with study partners at your level', 'Share notes & past papers'].map(txt => (
                                <div key={txt} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#64748b' }}>
                                    <CheckCircle2 size={14} style={{ color: '#34d399', flexShrink: 0 }} />
                                    {txt}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right — Product Preview */}
                    <div className="animate-slideUp delay-2" style={{ position: 'relative' }}>
                        {/* Soft glow behind card */}
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '120%', height: '120%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,92,255,0.1) 0%, transparent 60%)', pointerEvents: 'none' }} />

                        <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(11,17,32,0.8)', boxShadow: '0 32px 64px -12px rgba(0,0,0,0.6)', transition: 'transform 0.5s ease, box-shadow 0.5s ease' }}>
                            {/* Window chrome */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.02)' }}>
                                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
                                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
                                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
                                <div style={{ flex: 1, textAlign: 'center', fontSize: 11, color: '#475569' }}>
                                    <Target size={10} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} /> Semester 3 — Target Tracker
                                </div>
                            </div>

                            <div style={{ padding: 20 }}>
                                {/* CGPA header */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                    <div>
                                        <p style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4, fontWeight: 600 }}>Current CGPA</p>
                                        <p style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.04em', color: '#f1f5f9' }}>8.42</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4, fontWeight: 600 }}>Target</p>
                                        <p style={{ fontSize: 24, fontWeight: 700, color: '#00E5FF' }}>9.00</p>
                                    </div>
                                </div>

                                {/* Progress */}
                                <div style={{ position: 'relative', width: '100%', height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.04)', marginBottom: 20, overflow: 'hidden' }}>
                                    <div style={{ height: '100%', borderRadius: 3, width: '84%', background: 'linear-gradient(90deg, #7C5CFF, #00E5FF)', transition: 'width 1s ease' }} />
                                </div>

                                {/* Subjects */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {[
                                        { n: 'Data Structures & Algo', c: 4, g: 'A+', gp: 9, color: '#7C5CFF' },
                                        { n: 'Discrete Mathematics', c: 4, g: 'O', gp: 10, color: '#00E5FF' },
                                        { n: 'Computer Networks', c: 3, g: 'A', gp: 8, color: '#34d399' },
                                        { n: 'Digital Electronics', c: 3, g: 'B+', gp: 7, color: '#FBBC05' },
                                    ].map((row, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.03)', fontSize: 13 }}>
                                            <span style={{ fontWeight: 500, color: '#cbd5e1' }}>{row.n}</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
                                                <span style={{ color: '#475569' }}>{row.c} cr</span>
                                                <span style={{ fontWeight: 700, fontSize: 11, padding: '2px 8px', borderRadius: 6, background: `${row.color}15`, color: row.color, minWidth: 28, textAlign: 'center' }}>{row.g}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Bottom action */}
                                <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 10, background: 'rgba(124,92,255,0.06)', border: '1px solid rgba(124,92,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <Zap size={14} style={{ color: '#7C5CFF' }} />
                                        <span style={{ color: '#94a3b8' }}>Need <strong style={{ color: '#00E5FF' }}>8.8+</strong> avg in Sem 4 to hit target</span>
                                    </div>
                                    <ChevronRight size={14} style={{ color: '#475569' }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════ */}
            {/* SOCIAL PROOF BAR */}
            {/* ═══════════════════════════════════════════ */}
            <section style={{ borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)', padding: '32px 0', background: 'rgba(255,255,255,0.01)' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 48, flexWrap: 'wrap' }}>
                    {['SRM University', 'VIT Vellore', 'Anna University', 'BITS Pilani', 'Manipal'].map((uni, i) => (
                        <span key={uni} style={{ fontSize: 14, fontWeight: 600, color: '#334155', letterSpacing: '-0.01em', position: 'relative', display: 'flex', alignItems: 'center', gap: 48 }}>
                            {uni}
                            {i < 4 && <span style={{ position: 'absolute', right: -28, width: 4, height: 4, borderRadius: '50%', background: 'rgba(124,92,255,0.25)' }} />}
                        </span>
                    ))}
                </div>
            </section>

            {/* ═══════════════════════════════════════════ */}
            {/* FEATURES — 3 columns with scroll-reveal */}
            {/* ═══════════════════════════════════════════ */}
            <section ref={features.ref} style={{ position: 'relative', zIndex: 10, padding: '96px 0' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
                    <div style={{ maxWidth: 520, marginBottom: 64 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#7C5CFF', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 12 }}>Features</p>
                        <h2 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.25rem)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.2, marginBottom: 16, color: '#f1f5f9' }}>
                            Everything you actually need. Nothing you don't.
                        </h2>
                        <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.7 }}>
                            Built by students who were tired of juggling Excel sheets, WhatsApp groups, and calculators.
                        </p>
                    </div>

                    <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                        {[
                            { icon: Calculator, title: 'CGPA Calculator', desc: 'Add subjects, pick grades, see your GPA instantly. Saves per semester. Works offline.', color: '#7C5CFF' },
                            { icon: BarChart3, title: 'Target Tracker', desc: 'Set a target CGPA and see exactly what grades you need in upcoming semesters.', color: '#00E5FF' },
                            { icon: Users, title: 'StudyMatch', desc: 'Find study partners at your academic level. Like profiles, match, and start chatting.', color: '#FF4D9D' },
                            { icon: BookOpen, title: 'Material Sharing', desc: 'Upload and download notes, question papers, and resources shared by your peers.', color: '#34d399' },
                            { icon: MessageSquare, title: 'Real-time Chat', desc: 'Instant messaging with your study matches. Powered by WebSockets, no refresh needed.', color: '#FBBC05' },
                            { icon: Shield, title: 'Privacy First', desc: 'Your data is yours. Row-level security ensures no one sees your grades but you.', color: '#94a3b8' },
                        ].map((f, i) => (
                            <div
                                key={i}
                                className={`card-hover-glow ${features.visible ? 'animate-slideUp delay-' + (i + 1) : ''}`}
                                style={{
                                    padding: 28,
                                    borderRadius: 14,
                                    border: '1px solid rgba(255,255,255,0.04)',
                                    background: 'rgba(255,255,255,0.015)',
                                    opacity: features.visible ? undefined : 0,
                                    cursor: 'default',
                                }}
                            >
                                <div style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, background: `${f.color}10`, border: `1px solid ${f.color}15` }}>
                                    <f.icon size={18} style={{ color: f.color }} />
                                </div>
                                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.01em', color: '#e2e8f0' }}>{f.title}</h3>
                                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.65 }}>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════ */}
            {/* HOW IT WORKS — scroll reveal */}
            {/* ═══════════════════════════════════════════ */}
            <section ref={howItWorks.ref} style={{ padding: '80px 0', borderTop: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.01)' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
                    <div style={{ textAlign: 'center', marginBottom: 56 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#7C5CFF', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 12 }}>How it works</p>
                        <h2 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.25rem)', fontWeight: 800, letterSpacing: '-0.03em', color: '#f1f5f9' }}>
                            Three steps. That's it.
                        </h2>
                    </div>

                    <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
                        {[
                            { step: '01', title: 'Create your profile', desc: 'Sign up with Google or email. Pick your university and department.' },
                            { step: '02', title: 'Add your grades', desc: 'Enter subjects per semester. Your CGPA is calculated and saved automatically.' },
                            { step: '03', title: 'Connect & grow', desc: 'Find study partners, share materials, and track your progress over time.' },
                        ].map((s, i) => (
                            <div
                                key={i}
                                className={howItWorks.visible ? `animate-slideUp delay-${i + 1}` : ''}
                                style={{ textAlign: 'center', padding: '32px 24px', opacity: howItWorks.visible ? undefined : 0 }}
                            >
                                <div style={{ fontSize: 48, fontWeight: 900, letterSpacing: '-0.04em', marginBottom: 16, lineHeight: 1, background: 'linear-gradient(135deg, rgba(124,92,255,0.2), rgba(0,229,255,0.1))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{s.step}</div>
                                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8, color: '#e2e8f0' }}>{s.title}</h3>
                                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.65 }}>{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════ */}
            {/* CTA SECTION */}
            {/* ═══════════════════════════════════════════ */}
            <section ref={cta.ref} style={{ padding: '80px 0 96px', position: 'relative' }}>
                {/* CTA background glow */}
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 600, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,92,255,0.06), transparent 60%)', pointerEvents: 'none' }} />
                <div className={cta.visible ? 'animate-slideUp' : ''} style={{ maxWidth: 640, margin: '0 auto', padding: '0 24px', textAlign: 'center', position: 'relative', zIndex: 10, opacity: cta.visible ? undefined : 0 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 9999, background: 'rgba(124,92,255,0.08)', border: '1px solid rgba(124,92,255,0.15)', marginBottom: 24 }}>
                        <Sparkles size={12} style={{ color: '#7C5CFF' }} />
                        <span style={{ fontSize: 11, color: '#7C5CFF', fontWeight: 600 }}>Free forever for students</span>
                    </div>
                    <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.15, marginBottom: 16, color: '#f1f5f9' }}>
                        Ready to stop guessing<br />your CGPA?
                    </h2>
                    <p style={{ fontSize: 16, color: '#64748b', lineHeight: 1.7, marginBottom: 32, maxWidth: 460, margin: '0 auto 32px' }}>
                        Join thousands of engineering students who've already made the switch.
                    </p>
                    <Link to="/signup" className="btn btn-primary" style={{ padding: '14px 36px', fontSize: 16, borderRadius: 12 }}>
                        Create Free Account <ArrowRight size={16} />
                    </Link>
                </div>
            </section>

            {/* ═══════════════════════════════════════════ */}
            {/* FOOTER — Premium multi-column */}
            {/* ═══════════════════════════════════════════ */}
            <footer style={{ borderTop: '1px solid rgba(255,255,255,0.04)', padding: '48px 0 32px', background: 'rgba(255,255,255,0.01)' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
                    {/* Footer grid */}
                    <div className="footer-inner" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48, marginBottom: 40 }}>
                        {/* Brand */}
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                                <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 11, color: 'white', background: 'linear-gradient(135deg, #7C5CFF, #5234cc)' }}>G</div>
                                <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.03em', color: '#f1f5f9' }}>GradeForge</span>
                            </div>
                            <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.7, maxWidth: 260 }}>
                                The open-source academic companion for Indian engineering students.
                            </p>
                            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                                <a href="https://github.com/SaravanaSabare/GradeForge" target="_blank" rel="noopener" style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', color: '#64748b', transition: 'all 0.2s' }}>
                                    <Github size={14} />
                                </a>
                            </div>
                        </div>

                        {/* Product */}
                        <div>
                            <h4 style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>Product</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {['CGPA Calculator', 'Study Materials', 'StudyMatch', 'Dashboard'].map(item => (
                                    <Link key={item} to="/signup" style={{ fontSize: 13, color: '#475569', transition: 'color 0.2s' }}>{item}</Link>
                                ))}
                            </div>
                        </div>

                        {/* University */}
                        <div>
                            <h4 style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>Universities</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {['SRM University', 'VIT Vellore', 'Anna University', 'BITS Pilani'].map(uni => (
                                    <span key={uni} style={{ fontSize: 13, color: '#475569' }}>{uni}</span>
                                ))}
                            </div>
                        </div>

                        {/* Legal */}
                        <div>
                            <h4 style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>Legal</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {['Privacy Policy', 'Terms of Service', 'Open Source'].map(item => (
                                    <a key={item} href="#" style={{ fontSize: 13, color: '#475569', transition: 'color 0.2s' }}>{item}</a>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Bottom bar */}
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <p style={{ fontSize: 12, color: '#334155' }}>© 2026 GradeForge. Built with ❤️ for students.</p>
                        <p style={{ fontSize: 11, color: '#1e293b' }}>v1.0</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

import { Link } from 'react-router-dom';
import { BookOpen, Calculator, Users, ArrowRight, Sparkles, Target, Zap } from 'lucide-react';

export default function Landing() {
    return (
        <div style={{ minHeight: '100vh', color: 'white', overflow: 'hidden', position: 'relative', background: 'linear-gradient(180deg, #020617 0%, #0B1120 50%, #020617 100%)' }}>

            {/* Background Systems */}
            <div className="bg-grid-pattern" style={{ position: 'fixed', inset: 0, opacity: 0.4, zIndex: 0, pointerEvents: 'none' }} />
            <div className="glow-orb primary" style={{ width: 700, height: 700, top: '-15%', left: '-5%' }} />
            <div className="glow-orb secondary" style={{ width: 500, height: 500, bottom: '-10%', right: '-5%', animationDelay: '3s' }} />
            <div className="glow-orb highlight" style={{ width: 350, height: 350, top: '50%', left: '50%', animationDelay: '5s' }} />

            {/* Navigation */}
            <nav style={{ position: 'relative', zIndex: 50, borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(2,6,23,0.6)', backdropFilter: 'blur(20px)' }}>
                <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 2rem', height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 14, color: 'white', background: 'linear-gradient(135deg, #7C5CFF, #00E5FF)' }}>G</div>
                        <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.025em' }}>GradeForge</span>
                    </Link>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Link to="/login" style={{ fontSize: 14, fontWeight: 500, color: '#94a3b8', padding: '8px 16px', borderRadius: 8, transition: 'color 0.2s' }}>Sign In</Link>
                        <Link to="/signup" className="btn btn-primary" style={{ fontSize: 14, padding: '10px 20px' }}>Get Started <ArrowRight size={16} /></Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section style={{ position: 'relative', zIndex: 10, maxWidth: 1280, margin: '0 auto', padding: '80px 2rem 100px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>

                    {/* Left Column */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', position: 'relative', zIndex: 20 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 9999, border: '1px solid rgba(124,92,255,0.3)', background: 'rgba(124,92,255,0.08)', color: '#00E5FF', fontSize: 13, fontWeight: 500, marginBottom: 32 }}>
                            <Sparkles size={14} />
                            Next-Gen Academic Analytics for India
                        </div>

                        <h1 style={{ fontSize: 'clamp(3rem, 5vw, 4.5rem)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: 24 }}>
                            Forge your<br />
                            <span className="text-accent-gradient">Perfect CGPA.</span>
                        </h1>

                        <p style={{ fontSize: 18, color: '#94a3b8', lineHeight: 1.7, maxWidth: 520, marginBottom: 40 }}>
                            The ultimate academic toolkit designed for engineering students at SRM, VIT, and beyond. Calculate targets, share study materials, and build collaborative groups — all in one sleek interface.
                        </p>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                            <Link to="/signup" className="btn btn-primary" style={{ padding: '14px 32px', fontSize: 16 }}>
                                Launch App <ArrowRight size={18} />
                            </Link>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ display: 'flex' }}>
                                    {['#7C5CFF', '#00E5FF', '#FF4D9D', '#34d399'].map((c, i) => (
                                        <div key={i} style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid #020617', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, background: `${c}30`, color: c, marginLeft: i > 0 ? -10 : 0 }}>
                                            {String.fromCharCode(65 + i)}
                                        </div>
                                    ))}
                                </div>
                                <p style={{ fontSize: 13, color: '#64748b' }}><span style={{ color: 'white', fontWeight: 600 }}>5,200+</span> students</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column — Preview Card */}
                    <div className="animate-float" style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', inset: -40, borderRadius: '50%', opacity: 0.25, filter: 'blur(80px)', background: 'linear-gradient(135deg, #7C5CFF, #FF4D9D)', pointerEvents: 'none' }} />

                        <div className="glass-panel" style={{ position: 'relative', padding: 24, borderRadius: 20, overflow: 'hidden', boxShadow: '0 25px 80px -12px rgba(0,0,0,0.8), 0 0 60px -20px rgba(124,92,255,0.3)' }}>
                            {/* Top accent */}
                            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 2, background: 'linear-gradient(90deg, #7C5CFF, #00E5FF, #FF4D9D)' }} />

                            {/* Window dots */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'rgba(255,59,48,0.7)' }} />
                                <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'rgba(255,204,0,0.7)' }} />
                                <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'rgba(40,205,65,0.7)' }} />
                                <span style={{ margin: '0 auto', fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <Target size={12} style={{ color: '#7C5CFF' }} /> Target Tracker
                                </span>
                            </div>

                            {/* CGPA Display */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
                                <div>
                                    <p style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Current Standing</p>
                                    <p style={{ fontSize: 32, fontWeight: 700 }}><span className="text-gradient">8.42</span> <span style={{ fontSize: 14, fontWeight: 500, color: '#64748b' }}>CGPA</span></p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Target</p>
                                    <p style={{ fontSize: 24, fontWeight: 700, color: '#00E5FF' }}>9.00</p>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div style={{ width: '100%', height: 6, borderRadius: 4, background: 'rgba(255,255,255,0.05)', marginBottom: 20, overflow: 'hidden' }}>
                                <div style={{ height: '100%', borderRadius: 4, width: '84%', background: 'linear-gradient(90deg, #7C5CFF, #00E5FF)' }} />
                            </div>

                            {/* Subject Rows */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {[
                                    { n: 'Data Structures', c: '4', g: 'A+', color: '#7C5CFF' },
                                    { n: 'Linear Algebra', c: '3', g: 'O', color: '#00E5FF' },
                                    { n: 'Computer Networks', c: '3', g: 'A', color: '#FF4D9D' },
                                ].map((row, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', fontSize: 13 }}>
                                        <span style={{ fontWeight: 500 }}>{row.n}</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#94a3b8' }}>
                                            <span style={{ fontSize: 12 }}>{row.c} Cr</span>
                                            <span style={{ fontWeight: 700, fontSize: 11, padding: '2px 8px', borderRadius: 6, background: `${row.color}20`, color: row.color }}>{row.g}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button style={{ width: '100%', marginTop: 16, padding: '12px 0', borderRadius: 12, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'linear-gradient(135deg, rgba(124,92,255,0.1), rgba(0,229,255,0.1))', color: 'white', cursor: 'pointer', transition: 'background 0.2s' }}>
                                <Zap size={15} style={{ color: '#00E5FF' }} /> Calculate Optimal Path
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section style={{ position: 'relative', zIndex: 10, borderTop: '1px solid rgba(255,255,255,0.06)', padding: '96px 0', background: 'rgba(2,6,23,0.5)', backdropFilter: 'blur(8px)' }}>
                <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 2rem' }}>
                    <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 64px' }}>
                        <h2 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 20 }}>
                            Academic excellence, <span style={{ color: '#7C5CFF' }}>engineered.</span>
                        </h2>
                        <p style={{ fontSize: 17, color: '#94a3b8', lineHeight: 1.7 }}>
                            Stop using spreadsheets and fragmented WhatsApp groups. Everything you need in one futuristic interface.
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
                        {[
                            { icon: Calculator, title: 'Smart CGPA Predictor', desc: 'Enter current grades, set a target, and instantly see the minimum grades needed in remaining courses to hit your goals.', color: '#7C5CFF' },
                            { icon: BookOpen, title: 'Study Material Hub', desc: 'Access a curated database of previous year papers, handwritten notes, and solved assignments uploaded by top students.', color: '#00E5FF' },
                            { icon: Users, title: 'Community Engine', desc: 'Join hyper-focused study groups based on your courses and university. Ask questions, share resources, and collaborate in real-time.', color: '#FF4D9D' },
                        ].map((f, i) => (
                            <div key={i} className="glass-card" style={{ padding: 32, cursor: 'default' }}>
                                <div style={{ width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, border: `1px solid ${f.color}25`, background: `${f.color}10` }}>
                                    <f.icon size={22} style={{ color: f.color }} />
                                </div>
                                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>{f.title}</h3>
                                <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.7 }}>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer style={{ position: 'relative', zIndex: 10, borderTop: '1px solid rgba(255,255,255,0.06)', padding: '32px 0' }}>
                <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <p style={{ fontSize: 13, color: '#64748b' }}>© 2026 GradeForge. Built for students, by students.</p>
                    <div style={{ display: 'flex', gap: 24, fontSize: 13, color: '#64748b' }}>
                        <a href="#" style={{ transition: 'color 0.2s' }}>Privacy</a>
                        <a href="#" style={{ transition: 'color 0.2s' }}>Terms</a>
                        <a href="#" style={{ transition: 'color 0.2s' }}>GitHub</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}

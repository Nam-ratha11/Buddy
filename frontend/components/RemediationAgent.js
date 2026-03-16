"use client";
import { useState, useEffect, useRef, useCallback } from 'react';

// Mermaid rendering component
function MermaidDiagram({ chart }) {
    const containerRef = useRef(null);
    const [svg, setSvg] = useState('');
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!chart) return;
        let cancelled = false;

        (async () => {
            try {
                const mermaid = (await import('mermaid')).default;
                mermaid.initialize({
                    startOnLoad: false,
                    theme: 'base',
                    themeVariables: {
                        primaryColor: '#e0f5ff',
                        primaryBorderColor: '#38bdf8',
                        primaryTextColor: '#0f1729',
                        lineColor: '#818cf8',
                        secondaryColor: '#f0e6ff',
                        tertiaryColor: '#f8fafc',
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '14px'
                    },
                    flowchart: { curve: 'basis', padding: 15 }
                });
                const id = `mermaid-${Date.now()}`;
                const { svg: rendered } = await mermaid.render(id, chart);
                if (!cancelled) setSvg(rendered);
            } catch (e) {
                console.error('Mermaid render error:', e);
                if (!cancelled) setError(true);
            }
        })();

        return () => { cancelled = true; };
    }, [chart]);

    if (error || !chart) return null;
    if (!svg) return <p style={{ opacity: 0.5, fontSize: '0.85rem' }}>Rendering diagram...</p>;

    return (
        <div
            ref={containerRef}
            style={{
                padding: '1.5rem', borderRadius: '12px',
                background: 'white', border: '1px solid var(--border)',
                display: 'flex', justifyContent: 'center', overflow: 'auto'
            }}
            dangerouslySetInnerHTML={{ __html: svg }}
        />
    );
}

export default function RemediationAgent({ evaluation, history = [], studentClass, syllabusTopics }) {
    const [gapProgress, setGapProgress] = useState({});
    const [activeSubject, setActiveSubject] = useState(null);
    const [remediationData, setRemediationData] = useState(null);
    const [loadingTopic, setLoadingTopic] = useState(null);
    const [mcqAnswer, setMcqAnswer] = useState(null);
    const [mcqSubmitted, setMcqSubmitted] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerTopic, setDrawerTopic] = useState(null);
    const drawerRef = useRef(null);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

    // Per-user localStorage key for gap progress
    const getStorageKey = () => {
        try {
            const user = JSON.parse(localStorage.getItem('sprout_current_user') || '{}');
            return `sprout_gap_progress_${user.studentId || 'default'}`;
        } catch { return 'sprout_gap_progress_default'; }
    };

    // Load gap progress from localStorage (per-user)
    useEffect(() => {
        const saved = localStorage.getItem(getStorageKey());
        if (saved) {
            try { setGapProgress(JSON.parse(saved)); } catch { }
        }
    }, []);

    const updateGapProgress = (topic, status) => {
        const updated = { ...gapProgress, [topic]: status };
        setGapProgress(updated);
        localStorage.setItem(getStorageKey(), JSON.stringify(updated));
    };

    // Aggregate all evaluated questions
    let allQuestions = [];
    if (evaluation && evaluation.questions) {
        allQuestions = evaluation.questions;
    } else if (history.length > 0) {
        allQuestions = history.reduce((acc, item) => {
            if (item.data && item.data.questions) return acc.concat(item.data.questions);
            return acc;
        }, []);
    }

    // Build topic scores
    const topicScores = {};
    allQuestions.forEach(q => {
        if (!topicScores[q.topic]) {
            topicScores[q.topic] = { subject: q.subject, total: 0, obtained: 0, mistakeType: null, feedback: null };
        }
        topicScores[q.topic].total += q.maxMarks;
        topicScores[q.topic].obtained += q.marksObtained;
        if (q.marksObtained < q.maxMarks) {
            topicScores[q.topic].mistakeType = q.mistakeType;
            topicScores[q.topic].feedback = q.feedback;
        }
    });

    // Build chapter-wise view
    const subjectChapters = {};
    if (syllabusTopics) {
        Object.entries(syllabusTopics).forEach(([subject, topics]) => {
            subjectChapters[subject] = topics.map(topic => {
                const score = topicScores[topic];
                let status = 'not_tested';
                if (score) {
                    const pct = (score.obtained / score.total) * 100;
                    status = pct >= 75 ? 'strong' : 'weak';
                }
                const savedStatus = gapProgress[topic];
                // If score is weak, always show as weak so "Fix this Gap" remains available
                // Only override with in_progress (actively studying)
                if (savedStatus === 'in_progress' && status === 'weak') status = 'in_progress';
                return {
                    topic, status,
                    percentage: score ? Math.round((score.obtained / score.total) * 100) : null,
                    mistakeType: score?.mistakeType,
                    feedback: score?.feedback
                };
            });
        });
    }

    const subjects = Object.keys(subjectChapters);

    useEffect(() => {
        if (subjects.length > 0 && !activeSubject) setActiveSubject(subjects[0]);
    }, [subjects, activeSubject]);

    // Close drawer on Escape key
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') closeDrawer(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, []);

    const closeDrawer = useCallback(() => {
        setDrawerOpen(false);
        setTimeout(() => {
            setRemediationData(null);
            setDrawerTopic(null);
            setMcqAnswer(null);
            setMcqSubmitted(false);
        }, 300);
    }, []);

    const handleFixGap = async (topic, mistakeType, feedback) => {
        setDrawerTopic(topic);
        setDrawerOpen(true);
        setLoadingTopic(topic);
        setRemediationData(null);
        setMcqAnswer(null);
        setMcqSubmitted(false);
        updateGapProgress(topic, 'in_progress');

        try {
            const response = await fetch(`${API_URL}/api/remediate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic, grade: studentClass, mistakeType, feedback }),
            });
            const data = await response.json();
            if (data.error) throw new Error(data.error);
            setRemediationData(data);
        } catch (error) {
            console.error("Remediation failed:", error);
            alert(error.message || "Failed to generate remediation content.");
            closeDrawer();
        } finally {
            setLoadingTopic(null);
        }
    };

    const handleMcqSubmit = (optionIndex) => {
        setMcqAnswer(optionIndex);
        setMcqSubmitted(true);
        if (remediationData && optionIndex === remediationData.mcq.correctOption) {
            updateGapProgress(remediationData.topic, 'resolved');
        }
    };

    const handleWatchVideo = (topic) => {
        const query = encodeURIComponent(`${studentClass} CBSE ${topic} NCERT explained`);
        window.open(`https://www.youtube.com/results?search_query=${query}`, '_blank');
    };

    const getStatusBadge = (status) => {
        const styles = {
            strong: { bg: 'hsla(145, 63%, 42%, 0.12)', color: 'hsl(145, 63%, 32%)', label: 'Strong' },
            weak: { bg: 'hsla(0, 72%, 51%, 0.12)', color: 'hsl(0, 72%, 41%)', label: 'Weak' },
            not_tested: { bg: 'hsla(220, 13%, 50%, 0.12)', color: 'hsl(220, 13%, 45%)', label: 'Not Tested' },
            in_progress: { bg: 'hsla(38, 92%, 50%, 0.12)', color: 'hsl(38, 92%, 40%)', label: 'In Progress' },
            resolved: { bg: 'hsla(200, 100%, 50%, 0.12)', color: 'var(--primary)', label: 'Resolved' }
        };
        const s = styles[status] || styles.not_tested;
        return (
            <span style={{
                padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.7rem',
                fontWeight: 700, background: s.bg, color: s.color, textTransform: 'uppercase'
            }}>{s.label}</span>
        );
    };

    const stepBadge = (num, bg) => (
        <span style={{
            width: '28px', height: '28px', borderRadius: '50%', background: bg, color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.8rem', fontWeight: 700, flexShrink: 0
        }}>{num}</span>
    );

    if (subjects.length === 0) {
        return (
            <div className="card glass" style={{ animation: 'fadeIn 0.5s ease', textAlign: 'center', padding: '4rem' }}>
                <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--primary)' }}>No Data Yet</h2>
                <p style={{ opacity: 0.7 }}>Upload and analyze an answer sheet first to see your chapter-wise gaps for {studentClass}.</p>
                <style jsx>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
            </div>
        );
    }

    const chapters = subjectChapters[activeSubject] || [];
    const weakCount = chapters.filter(c => c.status === 'weak').length;
    const strongCount = chapters.filter(c => c.status === 'strong' || c.status === 'resolved').length;
    const notTestedCount = chapters.filter(c => c.status === 'not_tested').length;

    return (
        <>
            <div style={{ animation: 'fadeIn 0.5s ease' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Remediation Agent</h2>
                    <p style={{ opacity: 0.6 }}>Fix your knowledge gaps topic by topic for {studentClass}</p>
                </div>

                {/* Subject tabs */}
                <div className="tabs-container" style={{
                    marginBottom: '1.5rem', display: 'flex', gap: '0.5rem',
                    overflowX: 'auto', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)'
                }}>
                    {subjects.map(subject => (
                        <button
                            key={subject}
                            onClick={() => setActiveSubject(subject)}
                            className={`tab-item ${activeSubject === subject ? 'active' : ''}`}
                            style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem', whiteSpace: 'nowrap' }}
                        >{subject}</button>
                    ))}
                </div>

                {/* Summary stats */}
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                    {[
                        { label: 'Weak', count: weakCount, color: 'hsl(0, 72%, 51%)' },
                        { label: 'Strong', count: strongCount, color: 'hsl(145, 63%, 42%)' },
                        { label: 'Not Tested', count: notTestedCount, color: 'hsl(220, 13%, 50%)' }
                    ].map(stat => (
                        <div key={stat.label} className="card" style={{
                            padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
                            flex: '1 1 120px', minWidth: '120px'
                        }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: stat.color }}>{stat.count}</div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.7, textTransform: 'uppercase' }}>{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Chapter list */}
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                    {chapters.map((chapter, i) => (
                        <div key={i} className="card glass" style={{
                            padding: '1rem 1.5rem',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            flexWrap: 'wrap', gap: '0.75rem',
                            borderLeft: `3px solid ${chapter.status === 'weak' ? 'hsl(0, 72%, 51%)' :
                                chapter.status === 'strong' ? 'hsl(145, 63%, 42%)' :
                                    chapter.status === 'resolved' ? 'var(--primary)' :
                                        chapter.status === 'in_progress' ? 'hsl(38, 92%, 50%)' : 'var(--border)'}`
                        }}>
                            <div style={{ flex: '1 1 200px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                                    <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{chapter.topic}</span>
                                    {getStatusBadge(chapter.status)}
                                </div>
                                {chapter.percentage !== null && (
                                    <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>Score: {chapter.percentage}%</span>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {(chapter.status === 'weak' || chapter.status === 'in_progress') && (
                                    <button
                                        onClick={() => handleFixGap(chapter.topic, chapter.mistakeType, chapter.feedback)}
                                        disabled={loadingTopic === chapter.topic}
                                        className="btn-primary"
                                        style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', borderRadius: '20px' }}
                                    >
                                        {loadingTopic === chapter.topic ? 'Loading...' : 'Fix this Gap'}
                                    </button>
                                )}
                                <button
                                    onClick={() => handleWatchVideo(chapter.topic)}
                                    style={{
                                        padding: '0.5rem 1rem', fontSize: '0.8rem', borderRadius: '20px',
                                        background: 'transparent', border: '1px solid var(--border)',
                                        color: 'var(--foreground)', cursor: 'pointer', fontWeight: 600,
                                        transition: 'border-color 0.2s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                                >Watch Video</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Overlay */}
            {drawerOpen && (
                <div
                    onClick={closeDrawer}
                    style={{
                        position: 'fixed', inset: 0, zIndex: 2000,
                        background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
                        transition: 'opacity 0.3s', opacity: drawerOpen ? 1 : 0
                    }}
                />
            )}

            {/* Sliding Drawer */}
            <div
                ref={drawerRef}
                style={{
                    position: 'fixed', top: 0, right: 0, bottom: 0,
                    width: 'min(620px, 90vw)', zIndex: 2001,
                    background: 'var(--background)',
                    borderLeft: '1px solid var(--border)',
                    boxShadow: drawerOpen ? '-8px 0 40px rgba(0,0,0,0.15)' : 'none',
                    transform: drawerOpen ? 'translateX(0)' : 'translateX(100%)',
                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    overflowY: 'auto', overflowX: 'hidden'
                }}
            >
                {/* Drawer header */}
                <div className="glass" style={{
                    position: 'sticky', top: 0, zIndex: 10,
                    padding: '1.25rem 1.5rem',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    borderBottom: '1px solid var(--border)'
                }}>
                    <div>
                        <h3 style={{ fontSize: '1.2rem', margin: 0, color: 'var(--primary)' }}>
                            {drawerTopic || 'Loading...'}
                        </h3>
                        <p style={{ fontSize: '0.8rem', opacity: 0.5, margin: '0.2rem 0 0' }}>
                            AI Tutor - {studentClass}
                        </p>
                    </div>
                    <button
                        onClick={closeDrawer}
                        style={{
                            width: '36px', height: '36px', borderRadius: '50%',
                            border: '1px solid var(--border)', background: 'var(--card)',
                            color: 'var(--foreground)', cursor: 'pointer', fontSize: '1.1rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                    >x</button>
                </div>

                {/* Drawer content */}
                <div style={{ padding: '1.5rem' }}>
                    {loadingTopic && !remediationData && (
                        <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                            <div style={{
                                width: '48px', height: '48px', borderRadius: '50%',
                                border: '3px solid var(--border)', borderTopColor: 'var(--primary)',
                                animation: 'spin 0.8s linear infinite', margin: '0 auto 1.5rem'
                            }} />
                            <h3 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>Generating Explanation...</h3>
                            <p style={{ opacity: 0.5, fontSize: '0.9rem' }}>Teaching the full chapter with visual aids</p>
                        </div>
                    )}

                    {remediationData && (
                        <div style={{ animation: 'fadeIn 0.4s ease' }}>

                            {/* Step 1: The Hook */}
                            <div style={{ marginBottom: '2rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                    {stepBadge(1, 'var(--primary)')}
                                    <h4 style={{ margin: 0 }}>The Hook</h4>
                                </div>
                                {remediationData.hook && (
                                    <div style={{
                                        padding: '1.25rem', borderRadius: '12px',
                                        background: 'var(--primary-light)', border: '1px solid var(--border)',
                                        lineHeight: '1.7', fontSize: '0.95rem'
                                    }}>
                                        {remediationData.hook.title && (
                                            <p style={{ fontWeight: 700, marginBottom: '0.5rem', color: 'var(--primary)' }}>
                                                {remediationData.hook.title}
                                            </p>
                                        )}
                                        <p style={{ margin: 0 }}>{remediationData.hook.explanation}</p>
                                    </div>
                                )}
                            </div>

                            {/* Step 2: Full Chapter */}
                            {remediationData.chapterExplanation && (
                                <div style={{ marginBottom: '2rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                        {stepBadge(2, 'var(--secondary)')}
                                        <h4 style={{ margin: 0 }}>Full Chapter: {remediationData.topic}</h4>
                                    </div>
                                    <div style={{
                                        padding: '1.5rem', borderRadius: '12px',
                                        background: 'hsl(230, 100%, 98%)', border: '1px solid hsla(230, 100%, 67%, 0.2)',
                                        lineHeight: '1.7', fontSize: '0.95rem'
                                    }}>
                                        {remediationData.chapterExplanation.overview && (
                                            <p style={{ marginBottom: '1.5rem', fontSize: '1rem', fontWeight: 500 }}>
                                                {remediationData.chapterExplanation.overview}
                                            </p>
                                        )}

                                        {/* Key Concepts */}
                                        {remediationData.chapterExplanation.keyConcepts?.length > 0 && (
                                            <div style={{ marginBottom: '1.5rem' }}>
                                                <p style={{ fontWeight: 700, color: 'var(--secondary)', marginBottom: '0.75rem', fontSize: '1rem' }}>Key Concepts</p>
                                                <div style={{ display: 'grid', gap: '0.75rem' }}>
                                                    {remediationData.chapterExplanation.keyConcepts.map((c, i) => (
                                                        <div key={i} style={{
                                                            padding: '1rem', borderRadius: '10px',
                                                            background: 'rgba(255,255,255,0.6)', border: '1px solid var(--border)'
                                                        }}>
                                                            <p style={{ fontWeight: 700, marginBottom: '0.35rem', color: 'var(--secondary)' }}>{c.heading}</p>
                                                            <p style={{ margin: 0 }}>{c.explanation}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Important Terms */}
                                        {remediationData.chapterExplanation.importantTerms?.length > 0 && (
                                            <div style={{ marginBottom: '1.5rem' }}>
                                                <p style={{ fontWeight: 700, color: 'var(--secondary)', marginBottom: '0.75rem', fontSize: '1rem' }}>Important Terms</p>
                                                <div style={{ display: 'grid', gap: '0.5rem' }}>
                                                    {remediationData.chapterExplanation.importantTerms.map((item, i) => (
                                                        <div key={i} style={{
                                                            padding: '0.75rem 1rem', borderRadius: '8px',
                                                            background: 'hsla(230, 100%, 67%, 0.06)',
                                                            border: '1px solid hsla(230, 100%, 67%, 0.12)'
                                                        }}>
                                                            <span style={{ fontWeight: 700, color: 'var(--secondary)' }}>{item.term}: </span>
                                                            <span>{item.definition}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Formulas */}
                                        {remediationData.chapterExplanation.formulas?.length > 0 && remediationData.chapterExplanation.formulas[0] !== '' && (
                                            <div style={{ marginBottom: '1.5rem' }}>
                                                <p style={{ fontWeight: 700, color: 'var(--secondary)', marginBottom: '0.5rem', fontSize: '1rem' }}>Formulas</p>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                    {remediationData.chapterExplanation.formulas.map((f, i) => (
                                                        <span key={i} style={{
                                                            padding: '0.5rem 1rem', borderRadius: '8px',
                                                            background: 'hsla(230, 100%, 67%, 0.1)',
                                                            fontFamily: 'monospace', fontSize: '0.9rem',
                                                            border: '1px solid hsla(230, 100%, 67%, 0.2)'
                                                        }}>{f}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* NCERT Examples */}
                                        {remediationData.chapterExplanation.ncertExamples?.length > 0 && (
                                            <div>
                                                <p style={{ fontWeight: 700, color: 'var(--secondary)', marginBottom: '0.5rem', fontSize: '1rem' }}>NCERT Examples</p>
                                                <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                                                    {remediationData.chapterExplanation.ncertExamples.map((ex, i) => (
                                                        <li key={i} style={{ marginBottom: '0.4rem' }}>{ex}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Visual Concept Map */}
                            {remediationData.conceptMap && (
                                <div style={{ marginBottom: '2rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                        {stepBadge(3, '#10b981')}
                                        <h4 style={{ margin: 0 }}>Concept Map</h4>
                                    </div>
                                    <MermaidDiagram chart={remediationData.conceptMap} />
                                </div>
                            )}

                            {/* Step 4: Common Mistakes */}
                            {remediationData.commonMistakes?.length > 0 && (
                                <div style={{ marginBottom: '2rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                        {stepBadge(4, 'hsl(0, 72%, 51%)')}
                                        <h4 style={{ margin: 0 }}>Common Mistakes to Avoid</h4>
                                    </div>
                                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                                        {remediationData.commonMistakes.map((item, i) => (
                                            <div key={i} style={{
                                                padding: '1rem 1.25rem', borderRadius: '10px',
                                                background: 'hsla(0, 72%, 51%, 0.04)',
                                                border: '1px solid hsla(0, 72%, 51%, 0.12)', lineHeight: '1.6'
                                            }}>
                                                <p style={{ fontWeight: 700, color: 'hsl(0, 72%, 41%)', marginBottom: '0.35rem' }}>{item.mistake}</p>
                                                <p style={{ margin: 0, color: 'hsl(145, 63%, 32%)' }}>Correction: {item.correction}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Step 5: Pro Tips */}
                            {remediationData.proTips?.length > 0 && (
                                <div style={{ marginBottom: '2rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                        {stepBadge(5, 'var(--accent)')}
                                        <h4 style={{ margin: 0 }}>Pro Tips for Scoring</h4>
                                    </div>
                                    <div style={{
                                        padding: '1.25rem', borderRadius: '12px',
                                        background: 'hsla(280, 100%, 65%, 0.06)', border: '1px solid hsla(280, 100%, 65%, 0.15)',
                                        lineHeight: '1.7', fontSize: '0.95rem'
                                    }}>
                                        <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                                            {remediationData.proTips.map((tip, i) => (
                                                <li key={i} style={{ marginBottom: '0.5rem', fontWeight: 500 }}>{tip}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}

                            {/* Step 6: MCQ Check */}
                            {remediationData.mcq && (
                                <div style={{ marginBottom: '2rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                        {stepBadge(6, 'hsl(145, 63%, 42%)')}
                                        <h4 style={{ margin: 0 }}>Check Your Understanding</h4>
                                    </div>
                                    <div style={{
                                        padding: '1.25rem', borderRadius: '12px',
                                        background: 'var(--card)', border: '1px solid var(--border)', lineHeight: '1.7'
                                    }}>
                                        <p style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '1rem' }}>
                                            {remediationData.mcq.question}
                                        </p>
                                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                                            {remediationData.mcq.options.map((option, i) => {
                                                let bg = 'transparent';
                                                let borderColor = 'var(--border)';
                                                let fontW = 500;
                                                if (mcqSubmitted) {
                                                    if (i === remediationData.mcq.correctOption) {
                                                        bg = 'hsla(145, 63%, 42%, 0.12)';
                                                        borderColor = 'hsl(145, 63%, 42%)';
                                                        fontW = 700;
                                                    } else if (i === mcqAnswer && i !== remediationData.mcq.correctOption) {
                                                        bg = 'hsla(0, 72%, 51%, 0.12)';
                                                        borderColor = 'hsl(0, 72%, 51%)';
                                                    }
                                                }
                                                return (
                                                    <button
                                                        key={i}
                                                        onClick={() => !mcqSubmitted && handleMcqSubmit(i)}
                                                        disabled={mcqSubmitted}
                                                        style={{
                                                            padding: '0.75rem 1rem', borderRadius: '10px',
                                                            border: `2px solid ${borderColor}`, background: bg,
                                                            cursor: mcqSubmitted ? 'default' : 'pointer',
                                                            textAlign: 'left', fontSize: '0.9rem',
                                                            fontWeight: fontW, transition: 'all 0.2s',
                                                            color: 'var(--foreground)'
                                                        }}
                                                    >
                                                        <span style={{ fontWeight: 700, marginRight: '0.5rem', opacity: 0.5 }}>
                                                            {String.fromCharCode(65 + i)}.
                                                        </span>
                                                        {option}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        {mcqSubmitted && (
                                            <div style={{
                                                marginTop: '1rem', padding: '1rem', borderRadius: '10px',
                                                background: mcqAnswer === remediationData.mcq.correctOption
                                                    ? 'hsla(145, 63%, 42%, 0.08)' : 'hsla(0, 72%, 51%, 0.08)',
                                                fontSize: '0.9rem', fontWeight: 600,
                                                color: mcqAnswer === remediationData.mcq.correctOption
                                                    ? 'hsl(145, 63%, 32%)' : 'hsl(0, 72%, 41%)'
                                            }}>
                                                {mcqAnswer === remediationData.mcq.correctOption
                                                    ? 'Correct! This gap has been marked as resolved.'
                                                    : `Incorrect. The correct answer is ${String.fromCharCode(65 + remediationData.mcq.correctOption)}. Review the explanation above and try the video.`
                                                }
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Watch Video CTA */}
                            <div style={{ textAlign: 'center', padding: '1rem 0 0.5rem' }}>
                                <button
                                    onClick={() => handleWatchVideo(remediationData.topic)}
                                    className="btn-primary"
                                    style={{ padding: '0.75rem 2rem', fontSize: '0.9rem', borderRadius: '25px' }}
                                >Watch Video Explanation</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </>
    );
}

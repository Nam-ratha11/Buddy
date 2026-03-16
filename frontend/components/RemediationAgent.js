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
                display: 'flex', justifyContent: 'center', overflow: 'auto',
                marginTop: '1rem',
                marginBottom: '1rem'
            }}
            dangerouslySetInnerHTML={{ __html: svg }}
        />
    );
}

export default function RemediationAgent({ evaluation, history = [], studentClass, syllabusTopics }) {
    const [gapProgress, setGapProgress] = useState({});
    const [messages, setMessages] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    
    // Track states of MCQs inside chat
    const [mcqAnswers, setMcqAnswers] = useState({}); // { messageId: selectedOptionIndex }

    const scrollRef = useRef(null);
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

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    // Aggregate all evaluated questions to find weak topics
    let allQuestions = [];
    if (evaluation && evaluation.questions) {
        allQuestions = evaluation.questions;
    } else if (history.length > 0) {
        allQuestions = history.reduce((acc, item) => {
            if (item.data && item.data.questions) return acc.concat(item.data.questions);
            return acc;
        }, []);
    }

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

    const buildWeakTopics = () => {
        let weak = [];
        if (syllabusTopics) {
            Object.entries(syllabusTopics).forEach(([subject, topics]) => {
                topics.forEach(topic => {
                    const score = topicScores[topic];
                    if (score) {
                        const pct = (score.obtained / score.total) * 100;
                        if (pct < 75) {
                            weak.push({
                                topic, 
                                subject,
                                mistakeType: score.mistakeType,
                                feedback: score.feedback,
                                status: gapProgress[topic] || 'weak'
                            });
                        }
                    }
                });
            });
        }
        return weak;
    };

    const weakTopics = buildWeakTopics();

    // Initialize Chat
    useEffect(() => {
        if (weakTopics.length > 0 && messages.length === 0) {
            const unresolvedTopics = weakTopics.filter(t => t.status !== 'resolved');
            
            if (unresolvedTopics.length > 0) {
                setMessages([
                    {
                        id: Date.now().toString(),
                        role: 'bot',
                        type: 'text',
                        content: `Hi! I'm your AI Improvement Coach. Based on your recent performance, I've identified a few specific areas where we can improve to boost your score. What would you like to review first?`
                    },
                    {
                        id: (Date.now() + 1).toString(),
                        role: 'bot',
                        type: 'options',
                        options: unresolvedTopics.map(t => ({
                            label: t.topic,
                            action: () => handleTopicSelect(t.topic, t.mistakeType, t.feedback)
                        }))
                    }
                ]);
            } else {
                 setMessages([
                    {
                        id: Date.now().toString(),
                        role: 'bot',
                        type: 'text',
                        content: `Hi! I'm your AI Improvement Coach. Great job! It looks like you have resolved all your weak topics for now.`
                    }
                ]);
            }
        } else if (weakTopics.length === 0 && messages.length === 0) {
            setMessages([
                {
                    id: Date.now().toString(),
                    role: 'bot',
                    type: 'text',
                    content: `Hi there! I don't have enough data from your tests to find any weak topics yet. Keep practicing!`
                }
            ]);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [weakTopics.length]); // Intentionally omitting messages to avoid loops

    const generateOptionsMessage = () => {
         const unresolvedTopics = buildWeakTopics().filter(t => t.status !== 'resolved');
         if (unresolvedTopics.length > 0) {
               return {
                    id: Date.now().toString(),
                    role: 'bot',
                    type: 'options',
                    content: 'Which topic would you like to tackle next?',
                    options: unresolvedTopics.map(t => ({
                        label: t.topic,
                        action: () => handleTopicSelect(t.topic, t.mistakeType, t.feedback)
                    }))
                };
         } else {
              return {
                 id: Date.now().toString(),
                 role: 'bot',
                 type: 'text',
                 content: 'Amazing! You have resolved all the weak gaps I found.'
              };
         }
    };

    const handleTopicSelect = async (topic, mistakeType, feedback) => {
        // Find existing unresolved topic list and replace it so buttons disappear
        setMessages(prev => {
            const newMsgs = [...prev];
            const lastMsg = newMsgs[newMsgs.length - 1];
            if (lastMsg.type === 'options') {
                 newMsgs.pop(); 
            }
            return [
                ...newMsgs,
                { id: Date.now().toString(), role: 'user', type: 'text', content: `I want to review ${topic}` }
            ];
        });

        setIsTyping(true);
        updateGapProgress(topic, 'in_progress');

        try {
            const response = await fetch(`${API_URL}/api/remediate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic, grade: studentClass, mistakeType, feedback }),
            });
            const data = await response.json();
            if (data.error) throw new Error(data.error);
            
            setMessages(prev => [
                ...prev,
                { id: (Date.now() + 1).toString(), role: 'bot', type: 'explanation', data: data },
                generateOptionsMessage()
            ]);
            
        } catch (error) {
            console.error("Remediation failed:", error);
            setMessages(prev => [
                ...prev,
                { id: Date.now().toString(), role: 'bot', type: 'text', content: "Sorry, I had trouble generating that lesson. Let's try another topic." }
            ]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleMcqSubmit = (messageId, optionIndex, correctOption, topic) => {
        setMcqAnswers(prev => ({ ...prev, [messageId]: optionIndex }));
        if (optionIndex === correctOption) {
            updateGapProgress(topic, 'resolved');
        }
    };

    const handleWatchVideo = (topic) => {
        const query = encodeURIComponent(`${studentClass} CBSE ${topic} NCERT explained`);
        window.open(`https://www.youtube.com/results?search_query=${query}`, '_blank');
    };

    // --- RENDER HELPERS ---

    const renderText = (msg) => (
        <div style={{
            padding: '1rem 1.25rem',
            borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
            background: msg.role === 'user' ? 'var(--primary)' : 'var(--card)',
            color: msg.role === 'user' ? 'white' : 'var(--foreground)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            border: msg.role === 'bot' ? '1px solid var(--border)' : 'none',
            maxWidth: '85%',
            lineHeight: '1.5',
            fontSize: '0.95rem'
        }}>
           {msg.content}
        </div>
    );

    const renderOptions = (msg) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: '85%' }}>
            {msg.content && (
                 <div style={{
                    padding: '1rem 1.25rem',
                    borderRadius: '20px 20px 20px 4px',
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    fontSize: '0.95rem',
                    marginBottom: '0.5rem'
                }}>
                    {msg.content}
                </div>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {msg.options.map((opt, i) => (
                    <button
                        key={i}
                        onClick={opt.action}
                        style={{
                            padding: '0.75rem 1.25rem',
                            borderRadius: '20px',
                            background: 'white',
                            border: '1px solid var(--primary)',
                            color: 'var(--primary)',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                        }}
                        onMouseEnter={e => { e.target.style.background = 'var(--primary)'; e.target.style.color = 'white'; }}
                        onMouseLeave={e => { e.target.style.background = 'white'; e.target.style.color = 'var(--primary)'; }}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
        </div>
    );

    const renderExplanation = (msg) => {
        const d = msg.data;
        if (!d) return null;

        const isMcqSubmitted = mcqAnswers[msg.id] !== undefined;
        const userAnswer = mcqAnswers[msg.id];

        return (
            <div style={{
                borderRadius: '20px 20px 20px 4px',
                background: 'var(--card)', border: '1px solid var(--border)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                maxWidth: '90%', padding: '1.5rem',
                animation: 'fadeIn 0.4s ease'
            }}>
                <h3 style={{ marginTop: 0, color: 'var(--primary)', borderBottom: '2px solid var(--primary-light)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
                    {d.topic}
                </h3>

                {/* The Hook */}
                {d.hook && (
                    <div style={{ marginBottom: '1.5rem', background: 'var(--primary-light)', padding: '1rem', borderRadius: '12px' }}>
                        <p style={{ fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--primary)' }}>💡 {d.hook.title}</p>
                        <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.6' }}>{d.hook.explanation}</p>
                    </div>
                )}

                {/* Chapter Overview */}
                {d.chapterExplanation && (
                    <div style={{ marginBottom: '1.5rem' }}>
                        <p style={{ lineHeight: '1.6', fontSize: '0.95rem' }}>{d.chapterExplanation.overview}</p>
                        
                        {d.chapterExplanation.keyConcepts?.length > 0 && (
                            <div style={{ marginTop: '1rem' }}>
                                <strong style={{ color: 'var(--secondary)' }}>Key Concepts:</strong>
                                <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem', fontSize: '0.95rem', lineHeight: '1.6' }}>
                                    {d.chapterExplanation.keyConcepts.map((kc, i) => (
                                        <li key={i}><strong>{kc.heading}:</strong> {kc.explanation}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        
                        {d.chapterExplanation.importantTerms?.length > 0 && (
                            <div style={{ marginTop: '1rem', background: 'hsla(230, 100%, 67%, 0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid hsla(230, 100%, 67%, 0.1)' }}>
                                <strong style={{ color: 'var(--secondary)' }}>Important Terms:</strong>
                                <div style={{ display: 'grid', gap: '0.5rem', marginTop: '0.5rem' }}>
                                    {d.chapterExplanation.importantTerms.map((term, i) => (
                                        <div key={i} style={{ fontSize: '0.9rem' }}>
                                            <span style={{ fontWeight: 600 }}>{term.term}:</span> {term.definition}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Diagram */}
                {d.conceptMap && (
                    <MermaidDiagram chart={d.conceptMap} />
                )}

                {/* Common Mistakes */}
                {d.commonMistakes?.length > 0 && (
                    <div style={{ marginBottom: '1.5rem', background: 'hsla(0, 72%, 51%, 0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid hsla(0, 72%, 51%, 0.1)' }}>
                        <strong style={{ color: 'hsl(0, 72%, 41%)' }}>⚠️ Common Mistakes:</strong>
                        <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem', fontSize: '0.95rem', lineHeight: '1.5' }}>
                            {d.commonMistakes.map((cm, i) => (
                                <li key={i} style={{ marginBottom: '0.5rem' }}>
                                    <span style={{ textDecoration: 'line-through', opacity: 0.7 }}>{cm.mistake}</span><br/>
                                    <strong style={{ color: 'hsl(145, 63%, 32%)' }}>Correct:</strong> {cm.correction}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                
                {d.proTips?.length > 0 && (
                    <div style={{ marginBottom: '1.5rem' }}>
                        <strong style={{ color: 'var(--accent)' }}>⭐ Pro Tips:</strong>
                        <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem', fontSize: '0.95rem', lineHeight: '1.5' }}>
                            {d.proTips.map((tip, i) => (
                                <li key={i}>{tip}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* MCQ Question Module embedded in the explanation */}
                {d.mcq && (
                     <div style={{ marginTop: '2rem', padding: '1.25rem', background: 'var(--background)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                        <p style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '1rem' }}>
                            Let's check your understanding: <br />
                            <span style={{ fontWeight: 500, opacity: 0.8, fontSize: '0.95rem' }}>{d.mcq.question}</span>
                        </p>
                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                            {d.mcq.options.map((option, i) => {
                                let bg = 'transparent';
                                let borderColor = 'var(--border)';
                                let fontW = 500;
                                
                                if (isMcqSubmitted) {
                                    if (i === d.mcq.correctOption) {
                                        bg = 'hsla(145, 63%, 42%, 0.12)';
                                        borderColor = 'hsl(145, 63%, 42%)';
                                        fontW = 700;
                                    } else if (i === userAnswer && i !== d.mcq.correctOption) {
                                        bg = 'hsla(0, 72%, 51%, 0.12)';
                                        borderColor = 'hsl(0, 72%, 51%)';
                                    }
                                }
                                return (
                                    <button
                                        key={i}
                                        onClick={() => !isMcqSubmitted && handleMcqSubmit(msg.id, i, d.mcq.correctOption, d.topic)}
                                        disabled={isMcqSubmitted}
                                        style={{
                                            padding: '0.75rem 1rem', borderRadius: '10px',
                                            border: `2px solid ${borderColor}`, background: bg,
                                            cursor: isMcqSubmitted ? 'default' : 'pointer',
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
                        {isMcqSubmitted && (
                            <div style={{
                                marginTop: '1rem', padding: '1rem', borderRadius: '10px',
                                background: userAnswer === d.mcq.correctOption
                                    ? 'hsla(145, 63%, 42%, 0.08)' : 'hsla(0, 72%, 51%, 0.08)',
                                fontSize: '0.9rem', fontWeight: 600,
                                color: userAnswer === d.mcq.correctOption
                                    ? 'hsl(145, 63%, 32%)' : 'hsl(0, 72%, 41%)'
                            }}>
                                {userAnswer === d.mcq.correctOption
                                    ? 'Correct! This gap has been marked as resolved.'
                                    : `Incorrect. The correct answer is ${String.fromCharCode(65 + d.mcq.correctOption)}. Review the explanation and try watching the video.`
                                }
                            </div>
                        )}
                    </div>
                )}

                 {/* Video CTA */}
                 <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                     <button
                        onClick={() => handleWatchVideo(d.topic)}
                        style={{
                            padding: '0.75rem 1.5rem', borderRadius: '25px',
                            background: 'transparent', border: '1px solid var(--border)',
                            color: 'var(--foreground)', cursor: 'pointer', fontWeight: 600,
                            fontSize: '0.85rem'
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                    >
                        🎥 Search YouTube for this Topic
                    </button>
                 </div>
            </div>
        );
    };

    return (
        <div style={{ height: 'calc(100vh - 180px)', display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.5s ease' }}>
             <div style={{ marginBottom: '1rem', flexShrink: 0 }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.8rem' }}>🤖</span> AI Improvement Coach
                </h2>
                <p style={{ opacity: 0.6, fontSize: '0.9rem' }}>Chat with me to fix your knowledge gaps</p>
            </div>

            <div 
                ref={scrollRef}
                style={{ 
                    flex: '1', 
                    background: 'hsla(0,0%,100%,0.5)', 
                    borderRadius: '16px', 
                    border: '1px solid var(--border)',
                    overflowY: 'auto',
                    padding: '2rem 1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.5rem'
                }}
            >
                {messages.map((msg) => (
                    <div key={msg.id} style={{
                        display: 'flex',
                        justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        alignItems: 'flex-end',
                        gap: '0.5rem'
                    }}>
                        {msg.role === 'bot' && (
                             <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'white', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                                 🤖
                             </div>
                        )}
                        {msg.type === 'text' && renderText(msg)}
                        {msg.type === 'options' && renderOptions(msg)}
                        {msg.type === 'explanation' && renderExplanation(msg)}
                    </div>
                ))}
                
                {isTyping && (
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'white', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                            🤖
                        </div>
                        <div style={{
                            padding: '1rem', borderRadius: '20px 20px 20px 4px',
                            background: 'var(--card)', border: '1px solid var(--border)',
                            display: 'flex', gap: '4px', alignItems: 'center'
                        }}>
                            <div className="typing-dot" />
                            <div className="typing-dot" style={{ animationDelay: '0.2s' }} />
                            <div className="typing-dot" style={{ animationDelay: '0.4s' }} />
                        </div>
                    </div>
                )}
            </div>

             <style jsx>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .typing-dot {
                    width: 6px; height: 6px; background: var(--primary); borderRadius: 50%;
                    animation: bounce 1.4s infinite ease-in-out both;
                }
                @keyframes bounce {
                    0%, 80%, 100% { transform: scale(0); }
                    40% { transform: scale(1); }
                }
            `}</style>
        </div>
    );
}

"use client";
import { useState } from 'react';

export default function FeedbackDisplay({ evaluation, onBack, onGeneratePractice }) {
    if (!evaluation) return null;

    const [selectedTypes, setSelectedTypes] = useState([]);
    const [activeTopicFilter, setActiveTopicFilter] = useState('All');

    // Extract unique topics for tabs
    const topics = ['All', ...new Set(evaluation.questions.map(q => q.topic))];

    // Filtered questions based on active topic tab
    const filteredQuestions = activeTopicFilter === 'All'
        ? evaluation.questions
        : evaluation.questions.filter(q => q.topic === activeTopicFilter);

    const handleGeneratePractice = () => {
        if (selectedTypes.length === 0) {
            alert("Please select at least one question type (e.g., Multiple Choice).");
            return;
        }

        // Only generate for weak topics WITHIN the current filter
        const weakTopics = filteredQuestions
            .filter(q => q.marksObtained < q.maxMarks)
            .map(q => q.topic);

        if (weakTopics.length === 0) {
            alert("No weak topics identified in this category. Great job!");
            return;
        }

        if (selectedTypes.length === 0) {
            alert("Please select at least one question type.");
            return;
        }

        onGeneratePractice([...new Set(weakTopics)], selectedTypes);
    };

    const toggleType = (type) => {
        setSelectedTypes(prev =>
            prev.includes(type)
                ? prev.filter(t => t !== type)
                : [...prev, type]
        );
    };

    return (
        <div className="feedback-container" style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <button onClick={onBack} style={{
                        background: 'none', border: 'none', color: 'var(--primary)',
                        cursor: 'pointer', marginBottom: '1rem', fontWeight: 600,
                        display: 'flex', alignItems: 'center', gap: '0.5rem'
                    }}>
                        ← Back to Upload
                    </button>
                    <h1 style={{ fontSize: '2.5rem' }}>Solutions & Feedback</h1>
                </div>

                <div className="glass" style={{
                    padding: '1.5rem 2.5rem', borderRadius: 'var(--radius)',
                    textAlign: 'center', minWidth: '150px'
                }}>
                    <p style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '0.25rem' }}>Overall Score</p>
                    <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary)' }}>
                        {evaluation.overallScore}<span style={{ fontSize: '1rem', opacity: 0.5 }}>/{evaluation.totalMarks}</span>
                    </div>
                </div>
            </header>

            <div className="tabs-container" style={{ marginBottom: '2rem', display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>
                {topics.map(topic => (
                    <button
                        key={topic}
                        onClick={() => setActiveTopicFilter(topic)}
                        className={`tab-item ${activeTopicFilter === topic ? 'active' : ''}`}
                        style={{
                            padding: '0.5rem 1.25rem',
                            fontSize: '0.9rem',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {topic}
                    </button>
                ))}
            </div>

            <div style={{ display: 'grid', gap: '1.5rem' }}>
                {filteredQuestions && filteredQuestions.length > 0 ? (
                    filteredQuestions.map((q) => (
                        <div key={q.id} className="card glass" style={{ padding: '0' }}>
                            <div style={{
                                padding: '1rem 1.5rem',
                                borderBottom: '1px solid var(--border)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                background: q.marksObtained === q.maxMarks ? 'hsla(200, 100%, 50%, 0.05)' : 'hsla(0, 100%, 50%, 0.02)'
                            }}>
                                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: q.marksObtained === q.maxMarks ? 'var(--primary)' : 'inherit' }}>
                                    Question {q.id} • <span style={{ color: 'var(--secondary)' }}>{q.subject}</span> • {q.topic}
                                </span>
                                <div style={{
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '20px',
                                    background: q.marksObtained === q.maxMarks ? 'var(--primary-light)' : 'rgba(0,0,0,0.05)',
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                    color: q.marksObtained === q.maxMarks ? 'var(--primary)' : 'inherit'
                                }}>
                                    {q.marksObtained} / {q.maxMarks} Marks
                                </div>
                            </div>

                            <div style={{ padding: '1.5rem' }}>
                                <h4 style={{ marginBottom: '1rem' }}>{q.question}</h4>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                                    <div>
                                        <p style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: '0.5rem', fontWeight: 600, textTransform: 'uppercase' }}>Your Answer</p>
                                        <div style={{
                                            padding: '1rem', background: 'rgba(0,0,0,0.02)', borderRadius: '12px',
                                            border: '1px solid var(--border)', fontSize: '0.95rem', minHeight: '80px'
                                        }}>
                                            {q.studentAnswer}
                                        </div>
                                    </div>

                                    {q.marksObtained < q.maxMarks && (
                                        <div>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--secondary)', marginBottom: '0.5rem', fontWeight: 600, textTransform: 'uppercase' }}>Why I Lost Marks</p>
                                            <div style={{
                                                padding: '1rem', background: 'hsl(230, 100%, 98%)', borderRadius: '12px',
                                                border: '1px solid hsla(230, 100%, 67%, 0.2)', fontSize: '0.95rem', minHeight: '80px',
                                                color: 'hsl(230, 47%, 21%)'
                                            }}>
                                                <p style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--secondary)' }}>
                                                    [{q.mistakeType}]
                                                </p>
                                                {q.feedback}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {q.marksObtained < q.maxMarks && (
                                    <div style={{ marginTop: '1.5rem', borderTop: '1px dashed var(--border)', paddingTop: '1.5rem' }}>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--primary)', marginBottom: '0.5rem', fontWeight: 600, textTransform: 'uppercase' }}>Correct Answer Guidance</p>
                                        <p style={{ fontSize: '0.95rem', opacity: 0.8, lineHeight: '1.6' }}>{q.correctAnswer}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="card glass" style={{ padding: '2rem', textAlign: 'center', width: '100%' }}>
                        <p>No question details were extracted. Please try a clearer photo or check your connection.</p>
                    </div>
                )}
            </div>

            <div style={{ marginTop: '3rem', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2rem', marginBottom: '1rem' }}>
                    <p style={{ fontSize: '0.9rem', opacity: 1, fontWeight: 600, color: 'var(--primary)', margin: 0 }}>SELECT QUESTION TYPES:</p>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            onClick={() => setSelectedTypes(['Multiple Choice', 'Short Answer', 'Long Answer'])}
                            style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}
                        >
                            Select All
                        </button>
                        <span style={{ opacity: 0.3 }}>|</span>
                        <button
                            onClick={() => setSelectedTypes([])}
                            style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}
                        >
                            Clear All
                        </button>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '2rem', flexWrap: 'wrap' }}>
                    {['Multiple Choice', 'Short Answer', 'Long Answer'].map(type => (
                        <button
                            key={type}
                            onClick={() => toggleType(type)}
                            className="glass"
                            style={{
                                padding: '0.75rem 1.5rem',
                                borderRadius: '30px',
                                border: `2px solid ${selectedTypes.includes(type) ? 'var(--primary)' : 'var(--border)'}`,
                                background: selectedTypes.includes(type) ? 'var(--primary-light)' : 'rgba(255,255,255,0.05)',
                                color: selectedTypes.includes(type) ? 'var(--primary)' : 'var(--foreground)',
                                cursor: 'pointer',
                                fontWeight: 700,
                                fontSize: '0.9rem',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: selectedTypes.includes(type) ? '0 4px 12px hsla(200, 100%, 50%, 0.2)' : 'none',
                                transform: selectedTypes.includes(type) ? 'scale(1.05)' : 'scale(1)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <span style={{
                                width: '18px', height: '18px', borderRadius: '50%',
                                border: `2px solid ${selectedTypes.includes(type) ? 'var(--primary)' : 'var(--border)'}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '10px', background: selectedTypes.includes(type) ? 'var(--primary)' : 'transparent',
                                color: 'white'
                            }}>
                                {selectedTypes.includes(type) ? '✓' : ''}
                            </span>
                            {type}
                        </button>
                    ))}
                </div>
                <button className="btn-primary" style={{ padding: '1rem 3rem' }} onClick={handleGeneratePractice}>
                    Generate Practice for {activeTopicFilter === 'All' ? 'All Topics' : activeTopicFilter}
                </button>
            </div>

            <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
        </div>
    );
}

"use client";

export default function FeedbackDisplay({ evaluation, onBack, onGeneratePractice }) {
    if (!evaluation) return null;

    const handleGeneratePractice = () => {
        const weakTopics = evaluation.questions
            .filter(q => q.marksObtained < q.maxMarks)
            .map(q => q.topic);
        onGeneratePractice(weakTopics);
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
                    <h1 style={{ fontSize: '2.5rem' }}>NCERT <span className="gradient-text">Solutions & Feedback</span></h1>
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

            <div style={{ display: 'grid', gap: '1.5rem' }}>
                {evaluation.questions.map((q) => (
                    <div key={q.id} className="card glass" style={{ padding: '0' }}>
                        <div style={{
                            padding: '1rem 1.5rem',
                            borderBottom: '1px solid var(--border)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: q.marksObtained === q.maxMarks ? 'hsla(142, 71%, 45%, 0.05)' : 'hsla(0, 100%, 50%, 0.02)'
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
                ))}
            </div>

            <div style={{ marginTop: '3rem', textAlign: 'center' }}>
                <button className="btn-primary" style={{ padding: '1rem 3rem' }} onClick={handleGeneratePractice}>
                    Generate Practice Questions for Weak Topics
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

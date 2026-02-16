"use client";

export default function Dashboard({ evaluation }) {
    // Simulate some historical data based on current evaluation
    const topics = evaluation.questions.reduce((acc, q) => {
        if (!acc[q.topic]) {
            acc[q.topic] = {
                name: q.topic,
                total: 0,
                obtained: 0,
                mistakes: []
            };
        }
        acc[q.topic].total += q.maxMarks;
        acc[q.topic].obtained += q.marksObtained;
        if (q.marksObtained < q.maxMarks) {
            acc[q.topic].mistakes.push(q.mistakeType);
        }
        return acc;
    }, {});

    const topicList = Object.values(topics);

    const subjectStats = topicList.reduce((acc, topic) => {
        const q = evaluation.questions.find(quest => quest.topic === topic.name);
        if (!acc[q.subject]) {
            acc[q.subject] = { name: q.subject, total: 0, obtained: 0 };
        }
        acc[q.subject].total += topic.total;
        acc[q.subject].obtained += topic.obtained;
        return acc;
    }, {});

    const subjectList = Object.values(subjectStats);

    return (
        <div className="dashboard" style={{ animation: 'fadeIn 0.5s ease' }}>
            <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '2rem' }}>Learning <span className="gradient-text">Insights</span></h2>
                <p style={{ opacity: 0.6 }}>CBSE Class 6 NCERT Progress Tracker</p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                <div className="card glass">
                    <h4 style={{ marginBottom: '1.5rem', opacity: 0.7 }}>Subject Mastery</h4>
                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                        {subjectList.map((subject, i) => (
                            <div key={i}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                    <span style={{ fontWeight: 600 }}>{subject.name}</span>
                                    <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{Math.round((subject.obtained / subject.total) * 100)}%</span>
                                </div>
                                <div style={{ height: '10px', background: 'var(--border)', borderRadius: '5px', overflow: 'hidden' }}>
                                    <div style={{
                                        height: '100%',
                                        width: `${(subject.obtained / subject.total) * 100}%`,
                                        background: 'linear-gradient(90deg, var(--primary), var(--secondary))',
                                        transition: 'width 1s ease-out'
                                    }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card glass">
                    <h4 style={{ marginBottom: '1.5rem', opacity: 0.7 }}>Mistake Classification</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {["Conceptual Gap", "Silly Mistake", "Topic Gap"].map((m, i) => {
                            const count = topicList.reduce((acc, t) => acc + t.mistakes.filter(mistake => mistake === m).length, 0);
                            return (
                                <div key={i} className="card" style={{
                                    padding: '1rem', flex: '1 1 120px', textAlign: 'center',
                                    background: count > 0 ? 'var(--primary-light)' : 'var(--card)',
                                    borderColor: count > 0 ? 'var(--primary)' : 'var(--border)',
                                    boxShadow: count > 0 ? '0 4px 12px hsla(142, 71%, 45%, 0.1)' : 'none'
                                }}>
                                    <div style={{ fontSize: '2rem', fontWeight: 800, color: count > 0 ? 'var(--primary)' : 'inherit' }}>{count}</div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.7, textTransform: 'uppercase' }}>{m}s</div>
                                </div>
                            );
                        })}
                    </div>
                    <p style={{ marginTop: '1.5rem', fontSize: '0.85rem', lineHeight: '1.5', padding: '1rem', borderRadius: '8px', background: 'rgba(0,0,0,0.02)' }}>
                        💡 <b>Insight:</b> You are performing exceptionally well in <b>Mathematics</b>! Focus on <b>Science</b> topics where conceptual gaps were identified.
                    </p>
                </div>
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

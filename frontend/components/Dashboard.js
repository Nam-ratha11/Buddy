"use client";

export default function Dashboard({ evaluation, history = [], studentClass }) {
    // If no single evaluation is provided, aggregate questions from history
    let questionsToAnalyze = [];
    if (evaluation && evaluation.questions) {
        questionsToAnalyze = evaluation.questions;
    } else if (history.length > 0) {
        questionsToAnalyze = history.reduce((acc, item) => {
            if (item.data && item.data.questions) {
                return acc.concat(item.data.questions);
            }
            return acc;
        }, []);
    }

    if (questionsToAnalyze.length === 0) {
        return (
            <div className="dashboard card glass" style={{ animation: 'fadeIn 0.5s ease', textAlign: 'center', padding: '4rem' }}>
                <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--primary)' }}>No Insights Yet</h2>
                <p style={{ opacity: 0.7 }}>Upload an answer sheet to see your subject mastery for {studentClass}.</p>
                <style jsx>{`
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(10px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
            </div>
        );
    }

    // Simulate some historical data based on current evaluation or aggregated questions
    const topics = questionsToAnalyze.reduce((acc, q) => {
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
        const q = questionsToAnalyze.find(quest => quest.topic === topic.name);
        if (!acc[q.subject]) {
            acc[q.subject] = { name: q.subject, total: 0, obtained: 0 };
        }
        acc[q.subject].total += topic.total;
        acc[q.subject].obtained += topic.obtained;
        return acc;
    }, {});

    const subjectList = Object.values(subjectStats);

    // Determine the display title
    const displayClass = evaluation ? (evaluation.studentClass || "Student") : (studentClass || "Student");
    const isHistorical = !evaluation && history.length > 0;

    return (
        <div className="dashboard" style={{ animation: 'fadeIn 0.5s ease' }}>
            <h2 style={{ fontSize: '2rem' }}>Learning Insights</h2>
            <p style={{ opacity: 0.6 }}>
                {displayClass} Progress Tracker {isHistorical ? "(All Recent Submissions)" : ""}
            </p>

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
                                    boxShadow: count > 0 ? '0 4px 12px hsla(200, 100%, 50%, 0.1)' : 'none'
                                }}>
                                    <div style={{ fontSize: '2rem', fontWeight: 800, color: count > 0 ? 'var(--primary)' : 'inherit' }}>{count}</div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.7, textTransform: 'uppercase' }}>{m}s</div>
                                </div>
                            );
                        })}
                    </div>
                    {(() => {
                        const sortedSubjects = [...subjectList].sort((a, b) => (b.obtained / b.total) - (a.obtained / a.total));
                        const best = sortedSubjects[0];
                        const worst = sortedSubjects.length > 1 ? sortedSubjects[sortedSubjects.length - 1] : null;

                        const weakTopics = topicList
                            .filter(t => t.obtained < t.total)
                            .sort((a, b) => (a.obtained / a.total) - (b.obtained / b.total))
                            .slice(0, 2);

                        return (
                            <p style={{ marginTop: '1.5rem', fontSize: '0.85rem', lineHeight: '1.5', padding: '1rem', borderRadius: '8px', background: 'rgba(0,0,0,0.02)' }}>
                                <b>Insight:</b> You are performing {best.obtained / best.total > 0.8 ? 'exceptionally well' : 'well'} in <b>{best.name}</b>!
                                {worst && worst !== best ? (
                                    <> Focus on <b>{worst.name}</b> where some gaps were identified.</>
                                ) : weakTopics.length > 0 ? (
                                    <> Focus on <b>{weakTopics.map(t => t.name).join(' & ')}</b> to improve your score.</>
                                ) : (
                                    <> Keep up the great work across all topics!</>
                                )}
                            </p>
                        );
                    })()}
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

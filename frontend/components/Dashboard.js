"use client";

const T = {
  pageBg: 'var(--page)', cardBg: 'var(--card)', zoneBg: 'var(--zone)',
  green: 'var(--g)', gMid: 'var(--gMid)', gLight: 'var(--gLight)', gRing: 'var(--gRing)',
  gGlow: 'var(--gGlow)', ink: 'var(--ink)', sub: 'var(--sub)',
  hint: 'var(--hint)', line: 'var(--line)', lineHi: 'var(--lineHi)',
};
const cardShadow = '0 0 0 1px rgba(0,0,0,0.04), 0 2px 4px rgba(0,0,0,0.04), 0 12px 40px rgba(0,0,0,0.07)';

export default function Dashboard({ evaluation, history = [], studentClass }) {
  let questionsToAnalyze = [];
  if (evaluation && evaluation.questions) {
    questionsToAnalyze = evaluation.questions;
  } else if (history.length > 0) {
    questionsToAnalyze = history.reduce((acc, item) => {
      if (item.data && item.data.questions) return acc.concat(item.data.questions);
      return acc;
    }, []);
  }

  if (questionsToAnalyze.length === 0) {
    return (
      <div style={{
        background: T.cardBg, border: `1px solid ${T.line}`, borderRadius: 20,
        boxShadow: cardShadow, textAlign: 'center', padding: '4rem 2rem',
        animation: 'sp-fadein 0.3s ease both',
      }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: T.gLight, border: `1px solid ${T.gRing}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 24 }}>📊</div>
        <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 22, color: T.ink, marginBottom: 8 }}>No Insights Yet</h2>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: T.sub }}>Upload an answer sheet to see your subject mastery for {studentClass}.</p>
      </div>
    );
  }

  const topics = questionsToAnalyze.reduce((acc, q) => {
    if (!acc[q.topic]) acc[q.topic] = { name: q.topic, total: 0, obtained: 0, mistakes: [] };
    acc[q.topic].total += q.maxMarks;
    acc[q.topic].obtained += q.marksObtained;
    if (q.marksObtained < q.maxMarks) acc[q.topic].mistakes.push(q.mistakeType);
    return acc;
  }, {});
  const topicList = Object.values(topics);

  const subjectStats = questionsToAnalyze.reduce((acc, q) => {
    const subj = q.subject || 'General';
    if (!acc[subj]) acc[subj] = { name: subj, total: 0, obtained: 0 };
    acc[subj].total += q.maxMarks;
    acc[subj].obtained += q.marksObtained;
    return acc;
  }, {});
  const subjectList = Object.values(subjectStats);

  const displayClass = evaluation ? (evaluation.studentClass || 'Student') : (studentClass || 'Student');
  const isHistorical = !evaluation && history.length > 0;

  const mistakeTypes = ['Conceptual Gap', 'Silly Mistake', 'Topic Gap'];

  const sortedSubjects = [...subjectList].sort((a, b) => (b.obtained / b.total) - (a.obtained / a.total));
  const best = sortedSubjects[0];
  const worst = sortedSubjects.length > 1 ? sortedSubjects[sortedSubjects.length - 1] : null;
  const weakTopics = topicList.filter(t => t.obtained < t.total).sort((a, b) => (a.obtained / a.total) - (b.obtained / b.total)).slice(0, 2);

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", animation: 'sp-fadein 0.3s ease both' }}>
      {/* Header */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: T.green, boxShadow: `0 0 0 3px ${T.gRing}` }} />
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 11, color: T.green, letterSpacing: '0.9px', textTransform: 'uppercase' }}>Learning Insights</span>
        </div>
        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: T.ink, marginBottom: 4 }}>
          {displayClass} Progress Tracker
        </h1>
        {isHistorical && <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: T.hint }}>Aggregated from all recent submissions</span>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        {/* Subject Mastery */}
        <div style={{ background: T.cardBg, border: `1px solid ${T.line}`, borderRadius: 20, overflow: 'hidden', boxShadow: cardShadow }}>
          <div style={{ height: 3, background: `linear-gradient(90deg, ${T.green}, #FCD34D, transparent)` }} />
          <div style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: T.gLight, border: `1px solid ${T.gRing}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>📈</div>
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 13, color: T.ink }}>Subject Mastery</span>
            </div>
            <div style={{ display: 'grid', gap: 16 }}>
              {subjectList.map((subject, i) => {
                const pct = Math.round((subject.obtained / subject.total) * 100);
                const barColor = pct >= 75 ? T.gMid : pct >= 50 ? '#D97706' : '#DC2626';
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 13, color: T.ink }}>{subject.name}</span>
                      <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 13, color: barColor }}>{pct}%</span>
                    </div>
                    <div style={{ height: 6, background: T.gLight, border: `1px solid ${T.gRing}`, borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${barColor}, ${barColor}cc)`, borderRadius: 99, transition: 'width 1s ease-out' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mistake Classification */}
        <div style={{ background: T.cardBg, border: `1px solid ${T.line}`, borderRadius: 20, overflow: 'hidden', boxShadow: cardShadow }}>
          <div style={{ height: 3, background: `linear-gradient(90deg, ${T.green}, #FCD34D, transparent)` }} />
          <div style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: T.gLight, border: `1px solid ${T.gRing}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🎯</div>
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 13, color: T.ink }}>Mistake Classification</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 18 }}>
              {mistakeTypes.map((m, i) => {
                const count = topicList.reduce((acc, t) => acc + t.mistakes.filter(x => x === m).length, 0);
                return (
                  <div key={i} style={{
                    flex: '1 1 100px', textAlign: 'center', padding: '14px 10px',
                    background: count > 0 ? T.gLight : T.zoneBg,
                    border: `1px solid ${count > 0 ? T.gRing : T.line}`,
                    borderRadius: 12,
                  }}>
                    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 22, color: count > 0 ? T.green : T.hint, letterSpacing: '-0.5px' }}>{count}</div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: T.hint, marginTop: 2 }}>{m}s</div>
                  </div>
                );
              })}
            </div>
            {best && (
              <div style={{ padding: '12px 14px', background: T.gLight, border: `1px solid ${T.gRing}`, borderRadius: 12 }}>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: T.sub, lineHeight: 1.6, margin: 0 }}>
                  <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, color: T.green }}>Insight: </span>
                  You are performing {best.obtained / best.total > 0.8 ? 'exceptionally well' : 'well'} in <strong>{best.name}</strong>!
                  {worst && worst !== best
                    ? <> Focus on <strong>{worst.name}</strong> where some gaps were identified.</>
                    : weakTopics.length > 0
                      ? <> Focus on <strong>{weakTopics.map(t => t.name).join(' & ')}</strong> to improve your score.</>
                      : <> Keep up the great work across all topics!</>
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

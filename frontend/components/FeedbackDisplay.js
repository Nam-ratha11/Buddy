"use client";
import { useState } from 'react';

const T = {
  pageBg: 'var(--page)', cardBg: 'var(--card)', zoneBg: 'var(--zone)',
  green: 'var(--g)', gMid: 'var(--gMid)', gLight: 'var(--gLight)', gRing: 'var(--gRing)',
  gGlow: 'var(--gGlow)', ink: 'var(--ink)', sub: 'var(--sub)',
  hint: 'var(--hint)', line: 'var(--line)', lineHi: 'var(--lineHi)',
  red: 'var(--red)', redBg: 'var(--redBg)', redLine: 'var(--redLine)',
  amber: 'var(--amber)', amberBg: 'var(--amberBg)', amberLine: 'var(--amberLine)',
};

const cardShadow = '0 0 0 1px rgba(0,0,0,0.04), 0 2px 4px rgba(0,0,0,0.04), 0 12px 40px rgba(0,0,0,0.07)';

export default function FeedbackDisplay({ evaluation, onBack, onGeneratePractice, onNavigateToPractice }) {
  if (!evaluation) return null;

  const [activeTopicFilter, setActiveTopicFilter] = useState('All');
  const [revealedProof, setRevealedProof] = useState({});
  const [fetchedProofs, setFetchedProofs] = useState({});
  const [showPicker, setShowPicker] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState([]);

  const QUESTION_TYPES = [
    { id: 'Multiple Choice', label: 'Multiple Choice', mark: '1 mark', desc: 'Pick the correct option' },
    { id: 'Short Answer', label: 'Short Answer', mark: '3 marks', desc: '2–3 sentence answers' },
    { id: 'Long Answer', label: 'Long Answer', mark: '5 marks', desc: 'Detailed explanations' },
  ];

  const toggleType = (id) =>
    setSelectedTypes(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const toggleProof = async (qId, topic, question, currentProof) => {
    setRevealedProof(prev => ({ ...prev, [qId]: !prev[qId] }));
    if (!currentProof && !fetchedProofs[qId]) {
      try {
        const res = await fetch(`http://localhost:5001/api/proof?topic=${encodeURIComponent(topic)}&question=${encodeURIComponent(question)}`);
        const data = await res.json();
        if (data) setFetchedProofs(prev => ({ ...prev, [qId]: data }));
      } catch (e) { console.error("Proof fetch failed:", e); }
    }
  };

  const topics = ['All', ...new Set(evaluation.questions.map(q => q.topic))];
  const filteredQuestions = activeTopicFilter === 'All'
    ? evaluation.questions
    : evaluation.questions.filter(q => q.topic === activeTopicFilter);

  const handleGeneratePractice = () => {
    if (selectedTypes.length === 0) {
      alert('Please select at least one question type');
      return;
    }
    
    const weakTopics = filteredQuestions.filter(q => q.marksObtained < q.maxMarks).map(q => q.topic);
    const uniqueTopics = [...new Set(weakTopics)];
    
    console.log('Strengthen button clicked, topics:', uniqueTopics, 'types:', selectedTypes);
    
    // Call the parent's navigation handler with topics
    if (onNavigateToPractice) {
      onNavigateToPractice(uniqueTopics, selectedTypes);
    } else {
      console.error('onNavigateToPractice handler not provided');
    }
    
    setShowPicker(false);
  };

  const pct = Math.round((evaluation.overallScore / evaluation.totalMarks) * 100);
  const scoreColor = pct >= 75 ? T.green : pct >= 50 ? '#D97706' : T.red;

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", animation: 'sp-fadein 0.3s ease both' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <button onClick={onBack} style={{
            background: 'none', border: 'none', color: T.gMid, cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: 13,
            display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8, padding: 0,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Back
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: T.green, boxShadow: `0 0 0 3px ${T.gRing}` }} />
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 11, color: T.green, letterSpacing: '0.9px', textTransform: 'uppercase' }}>Review Solutions</span>
          </div>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: T.ink, margin: 0 }}>
            Answer Sheet Review
          </h1>
        </div>
        {/* Score pill */}
        <div style={{
          background: T.cardBg, border: `1px solid ${T.line}`, borderRadius: 16,
          padding: '14px 22px', textAlign: 'center', boxShadow: cardShadow, minWidth: 110,
        }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: T.hint, marginBottom: 4 }}>Score</div>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 28, color: scoreColor, letterSpacing: '-1px', lineHeight: 1 }}>
            {evaluation.overallScore}<span style={{ fontSize: 16, opacity: 0.5 }}>/{evaluation.totalMarks}</span>
          </div>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 11, color: scoreColor, marginTop: 4 }}>{pct}%</div>
        </div>
      </div>

      {/* Topic filter tabs */}
      <div style={{
        display: 'inline-flex', background: T.cardBg, border: `1px solid ${T.line}`,
        borderRadius: 14, padding: 5, gap: 2, marginBottom: 20, flexWrap: 'wrap',
      }}>
        {topics.map(topic => {
          const active = activeTopicFilter === topic;
          return (
            <button key={topic} onClick={() => setActiveTopicFilter(topic)} style={{
              padding: '6px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: active ? T.green : 'transparent',
              color: active ? 'white' : T.sub,
              fontFamily: active ? "'Plus Jakarta Sans', sans-serif" : "'DM Sans', sans-serif",
              fontWeight: active ? 700 : 400, fontSize: 13,
              boxShadow: active ? `0 2px 12px ${T.gGlow}` : 'none',
              transition: 'all 0.15s ease', whiteSpace: 'nowrap',
            }}>{topic}</button>
          );
        })}
      </div>

      {/* Question cards */}
      <div style={{ display: 'grid', gap: 14 }}>
        {filteredQuestions.map((q, idx) => {
          const wrong = q.marksObtained < q.maxMarks;
          return (
            <div key={idx} style={{
              background: T.cardBg, borderRadius: 20, overflow: 'hidden',
              border: `1px solid ${wrong ? T.redLine : T.line}`,
              boxShadow: cardShadow,
            }}>
              {/* Top accent */}
              <div style={{ height: 3, background: wrong ? `linear-gradient(90deg, ${T.red}, #F87171, transparent)` : `linear-gradient(90deg, ${T.green}, #FCD34D, transparent)` }} />
              {/* Card header */}
              <div style={{
                padding: '10px 20px', borderBottom: `1px solid ${T.line}`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: wrong ? T.redBg : T.gLight,
              }}>
                <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 11, color: wrong ? T.red : T.green, letterSpacing: '0.7px', textTransform: 'uppercase' }}>
                  Q{q.id} · {q.topic}
                </span>
                <span style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 12,
                  background: T.cardBg, border: `1px solid ${wrong ? T.redLine : T.gRing}`,
                  color: wrong ? T.red : T.green, borderRadius: 99, padding: '3px 10px',
                }}>
                  {q.marksObtained} / {q.maxMarks}
                </span>
              </div>

              <div style={{ padding: '18px 20px' }}>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, lineHeight: 1.6, color: T.ink, marginBottom: 16 }}>{q.question}</p>
                <div style={{ display: 'grid', gridTemplateColumns: wrong ? '1fr 1fr' : '1fr', gap: 20 }}>
                  {/* Student answer */}
                  <div>
                    <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 10, color: T.hint, textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 8 }}>Your Answer</p>
                    <div style={{ padding: '12px 14px', background: T.zoneBg, borderRadius: 12, border: `1px solid ${T.line}`, fontSize: 14, color: T.ink, lineHeight: 1.6, minHeight: 52 }}>
                      {q.studentAnswer || <span style={{ color: T.hint, fontStyle: 'italic' }}>No answer provided</span>}
                    </div>
                  </div>

                  {/* Proof / coach panel */}
                  {wrong && (
                    <div style={{ borderLeft: `1px dashed ${T.line}`, paddingLeft: 20 }}>
                      {!revealedProof[q.id] ? (
                        <button onClick={() => toggleProof(q.id, q.topic, q.question, q.proof)} style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '10px 16px', borderRadius: 10,
                          background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: 'white',
                          border: 'none', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700,
                          cursor: 'pointer', fontSize: 13,
                          boxShadow: `0 4px 14px ${T.gGlow}`,
                        }}>
                          <span>🧐</span> View Lesson &amp; Proof
                        </button>
                      ) : (
                        <div style={{ display: 'grid', gap: 10, animation: 'sp-fadein 0.3s ease' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 10, color: T.gMid, letterSpacing: '1px', textTransform: 'uppercase' }}>Coach's Analysis</span>
                            <button onClick={() => toggleProof(q.id)} style={{ background: 'none', border: 'none', color: T.hint, cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>Hide</button>
                          </div>
                          <div style={{ padding: '10px 12px', background: T.amberBg, borderRadius: 10, borderLeft: `3px solid ${T.amberLine}` }}>
                            <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 10, color: T.amber, marginBottom: 4, textTransform: 'uppercase' }}>📖 Lesson: {q.topic}</p>
                            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: T.amber, lineHeight: 1.5, margin: 0 }}>{q.correctAnswer}</p>
                          </div>
                          {(q.proof || fetchedProofs[q.id]) ? (
                            <div style={{ padding: '10px 12px', background: '#EFF6FF', borderLeft: `3px solid #3B82F6`, borderRadius: 10 }}>
                              <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 10, color: '#1D4ED8', marginBottom: 4, textTransform: 'uppercase' }}>✅ Proof · Page {(q.proof || fetchedProofs[q.id]).page || 'N/A'}</p>
                              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontStyle: 'italic', color: '#1E3A8A', lineHeight: 1.5, margin: 0 }}>"{(q.proof || fetchedProofs[q.id]).text}"</p>
                            </div>
                          ) : (
                            <div style={{ padding: '8px 12px', background: T.zoneBg, borderRadius: 10, fontSize: 12, color: T.hint, textAlign: 'center' }}>Parsing curriculum for exact proof…</div>
                          )}
                          <div style={{ padding: '10px 12px', background: T.redBg, borderLeft: `3px solid ${T.redLine}`, borderRadius: 10 }}>
                            <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 10, color: T.red, marginBottom: 4, textTransform: 'uppercase' }}>Feedback</p>
                            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#9F1239', lineHeight: 1.5, margin: 0 }}>{q.feedback}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <div style={{ marginTop: 28 }}>
        {/* Picker panel */}
        {showPicker && (
          <div style={{
            background: T.cardBg, border: `1px solid ${T.line}`, borderRadius: 16,
            boxShadow: cardShadow, padding: '22px 24px', marginBottom: 16,
            animation: 'sp-fadein 0.2s ease both',
          }}>
            {/* Panel header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 15, color: T.ink }}>
                  Choose question types
                </div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12.5, color: T.hint, marginTop: 2 }}>
                  Select one or more — we'll mix them in your practice set
                </div>
              </div>
              <button onClick={() => setShowPicker(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.hint, fontSize: 18, lineHeight: 1, padding: 4 }}>×</button>
            </div>

            {/* Radio-style option cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {QUESTION_TYPES.map(qt => {
                const checked = selectedTypes.includes(qt.id);
                return (
                  <label key={qt.id} onClick={() => toggleType(qt.id)} style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
                    border: `1.5px solid ${checked ? T.green : T.line}`,
                    background: checked ? T.gLight : T.zoneBg,
                    transition: 'all 0.15s ease',
                  }}>
                    {/* Custom checkbox */}
                    <div style={{
                      width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                      border: `2px solid ${checked ? T.green : T.lineHi}`,
                      background: checked ? T.green : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}>
                      {checked && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </div>
                    {/* Label text */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 14, color: checked ? T.green : T.ink }}>
                          {qt.label}
                        </span>
                        <span style={{
                          fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 10,
                          padding: '2px 8px', borderRadius: 99,
                          background: checked ? T.green : T.line,
                          color: checked ? 'white' : T.hint,
                          transition: 'all 0.15s',
                        }}>{qt.mark}</span>
                      </div>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12.5, color: T.hint, marginTop: 2 }}>{qt.desc}</div>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Generate button */}
            <button
              onClick={handleGeneratePractice}
              disabled={selectedTypes.length === 0}
              style={{
                width: '100%', padding: '13px', borderRadius: 12, border: 'none',
                background: selectedTypes.length ? 'linear-gradient(135deg, #F59E0B, #D97706)' : T.line,
                color: selectedTypes.length ? 'white' : T.hint,
                fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 14,
                cursor: selectedTypes.length ? 'pointer' : 'not-allowed',
                boxShadow: selectedTypes.length ? `0 4px 16px ${T.gGlow}` : 'none',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => { if (selectedTypes.length) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(245,158,11,0.35)'; } }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = selectedTypes.length ? `0 4px 16px ${T.gGlow}` : 'none'; }}
            >
              {selectedTypes.length === 0
                ? 'Select at least one type'
                : `Generate ${selectedTypes.join(' + ')} Questions 🚀`}
            </button>
          </div>
        )}

        {/* Trigger button */}
        {!showPicker && (
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={() => { setShowPicker(true); setSelectedTypes([]); }}
              style={{
                padding: '14px 32px', borderRadius: 12,
                background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: 'white',
                border: 'none', cursor: 'pointer',
                fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 15,
                letterSpacing: '-0.2px', boxShadow: `0 4px 16px ${T.gGlow}`,
                transition: 'all 0.22s cubic-bezier(0.4,0,0.2,1)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg, #D97706, #B45309)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, #F59E0B, #D97706)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              Strengthen These Topics 🚀
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

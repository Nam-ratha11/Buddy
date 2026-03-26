"use client";
import { useState } from 'react';

const T = {
  pageBg: 'var(--page)', cardBg: 'var(--card)', zoneBg: 'var(--zone)',
  green: 'var(--g)', gMid: 'var(--gMid)', gLight: 'var(--gLight)', gRing: 'var(--gRing)',
  gGlow: 'var(--gGlow)', ink: 'var(--ink)', sub: 'var(--sub)',
  hint: 'var(--hint)', line: 'var(--line)', lineHi: 'var(--lineHi)',
};

export default function TopicSelector({ onSelect, weakTopics = {}, syllabusTopics = {}, loading, studentClass }) {
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);

  const subjects = Object.keys(syllabusTopics);

  const handleModeSelect = (selectedMode) => {
    setMode(selectedMode);
    setStep(selectedMode === 'AUTO' ? 3 : 2);
  };

  const handleSubjectSelect = (subject) => {
    setSelectedSubject(subject);
    setStep(3);
  };

  const handleTopicSelect = (topic) => {
    onSelect({
      mode,
      topics: [topic],
      subject: selectedSubject || 'Mixed',
      selectedTypes: ['Multiple Choice']
    });
  };

  const handleBack = () => {
    if (step === 3 && mode === 'CHOOSE') {
      setStep(2);
    } else {
      setStep(1);
      setMode(null);
      setSelectedSubject(null);
    }
  };

  if (step === 1) {
    return (
      <div style={{ background: T.cardBg, border: `1px solid ${T.line}`, borderRadius: 20, padding: '32px' }}>
        <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 22, color: T.ink, marginBottom: 8 }}>
          Choose Practice Mode
        </h2>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: T.sub, marginBottom: 24 }}>
          Select how you want to practice
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <button onClick={() => handleModeSelect('AUTO')} style={{ padding: '24px', borderRadius: 16, cursor: 'pointer', border: `2px solid ${T.gRing}`, background: T.gLight, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
            <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 17, color: T.green, marginBottom: 6 }}>AUTO Mode</h3>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: T.green }}>Practice your weak topics</p>
          </button>
          <button onClick={() => handleModeSelect('CHOOSE')} style={{ padding: '24px', borderRadius: 16, cursor: 'pointer', border: `2px solid ${T.line}`, background: T.zoneBg, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
            <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 17, color: T.ink, marginBottom: 6 }}>CHOOSE Topic</h3>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: T.sub }}>Pick a specific topic</p>
          </button>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div style={{ background: T.cardBg, border: `1px solid ${T.line}`, borderRadius: 20, padding: '32px' }}>
        <button onClick={handleBack} style={{ background: 'none', border: 'none', color: T.gMid, cursor: 'pointer', marginBottom: 20 }}>← Back</button>
        <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 22, color: T.ink, marginBottom: 24 }}>Select Subject</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {subjects.map(subject => (
            <button key={subject} onClick={() => handleSubjectSelect(subject)} style={{ padding: '20px', borderRadius: 12, cursor: 'pointer', border: `2px solid ${T.line}`, background: T.zoneBg, textAlign: 'left' }}>
              <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 16, color: T.ink }}>{subject}</h3>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: T.sub }}>{syllabusTopics[subject]?.length || 0} topics</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (step === 3) {
    const topicsToShow = mode === 'AUTO' ? Object.keys(weakTopics) : (syllabusTopics[selectedSubject] || []);
    return (
      <div style={{ background: T.cardBg, border: `1px solid ${T.line}`, borderRadius: 20, padding: '32px' }}>
        <button onClick={handleBack} style={{ background: 'none', border: 'none', color: T.gMid, cursor: 'pointer', marginBottom: 20 }}>← Back</button>
        <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 22, color: T.ink, marginBottom: 24 }}>
          {mode === 'AUTO' ? 'Your Weak Topics' : `${selectedSubject} Topics`}
        </h2>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
        ) : topicsToShow.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', background: T.zoneBg, borderRadius: 12 }}>
            <p style={{ color: T.sub }}>No topics available</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {topicsToShow.map(topic => (
              <button key={topic} onClick={() => handleTopicSelect(topic)} style={{ padding: '16px', borderRadius: 12, cursor: 'pointer', border: `2px solid ${T.line}`, background: T.zoneBg, textAlign: 'left' }}>
                <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 15, color: T.ink }}>{topic}</h3>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
}

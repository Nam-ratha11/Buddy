"use client";
import { useState, useEffect, useRef } from 'react';

const T = {
  pageBg: 'var(--page)', cardBg: 'var(--card)', zoneBg: 'var(--zone)',
  green: 'var(--g)', gMid: 'var(--gMid)', gLight: 'var(--gLight)', gRing: 'var(--gRing)',
  gGlow: 'var(--gGlow)', ink: 'var(--ink)', sub: 'var(--sub)',
  hint: 'var(--hint)', line: 'var(--line)', lineHi: 'var(--lineHi)',
};
const cardShadow = '0 0 0 1px rgba(0,0,0,0.04), 0 2px 4px rgba(0,0,0,0.04), 0 12px 40px rgba(0,0,0,0.07)';

const CSS = `
  @keyframes fc-fadein  { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fc-pulse   { 0%,100% { opacity:.5; } 50% { opacity:.25; } }
  @keyframes fc-spin-in { from { opacity:0; transform:rotateY(-90deg) scale(0.85); } to { opacity:1; transform:rotateY(0deg) scale(1); } }
  @keyframes fc-spin-out{ from { opacity:1; transform:rotateY(0deg) scale(1); } to { opacity:0; transform:rotateY(90deg) scale(0.85); } }
  @keyframes fc-dot-pop { 0%,100% { transform:scale(1); } 40% { transform:scale(1.6); } }
  .fc-card-wrap { perspective: 1200px; }
  .fc-inner {
    position:relative; width:100%; height:100%;
    transform-style: preserve-3d;
    transition: transform 0.55s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .fc-inner.flipped { transform: rotateY(180deg); }
  .fc-face {
    position:absolute; inset:0; backface-visibility:hidden; border-radius:20px;
    display:flex; flex-direction:column; justify-content:space-between;
  }
  .fc-face.back { transform: rotateY(180deg); }
  .fc-arrow {
    width:40px; height:40px; border-radius:50%; border:1.5px solid var(--line);
    background:var(--card); cursor:pointer; display:flex; align-items:center;
    justify-content:center; transition:all 0.18s; flex-shrink:0;
  }
  .fc-arrow:hover:not(:disabled) { background:var(--gLight); border-color:var(--gRing); }
  .fc-arrow:disabled { opacity:0.3; cursor:not-allowed; }
  .fc-dot { border-radius:50%; transition:all 0.25s cubic-bezier(0.34,1.56,0.64,1); cursor:pointer; border:none; padding:0; }
  .fc-dot.active { animation: fc-dot-pop 0.35s ease; }
`;

// ── Single animated card ──────────────────────────────────────────────────────
function FlashCard({ card, animDir }) {
  const [flipped, setFlipped] = useState(false);
  const [phase, setPhase]     = useState('idle'); // 'out' | 'in' | 'idle'
  const prevCard = useRef(card);

  // When card prop changes, run spin-out → swap → spin-in
  useEffect(() => {
    if (prevCard.current === card) return;
    setPhase('out');
    const t = setTimeout(() => {
      prevCard.current = card;
      setFlipped(false);
      setPhase('in');
      setTimeout(() => setPhase('idle'), 420);
    }, 280);
    return () => clearTimeout(t);
  }, [card]);

  const spinStyle = phase === 'out'
    ? { animation: 'fc-spin-out 0.28s cubic-bezier(0.4,0,1,1) forwards' }
    : phase === 'in'
    ? { animation: 'fc-spin-in 0.42s cubic-bezier(0.34,1.56,0.64,1) both' }
    : {};

  return (
    <div
      className="fc-card-wrap"
      style={{ height: 320, cursor: 'pointer', ...spinStyle }}
      onClick={() => phase === 'idle' && setFlipped(f => !f)}
    >
      <div className={`fc-inner${flipped ? ' flipped' : ''}`} style={{ height: '100%' }}>

        {/* ── FRONT ── */}
        <div className="fc-face" style={{
          background: T.cardBg, border: `1px solid ${T.line}`, boxShadow: cardShadow, padding: '1.75rem',
        }}>
          <div>
            <p style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: T.green, fontFamily: "'Plus Jakarta Sans',sans-serif", margin: '0 0 6px', letterSpacing: '0.8px' }}>
              {card.subject}
            </p>
            <h3 style={{ margin: '0 0 12px', fontSize: '1.15rem', lineHeight: 1.35, fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, color: T.ink }}>
              {card.topic}
            </h3>
            <p style={{ fontSize: '0.9rem', lineHeight: 1.65, color: T.sub, margin: 0, fontFamily: "'DM Sans',sans-serif" }}>
              {card.summary}
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
            <span style={{ fontSize: '0.72rem', color: T.hint, fontFamily: "'DM Sans',sans-serif", display: 'flex', alignItems: 'center', gap: 5 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.hint} strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Tap to reveal answer
            </span>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: T.gLight, border: `1px solid ${T.gRing}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🔄</div>
          </div>
        </div>

        {/* ── BACK ── */}
        <div className="fc-face back" style={{
          background: `linear-gradient(135deg, ${T.green} 0%, #1d4ed8 100%)`,
          border: `1px solid ${T.green}`, boxShadow: cardShadow, padding: '1.75rem',
        }}>
          <div>
            <p style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: 'rgba(255,255,255,0.65)', fontFamily: "'Plus Jakarta Sans',sans-serif", margin: '0 0 10px', letterSpacing: '0.8px' }}>
              Key Points
            </p>
            <ul style={{ paddingLeft: '1.1rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {(card.keyPoints || []).map((pt, i) => (
                <li key={i} style={{ fontSize: '0.88rem', lineHeight: 1.55, fontFamily: "'DM Sans',sans-serif", color: 'rgba(255,255,255,0.92)' }}>{pt}</li>
              ))}
            </ul>
          </div>
          {card.memoryTip && (
            <div style={{ marginTop: '0.75rem', padding: '0.65rem 0.9rem', borderRadius: 12, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', fontSize: '0.8rem', fontFamily: "'DM Sans',sans-serif", color: 'rgba(255,255,255,0.85)' }}>
              💡 <strong>Tip:</strong> {card.memoryTip}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// ── Carousel wrapper ──────────────────────────────────────────────────────────
function FlashCardCarousel({ cards }) {
  const [idx, setIdx]   = useState(0);
  const [dir, setDir]   = useState('next');
  const cardRef         = useRef(cards[0]);

  const go = (next) => {
    setDir(next > idx ? 'next' : 'prev');
    setIdx(next);
    cardRef.current = cards[next];
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>

      {/* Counter */}
      <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 13, color: T.hint }}>
        {idx + 1} <span style={{ opacity: 0.4 }}>/</span> {cards.length}
      </div>

      {/* Card + arrows row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, width: '100%', maxWidth: 560 }}>
        <button className="fc-arrow" disabled={idx === 0} onClick={() => go(idx - 1)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.ink} strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>

        <div style={{ flex: 1 }}>
          <FlashCard card={cards[idx]} animDir={dir} />
        </div>

        <button className="fc-arrow" disabled={idx === cards.length - 1} onClick={() => go(idx + 1)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.ink} strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>

      {/* Dot indicators */}
      <div style={{ display: 'flex', gap: 7, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', maxWidth: 400 }}>
        {cards.map((_, i) => (
          <button
            key={i}
            className={`fc-dot${i === idx ? ' active' : ''}`}
            onClick={() => go(i)}
            style={{
              width:  i === idx ? 22 : 8,
              height: 8,
              background: i === idx ? T.green : T.line,
            }}
          />
        ))}
      </div>

      <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12.5, color: T.hint, margin: 0 }}>
        Tap the card to flip · use arrows or dots to navigate
      </p>
    </div>
  );
}

export default function Flashcards({ studentClass, syllabusTopics }) {
  const [activeSubject, setActiveSubject] = useState(null);
  const [cards, setCards] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeChapter, setActiveChapter] = useState(null);
  const [error, setError] = useState(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

  const subjects = syllabusTopics ? Object.keys(syllabusTopics) : [];
  const chapters = activeSubject && syllabusTopics ? syllabusTopics[activeSubject] : [];

  const handleSubjectClick = (subject) => {
    setActiveSubject(subject);
    setActiveChapter(null);
    setCards([]);
    setError(null);
  };

  const handleChapterClick = async (chapter) => {
    setActiveChapter(chapter);
    setCards([]);
    setError(null);
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/flashcards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: chapter, subject: activeSubject, grade: studentClass }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setCards(data.cards || []);
    } catch (e) {
      setError('Failed to generate flashcards. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!syllabusTopics || subjects.length === 0) {
    return (
      <div style={{ background: T.cardBg, border: `1px solid ${T.line}`, borderRadius: 20, boxShadow: cardShadow, textAlign: 'center', padding: '4rem 2rem', animation: 'fc-fadein 0.3s ease both' }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: T.gLight, border: `1px solid ${T.gRing}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 24 }}>📖</div>
        <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 22, color: T.ink, marginBottom: 8 }}>Syllabus Not Loaded</h2>
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: T.sub }}>Please wait a moment and try again.</p>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", animation: 'fc-fadein 0.3s ease both' }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* Header */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: T.green, boxShadow: `0 0 0 3px ${T.gRing}` }} />
          <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 11, color: T.green, letterSpacing: '0.9px', textTransform: 'uppercase' }}>Study Cards</span>
        </div>
        <h1 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 'clamp(1.5rem,3vw,2rem)', color: T.ink, marginBottom: 4 }}>
          Flashcards
        </h1>
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13.5, color: T.sub }}>
          {!activeSubject ? 'Select a subject to get started' : !activeChapter ? `Select a chapter from ${activeSubject}` : `Flashcards for: ${activeChapter}`}
        </p>
      </div>

      {/* Subject buttons */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20, paddingBottom: 16, borderBottom: `1px solid ${T.line}` }}>
        {subjects.map(subject => {
          const active = activeSubject === subject;
          return (
            <button key={subject} onClick={() => handleSubjectClick(subject)} style={{
              padding: '8px 18px', borderRadius: 99, fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 13,
              border: `1.5px solid ${active ? T.green : T.line}`,
              background: active ? 'linear-gradient(135deg, #F59E0B, #D97706)' : T.cardBg,
              color: active ? 'white' : T.sub, cursor: 'pointer', transition: 'all 0.18s ease',
              boxShadow: active ? `0 4px 14px ${T.gGlow}` : 'none',
            }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = T.gRing; e.currentTarget.style.color = T.green; } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = T.line; e.currentTarget.style.color = T.sub; } }}
            >{subject}</button>
          );
        })}
      </div>

      {/* Chapter list */}
      {activeSubject && (
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 11, color: T.hint, textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 10 }}>Chapters</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 8 }}>
            {chapters.map((chapter, i) => {
              const active = activeChapter === chapter;
              return (
                <button key={i} onClick={() => handleChapterClick(chapter)} disabled={isLoading} style={{
                  padding: '12px 14px', borderRadius: 12, textAlign: 'left',
                  border: `1.5px solid ${active ? T.green : T.line}`,
                  background: active ? T.gLight : T.cardBg, color: active ? T.green : T.ink,
                  fontFamily: "'DM Sans',sans-serif", fontWeight: active ? 700 : 400, fontSize: 13.5,
                  cursor: isLoading ? 'not-allowed' : 'pointer', transition: 'all 0.18s',
                  opacity: isLoading && !active ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: 8,
                }}
                  onMouseEnter={e => { if (!active && !isLoading) { e.currentTarget.style.borderColor = T.gRing; e.currentTarget.style.background = T.gLight; e.currentTarget.style.color = T.green; } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = T.line; e.currentTarget.style.background = T.cardBg; e.currentTarget.style.color = T.ink; } }}
                >
                  <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 11, color: T.hint, flexShrink: 0 }}>{String(i + 1).padStart(2, '0')}</span>
                  <span style={{ flex: 1 }}>{chapter}</span>
                  {active && isLoading && <span style={{ fontSize: 11, color: T.gMid }}>generating…</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ padding: '14px 16px', borderRadius: 12, background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontFamily: "'DM Sans',sans-serif", fontSize: 14, marginBottom: 20 }}>
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '2rem 0' }}>
          <div style={{ width: '100%', maxWidth: 560, height: 320, borderRadius: 20, background: T.cardBg, border: `1px solid ${T.line}`, animation: 'fc-pulse 1.5s ease-in-out infinite', opacity: 0.5 }} />
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: T.hint }}>Generating flashcards…</p>
        </div>
      )}

      {/* Carousel */}
      {!isLoading && cards.length > 0 && (
        <FlashCardCarousel key={activeChapter} cards={cards} />
      )}
    </div>
  );
}


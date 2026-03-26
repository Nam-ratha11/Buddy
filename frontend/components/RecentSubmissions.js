"use client";
import { useState } from 'react';

const T = {
  pageBg: 'var(--page)', cardBg: 'var(--card)', zoneBg: 'var(--zone)',
  green: 'var(--g)', gMid: 'var(--gMid)', gLight: 'var(--gLight)', gRing: 'var(--gRing)',
  gGlow: 'var(--gGlow)', ink: 'var(--ink)', sub: 'var(--sub)',
  hint: 'var(--hint)', line: 'var(--line)', lineHi: 'var(--lineHi)',
  red: 'var(--red)', redBg: 'var(--redBg)', redLine: 'var(--redLine)',
};
const cardShadow = '0 0 0 1px rgba(0,0,0,0.04), 0 2px 4px rgba(0,0,0,0.04), 0 12px 40px rgba(0,0,0,0.07)';

export default function RecentSubmissions({ history, onLoadSubmission, onDeleteSubmission }) {
  const [confirmDelete, setConfirmDelete] = useState(null);

  if (!history || history.length === 0) {
    return (
      <div style={{
        background: T.cardBg, border: `1px solid ${T.line}`, borderRadius: 20,
        boxShadow: cardShadow, textAlign: 'center', padding: '4rem 2rem',
        animation: 'sp-fadein 0.3s ease both',
      }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: T.gLight, border: `1px solid ${T.gRing}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 24 }}>🕐</div>
        <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 22, color: T.ink, marginBottom: 8 }}>No Submissions Yet</h2>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: T.sub, maxWidth: 360, margin: '0 auto' }}>
          Your analyzed answer sheets will appear here so you can track your progress over time.
        </p>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", animation: 'sp-fadein 0.3s ease both' }}>
      {/* Delete modal */}
      {confirmDelete && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 2000,
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'sp-fadein 0.15s ease',
        }} onClick={() => setConfirmDelete(null)}>
          <div style={{
            background: T.cardBg, border: `1px solid ${T.line}`, borderRadius: 20,
            padding: '2rem', maxWidth: 380, width: '90%', textAlign: 'center',
            boxShadow: cardShadow, animation: 'sp-fadein 0.2s ease',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🗑️</div>
            <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 18, color: T.ink, marginBottom: 8 }}>Delete Submission?</h3>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, color: T.sub, marginBottom: 24, lineHeight: 1.5 }}>
              This action cannot be undone. The submission will be permanently removed from your history.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setConfirmDelete(null)} style={{
                padding: '10px 22px', borderRadius: 99, border: `1px solid ${T.line}`,
                background: T.zoneBg, cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: 13.5, color: T.sub,
              }}>Cancel</button>
              <button onClick={() => { onDeleteSubmission(confirmDelete); setConfirmDelete(null); }} style={{
                padding: '10px 22px', borderRadius: 99, border: 'none',
                background: T.red, color: 'white', cursor: 'pointer',
                fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 13.5,
              }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: T.green, boxShadow: `0 0 0 3px ${T.gRing}` }} />
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 11, color: T.green, letterSpacing: '0.9px', textTransform: 'uppercase' }}>History</span>
        </div>
        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: T.ink }}>Recent Submissions</h1>
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        {history.map((item, index) => {
          const pct = item.data.totalMarks ? Math.round((item.data.overallScore / item.data.totalMarks) * 100) : 0;
          const scoreColor = pct >= 75 ? T.green : pct >= 50 ? '#D97706' : T.red;
          return (
            <div key={item.id || index} onClick={() => onLoadSubmission(item)} style={{
              background: T.cardBg, border: `1px solid ${T.line}`, borderRadius: 16,
              padding: '16px 20px', display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', cursor: 'pointer', boxShadow: '0 0 0 1px rgba(0,0,0,0.03), 0 2px 8px rgba(0,0,0,0.04)',
              transition: 'all 0.18s ease', gap: 12,
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.gRing; e.currentTarget.style.transform = 'translateX(3px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.line; e.currentTarget.style.transform = 'translateX(0)'; }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                  <span style={{
                    background: T.gLight, border: `1px solid ${T.gRing}`, color: T.green,
                    fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 11,
                    borderRadius: 99, padding: '2px 9px',
                  }}>{item.data.studentClass || '6th CBSE'}</span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: T.hint }}>
                    {new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 14, color: T.ink, marginBottom: 3 }}>
                  Evaluation for {item.data.questions?.[0]?.subject || 'Subject'}
                </h3>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: T.sub }}>
                  {item.data.questions?.length || 0} Questions
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                {/* Score badge */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 18, color: scoreColor, letterSpacing: '-0.5px', lineHeight: 1 }}>
                    {item.data.overallScore}<span style={{ fontSize: 12, opacity: 0.5 }}>/{item.data.totalMarks}</span>
                  </div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: T.hint }}>{pct}%</div>
                </div>

                <button onClick={e => { e.stopPropagation(); onLoadSubmission(item); }} style={{
                  padding: '8px 16px', borderRadius: 99,
                  background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: 'white',
                  border: 'none', cursor: 'pointer',
                  fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 12,
                  boxShadow: `0 2px 8px ${T.gGlow}`,
                }}>View</button>

                <button onClick={e => { e.stopPropagation(); setConfirmDelete(item.timestamp); }} style={{
                  width: 32, height: 32, borderRadius: 8, border: `1px solid ${T.line}`,
                  background: T.zoneBg, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, transition: 'all 0.15s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = T.redLine; e.currentTarget.style.background = T.redBg; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = T.line; e.currentTarget.style.background = T.zoneBg; }}
                  title="Delete">🗑️</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

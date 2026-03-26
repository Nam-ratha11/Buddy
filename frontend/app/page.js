"use client";
import Link from 'next/link';
import { useState } from 'react';

const T = {
  pageBg: '#F8FAFC', cardBg: '#FFFFFF',
  green: '#1E3A8A', gMid: '#2563EB', gLight: '#EFF6FF', gRing: '#BFDBFE',
  gGlow: 'rgba(37,99,235,0.18)', ink: '#0F172A', sub: '#475569',
  hint: '#94A3B8', line: '#E2E8F0',
};

const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,800&family=DM+Sans:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { background: ${T.pageBg}; font-family: 'DM Sans', sans-serif; }
  @media (max-width: 768px) {
    .sp-hero { padding: 60px 20px !important; }
    .sp-hero-inner { flex-direction: column !important; }
    .sp-feat-grid { grid-template-columns: 1fr !important; }
    .sp-steps { grid-template-columns: 1fr 1fr !important; }
    .sp-stats-row { grid-template-columns: 1fr 1fr !important; }
    .sp-tips-grid { grid-template-columns: 1fr !important; }
    .sp-section { padding: 48px 20px !important; }
    .sp-cta-row { flex-direction: column !important; align-items: flex-start !important; }
    .sp-footer-inner { flex-direction: column !important; gap: 16px !important; }
  }
`;

function Navbar() {
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 100, height: 56,
      background: 'rgba(247,246,242,0.85)', backdropFilter: 'blur(20px)',
      borderBottom: `1px solid ${T.line}`,
      boxShadow: `0 1px 0 ${T.line}, 0 2px 8px rgba(0,0,0,0.04)`,
      display: 'flex', alignItems: 'center',
    }}>
      <div style={{ width: '100%', maxWidth: 1040, margin: '0 auto', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: T.green, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(37,99,235,0.25)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M8 12s1.5-2 4-2 4 2 4 2"/><path d="M12 10v4"/></svg>
          </div>
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 17, color: T.ink }}>
            Sprout<span style={{ color: T.green }}>AI</span>
          </span>
        </div>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Link href="/" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: T.sub, textDecoration: 'none', padding: '6px 14px', borderRadius: 8, transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = T.line; e.currentTarget.style.color = T.ink; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.sub; }}>
            Home
          </Link>
          <Link href="/login" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: T.sub, textDecoration: 'none', padding: '6px 14px', borderRadius: 8, transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = T.line; e.currentTarget.style.color = T.ink; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.sub; }}>
            Login
          </Link>
          <Link href="/register" style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 13.5,
            color: T.green, textDecoration: 'none',
            padding: '7px 16px', borderRadius: 10,
            border: `1.5px solid ${T.gRing}`,
            background: T.gLight,
            transition: 'all 0.18s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = T.gRing; e.currentTarget.style.borderColor = T.green; }}
            onMouseLeave={e => { e.currentTarget.style.background = T.gLight; e.currentTarget.style.borderColor = T.gRing; }}>
            Register
          </Link>
          <Link href="/analyze" style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 13.5,
            color: 'white', textDecoration: 'none',
            padding: '8px 18px', borderRadius: 10,
            background: 'linear-gradient(135deg, #F59E0B, #D97706)',
            boxShadow: `0 3px 10px ${T.gGlow}`,
            transition: 'all 0.18s',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(37,99,235,0.32)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 3px 10px ${T.gGlow}`; }}>
            Analyse →
          </Link>
        </nav>
      </div>
    </header>
  );
}

const features = [
  { emoji: '📊', title: 'Score Breakdown',    desc: 'Marks per question with detailed reasoning so you know exactly why you lost marks' },
  { emoji: '❌', title: 'Mistake Analysis',   desc: 'Conceptual gaps vs. silly mistakes identified separately so you fix the right things' },
  { emoji: '📚', title: 'Topic Mapping',      desc: 'Questions mapped to CBSE syllabus topics so you know which chapters to revisit' },
  { emoji: '💡', title: 'Remediation Tips',   desc: 'Targeted suggestions for each weak area with chapter references and study strategies' },
  { emoji: '🃏', title: 'Auto Flashcards',    desc: 'Auto-generated revision cards from your wrong answers — ready to study immediately' },
  { emoji: '✏️', title: 'Practice Questions', desc: 'Personalised questions on your weak topics to reinforce learning after each analysis' },
];

const steps = [
  { num: '01', title: 'Upload',  desc: 'Drop your answer sheet — any scan or photo works',
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={T.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> },
  { num: '02', title: 'Analyse', desc: 'AI reads each answer and maps it to the syllabus',
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={T.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> },
  { num: '03', title: 'Score',   desc: 'Get marks per question with clear justification',
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={T.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg> },
  { num: '04', title: 'Improve', desc: 'Receive topic-wise remediation and flashcards',
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={T.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> },
];

const tips = [
  'Ensure the answer sheet is well-lit and clearly visible',
  'Upload the question paper for more accurate scoring',
  'Flatten crumpled sheets before scanning or photographing',
  'PDF scans give the best recognition accuracy',
];


export default function LandingPage() {
  const [hoveredFeat, setHoveredFeat] = useState(null);
  const [hoveredStep, setHoveredStep] = useState(null);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: FONTS }} />
      <div style={{ minHeight: '100vh', background: T.pageBg }}>
        <Navbar />

        {/* ── HERO ── */}
        <section className="sp-hero" style={{ background: T.pageBg, padding: '88px 32px 80px' }}>
          <div style={{ maxWidth: 1040, margin: '0 auto' }}>
            {/* Eyebrow */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: T.green, boxShadow: `0 0 0 3px ${T.gRing}` }} />
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 11, color: T.green, letterSpacing: '1px', textTransform: 'uppercase' }}>AI-Powered Learning</span>
            </div>
            {/* Headline */}
            <h1 style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800,
              fontSize: 'clamp(2.4rem, 5vw, 3.8rem)', letterSpacing: '-0.8px', lineHeight: 1.08,
              color: T.ink, marginBottom: 22, maxWidth: 680,
            }}>
              Turn Every Mistake Into<br />
              <em style={{ color: T.green, fontStyle: 'italic', textDecoration: 'underline', textDecorationColor: T.gRing, textUnderlineOffset: '5px' }}>Your Next Big Score</em>
            </h1>
            {/* Subheadline */}
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 400, fontSize: 17, color: T.sub, maxWidth: 520, lineHeight: 1.65, marginBottom: 32 }}>
              Upload your CBSE answer sheet and get instant AI feedback, question-wise scores, mistake analysis and a personalised study plan — in under 30 seconds.
            </p>
            {/* CTA buttons */}
            <div className="sp-cta-row" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
              <Link href="/analyze" style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 15,
                color: 'white', textDecoration: 'none',
                padding: '14px 28px', borderRadius: 12,
                background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                boxShadow: '0 4px 16px rgba(37,99,235,0.28)',
                transition: 'all 0.2s ease', display: 'inline-block',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(37,99,235,0.36)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(37,99,235,0.28)'; }}>
                Analyse My Answer Sheet →
              </Link>
              <a href="#how-it-works" style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 15,
                color: T.sub, textDecoration: 'none',
                padding: '14px 24px', borderRadius: 12,
                background: 'transparent', border: `1.5px solid ${T.line}`,
                transition: 'all 0.2s ease', display: 'inline-block',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = '#F0EEE8'; e.currentTarget.style.borderColor = '#CBD5E1'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = T.line; }}>
                See how it works ↓
              </a>
            </div>
            {/* Trust row */}
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
              {['No signup required', 'Results in ~30 seconds', 'Free to try'].map(t => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.green} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12.5, color: T.hint }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section className="sp-section" style={{ background: T.cardBg, padding: '80px 32px' }}>
          <div style={{ maxWidth: 1040, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.green }} />
                <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 11, color: T.green, letterSpacing: '1px', textTransform: 'uppercase' }}>Features</span>
              </div>
              <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', color: T.ink, marginBottom: 10 }}>
                Everything you need to improve faster
              </h2>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: T.sub }}>One upload. Complete analysis.</p>
            </div>
            <div className="sp-feat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {features.map((f, i) => (
                <div key={i}
                  onMouseEnter={() => setHoveredFeat(i)}
                  onMouseLeave={() => setHoveredFeat(null)}
                  style={{
                    background: T.cardBg, border: `1px solid ${hoveredFeat === i ? T.gRing : T.line}`,
                    borderRadius: 16, padding: '24px 20px',
                    boxShadow: hoveredFeat === i ? '0 4px 16px rgba(37,99,235,0.10)' : '0 1px 3px rgba(0,0,0,0.04)',
                    transform: hoveredFeat === i ? 'translateY(-2px)' : 'translateY(0)',
                    transition: 'all 0.2s ease', cursor: 'default',
                  }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: T.gLight, border: `1px solid ${T.gRing}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 14 }}>
                    {f.emoji}
                  </div>
                  <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 15, color: T.ink, marginBottom: 6 }}>{f.title}</h3>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, color: T.sub, lineHeight: 1.6 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section id="how-it-works" className="sp-section" style={{ background: T.pageBg, padding: '80px 32px' }}>
          <div style={{ maxWidth: 1040, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.green }} />
                <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 11, color: T.green, letterSpacing: '1px', textTransform: 'uppercase' }}>Process</span>
              </div>
              <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', color: T.ink }}>
                From upload to insights in 4 steps
              </h2>
            </div>
            <div className="sp-steps" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, position: 'relative' }}>
              {steps.map((s, i) => (
                <div key={i}
                  onMouseEnter={() => setHoveredStep(i)}
                  onMouseLeave={() => setHoveredStep(null)}
                  style={{
                    background: T.cardBg, border: `1px solid ${hoveredStep === i ? T.gRing : T.line}`,
                    borderRadius: 16, padding: '24px 20px', textAlign: 'center',
                    boxShadow: hoveredStep === i ? '0 4px 16px rgba(37,99,235,0.10)' : '0 1px 3px rgba(0,0,0,0.04)',
                    transform: hoveredStep === i ? 'translateY(-2px)' : 'translateY(0)',
                    transition: 'all 0.2s ease', position: 'relative',
                  }}>
                  {/* Connector dashes */}
                  {i < steps.length - 1 && (
                    <div style={{ position: 'absolute', top: 36, right: -9, width: 18, height: 1, borderTop: `1.5px dashed ${T.line}`, zIndex: 1 }} />
                  )}
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 28, color: T.gRing, marginBottom: 12, lineHeight: 1 }}>{s.num}</div>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>{s.icon}</div>
                  <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 14, color: T.ink, marginBottom: 6 }}>{s.title}</h3>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: T.sub, lineHeight: 1.55 }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TIPS ── */}
        <section className="sp-section" style={{ background: T.cardBg, padding: '60px 32px' }}>
          <div className="sp-tips-grid" style={{ maxWidth: 1040, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.green }} />
                <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 11, color: T.green, letterSpacing: '1px', textTransform: 'uppercase' }}>Tips</span>
              </div>
              <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 'clamp(1.4rem, 2.5vw, 1.9rem)', color: T.ink, marginBottom: 14, lineHeight: 1.2 }}>
                Get the most accurate results
              </h2>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: T.sub, lineHeight: 1.65 }}>
                A few simple steps before uploading can significantly improve the quality of your analysis.
              </p>
            </div>
            <div style={{ background: T.gLight, border: `1px solid ${T.gRing}`, borderRadius: 20, padding: '28px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                <span style={{ fontSize: 16 }}>🌿</span>
                <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 14, color: T.green }}>Tips for best results</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {tips.map((tip, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: T.green, flexShrink: 0, marginTop: 7 }} />
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, color: T.green, lineHeight: 1.6 }}>{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>


        {/* ── STATS ── */}
        <section style={{ background: 'linear-gradient(135deg, #D97706, #B45309)', padding: '60px 32px' }}>
          <div className="sp-stats-row" style={{ maxWidth: 1040, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {[
              { num: '98%',   label: 'Analysis accuracy' },
              { num: '~30s',  label: 'Average result time' },
              { num: 'CBSE',  label: 'Curriculum supported' },
            ].map((s, i, arr) => (
              <div key={i} style={{
                textAlign: 'center', padding: '0 24px',
                borderRight: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.15)' : 'none',
              }}>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 36, color: 'white', letterSpacing: '-1px', lineHeight: 1, marginBottom: 8 }}>{s.num}</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section className="sp-section" style={{ background: T.pageBg, padding: '80px 32px', textAlign: 'center' }}>
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', color: T.ink, letterSpacing: '-0.5px', lineHeight: 1.1, marginBottom: 12 }}>
              Ready to see where you stand?
            </h2>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: T.sub, lineHeight: 1.6 }}>
              Upload your first answer sheet free. No account needed.
            </p>
            <Link href="/analyze" style={{
              display: 'inline-block', marginTop: 28,
              fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 15,
              color: 'white', textDecoration: 'none',
              padding: '14px 32px', borderRadius: 12,
              background: 'linear-gradient(135deg, #F59E0B, #D97706)',
              boxShadow: '0 4px 16px rgba(37,99,235,0.28)',
              transition: 'all 0.2s ease',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(37,99,235,0.36)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(37,99,235,0.28)'; }}>
              Start Analysing Now →
            </Link>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{ background: T.ink, padding: '32px' }}>
          <div className="sp-footer-inner" style={{ maxWidth: 1040, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 15, color: 'white' }}>Sprout<span style={{ color: '#FCD34D' }}>AI</span></span>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>© 2025 Sprout AI</span>
            </div>
            <div style={{ display: 'flex', gap: 20 }}>
              {['Privacy', 'Terms', 'Contact'].map(l => (
                <a key={l} href="#" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'none', transition: 'color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}>
                  {l}
                </a>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

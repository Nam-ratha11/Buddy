"use client";
import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import FeedbackDisplay from '@/components/FeedbackDisplay';
import PracticeTabs from '@/components/PracticeTabs';
import Dashboard from '@/components/Dashboard';
import RecentSubmissions from '@/components/RecentSubmissions';
import RemediationAgent from '@/components/RemediationAgent';
import Flashcards from '@/components/Flashcards';

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  pageBg:   'var(--page)',
  cardBg:   'var(--card)',
  zoneBg:   'var(--zone)',
  navBg:    'var(--nav)',
  green:    'var(--g)',
  gMid:     'var(--gMid)',
  gLight:   'var(--gLight)',
  gRing:    'var(--gRing)',
  gGlow:    'var(--gGlow)',
  ink:      'var(--ink)',
  sub:      'var(--sub)',
  hint:     'var(--hint)',
  line:     'var(--line)',
  lineHi:   'var(--lineHi)',
  amber:    'var(--amber)',
  amberBg:  'var(--amberBg)',
  amberLine:'var(--amberLine)',
};

// ─── Global CSS (injected once) ───────────────────────────────────────────────
const GLOBAL_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans', sans-serif; background: var(--page); color: var(--ink); }
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--lineHi); border-radius: 99px; }
  .sp-tab:hover { background: var(--line) !important; color: var(--ink) !important; }
  .sp-zone:hover { border-color: var(--gMid) !important; background: var(--gLight) !important; }
  .sp-zone:hover .sp-zico { background: var(--gRing) !important; }
  .sp-cta:not(:disabled):not(.sp-cta-done):hover { background: linear-gradient(135deg, #D97706, #B45309) !important; box-shadow: 0 8px 28px var(--gGlow), 0 1px 0 rgba(255,255,255,0.12) inset !important; transform: translateY(-1px) !important; }
  .sp-sel:focus { border-color: var(--gMid) !important; box-shadow: 0 0 0 3px var(--gLight) !important; outline: none; }
  .sp-feat:hover { background: var(--gLight) !important; }
  @keyframes sp-bounce {
    0%,80%,100% { transform: translateY(0); opacity: 0.75; }
    40% { transform: translateY(-6px); opacity: 1; }
  }
  @keyframes sp-fadein {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes sp-shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  .sp-fadein { animation: sp-fadein 0.3s ease both; }
  .sp-pbar {
    background: linear-gradient(90deg, var(--gMid), var(--gRing), var(--gMid));
    background-size: 200% 100%;
    animation: sp-shimmer 1.6s linear infinite;
  }
  @media (max-width: 768px) {
    .sp-layout { flex-direction: column !important; }
    .sp-sidebar { width: 100% !important; }
    .sp-nav-inner { padding: 0 16px !important; }
    .sp-main-pad { padding: 16px !important; }
  }
  @media (max-width: 600px) {
    .sp-zones { grid-template-columns: 1fr !important; }
  }
`;

// ─── SVG icons ────────────────────────────────────────────────────────────────
const LeafIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M12 22C12 22 4 16 4 9a8 8 0 0 1 16 0c0 7-8 13-8 13z" fill="white" opacity="0.9"/>
    <path d="M12 22V9" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const BellIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.sub} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);
const ChevronIcon = ({ open }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d={open ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"}/>
  </svg>
);
const ShieldIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.hint} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const ClockIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.hint} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
  </svg>
);
const FileIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.hint} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
  </svg>
);
const StarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.gMid} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);
const PencilIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={T.hint} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const UploadArrowIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={T.hint} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 15V3m0 0L8 7m4-4 4 4"/><path d="M3 15v2a4 4 0 0 0 4 4h10a4 4 0 0 0 4-4v-2"/>
  </svg>
);
const CheckIcon = ({ size = 16, color = 'white' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const XIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={T.sub} strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const WarnIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.amber} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

// ─── Upload Zone sub-component ────────────────────────────────────────────────
function UploadZone({ step, title, file, onFile, onClear, isDragging, onDragOver, onDragLeave, onDrop }) {
  const hasFile = !!file;
  const ext = hasFile ? file.name.split('.').pop().toUpperCase() : null;
  const shortName = hasFile ? (file.name.length > 22 ? file.name.slice(0, 20) + '…' : file.name) : null;
  const sizeMB = hasFile ? (file.size / 1024 / 1024).toFixed(2) + ' MB' : null;
  const inputRef = useRef(null);

  const gridBg = !hasFile
    ? `repeating-linear-gradient(0deg,transparent,transparent 27px,rgba(233,231,225,0.5) 27px,rgba(233,231,225,0.5) 28px),repeating-linear-gradient(90deg,transparent,transparent 27px,rgba(233,231,225,0.5) 27px,rgba(233,231,225,0.5) 28px)`
    : 'none';

  return (
    <div
      className="sp-zone"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => !hasFile && inputRef.current?.click()}
      style={{
        position: 'relative',
        borderRadius: 16,
        border: `1.5px dashed ${isDragging || hasFile ? T.gMid : T.lineHi}`,
        minHeight: 148,
        background: isDragging ? '#EFF8F3' : hasFile ? T.gLight : T.zoneBg,
        backgroundImage: !hasFile ? gridBg : 'none',
        cursor: hasFile ? 'default' : 'pointer',
        transform: isDragging ? 'scale(1.013)' : 'scale(1)',
        transition: 'all 0.2s ease',
        padding: '20px 16px 18px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        style={{ display: 'none' }}
        onChange={e => { if (e.target.files[0]) onFile(e.target.files[0]); }}
      />

      {/* Step badge */}
      <div style={{
        position: 'absolute', top: 10, left: 10,
        width: 22, height: 22, borderRadius: '50%',
        background: hasFile ? T.green : T.lineHi,
        color: hasFile ? 'white' : T.hint,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700,
      }}>
        {hasFile ? <CheckIcon size={11} /> : step}
      </div>

      {/* Clear button */}
      {hasFile && (
        <button
          onClick={e => { e.stopPropagation(); onClear(); }}
          style={{
            position: 'absolute', top: 10, right: 10,
            width: 22, height: 22, borderRadius: '50%',
            background: T.line, border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <XIcon />
        </button>
      )}

      {/* Icon box */}
      <div
        className="sp-zico"
        style={{
          width: 44, height: 44, borderRadius: 10,
          background: hasFile ? '#BFDBFE' : T.line,
          border: `1px solid ${hasFile ? T.gRing : T.lineHi}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s', marginBottom: 10,
        }}
      >
        {hasFile ? <CheckIcon size={20} color={T.green} /> : <UploadArrowIcon />}
      </div>

      {/* Title */}
      <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 13, color: T.ink, textAlign: 'center' }}>
        {title}
      </div>

      {/* File info or hint */}
      {hasFile ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: T.cardBg, border: `1px solid ${T.gRing}`,
            borderRadius: 8, padding: '4px 8px',
          }}>
            <span style={{
              background: T.green, color: 'white', borderRadius: 4,
              fontSize: 9, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700,
              padding: '1px 5px',
            }}>{ext}</span>
            <span style={{ fontSize: 12, color: T.ink }}>{shortName}</span>
          </div>
          <span style={{ fontSize: 11, color: T.hint }}>{sizeMB}</span>
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: T.hint }}>Click or drag &amp; drop</div>
          <div style={{ fontSize: 11, color: T.hint, marginTop: 2 }}>PDF · JPG · PNG</div>
        </div>
      )}
    </div>
  );
}

// ─── Progress sub-component ───────────────────────────────────────────────────
const STEPS = ['Uploading', 'Reading', 'Matching', 'Scoring', 'Feedback'];

function AnalyzeProgress({ progress = 0, stepIndex = 0 }) {
  const stepName = STEPS[Math.min(stepIndex, STEPS.length - 1)];
  return (
    <div className="sp-fadein" style={{ marginTop: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: T.sub }}>{stepName}</span>
        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 13, color: T.gMid }}>{progress}%</span>
      </div>
      <div style={{ height: 6, background: T.gLight, border: `1px solid ${T.gRing}`, borderRadius: 99, overflow: 'hidden' }}>
        <div
          className="sp-pbar"
          style={{ height: '100%', width: `${progress}%`, borderRadius: 99, transition: 'width 0.4s ease' }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
        {STEPS.map((s, i) => {
          const done = i < stepIndex;
          const cur  = i === stepIndex;
          return (
            <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 10, height: 10, borderRadius: '50%',
                background: done || cur ? T.green : T.line,
                boxShadow: cur ? `0 0 0 3px ${T.gLight}` : 'none',
                transition: 'all 0.3s',
              }} />
              <span style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 10,
                color: done || cur ? T.green : T.hint,
              }}>{s}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── AnalyzePage (the 'analyze' tab content) ──────────────────────────────────
function AnalyzePage({
  studentClass, syllabusTopics, selectedSubject, setSelectedSubject,
  questionFile, setQuestionFile, answerFile, setAnswerFile,
  isAnalyzing, evaluation, handleAnalyze,
  reminders, setReminders, setBellReminders, setToasts, setBellBounce,
}) {
  const [drag1, setDrag1] = useState(false);
  const [drag2, setDrag2] = useState(false);
  const [reminderInput, setReminderInput] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('');
  const [reminderFocused, setReminderFocused] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null); // { reminder, timeLeft }

  // Load reminders from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('sprout_reminders');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Filter out already fired reminders older than 7 days
        const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        const active = parsed.filter(r => !r.firedAt || r.firedAt > weekAgo);
        setReminders(active);
      }
    } catch (e) {
      console.error('Failed to load reminders:', e);
    }
  }, []);

  // Fire a toast notification
  const fireToast = (text) => {
    const id = Date.now();
    setBellReminders(prev => [{ id, text, read: false }, ...prev]);
    setToasts(prev => [...prev, { id, text }]);
    setBellBounce(true);
    setTimeout(() => setBellBounce(false), 600);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500);
  };

  const addReminder = () => {
    if (!reminderInput.trim()) return;
    
    const label = selectedPreset ? reminderInput.trim() + ' · ' + selectedPreset : reminderInput.trim();
    const now = Date.now();
    
    // Calculate due date based on preset
    let dueAt = null;
    if (selectedPreset === 'In 1 day') {
      dueAt = now + (24 * 60 * 60 * 1000); // 1 day
    } else if (selectedPreset === 'In 3 days') {
      dueAt = now + (3 * 24 * 60 * 60 * 1000); // 3 days
    } else if (selectedPreset === 'This weekend') {
      // Calculate next Saturday
      const date = new Date();
      const dayOfWeek = date.getDay();
      const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
      dueAt = now + (daysUntilSaturday * 24 * 60 * 60 * 1000);
    } else {
      // For custom reminders without preset, set to 1 hour from now for testing
      dueAt = now + (60 * 60 * 1000);
    }
    
    const newReminder = { 
      id: now, 
      text: label, 
      dueAt, 
      createdAt: now,
      firedAt: null 
    };
    
    // Update local state
    setReminders(prev => [...prev, newReminder]);
    
    // Save to localStorage for persistence
    try {
      const existing = JSON.parse(localStorage.getItem('sprout_reminders') || '[]');
      existing.push(newReminder);
      localStorage.setItem('sprout_reminders', JSON.stringify(existing));
    } catch (e) {
      console.error('Failed to save reminder:', e);
    }
    
    // Show immediate confirmation toast
    fireToast(`Reminder set: ${label}`);
    
    setReminderInput('');
    setSelectedPreset('');
  };

  const markComplete = (reminderId) => {
    const updated = reminders.map(r => 
      r.id === reminderId ? { ...r, completed: true, completedAt: Date.now() } : r
    );
    setReminders(updated);
    
    // Update localStorage
    try {
      const existing = JSON.parse(localStorage.getItem('sprout_reminders') || '[]');
      const updatedStorage = existing.map(r => 
        r.id === reminderId ? { ...r, completed: true, completedAt: Date.now() } : r
      );
      localStorage.setItem('sprout_reminders', JSON.stringify(updatedStorage));
    } catch (e) {
      console.error('Failed to update reminder:', e);
    }
    
    const reminder = reminders.find(r => r.id === reminderId);
    if (reminder) {
      fireToast(`✅ Great job completing "${reminder.text.split(' · ')[0]}"!`);
    }
  };

  const handleCompleteClick = (reminder) => {
    const now = Date.now();
    const dueTime = reminder.dueAt;
    
    if (now >= dueTime) {
      // Past due — mark complete directly
      markComplete(reminder.id);
    } else {
      // Not due yet — calculate time left
      const diff = dueTime - now;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      const timeLeft = hours > 0
        ? `${hours} hour${hours > 1 ? 's' : ''} and ${minutes} minute${minutes !== 1 ? 's' : ''}`
        : `${minutes} minute${minutes !== 1 ? 's' : ''}`;
      
      // Show confirmation modal
      setConfirmModal({ reminder, timeLeft });
    }
  };

  const handleDeleteReminder = (reminderId) => {
    const updated = reminders.filter(r => r.id !== reminderId);
    setReminders(updated);
    
    try {
      const existing = JSON.parse(localStorage.getItem('sprout_reminders') || '[]');
      const updatedStorage = existing.filter(r => r.id !== reminderId);
      localStorage.setItem('sprout_reminders', JSON.stringify(updatedStorage));
    } catch (e) {
      console.error('Failed to delete reminder:', e);
    }
  };

  // Simulated progress state (cycles while analyzing)
  const [progress, setProgress] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  const progressRef = useRef(null);

  useEffect(() => {
    if (isAnalyzing) {
      setProgress(0); setStepIdx(0);
      let p = 0;
      progressRef.current = setInterval(() => {
        p = Math.min(p + Math.random() * 4, 95);
        setProgress(Math.round(p));
        setStepIdx(Math.min(Math.floor(p / 20), 4));
      }, 400);
    } else {
      clearInterval(progressRef.current);
      if (evaluation) { setProgress(100); setStepIdx(4); }
    }
    return () => clearInterval(progressRef.current);
  }, [isAnalyzing, evaluation]);

  const done = !isAnalyzing && evaluation;

  const makeDragHandlers = (setDrag, setFile) => ({
    onDragOver:  (e) => { e.preventDefault(); setDrag(true); },
    onDragLeave: ()  => setDrag(false),
    onDrop:      (e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) setFile(f); },
  });

  return (
    <>
    <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }} className="sp-layout">
      {/* ── Main card ── */}
      <div style={{ flex: 1, minWidth: 0, maxWidth: 680 }}>
        {/* Page header */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: T.green, boxShadow: `0 0 0 3px ${T.gRing}` }} />
            <span style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 11,
              color: T.green, letterSpacing: '0.9px', textTransform: 'uppercase',
            }}>Answer Sheet Analyser</span>
          </div>
          <h1 style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800,
            fontSize: 'clamp(2rem, 4vw, 2.75rem)', lineHeight: 1.15,
            color: T.ink, marginBottom: 6,
          }}>
            <span style={{ color: T.ink, fontWeight: 800 }}>Ready to </span>
            <em style={{
              color: T.green, fontStyle: 'italic', fontWeight: 800,
              textDecoration: 'underline', textDecorationColor: T.gRing, textUnderlineOffset: '4px',
              textShadow: '0 2px 12px rgba(37,99,235,0.15)',
            }}>Improve?</em>
          </h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14.5, color: T.sub, maxWidth: 520, marginTop: 6 }}>
            Upload the answer sheet for {studentClass} and get instant AI-powered feedback.
          </p>
        </div>

        {/* Main card */}
        <div style={{
          background: T.cardBg, border: `1px solid ${T.line}`, borderRadius: 20,
          overflow: 'hidden',
          boxShadow: '0 0 0 1px rgba(0,0,0,0.04), 0 2px 4px rgba(0,0,0,0.04), 0 12px 40px rgba(0,0,0,0.07)',
        }}>
          {/* Top accent stripe */}
          <div style={{ height: 3, background: `linear-gradient(90deg, ${T.green}, #FCD34D, transparent)` }} />

          <div style={{ padding: 28 }}>
            {/* Subject select */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <PencilIcon />
                <span style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 11,
                  color: T.hint, textTransform: 'uppercase', letterSpacing: '0.7px',
                }}>Subject</span>
                <span style={{
                  background: T.line, color: T.hint, borderRadius: 99,
                  fontSize: 10, padding: '1px 7px',
                  fontFamily: "'DM Sans', sans-serif",
                }}>optional</span>
              </div>
              <div style={{ position: 'relative' }}>
                <select
                  className="sp-sel"
                  value={selectedSubject}
                  onChange={e => setSelectedSubject(e.target.value)}
                  style={{
                    width: '100%', padding: '11px 42px 11px 14px',
                    border: `1.5px solid ${T.line}`, borderRadius: 12,
                    background: T.cardBg, appearance: 'none',
                    fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: 14.5,
                    color: T.ink, cursor: 'pointer', transition: 'border-color 0.2s',
                    WebkitAppearance: 'none', MozAppearance: 'none',
                  }}
                >
                  {syllabusTopics && Object.keys(syllabusTopics).map((s, i) => (
                    <option key={i} value={s} style={{ background: '#FFFFFF', color: T.ink }}>{s}</option>
                  ))}
                </select>
                <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.hint} strokeWidth="2.5" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>
                </div>
              </div>
            </div>

            {/* Upload zones */}
            <div className="sp-zones" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
              <UploadZone
                step={1} title="Question Paper"
                file={questionFile} onFile={setQuestionFile} onClear={() => setQuestionFile(null)}
                isDragging={drag1} {...makeDragHandlers(setDrag1, setQuestionFile)}
              />
              <UploadZone
                step={2} title="Student Answer Sheet"
                file={answerFile} onFile={setAnswerFile} onClear={() => setAnswerFile(null)}
                isDragging={drag2} {...makeDragHandlers(setDrag2, setAnswerFile)}
              />
            </div>

            {/* Warning strip */}
            {!answerFile && (
              <div className="sp-fadein" style={{
                background: T.amberBg,
                borderLeft: `3px solid ${T.amberLine}`,
                borderTop: `1px solid ${T.amberLine}`,
                borderRight: `1px solid ${T.amberLine}`,
                borderBottom: `1px solid ${T.amberLine}`,
                borderRadius: 12, padding: '12px 16px',
                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
              }}>
                <div style={{
                  width: 26, height: 26, borderRadius: '50%',
                  background: 'rgba(252,211,77,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <WarnIcon />
                </div>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, color: T.amber }}>
                  An answer sheet is required to run the analysis.
                </span>
              </div>
            )}

            {/* CTA button */}
            <button
              className={`sp-cta${done ? ' sp-cta-done' : ''}`}
              onClick={handleAnalyze}
              disabled={isAnalyzing || !answerFile}
              style={{
                width: '100%', padding: '15px 20px', borderRadius: 12,
                fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 15,
                letterSpacing: '-0.2px', cursor: isAnalyzing || !answerFile ? 'not-allowed' : 'pointer',
                transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                ...(done ? {
                  background: T.gLight, color: T.green,
                  border: `1px solid ${T.gRing}`, fontWeight: 700, boxShadow: 'none',
                } : isAnalyzing || !answerFile ? {
                  background: '#EFEFEB', color: '#AAAA9E',
                  border: '1px solid #E2E0D8', boxShadow: 'none',
                } : {
                  background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#FFFFFF',
                  border: 'none',
                  boxShadow: '0 4px 16px rgba(37,99,235,0.28), 0 1px 0 rgba(255,255,255,0.12) inset',
                }),
              }}
            >
              {isAnalyzing ? (
                <>
                  {[0,1,2].map(i => (
                    <span key={i} style={{
                      width: 7, height: 7, borderRadius: '50%',
                      background: 'rgba(255,255,255,0.75)',
                      display: 'inline-block',
                      animation: `sp-bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }} />
                  ))}
                  <span>Analysing…</span>
                </>
              ) : done ? (
                <><CheckIcon size={16} /> View Results →</>
              ) : (
                `Analyse ${studentClass}${selectedSubject ? ` — ${selectedSubject}` : ''}`
              )}
            </button>

            {/* Progress */}
            {isAnalyzing && <AnalyzeProgress progress={progress} stepIndex={stepIdx} />}

            {/* Success banner */}
            {done && (
              <div className="sp-fadein" style={{
                marginTop: 16, background: T.gLight, border: `1px solid ${T.gRing}`,
                borderRadius: 12, padding: '14px 16px',
                display: 'flex', alignItems: 'center', gap: 13,
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: '50%', background: T.green, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 4px 12px ${T.gGlow}`,
                }}>
                  <CheckIcon size={18} />
                </div>
                <div>
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 14, color: T.ink }}>
                    Analysis complete!
                  </div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12.5, color: T.sub, marginTop: 2 }}>
                    Switch to the Review tab to see your detailed feedback.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Card footer */}
          <div style={{
            background: T.pageBg, borderTop: `1px solid ${T.line}`,
            padding: '12px 28px', display: 'flex', gap: 20, flexWrap: 'wrap',
          }}>
            {[
              { icon: <ShieldIcon />, text: 'End-to-end encrypted' },
              { icon: <ClockIcon />,  text: 'Results in ~30 sec' },
              { icon: <FileIcon />,   text: 'PDF · JPG · PNG' },
            ].map(({ icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                {icon}
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11.5, color: T.hint }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right sidebar ── */}
      <div style={{ width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 28 }}>

        {/* CARD 2 — Study Reminders */}
        <div style={{ background: T.cardBg, border: `1px solid ${T.line}`, borderRadius: 16, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ padding: '14px 18px', borderBottom: `1px solid ${T.line}`, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EA580C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </div>
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 13, color: T.ink, flex: 1 }}>Study Reminders</span>
            {reminders.length > 0 && (
              <span style={{ background: T.gLight, color: T.green, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>
                {reminders.length} set
              </span>
            )}
          </div>
          {/* Body */}
          <div style={{ padding: '14px 18px' }}>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 600, color: T.hint, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Quick presets</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['In 1 day', 'In 3 days', 'This weekend'].map(label => (
                <button key={label} onClick={() => setSelectedPreset(selectedPreset === label ? '' : label)} style={{
                  padding: '6px 12px', borderRadius: 99, fontSize: 12, fontWeight: 500,
                  fontFamily: "'DM Sans', sans-serif", cursor: 'pointer', transition: 'all 0.15s',
                  border: selectedPreset === label ? `1px solid ${T.gRing}` : `1px solid ${T.line}`,
                  background: selectedPreset === label ? T.gLight : T.pageBg,
                  color: selectedPreset === label ? T.green : T.sub,
                }}>{label}</button>
              ))}
            </div>
            <div style={{ height: 1, background: T.line, margin: '12px 0' }} />
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 600, color: T.hint, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Custom reminder</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                placeholder="e.g. Review Science Ch.4"
                value={reminderInput}
                onChange={e => setReminderInput(e.target.value)}
                onFocus={() => setReminderFocused(true)}
                onBlur={() => setReminderFocused(false)}
                onKeyDown={e => e.key === 'Enter' && addReminder()}
                style={{
                  flex: 1, padding: '9px 12px',
                  border: `1.5px solid ${reminderFocused ? T.gMid : T.line}`,
                  borderRadius: 10, fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                  color: T.ink, background: T.cardBg, outline: 'none', transition: 'border-color 0.2s',
                }}
              />
              <button
                onClick={addReminder}
                disabled={!reminderInput.trim()}
                style={{
                  padding: '9px 14px', border: 'none', borderRadius: 10,
                  fontSize: 13, fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif",
                  cursor: reminderInput.trim() ? 'pointer' : 'not-allowed',
                  background: reminderInput.trim() ? T.green : T.line,
                  color: reminderInput.trim() ? 'white' : T.hint,
                  transition: 'all 0.15s',
                }}
              >+</button>
            </div>
            {reminders.length > 0 && (
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {reminders
                  .sort((a, b) => (a.completed ? 1 : 0) - (b.completed ? 1 : 0)) // Completed items at bottom
                  .map(r => (
                  <div key={r.id} style={{ 
                    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', 
                    background: r.completed ? T.zoneBg : T.gLight, 
                    borderRadius: 10, 
                    border: `1px solid ${r.completed ? T.line : T.gRing}`,
                    opacity: r.completed ? 0.6 : 1,
                    transition: 'all 0.2s'
                  }}>
                    {/* Completion checkbox */}
                    <button
                      onClick={() => !r.completed && handleCompleteClick(r)}
                      disabled={r.completed}
                      style={{ 
                        width: 18, height: 18, borderRadius: '50%', 
                        background: r.completed ? T.gMid : 'transparent', 
                        border: `2px solid ${r.completed ? T.gMid : T.gRing}`,
                        cursor: r.completed ? 'default' : 'pointer', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        flexShrink: 0,
                        transition: 'all 0.2s'
                      }}
                    >
                      {r.completed && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </button>
                    
                    <span style={{ 
                      fontSize: 12.5, 
                      color: r.completed ? T.hint : T.ink, 
                      flex: 1, 
                      fontFamily: "'DM Sans', sans-serif", 
                      lineHeight: 1.4,
                      textDecoration: r.completed ? 'line-through' : 'none'
                    }}>
                      {r.text}
                    </span>
                    
                    {r.completed && (
                      <span style={{
                        fontSize: 9,
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontWeight: 700,
                        color: T.gMid,
                        background: T.gLight,
                        padding: '2px 6px',
                        borderRadius: 99,
                        border: `1px solid ${T.gRing}`
                      }}>Done</span>
                    )}
                    
                    <button
                      onClick={() => handleDeleteReminder(r.id)}
                      style={{ width: 18, height: 18, borderRadius: '50%', background: T.line, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                    >
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={T.sub} strokeWidth="2.5" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* CARD 3 — Tips for best results */}
        <div style={{ background: T.gLight, border: `1px solid ${T.gRing}`, borderRadius: 16, padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 16 }}>🌿</span>
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 13, color: T.green }}>Tips for best results</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              'Ensure the answer sheet is well-lit and clearly visible',
              'Upload the question paper for more accurate scoring',
              'Flatten crumpled sheets before scanning or photographing',
              'PDF scans give the best recognition accuracy',
            ].map((tip, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: T.gMid, marginTop: 5, flexShrink: 0 }} />
                <span style={{ fontSize: 12.5, color: T.green, lineHeight: 1.55, fontFamily: "'DM Sans', sans-serif" }}>{tip}</span>
              </div>
            ))}
          </div>
        </div>


      </div>

    </div>

    {/* Confirmation Modal */}
    {confirmModal && (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999, animation: 'sp-fadein 0.2s ease'
      }}
        onClick={() => setConfirmModal(null)}
      >
        <div style={{
          background: T.cardBg, borderRadius: 16, padding: '24px 28px',
          maxWidth: 420, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          border: `1px solid ${T.line}`, animation: 'sp-slideup 0.3s ease'
        }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ fontSize: 32, marginBottom: 12, textAlign: 'center' }}>⏰</div>
          <h3 style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800,
            fontSize: 18, color: T.ink, marginBottom: 8, textAlign: 'center'
          }}>
            {confirmModal.timeLeft} left!
          </h3>
          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: T.sub,
            lineHeight: 1.6, marginBottom: 24, textAlign: 'center'
          }}>
            You still have {confirmModal.timeLeft} left for "{confirmModal.reminder.text.split(' · ')[0]}". Are you sure you're done?
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setConfirmModal(null)}
              style={{
                flex: 1, padding: '10px 16px', borderRadius: 10,
                background: T.zoneBg, border: `1px solid ${T.line}`,
                color: T.ink, fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = T.line}
              onMouseLeave={(e) => e.currentTarget.style.background = T.zoneBg}
            >
              Keep it active
            </button>
            <button
              onClick={() => {
                markComplete(confirmModal.reminder.id);
                setConfirmModal(null);
              }}
              style={{
                flex: 1, padding: '10px 16px', borderRadius: 10,
                background: 'linear-gradient(135deg, #10B981, #059669)',
                border: 'none', color: 'white',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              Mark Done ✓
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

// ─── Main Home component ──────────────────────────────────────────────────────
export default function Home() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeTab, setActiveTab] = useState('analyze');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [practiceSet, setPracticeSet] = useState(null);
  const [isGeneratingPractice, setIsGeneratingPractice] = useState(false);
  const [practiceTopics, setPracticeTopics] = useState(null); // Store topics for practice tab
  const [questionFile, setQuestionFile] = useState(null);
  const [answerFile, setAnswerFile] = useState(null);
  const [studentClass, setStudentClass] = useState(null);
  const [history, setHistory] = useState([]);
  const [isDark, setIsDark] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [syllabusTopics, setSyllabusTopics] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [toasts, setToasts] = useState([]);
  const [showBellMenu, setShowBellMenu] = useState(false);
  const [bellReminders, setBellReminders] = useState([]);
  const [bellBounce, setBellBounce] = useState(false);
  const [reminders, setReminders] = useState([]);
  const userMenuRef = useRef(null);
  const bellMenuRef = useRef(null);

  // Auth guard
  useEffect(() => {
    const stored = localStorage.getItem('sprout_current_user');
    if (!stored) { router.replace('/login'); }
    else {
      const user = JSON.parse(stored);
      setCurrentUser(user);
      setStudentClass(user.grade || '6th CBSE');
      setAuthChecked(true);
    }
  }, [router]);

  // Theme
  useEffect(() => {
    const saved = localStorage.getItem('sprout_theme');
    const dark = saved === 'dark';
    setIsDark(dark);
    document.documentElement.classList.toggle('dark', dark);
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('sprout_theme', next ? 'dark' : 'light');
  };

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false);
      if (bellMenuRef.current && !bellMenuRef.current.contains(e.target)) setShowBellMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Check reminders every 60s — reads from localStorage set by AnalyzePage
  useEffect(() => {
    const check = () => {
      try {
        const raw = localStorage.getItem('sprout_reminders');
        if (!raw) return;
        const list = JSON.parse(raw);
        const now = Date.now();
        const updated = list.map(r => {
          if (!r.firedAt && r.dueAt && now >= r.dueAt) {
            fireToast(r.text);
            return { ...r, firedAt: now };
          }
          return r;
        });
        if (updated.some((r, i) => r.firedAt !== list[i].firedAt))
          localStorage.setItem('sprout_reminders', JSON.stringify(updated));
      } catch (_) {}
    };
    check();
    const id = setInterval(check, 60000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('sprout_current_user');
    router.replace('/login');
  };

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
  console.log("DEBUG: API_URL in Home is:", API_URL);

  const filteredHistory = useMemo(() => {
    return history.filter(item => (item.data.studentClass || '6th CBSE') === studentClass);
  }, [history, studentClass]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const sid = JSON.parse(localStorage.getItem('sprout_current_user') || '{}').studentId || 'default';
        const response = await fetch(`${API_URL}/api/history?studentId=${sid}`);
        const data = await response.json();
        setHistory(data);
      } catch (e) { console.error("Failed to fetch history:", e); }
    };
    fetchHistory();
  }, [API_URL]);

  useEffect(() => {
    if (!studentClass) return;
    const fetchSyllabus = async () => {
      try {
        const response = await fetch(`${API_URL}/api/syllabus/${encodeURIComponent(studentClass)}`);
        const data = await response.json();
        if (!data.error) {
          setSyllabusTopics(data);
          const subjects = Object.keys(data);
          if (subjects.length > 0) setSelectedSubject(subjects[0]);
        }
      } catch (e) { console.error("Failed to fetch syllabus:", e); }
    };
    fetchSyllabus();
  }, [API_URL, studentClass]);

  const tabs = useMemo(() => [
    { id: 'analyze',    label: 'Analyze',   icon: 'UPLOAD' },
    { id: 'recent',     label: 'Recent',    icon: 'HISTORY' },
    { id: 'review',     label: 'Review',    icon: 'EDIT',    disabled: !evaluation },
    { id: 'insights',   label: 'Insights',  icon: 'CHART' },
    { id: 'remediate',  label: 'Remediate', icon: 'FIX' },
    { id: 'flashcards', label: 'Flashcards',icon: 'CARDS' },
    { id: 'practice',   label: 'Practice',  icon: 'PRACTICE' },
  ], [evaluation, practiceSet]);

  const handleAnalyze = async () => {
    if (!answerFile) return;
    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('questionFile', questionFile);
      formData.append('answerFile', answerFile);
      formData.append('studentClass', studentClass);
      if (selectedSubject) formData.append('subject', selectedSubject);
      if (currentUser?.studentId) formData.append('studentId', currentUser.studentId);
      const response = await fetch(`${API_URL}/api/analyze`, { method: 'POST', body: formData });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setEvaluation(data.data);
      // Re-fetch full history from backend to ensure all submissions are persisted
      const histRes = await fetch(`${API_URL}/api/history?studentId=${currentUser?.studentId || 'default'}`);
      const histData = await histRes.json();
      setHistory(histData);
      setActiveTab('review');
    } catch (error) {
      console.error("Error analyzing:", error);
      alert(error.message || "Failed to analyze the sheet.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLoadSubmission = (item) => { setEvaluation(item.data); setPracticeSet(null); setActiveTab('review'); };

  const handleDeleteSubmission = async (timestamp) => {
    try {
      await fetch(`${API_URL}/api/history/${timestamp}?studentId=${currentUser?.studentId || 'default'}`, { method: 'DELETE' });
      setHistory(history.filter(h => h.timestamp !== timestamp));
    } catch (error) { console.error("Error deleting submission:", error); }
  };

  const handleNavigateToPractice = (topics, selectedTypes = ['Multiple Choice']) => {
    console.log('handleNavigateToPractice called with topics:', topics, 'types:', selectedTypes);
    setPracticeTopics({ topics, selectedTypes });
    setActiveTab('practice');
  };

  const handleGeneratePractice = async (topics, selectedTypes = ['Multiple Choice', 'Short Answer', 'Long Answer']) => {
    if (!topics || topics.length === 0) {
      alert("No weak topics identified for practice. You've mastered all the questions in this sheet!");
      return;
    }
    setIsGeneratingPractice(true);
    try {
      const response = await fetch(`${API_URL}/api/generate-practice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topics, studentClass, selectedTypes }),
      });
      const data = await response.json();
      setPracticeSet({ ...data, timestamp: Date.now() });
      setActiveTab('practice');
    } catch (error) { console.error("Error generating practice:", error); }
    finally { setIsGeneratingPractice(false); }
  };

  const handleBack = () => {
    setEvaluation(null); setPracticeSet(null);
    setQuestionFile(null); setAnswerFile(null);
    setActiveTab('analyze');
  };

  const renderContent = () => {
    if (isGeneratingPractice) {
      return (
        <div style={{
          background: T.cardBg, border: `1px solid ${T.line}`, borderRadius: 20,
          boxShadow: '0 0 0 1px rgba(0,0,0,0.04), 0 2px 4px rgba(0,0,0,0.04), 0 12px 40px rgba(0,0,0,0.07)',
          textAlign: 'center', padding: '4rem 2rem',
        }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: T.gLight, border: `1px solid ${T.gRing}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 24 }}>✏️</div>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 22, color: T.ink, marginBottom: 8 }}>Generating Your Practice Set…</h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: T.sub }}>Personalizing questions based on your weak areas.</p>
        </div>
      );
    }
    switch (activeTab) {
      case 'analyze':
        return (
          <AnalyzePage
            studentClass={studentClass}
            syllabusTopics={syllabusTopics}
            selectedSubject={selectedSubject}
            setSelectedSubject={setSelectedSubject}
            questionFile={questionFile}
            setQuestionFile={setQuestionFile}
            answerFile={answerFile}
            setAnswerFile={setAnswerFile}
            isAnalyzing={isAnalyzing}
            evaluation={evaluation}
            handleAnalyze={handleAnalyze}
            reminders={reminders}
            setReminders={setReminders}
            setBellReminders={setBellReminders}
            setToasts={setToasts}
            setBellBounce={setBellBounce}
          />
        );
      case 'recent':
        return <RecentSubmissions history={filteredHistory} onLoadSubmission={handleLoadSubmission} onDeleteSubmission={handleDeleteSubmission} />;
      case 'review':
        return <FeedbackDisplay evaluation={evaluation} onBack={handleBack} onGeneratePractice={handleGeneratePractice} onNavigateToPractice={handleNavigateToPractice} />;
      case 'insights':
        return <Dashboard evaluation={evaluation} history={filteredHistory} studentClass={studentClass} />;
      case 'remediate':
        return <RemediationAgent evaluation={evaluation} history={filteredHistory} studentClass={studentClass} syllabusTopics={syllabusTopics} />;
      case 'flashcards':
        return <Flashcards evaluation={evaluation} history={filteredHistory} studentClass={studentClass} syllabusTopics={syllabusTopics} />;
      case 'practice':
        return (
          <PracticeTabs
            key={practiceTopics ? JSON.stringify(practiceTopics) : 'practice'}
            studentClass={studentClass}
            syllabusTopics={syllabusTopics}
            onBack={() => {
              setPracticeTopics(null);
              setActiveTab('review');
            }}
            initialTopics={practiceTopics}
          />
        );
      default: return null;
    }
  };

  if (!authChecked) return null;

  const tabIcons = {
    analyze:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
    recent:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    review:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
    insights:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    remediate:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    flashcards: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
    practice:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />

      {/* ── Full-height shell: sidebar + content ── */}
      <div style={{ display: 'flex', minHeight: '100vh', background: T.pageBg, marginLeft: 240 }}>

        {/* ════ SIDEBAR ════ */}
        <aside style={{
          width: 240, flexShrink: 0,
          background: T.cardBg, borderRight: `1px solid ${T.line}`,
          display: 'flex', flexDirection: 'column',
          position: 'fixed', top: 0, left: 0, height: '100vh', overflowY: 'auto', zIndex: 200,
        }}>
          {/* Logo */}
          <div style={{ padding: '20px 20px 16px', borderBottom: `1px solid ${T.line}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, background: T.green, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(37,99,235,0.25)',
              }}>
                <LeafIcon />
              </div>
              <div>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 16, color: T.ink, lineHeight: 1.1 }}>
                  Sprout<span style={{ color: T.green }}>AI</span>
                </div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: T.hint, marginTop: 1 }}>
                  {studentClass}
                </div>
              </div>
            </div>
          </div>

          {/* Nav items */}
          <div style={{ flex: 1, padding: '12px 10px' }}>
            {/* Main section label */}
            <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 10, color: T.hint, textTransform: 'uppercase', letterSpacing: '0.8px', padding: '0 10px', marginBottom: 6 }}>Main</p>

            {/* Analyze + Recent */}
            {['analyze', 'recent'].map(id => {
              const tab = tabs.find(t => t.id === id);
              const active = activeTab === id;
              return (
                <button key={id} onClick={() => setActiveTab(id)} style={{
                  width: '100%', padding: '9px 12px', borderRadius: 10, border: 'none',
                  background: active ? T.gLight : 'transparent',
                  color: active ? T.green : T.sub,
                  fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: active ? 700 : 500,
                  fontSize: 13.5, cursor: 'pointer', textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: 10,
                  transition: 'all 0.15s ease', marginBottom: 2,
                  borderLeft: active ? `3px solid ${T.green}` : '3px solid transparent',
                }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.background = T.zoneBg; e.currentTarget.style.color = T.ink; } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.sub; } }}
                >
                  <span style={{ color: active ? T.green : T.hint, flexShrink: 0 }}>{tabIcons[id]}</span>
                  {tab?.label}
                </button>
              );
            })}

            {/* Results section label */}
            <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 10, color: T.hint, textTransform: 'uppercase', letterSpacing: '0.8px', padding: '12px 10px 6px', marginBottom: 0 }}>Results</p>

            {/* Review + Insights */}
            {['review', 'insights'].map(id => {
              const tab = tabs.find(t => t.id === id);
              const active = activeTab === id;
              const dimmed = tab?.disabled;
              return (
                <button key={id} onClick={() => !dimmed && setActiveTab(id)} disabled={dimmed} style={{
                  width: '100%', padding: '9px 12px', borderRadius: 10, border: 'none',
                  background: active ? T.gLight : 'transparent',
                  color: active ? T.green : dimmed ? T.hint : T.sub,
                  fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: active ? 700 : 500,
                  fontSize: 13.5, cursor: dimmed ? 'default' : 'pointer', textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: 10,
                  transition: 'all 0.15s ease', marginBottom: 2, opacity: dimmed ? 0.45 : 1,
                  borderLeft: active ? `3px solid ${T.green}` : '3px solid transparent',
                }}
                  onMouseEnter={e => { if (!active && !dimmed) { e.currentTarget.style.background = T.zoneBg; e.currentTarget.style.color = T.ink; } }}
                  onMouseLeave={e => { if (!active && !dimmed) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.sub; } }}
                >
                  <span style={{ color: active ? T.green : T.hint, flexShrink: 0 }}>{tabIcons[id]}</span>
                  {tab?.label}
                </button>
              );
            })}

            {/* Learn section label */}
            <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 10, color: T.hint, textTransform: 'uppercase', letterSpacing: '0.8px', padding: '12px 10px 6px', marginBottom: 0 }}>Learn</p>

            {/* Remediate + Flashcards + Practice */}
            {['remediate', 'flashcards', 'practice'].map(id => {
              const tab = tabs.find(t => t.id === id);
              const active = activeTab === id;
              const dimmed = tab?.disabled;
              return (
                <button key={id} onClick={() => !dimmed && setActiveTab(id)} disabled={dimmed} style={{
                  width: '100%', padding: '9px 12px', borderRadius: 10, border: 'none',
                  background: active ? T.gLight : 'transparent',
                  color: active ? T.green : dimmed ? T.hint : T.sub,
                  fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: active ? 700 : 500,
                  fontSize: 13.5, cursor: dimmed ? 'default' : 'pointer', textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: 10,
                  transition: 'all 0.15s ease', marginBottom: 2, opacity: dimmed ? 0.45 : 1,
                  borderLeft: active ? `3px solid ${T.green}` : '3px solid transparent',
                }}
                  onMouseEnter={e => { if (!active && !dimmed) { e.currentTarget.style.background = T.zoneBg; e.currentTarget.style.color = T.ink; } }}
                  onMouseLeave={e => { if (!active && !dimmed) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.sub; } }}
                >
                  <span style={{ color: active ? T.green : T.hint, flexShrink: 0 }}>{tabIcons[id]}</span>
                  {tab?.label}
                </button>
              );
            })}
          </div>

          {/* Bottom: user + actions */}
          <div style={{ borderTop: `1px solid ${T.line}`, padding: '12px 10px' }}>
            {/* Theme toggle */}
            <button onClick={toggleTheme} style={{
              width: '100%', padding: '9px 12px', borderRadius: 10, border: 'none',
              background: 'transparent', color: T.sub, cursor: 'pointer',
              fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500, fontSize: 13.5,
              textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10,
              transition: 'all 0.15s', marginBottom: 2,
            }}
              onMouseEnter={e => { e.currentTarget.style.background = T.zoneBg; e.currentTarget.style.color = T.ink; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.sub; }}
            >
              <span style={{ color: T.hint }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {isDark
                    ? <circle cx="12" cy="12" r="5"/>
                    : <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>}
                </svg>
              </span>
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </button>

            {/* User row */}
            <div style={{ position: 'relative' }} ref={userMenuRef}>
              <button onClick={() => setShowUserMenu(v => !v)} style={{
                width: '100%', padding: '9px 12px', borderRadius: 10, border: 'none',
                background: 'transparent', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 10, transition: 'background 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = T.zoneBg}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{
                  width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, #2563EB, #1E3A8A)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontSize: 12, fontWeight: 700,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}>
                  {currentUser?.name?.[0]?.toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 13, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {currentUser?.name}
                  </div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: T.hint }}>
                    {currentUser?.grade}
                  </div>
                </div>
                <ChevronIcon open={showUserMenu} />
              </button>

              {showUserMenu && (
                <div style={{
                  position: 'absolute', bottom: 'calc(100% + 8px)', left: 0, right: 0,
                  borderRadius: 12, overflow: 'hidden',
                  background: T.cardBg, border: `1px solid ${T.line}`,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.12)', zIndex: 1100,
                  animation: 'sp-fadein 0.15s ease-out',
                }}>
                  <div style={{ padding: '12px 14px', borderBottom: `1px solid ${T.line}` }}>
                    <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 13, color: T.ink, margin: 0 }}>{currentUser?.name}</p>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: T.hint, margin: '2px 0 0' }}>ID: {currentUser?.studentId}</p>
                  </div>
                  <button onClick={handleLogout} style={{
                    width: '100%', padding: '10px 14px', textAlign: 'left',
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500,
                    color: '#DC2626', display: 'flex', alignItems: 'center', gap: 8,
                    transition: 'background 0.15s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(220,38,38,0.06)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* ════ CONTENT ════ */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
          {/* Top bar */}
          <header style={{
            height: 56, flexShrink: 0,
            background: T.cardBg, borderBottom: `1px solid ${T.line}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 28px', position: 'sticky', top: 0, zIndex: 100,
          }}>
            {/* Page title */}
            <div>
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 15, color: T.ink }}>
                {tabs.find(t => t.id === activeTab)?.label || 'Dashboard'}
              </span>
            </div>
            {/* Bell */}
            <div style={{ position: 'relative' }} ref={bellMenuRef}>
              <button
                onClick={() => setShowBellMenu(v => !v)}
                style={{
                  width: 34, height: 34, borderRadius: 8,
                  background: T.zoneBg, border: `1px solid ${T.line}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', position: 'relative',
                  animation: bellBounce ? 'sp-bell-bounce 0.5s ease' : 'none',
                }}
              >
                <BellIcon />
                {reminders.filter(r => !r.firedAt).length > 0 && (
                  <div style={{
                    position: 'absolute', top: 5, right: 5,
                    minWidth: 16, height: 16, borderRadius: 99,
                    background: '#EF4444', border: `2px solid ${T.cardBg}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, fontWeight: 800, color: 'white',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    lineHeight: 1,
                  }}>
                    {reminders.filter(r => !r.firedAt).length}
                  </div>
                )}
              </button>

              {/* Bell dropdown */}
              {showBellMenu && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  width: 300, background: T.cardBg, border: `1px solid ${T.line}`,
                  borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                  zIndex: 500, overflow: 'hidden',
                  animation: 'sp-fadein 0.15s ease',
                }}>
                  {/* Dropdown header */}
                  <div style={{
                    padding: '12px 16px', borderBottom: `1px solid ${T.line}`,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 13, color: T.ink }}>
                      Reminders
                    </span>
                    {bellReminders.some(r => !r.read) && (
                      <button
                        onClick={() => setBellReminders(prev => prev.map(r => ({ ...r, read: true })))}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          fontFamily: "'DM Sans', sans-serif", fontSize: 12,
                          color: T.gMid, fontWeight: 600, padding: 0,
                        }}
                      >Mark all read</button>
                    )}
                  </div>
                  {/* Reminder list */}
                  <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                    {reminders.length === 0 ? (
                      <div style={{ padding: '24px 16px', textAlign: 'center', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: T.hint }}>
                        No reminders yet
                      </div>
                    ) : reminders.map(r => {
                      const isPending = !r.firedAt;
                      const dueDate = r.dueAt ? new Date(r.dueAt).toLocaleString('en-US', { 
                        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' 
                      }) : '';
                      return (
                        <div key={r.id} style={{
                          padding: '11px 16px', borderBottom: `1px solid ${T.line}`,
                          display: 'flex', alignItems: 'flex-start', gap: 10,
                          background: isPending ? 'transparent' : T.gLight,
                          transition: 'background 0.2s',
                        }}>
                          <div style={{
                            width: 7, height: 7, borderRadius: '50%', flexShrink: 0, marginTop: 4,
                            background: isPending ? '#3B82F6' : T.gMid,
                          }} />
                          <div style={{ flex: 1 }}>
                            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: T.ink, lineHeight: 1.45, display: 'block' }}>
                              {r.text}
                            </span>
                            {isPending && dueDate && (
                              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: T.hint, marginTop: 2, display: 'block' }}>
                                Due: {dueDate}
                              </span>
                            )}
                            {!isPending && (
                              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: T.gMid, marginTop: 2, display: 'block' }}>
                                ✓ Fired
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </header>

          {/* Page content */}
          <main style={{ flex: 1, padding: '28px 32px', overflowY: 'auto' }}>
            {renderContent()}
          </main>
        </div>
      </div>

      {/* ── Toast container ── */}
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end' }}>
        {toasts.map(toast => (
          <div key={toast.id} style={{
            background: T.cardBg, border: `1px solid ${T.line}`,
            borderRadius: 14, padding: '14px 16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
            minWidth: 260, maxWidth: 320,
            animation: 'sp-toast-in 0.3s cubic-bezier(0.34,1.56,0.64,1)',
            overflow: 'hidden', position: 'relative',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: '#FFF7ED', border: '1px solid #FED7AA', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#EA580C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
              </div>
              <div>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 12, color: T.hint, marginBottom: 2 }}>Study Reminder</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: T.ink, lineHeight: 1.45 }}>{toast.text}</div>
              </div>
            </div>
            {/* Progress bar */}
            <div style={{ height: 3, background: T.line, borderRadius: 99, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 99,
                background: `linear-gradient(90deg, ${T.green}, ${T.gMid})`,
                animation: 'sp-toast-bar 4.5s linear forwards',
              }} />
            </div>
          </div>
        ))}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes sp-toast-in {
          from { opacity: 0; transform: translateY(16px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes sp-toast-bar {
          from { width: 100%; }
          to   { width: 0%; }
        }
        @keyframes sp-bell-bounce {
          0%,100% { transform: rotate(0deg); }
          20%     { transform: rotate(-18deg); }
          40%     { transform: rotate(18deg); }
          60%     { transform: rotate(-10deg); }
          80%     { transform: rotate(10deg); }
        }
      `}} />
    </>
  );
}

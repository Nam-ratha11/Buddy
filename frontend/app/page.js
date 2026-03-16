"use client";
import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import FileUploader from '@/components/FileUploader';
import FeedbackDisplay from '@/components/FeedbackDisplay';
import PracticeArea from '@/components/PracticeArea';
import Dashboard from '@/components/Dashboard';
import Tabs from '@/components/Tabs';
import RecentSubmissions from '@/components/RecentSubmissions';
import RemediationAgent from '@/components/RemediationAgent';

export default function Home() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeTab, setActiveTab] = useState('analyze');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [practiceSet, setPracticeSet] = useState(null);
  const [isGeneratingPractice, setIsGeneratingPractice] = useState(false);
  const [questionFile, setQuestionFile] = useState(null);
  const [answerFile, setAnswerFile] = useState(null);
  const [studentClass, setStudentClass] = useState(null);
  const [history, setHistory] = useState([]);
  const [isDark, setIsDark] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [syllabusTopics, setSyllabusTopics] = useState(null);
  const userMenuRef = useRef(null);

  // Auth guard — grade comes from registration profile, no selection screen needed
  useEffect(() => {
    const stored = localStorage.getItem('sprout_current_user');
    if (!stored) {
      router.replace('/login');
    } else {
      const user = JSON.parse(stored);
      setCurrentUser(user);
      setStudentClass(user.grade || '6th CBSE');
      setAuthChecked(true);
    }
  }, [router]);

  // Theme — persist across sessions
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
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('sprout_current_user');
    router.replace('/login');
  };

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

  // Filtered history based on user's grade
  const filteredHistory = useMemo(() => {
    return history.filter(item => (item.data.studentClass || '6th CBSE') === studentClass);
  }, [history, studentClass]);

  // Load history on mount
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch(`${API_URL}/api/history`);
        const data = await response.json();
        setHistory(data);
      } catch (e) {
        console.error("Failed to fetch history:", e);
      }
    };
    fetchHistory();
  }, [API_URL]);

  // Fetch syllabus topics for remediation
  useEffect(() => {
    if (!studentClass) return;
    const fetchSyllabus = async () => {
      try {
        const response = await fetch(`${API_URL}/api/syllabus/${encodeURIComponent(studentClass)}`);
        const data = await response.json();
        if (!data.error) setSyllabusTopics(data);
      } catch (e) {
        console.error("Failed to fetch syllabus:", e);
      }
    };
    fetchSyllabus();
  }, [API_URL, studentClass]);

  const tabs = useMemo(() => [
    { id: 'analyze', label: 'Analyze', icon: 'UPLOAD' },
    { id: 'recent', label: 'Recent', icon: 'HISTORY' },
    { id: 'review', label: 'Review', icon: 'EDIT', disabled: !evaluation },
    { id: 'insights', label: 'Insights', icon: 'CHART' },
    { id: 'remediate', label: 'Remediate', icon: 'FIX' },
    { id: 'practice', label: 'Practice', icon: 'PRACTICE', disabled: !practiceSet }
  ], [evaluation, practiceSet]);

  const handleAnalyze = async () => {
    if (!answerFile) return;
    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('questionFile', questionFile);
      formData.append('answerFile', answerFile);
      formData.append('studentClass', studentClass);

      const response = await fetch(`${API_URL}/api/analyze`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setEvaluation(data.data);
      setHistory(prev => [data, ...prev].slice(0, 20));
      setActiveTab('review');
    } catch (error) {
      console.error("Error analyzing:", error);
      alert(error.message || "Failed to analyze the sheet.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLoadSubmission = (item) => {
    setEvaluation(item.data);
    setPracticeSet(null);
    setActiveTab('review');
  };

  const handleDeleteSubmission = async (timestamp) => {
    try {
      await fetch(`${API_URL}/api/history/${timestamp}`, { method: 'DELETE' });
      setHistory(history.filter(h => h.timestamp !== timestamp));
    } catch (error) {
      console.error("Error deleting submission:", error);
    }
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
    } catch (error) {
      console.error("Error generating practice:", error);
    } finally {
      setIsGeneratingPractice(false);
    }
  };

  const handleBack = () => {
    setEvaluation(null);
    setPracticeSet(null);
    setQuestionFile(null);
    setAnswerFile(null);
    setActiveTab('analyze');
  };

  const renderContent = () => {
    if (isGeneratingPractice) {
      return (
        <div className="card glass" style={{ textAlign: 'center', padding: '4rem' }}>
          <h2 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>Generating Your Practice Set...</h2>
          <p style={{ opacity: 0.7 }}>Personalizing questions based on your weak areas.</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'analyze':
        return (
          <section id="upload" className="card glass" style={{ padding: '3rem', textAlign: 'center' }}>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Ready to Improve?</h2>
            <p style={{ opacity: 0.7, marginBottom: '2rem' }}>Upload the answer sheet for {studentClass}.</p>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 300px' }}>
                  <FileUploader
                    label="1. Question Paper (Optional)"
                    id="question-paper"
                    onFilesSelected={(file) => setQuestionFile(file)}
                  />
                </div>
                <div style={{ flex: '1 1 300px' }}>
                  <FileUploader
                    label="2. Student Answer Sheet"
                    id="answer-sheet"
                    onFilesSelected={(file) => setAnswerFile(file)}
                  />
                </div>
              </div>
              <button
                className="btn-primary"
                onClick={handleAnalyze}
                disabled={isAnalyzing || !answerFile}
                style={{ width: '100%', padding: '1.25rem', fontSize: '1.1rem' }}
              >
                {isAnalyzing ? 'Analyzing with AI...' : `Analyze ${studentClass} Output`}
              </button>
            </div>
          </section>
        );
      case 'recent':
        return (
          <RecentSubmissions
            history={filteredHistory}
            onLoadSubmission={handleLoadSubmission}
            onDeleteSubmission={handleDeleteSubmission}
          />
        );
      case 'review':
        return <FeedbackDisplay evaluation={evaluation} onBack={handleBack} onGeneratePractice={handleGeneratePractice} />;
      case 'insights':
        return <Dashboard evaluation={evaluation} history={filteredHistory} studentClass={studentClass} />;
      case 'remediate':
        return (
          <RemediationAgent
            evaluation={evaluation}
            history={filteredHistory}
            studentClass={studentClass}
            syllabusTopics={syllabusTopics}
          />
        );
      case 'practice':
        return (
          <PracticeArea
            key={practiceSet?.timestamp || 'practice'}
            practiceSet={practiceSet}
            onBack={() => setActiveTab('review')}
            onReattempt={() => {
              const weakTopics = evaluation.questions
                .filter(q => q.marksObtained < q.maxMarks)
                .map(q => q.topic);
              handleGeneratePractice(weakTopics, practiceSet?.selectedTypes);
            }}
          />
        );
      default:
        return null;
    }
  };

  if (!authChecked) return null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <header className="glass" style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        padding: '1rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border)'
      }}>
        {/* Left: Logo + Grade badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>
            <span style={{ color: 'var(--primary)' }}>Sprout</span> AI
          </div>
          <span style={{
            padding: '0.4rem 0.8rem',
            borderRadius: '20px',
            border: '1px solid var(--border)',
            background: 'var(--primary-light)',
            color: 'var(--primary)',
            fontSize: '0.75rem',
            fontWeight: 600
          }}>
            {studentClass}
          </span>
        </div>

        {/* Right: Theme toggle + User dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            style={{
              width: '36px', height: '36px', borderRadius: '50%',
              border: '1px solid var(--border)', background: 'var(--card)',
              color: 'var(--foreground)', cursor: 'pointer', fontSize: '1rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'border-color 0.2s', flexShrink: 0
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            {isDark ? '☀' : '☾'}
          </button>

          {/* User dropdown */}
          <div style={{ position: 'relative' }} ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.35rem 0.75rem 0.35rem 0.35rem',
                borderRadius: '20px', border: '1px solid var(--border)',
                background: 'var(--primary-light)', cursor: 'pointer',
                transition: 'border-color 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              {/* Avatar */}
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: 'var(--primary)', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.8rem', fontWeight: 700, flexShrink: 0
              }}>
                {currentUser?.name?.[0]?.toUpperCase()}
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)' }}>
                {currentUser?.name}
              </span>
              <span style={{ fontSize: '0.65rem', color: 'var(--primary)', opacity: 0.7 }}>
                {showUserMenu ? '▴' : '▾'}
              </span>
            </button>

            {/* Dropdown menu */}
            {showUserMenu && (
              <div className="glass" style={{
                position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                minWidth: '220px', borderRadius: '14px', overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                border: '1px solid var(--border)', zIndex: 1100,
                animation: 'fadeIn 0.15s ease-out'
              }}>
                {/* User info section */}
                <div style={{ padding: '1rem 1.1rem', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div style={{
                      width: '38px', height: '38px', borderRadius: '50%',
                      background: 'var(--primary)', color: 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1rem', fontWeight: 700, flexShrink: 0
                    }}>
                      {currentUser?.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: '0.9rem', margin: 0, color: 'var(--foreground)' }}>
                        {currentUser?.name}
                      </p>
                      <p style={{ fontSize: '0.75rem', opacity: 0.55, margin: 0 }}>
                        ID: {currentUser?.studentId}
                      </p>
                      <p style={{ fontSize: '0.75rem', opacity: 0.55, margin: 0 }}>
                        {currentUser?.grade}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Logout button */}
                <button
                  onClick={handleLogout}
                  style={{
                    width: '100%', padding: '0.85rem 1.1rem',
                    textAlign: 'left', background: 'transparent',
                    border: 'none', cursor: 'pointer',
                    fontSize: '0.85rem', fontWeight: 600,
                    color: '#e53e3e', display: 'flex', alignItems: 'center', gap: '0.5rem',
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(229,62,62,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  ⎋ Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
        <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        <div style={{ marginTop: '2rem' }}>
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

"use client";
import { useState } from 'react';
import FileUploader from '@/components/FileUploader';
import FeedbackDisplay from '@/components/FeedbackDisplay';
import PracticeArea from '@/components/PracticeArea';
import Dashboard from '@/components/Dashboard';

export default function Home() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [practiceSet, setPracticeSet] = useState(null);
  const [isGeneratingPractice, setIsGeneratingPractice] = useState(false);
  const [files, setFiles] = useState([]);

  const [showDashboard, setShowDashboard] = useState(false);

  const handleFilesSelected = (selectedFiles) => {
    setFiles(selectedFiles);
  };

  const handleAnalyze = async (file) => {
    if (!file) return;
    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:5001/api/analyze', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setEvaluation(data);
    } catch (error) {
      console.error("Error analyzing:", error);
      alert(error.message || "Failed to analyze the sheet.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGeneratePractice = async (topics) => {
    setIsGeneratingPractice(true);
    try {
      const response = await fetch('http://localhost:5001/api/generate-practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topics }),
      });
      const data = await response.json();
      setPracticeSet(data);
    } catch (error) {
      console.error("Error generating practice:", error);
    } finally {
      setIsGeneratingPractice(false);
    }
  };

  const handleBack = () => {
    setEvaluation(null);
    setPracticeSet(null);
    setShowDashboard(false);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 2rem' }}>
      {isGeneratingPractice ? (
        <div className="card glass" style={{ textAlign: 'center', padding: '4rem' }}>
          <h2 className="gradient-text">Generating Your Practice Set...</h2>
          <p style={{ opacity: 0.7 }}>Personalizing questions based on your weak areas.</p>
        </div>
      ) : practiceSet ? (
        <PracticeArea practiceSet={practiceSet} onBack={() => setPracticeSet(null)} />
      ) : evaluation ? (
        <>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', justifyContent: 'center' }}>
            <button
              className={`btn-primary ${!showDashboard ? '' : 'btn-outline'}`}
              style={showDashboard ? { background: 'transparent', color: 'var(--foreground)', border: '1px solid var(--border)' } : {}}
              onClick={() => setShowDashboard(false)}
            >
              Feedback Report
            </button>
            <button
              className={`btn-primary ${showDashboard ? '' : 'btn-outline'}`}
              style={!showDashboard ? { background: 'transparent', color: 'var(--foreground)', border: '1px solid var(--border)' } : {}}
              onClick={() => setShowDashboard(true)}
            >
              Weakness Dashboard
            </button>
          </div>
          {showDashboard ? (
            <Dashboard evaluation={evaluation} />
          ) : (
            <FeedbackDisplay evaluation={evaluation} onBack={handleBack} onGeneratePractice={handleGeneratePractice} />
          )}
        </>
      ) : (
        <>
          <section style={{ textAlign: 'center', marginBottom: '6rem' }}>
            <h1 style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>
              CBSE Class 6 <span className="gradient-text">NCERT Coach</span>
            </h1>
            <p style={{ fontSize: '1.25rem', opacity: 0.7, maxWidth: '700px', margin: '0 auto 3rem' }}>
              Master your subjects with AI-driven feedback tailored to the NCERT curriculum.
              Upload any subject's answer sheet and get instant solutions.
            </p>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button className="btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }} onClick={() => document.getElementById('upload').scrollIntoView()}>
                Get Started
              </button>
              <button className="btn-primary" style={{
                backgroundColor: 'transparent',
                color: 'var(--foreground)',
                border: '1px solid var(--border)',
                padding: '1rem 2.5rem',
                fontSize: '1.1rem'
              }}>
                Watch Demo
              </button>
            </div>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '8rem' }}>
            <div className="card">
              <div style={{
                width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem',
                color: 'var(--primary)'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 16V8M12 8L9 11M12 8L15 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3>AI Extraction</h3>
              <p style={{ opacity: 0.7 }}>Automatically extract questions, answers, and marks from your uploaded sheets.</p>
            </div>

            <div className="card">
              <div style={{
                width: '48px', height: '48px', borderRadius: '12px', background: 'hsl(230, 100%, 95%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem',
                color: 'var(--secondary)'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9.663 17L5 12L9.663 7M14.337 17L19 12L14.337 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3>"Why I Lost Marks"</h3>
              <p style={{ opacity: 0.7 }}>AI explains the gap between your answer and the correct one with deep insights.</p>
            </div>

            <div className="card">
              <div style={{
                width: '48px', height: '48px', borderRadius: '12px', background: 'hsl(280, 100%, 95%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem',
                color: 'var(--accent)'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13 3L4 14H12L11 21L20 10H12L13 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3>Smart Practice</h3>
              <p style={{ opacity: 0.7 }}>Generate topic-focused questions to master the concepts you struggled with.</p>
            </div>
          </section>

          <section id="upload" className="card glass" style={{ padding: '4rem', textAlign: 'center' }}>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Ready to Improve?</h2>
            <p style={{ opacity: 0.7, marginBottom: '3rem' }}>Upload your latest answer sheet to start your learning journey.</p>

            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
              <FileUploader onFilesSelected={handleFilesSelected} />

              <button
                className="btn-primary"
                onClick={() => handleAnalyze(files[0])}
                disabled={isAnalyzing || files.length === 0}
                style={{ marginTop: '2rem', width: '100%', padding: '1rem' }}
              >
                {isAnalyzing ? 'Analyzing with AI...' : 'Analyze Answer Sheet'}
              </button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

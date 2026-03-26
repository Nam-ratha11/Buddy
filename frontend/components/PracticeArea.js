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

export default function PracticeArea({ practiceSet, onBack, onReattempt }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [textAnswer, setTextAnswer] = useState('');
  const [showModelAnswer, setShowModelAnswer] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [descriptiveScores, setDescriptiveScores] = useState({});
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
  const questions = practiceSet?.questions || [];
  const currentQuestion = questions[currentIndex];

  if (!currentQuestion) {
    return (
      <div style={{ background: T.cardBg, border: `1px solid ${T.line}`, borderRadius: 20, boxShadow: cardShadow, textAlign: 'center', padding: '4rem 2rem' }}>
        <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 22, color: T.ink, marginBottom: 8 }}>No questions available</h2>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: T.sub, marginBottom: 20 }}>We couldn&apos;t generate practice questions this time. Please try again.</p>
        <button onClick={onBack} style={{ padding: '12px 24px', borderRadius: 12, background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: 'white', border: 'none', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 14 }}>Back</button>
      </div>
    );
  }

  const handleOptionClick = (index) => {
    if (selectedOption !== null) return;
    setSelectedOption(index);
    const correct = index === currentQuestion.correctOption;
    setIsCorrect(correct);
    if (correct) setScore(s => s + 1);
  };

  const handleSubmitText = async () => {
    if (!textAnswer.trim()) return;
    setIsEvaluating(true);
    try {
      const response = await fetch(`${API_URL}/api/evaluate-practice-solution`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: currentQuestion.question, studentAnswer: textAnswer, modelAnswer: currentQuestion.modelAnswer }),
      });
      const data = await response.json();
      setEvaluationResult(data);
      setDescriptiveScores(prev => ({ ...prev, [currentIndex]: data.score }));
      setShowModelAnswer(true);
    } catch (error) {
      console.error("Error evaluating answer:", error);
      setShowModelAnswer(true);
    } finally { setIsEvaluating(false); }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1);
      setSelectedOption(null); setIsCorrect(null);
      setTextAnswer(''); setShowModelAnswer(false); setEvaluationResult(null);
    } else { setIsFinished(true); }
  };

  if (isFinished) {
    const mcqQuestions = questions.filter(q => q.type === 'Multiple Choice');
    const totalMcqs = mcqQuestions.length;
    const mcqEarned = score * 100;
    const descEarned = Object.values(descriptiveScores).reduce((a, b) => a + b, 0);
    const totalPossible = questions.length * 100;
    const percentage = Math.round(((mcqEarned + descEarned) / totalPossible) * 100);
    const needsReattempt = percentage < 75;

    return (
      <div style={{ background: T.cardBg, border: `1px solid ${T.line}`, borderRadius: 20, boxShadow: cardShadow, textAlign: 'center', padding: '4rem 2rem', animation: 'sp-fadein 0.3s ease both' }}>
        <div style={{ height: 3, background: `linear-gradient(90deg, ${T.green}, #FCD34D, transparent)`, borderRadius: '20px 20px 0 0', position: 'relative', top: -64, marginBottom: -61, marginLeft: -32, marginRight: -32 }} />
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 20 }}>
          {questions.map((_, i) => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: i <= currentIndex ? T.green : T.line }} />
          ))}
        </div>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: percentage >= 75 ? T.gLight : T.redBg, border: `2px solid ${percentage >= 75 ? T.gRing : T.redLine}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 28 }}>
          {percentage >= 75 ? '🏆' : '💪'}
        </div>
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 11, color: percentage >= 75 ? T.green : T.hint, textTransform: 'uppercase', letterSpacing: '0.9px', marginBottom: 8 }}>
          {percentage >= 75 ? 'Mastery Achieved' : 'Practice Complete'}
        </div>
        <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 26, color: T.ink, marginBottom: 8 }}>
          {percentage >= 75 ? 'Excellent Work!' : 'Great Effort!'}
        </h2>
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 40, color: percentage >= 75 ? T.green : '#D97706', letterSpacing: '-1px', marginBottom: 8 }}>{percentage}%</div>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: T.sub, marginBottom: 28 }}>
          {totalMcqs > 0
            ? `${score} of ${totalMcqs} MCQs correct · ${questions.length - totalMcqs} descriptive completed`
            : `All ${questions.length} descriptive questions completed`}
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={onBack} style={{ padding: '12px 22px', borderRadius: 12, background: T.zoneBg, border: `1px solid ${T.line}`, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 13.5, color: T.ink }}>Back to Feedback</button>
          {needsReattempt && (
            <button onClick={onReattempt} style={{ padding: '12px 22px', borderRadius: 12, background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: 'white', border: 'none', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 13.5, boxShadow: `0 4px 14px ${T.gGlow}` }}>Reattempt with New Questions</button>
          )}
          <button onClick={() => window.location.reload()} style={{ padding: '12px 22px', borderRadius: 12, background: T.gLight, border: `1px solid ${T.gRing}`, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 13.5, color: T.green }}>Analyse New Sheet</button>
        </div>
      </div>
    );
  }

  const handleExitClick = () => {
    if (!isFinished) {
      setShowExitConfirm(true);
    } else {
      onBack();
    }
  };

  const handleConfirmExit = () => {
    setShowExitConfirm(false);
    onBack();
  };

  const handleCancelExit = () => {
    setShowExitConfirm(false);
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', fontFamily: "'DM Sans', sans-serif", animation: 'sp-fadein 0.3s ease both' }}>
      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, animation: 'sp-fadein 0.2s ease'
        }}>
          <div style={{
            background: T.cardBg, borderRadius: 20, padding: '32px',
            maxWidth: 400, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            animation: 'sp-fadein 0.3s ease'
          }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: T.amberBg, border: `2px solid ${T.amberLine}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px', fontSize: 28
              }}>⚠️</div>
              <h3 style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800,
                fontSize: 20, color: T.ink, marginBottom: 8
              }}>
                Exit Practice?
              </h3>
              <p style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                color: T.sub, lineHeight: 1.6
              }}>
                Your progress will be lost. Are you sure you want to exit?
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={handleCancelExit}
                style={{
                  flex: 1, padding: '12px', borderRadius: 12,
                  background: T.zoneBg, border: `1px solid ${T.line}`,
                  color: T.ink, fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontWeight: 700, fontSize: 14, cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = T.line}
                onMouseLeave={e => e.currentTarget.style.background = T.zoneBg}
              >
                Continue Practice
              </button>
              <button
                onClick={handleConfirmExit}
                style={{
                  flex: 1, padding: '12px', borderRadius: 12,
                  background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                  border: 'none', color: 'white',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontWeight: 700, fontSize: 14, cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(239,68,68,0.3)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #DC2626, #B91C1C)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #EF4444, #DC2626)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <button onClick={handleExitClick} style={{ background: 'none', border: 'none', color: T.gMid, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: 13, display: 'flex', alignItems: 'center', gap: 5, padding: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Exit Practice
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {questions.map((_, i) => (
              <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: i < currentIndex ? T.green : i === currentIndex ? T.gMid : T.line, transition: 'background 0.2s' }} />
            ))}
          </div>
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 12, color: T.hint }}>{currentIndex + 1}/{questions.length}</span>
        </div>
      </div>

      {/* Question card */}
      <div style={{ background: T.cardBg, border: `1px solid ${T.line}`, borderRadius: 20, overflow: 'hidden', boxShadow: cardShadow }}>
        <div style={{ height: 3, background: `linear-gradient(90deg, ${T.green}, #FCD34D, transparent)` }} />
        <div style={{ padding: 28 }}>
          <span style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 11,
            background: T.gLight, border: `1px solid ${T.gRing}`, color: T.green,
            borderRadius: 99, padding: '3px 10px', display: 'inline-block', marginBottom: 16,
          }}>{currentQuestion.topic}</span>

          <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 18, color: T.ink, lineHeight: 1.45, marginBottom: 24 }}>
            {currentQuestion.question}
          </h3>

          {/* MCQ options */}
          {currentQuestion.type === 'Multiple Choice' ? (
            <div style={{ display: 'grid', gap: 10 }}>
              {currentQuestion.options.map((option, i) => {
                const isSelected = selectedOption === i;
                const isCorrectOpt = i === currentQuestion.correctOption;
                let bg = T.zoneBg, border = T.line, color = T.ink;
                if (selectedOption !== null) {
                  if (isCorrectOpt) { bg = T.gLight; border = T.gRing; color = T.green; }
                  else if (isSelected) { bg = T.redBg; border = T.redLine; color = T.red; }
                }
                return (
                  <button key={i} onClick={() => handleOptionClick(i)} style={{
                    padding: '14px 16px', borderRadius: 12, border: `1.5px solid ${border}`,
                    background: bg, textAlign: 'left', cursor: selectedOption === null ? 'pointer' : 'default',
                    transition: 'all 0.18s ease', fontFamily: "'DM Sans', sans-serif", fontSize: 14, color,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}
                    onMouseEnter={e => { if (selectedOption === null) { e.currentTarget.style.borderColor = T.gRing; e.currentTarget.style.background = T.gLight; } }}
                    onMouseLeave={e => { if (selectedOption === null) { e.currentTarget.style.borderColor = T.line; e.currentTarget.style.background = T.zoneBg; } }}
                  >
                    <span><span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, marginRight: 8, opacity: 0.5 }}>{String.fromCharCode(65 + i)}.</span>{option}</span>
                    {selectedOption !== null && isCorrectOpt && <span style={{ fontSize: 12, fontWeight: 700, color: T.green }}>✓ Correct</span>}
                    {selectedOption !== null && isSelected && !isCorrectOpt && <span style={{ fontSize: 12, fontWeight: 700, color: T.red }}>✗ Wrong</span>}
                  </button>
                );
              })}
            </div>
          ) : (
            /* Text answer */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <textarea
                value={textAnswer}
                onChange={e => !showModelAnswer && setTextAnswer(e.target.value)}
                placeholder={currentQuestion.type === 'Short Answer' ? 'Type your short answer here…' : 'Type your detailed answer here…'}
                disabled={showModelAnswer}
                style={{
                  width: '100%', minHeight: currentQuestion.type === 'Short Answer' ? 100 : 200,
                  padding: '14px', borderRadius: 12, border: `1.5px solid ${T.line}`,
                  background: T.zoneBg, fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                  color: T.ink, resize: 'vertical', outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = T.gMid}
                onBlur={e => e.target.style.borderColor = T.line}
              />
              {!showModelAnswer && (
                <button onClick={handleSubmitText} disabled={!textAnswer.trim() || isEvaluating} style={{
                  padding: '13px 20px', borderRadius: 12, border: 'none', cursor: !textAnswer.trim() || isEvaluating ? 'not-allowed' : 'pointer',
                  background: !textAnswer.trim() || isEvaluating ? '#EFEFEB' : 'linear-gradient(135deg, #F59E0B, #D97706)',
                  color: !textAnswer.trim() || isEvaluating ? T.hint : 'white',
                  fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: !textAnswer.trim() || isEvaluating ? 'none' : `0 4px 14px ${T.gGlow}`,
                  transition: 'all 0.22s cubic-bezier(0.4,0,0.2,1)',
                }}>
                  {isEvaluating ? (
                    <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'sp-spin 0.8s linear infinite' }} /> Analysing Answer…</>
                  ) : 'Submit Answer for Analysis'}
                </button>
              )}
            </div>
          )}

          {/* Result area */}
          {(selectedOption !== null || showModelAnswer) && (
            <div style={{ marginTop: 24, animation: 'sp-fadein 0.3s ease' }}>
              {currentQuestion.type === 'Multiple Choice' ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: isCorrect ? T.gLight : T.redBg, border: `1px solid ${isCorrect ? T.gRing : T.redLine}`, borderRadius: 12 }}>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: isCorrect ? T.green : T.red, fontWeight: 500 }}>
                    {isCorrect ? '✓ Correct! Well done.' : `✗ The correct answer is Option ${String.fromCharCode(65 + currentQuestion.correctOption)}.`}
                  </span>
                  <button onClick={handleNext} style={{ padding: '10px 22px', borderRadius: 99, background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: 'white', border: 'none', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 13, boxShadow: `0 3px 10px ${T.gGlow}` }}>
                    {currentIndex < questions.length - 1 ? 'Next →' : 'Finish'}
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 14 }}>
                  {evaluationResult && (
                    <div style={{ background: T.cardBg, padding: '18px 20px', borderRadius: 14, border: `1px solid ${T.gRing}`, animation: 'sp-fadein 0.4s ease' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 11, color: T.green, textTransform: 'uppercase', letterSpacing: '0.7px' }}>AI Analysis</span>
                        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 13, background: T.gLight, border: `1px solid ${T.gRing}`, color: T.green, borderRadius: 99, padding: '3px 10px' }}>
                          Score: {evaluationResult?.score || 0}%
                        </span>
                      </div>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: T.ink, lineHeight: 1.6, marginBottom: 12 }}>{evaluationResult.feedback}</p>
                      {evaluationResult.analysis && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                          <div style={{ background: T.gLight, padding: '12px 14px', borderRadius: 10, border: `1px solid ${T.gRing}` }}>
                            <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 10, color: T.green, textTransform: 'uppercase', marginBottom: 6 }}>Strengths</p>
                            <ul style={{ paddingLeft: '1.1rem', margin: 0, fontSize: 13, color: T.ink }}>
                              {(evaluationResult.analysis.strengths || []).map((s, i) => <li key={i} style={{ lineHeight: 1.5 }}>{s}</li>)}
                            </ul>
                          </div>
                          <div style={{ background: T.redBg, padding: '12px 14px', borderRadius: 10, border: `1px solid ${T.redLine}` }}>
                            <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 10, color: T.red, textTransform: 'uppercase', marginBottom: 6 }}>Missing Bits</p>
                            <ul style={{ paddingLeft: '1.1rem', margin: 0, fontSize: 13, color: T.ink }}>
                              {(evaluationResult.analysis.improvements || []).map((s, i) => <li key={i} style={{ lineHeight: 1.5 }}>{s}</li>)}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <div style={{ background: T.gLight, padding: '16px 18px', borderRadius: 12, border: `1px solid ${T.gRing}` }}>
                    <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 11, color: T.green, textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 8 }}>Model Answer</p>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, lineHeight: 1.65, color: T.ink, margin: 0 }}>{currentQuestion.modelAnswer}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <button onClick={handleNext} style={{ padding: '12px 24px', borderRadius: 12, background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: 'white', border: 'none', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 14, boxShadow: `0 4px 14px ${T.gGlow}` }}>
                      {currentIndex < questions.length - 1 ? 'Next Question →' : 'Finish Practice'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes sp-spin { to { transform: rotate(360deg); } }` }} />
    </div>
  );
}

"use client";
import { useState } from 'react';

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

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

    const questions = practiceSet?.questions || [];
    const currentQuestion = questions[currentIndex];

    if (!currentQuestion) {
        return (
            <div className="card glass" style={{ textAlign: 'center', padding: '4rem' }}>
                <h2>No questions available</h2>
                <p>We couldn&apos;t generate practice questions this time. Please try again.</p>
                <button className="btn-primary" onClick={onBack}>Back</button>
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
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: currentQuestion.question,
                    studentAnswer: textAnswer,
                    modelAnswer: currentQuestion.modelAnswer
                }),
            });
            const data = await response.json();
            setEvaluationResult(data);
            setDescriptiveScores(prev => ({ ...prev, [currentIndex]: data.score }));
            setShowModelAnswer(true);
        } catch (error) {
            console.error("Error evaluating answer:", error);
            // Fallback to just showing model answer if evaluation fails
            setShowModelAnswer(true);
        } finally {
            setIsEvaluating(false);
        }
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(i => i + 1);
            setSelectedOption(null);
            setIsCorrect(null);
            setTextAnswer('');
            setShowModelAnswer(false);
            setEvaluationResult(null);
        } else {
            setIsFinished(true);
        }
    };

    if (isFinished) {
        const mcqQuestions = questions.filter(q => q.type === "Multiple Choice");
        const totalMcqs = mcqQuestions.length;
        const totalDesc = questions.length - totalMcqs;

        const mcqEarned = score * 100;
        const descEarned = Object.values(descriptiveScores).reduce((a, b) => a + b, 0);

        const totalPossible = questions.length * 100;
        const totalEarned = mcqEarned + descEarned;
        const percentage = Math.round((totalEarned / totalPossible) * 100);

        const needsReattempt = percentage < 75;

        return (
            <div className="card glass" style={{ textAlign: 'center', padding: '4rem', animation: 'fadeIn 0.5s ease' }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    {questions.map((_, i) => (
                        <div key={i} style={{
                            width: '10px', height: '10px', borderRadius: '50%',
                            background: i < currentIndex + 1 ? 'var(--primary)' : 'var(--border)',
                            opacity: 0.6
                        }}></div>
                    ))}
                </div>
                <div style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: 700, opacity: 0.6 }}>
                    {percentage >= 75 ? 'EXCELLENT' : 'PRACTICE COMPLETE'}
                </div>
                <h2 style={{ marginBottom: '1rem' }}>{percentage >= 75 ? 'Mastery Achieved!' : 'Great Effort!'}</h2>
                <p style={{ opacity: 0.7, marginBottom: '2rem' }}>
                    {totalMcqs > 0 ? (
                        `You scored ${score} out of ${totalMcqs} MCQs (${Math.round(percentage)}%) and completed ${questions.length - totalMcqs} descriptive questions.`
                    ) : (
                        `You've completed all ${questions.length} descriptive practice questions!`
                    )}
                </p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button className="btn-primary" onClick={onBack}>
                        Back to Feedback
                    </button>
                    {needsReattempt && (
                        <button className="btn-primary" style={{ backgroundColor: 'var(--accent)' }} onClick={onReattempt}>
                            Reattempt with New Questions
                        </button>
                    )}
                    <button className="btn-primary" style={{ backgroundColor: 'var(--secondary)' }} onClick={() => window.location.reload()}>
                        Analyze New Sheet
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', animation: 'fadeIn 0.5s ease' }}>
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}>
                    Exit Practice
                </button>
                <div style={{ fontSize: '0.9rem', opacity: 0.6 }}>
                    Question {currentIndex + 1} of {questions.length}
                </div>
            </header>

            <div className="card glass" style={{ padding: '2rem' }}>
                <div style={{
                    display: 'inline-block', padding: '0.25rem 0.75rem', borderRadius: '20px',
                    background: 'var(--primary-light)', color: 'var(--primary)',
                    fontSize: '0.8rem', fontWeight: 700, marginBottom: '1.5rem'
                }}>
                    {currentQuestion.topic}
                </div>

                <h3 style={{ fontSize: '1.5rem', marginBottom: '2.5rem', lineHeight: '1.4' }}>
                    {currentQuestion.question}
                </h3>

                <div style={{ display: 'grid', gap: '1rem' }}>
                    {currentQuestion.type === "Multiple Choice" ? (
                        currentQuestion.options.map((option, i) => {
                            const isSelected = selectedOption === i;
                            const isCorrectOption = i === currentQuestion.correctOption;

                            let borderColor = 'var(--border)';
                            let background = 'var(--card)';
                            let textColor = 'inherit';

                            if (selectedOption !== null) {
                                if (isCorrectOption) {
                                    borderColor = 'var(--primary)';
                                    background = 'var(--primary-light)';
                                } else if (isSelected && !isCorrect) {
                                    borderColor = 'hsl(0, 100%, 65%)';
                                    background = 'hsl(0, 100%, 98%)';
                                    textColor = 'hsl(0, 100%, 40%)';
                                }
                            }

                            return (
                                <button
                                    key={i}
                                    onClick={() => handleOptionClick(i)}
                                    style={{
                                        padding: '1.25rem',
                                        borderRadius: '12px',
                                        border: '2px solid',
                                        borderColor,
                                        background,
                                        textAlign: 'left',
                                        cursor: selectedOption === null ? 'pointer' : 'default',
                                        transition: 'all 0.2s ease',
                                        fontSize: '1rem',
                                        color: textColor,
                                        position: 'relative'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>{option}</span>
                                        {selectedOption !== null && (
                                            <span>
                                                {isCorrectOption ? 'Correct' : (isSelected ? 'Incorrect' : '')}
                                            </span>
                                        )}
                                    </div>
                                </button>
                            );
                        })
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <textarea
                                value={textAnswer}
                                onChange={(e) => !showModelAnswer && setTextAnswer(e.target.value)}
                                placeholder={currentQuestion.type === "Short Answer" ? "Type your short answer here..." : "Type your detailed answer here..."}
                                disabled={showModelAnswer}
                                style={{
                                    width: '100%',
                                    minHeight: currentQuestion.type === "Short Answer" ? '100px' : '200px',
                                    padding: '1.25rem',
                                    borderRadius: '12px',
                                    border: '1px solid var(--border)',
                                    background: 'var(--background)',
                                    fontSize: '1rem',
                                    fontFamily: 'inherit',
                                    resize: 'vertical'
                                }}
                            />

                            {!showModelAnswer && (
                                <button
                                    className="btn-primary"
                                    onClick={handleSubmitText}
                                    disabled={!textAnswer.trim() || isEvaluating}
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                >
                                    {isEvaluating ? (
                                        <>
                                            <span className="spinner"></span>
                                            Analyzing Answer...
                                        </>
                                    ) : (
                                        'Submit Answer for Analysis'
                                    )}
                                </button>
                            )}
                        </div>
                    )}
                </div>



                {(selectedOption !== null || showModelAnswer) && (
                    <div style={{ marginTop: '2.5rem', animation: 'fadeIn 0.3s ease' }}>
                        {currentQuestion.type === "Multiple Choice" ? (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontSize: '0.9rem', color: isCorrect ? 'var(--primary)' : 'hsl(0, 100%, 40%)', fontWeight: 600 }}>
                                    {isCorrect ? 'Correct! Well done.' : `Not quite. The correct answer is Option ${String.fromCharCode(65 + currentQuestion.correctOption)}.`}
                                </div>
                                <button className="btn-primary" onClick={handleNext} style={{ padding: '0.75rem 2.5rem' }}>
                                    {currentIndex < questions.length - 1 ? 'Next Question' : 'Finish Practice'}
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gap: '1.5rem' }}>
                                {evaluationResult && (
                                    <div style={{ background: 'var(--card)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--primary)', animation: 'fadeIn 0.4s ease' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase' }}>AI Analysis</p>
                                            <div style={{
                                                padding: '0.25rem 0.75rem', borderRadius: '20px',
                                                background: 'var(--primary)', color: '#fff', fontSize: '0.85rem', fontWeight: 700
                                            }}>
                                                Score: {evaluationResult?.score || 0}%
                                            </div>
                                        </div>

                                        <p style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--foreground)' }}>
                                            {evaluationResult.feedback}
                                        </p>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                            <div style={{ background: 'hsla(150, 100%, 30%, 0.05)', padding: '1rem', borderRadius: '8px' }}>
                                                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'green', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Strengths</p>
                                                <ul style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '0.9rem' }}>
                                                    {evaluationResult.analysis.strengths.map((s, i) => <li key={i}>{s}</li>)}
                                                </ul>
                                            </div>
                                            <div style={{ background: 'hsla(0, 100%, 50%, 0.05)', padding: '1rem', borderRadius: '8px' }}>
                                                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'red', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Missing Bits</p>
                                                <ul style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '0.9rem' }}>
                                                    {evaluationResult.analysis.improvements.map((s, i) => <li key={i}>{s}</li>)}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div style={{ background: 'var(--primary-light)', padding: '1.5rem', borderRadius: '12px', border: '1px solid hsla(200, 100%, 50%, 0.2)' }}>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Model Answer for Reference</p>
                                    <p style={{ fontSize: '1rem', lineHeight: '1.6', opacity: 0.9 }}>{currentQuestion.modelAnswer}</p>
                                </div>

                                <div style={{ textAlign: 'right' }}>
                                    <button className="btn-primary" onClick={handleNext} style={{ padding: '0.75rem 2.5rem' }}>
                                        {currentIndex < questions.length - 1 ? 'Next Question' : 'Finish Practice'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <style jsx>{`
                .spinner {
                    width: 18px;
                    height: 18px;
                    border: 2px solid rgba(255,255,255,0.3);
                    border-top-color: #fff;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}

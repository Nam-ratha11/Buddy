"use client";
import { useState } from 'react';

export default function PracticeArea({ practiceSet, onBack }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);
    const [isCorrect, setIsCorrect] = useState(null);
    const [score, setScore] = useState(0);
    const [isFinished, setIsFinished] = useState(false);

    const currentQuestion = practiceSet.questions[currentIndex];

    const handleOptionClick = (index) => {
        if (selectedOption !== null) return;

        setSelectedOption(index);
        const correct = index === currentQuestion.correctOption;
        setIsCorrect(correct);
        if (correct) setScore(s => s + 1);
    };

    const handleNext = () => {
        if (currentIndex < practiceSet.questions.length - 1) {
            setCurrentIndex(i => i + 1);
            setSelectedOption(null);
            setIsCorrect(null);
        } else {
            setIsFinished(true);
        }
    };

    if (isFinished) {
        return (
            <div className="card glass" style={{ textAlign: 'center', padding: '4rem', animation: 'fadeIn 0.5s ease' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
                <h2 style={{ marginBottom: '1rem' }}>Practice Complete!</h2>
                <p style={{ opacity: 0.7, marginBottom: '2rem' }}>
                    You scored {score} out of {practiceSet.questions.length}.
                </p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <button className="btn-primary" onClick={onBack}>
                        Back to Feedback
                    </button>
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
                    ← Exit Practice
                </button>
                <div style={{ fontSize: '0.9rem', opacity: 0.6 }}>
                    Question {currentIndex + 1} of {practiceSet.questions.length}
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
                    {currentQuestion.options.map((option, i) => (
                        <button
                            key={i}
                            onClick={() => handleOptionClick(i)}
                            style={{
                                padding: '1.25rem',
                                borderRadius: '12px',
                                border: '2px solid',
                                borderColor: selectedOption === i
                                    ? (isCorrect ? 'var(--primary)' : 'hsl(0, 100%, 65%)')
                                    : 'var(--border)',
                                background: selectedOption === i
                                    ? (isCorrect ? 'var(--primary-light)' : 'hsl(0, 100%, 98%)')
                                    : 'var(--card)',
                                textAlign: 'left',
                                cursor: selectedOption === null ? 'pointer' : 'default',
                                transition: 'all 0.2s ease',
                                fontSize: '1rem',
                                color: selectedOption === i && !isCorrect ? 'hsl(0, 100%, 40%)' : 'inherit'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>{option}</span>
                                {selectedOption === i && (
                                    <span>{isCorrect ? '✅' : '❌'}</span>
                                )}
                            </div>
                        </button>
                    ))}
                </div>

                {selectedOption !== null && (
                    <div style={{ marginTop: '2.5rem', textAlign: 'right', animation: 'fadeIn 0.3s ease' }}>
                        <button className="btn-primary" onClick={handleNext} style={{ padding: '0.75rem 2.5rem' }}>
                            {currentIndex < practiceSet.questions.length - 1 ? 'Next Question' : 'Finish Practice'}
                        </button>
                    </div>
                )}
            </div>

            <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
        </div>
    );
}

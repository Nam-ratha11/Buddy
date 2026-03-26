"use client";
import { useState, useEffect } from 'react';

const T = {
  pageBg: 'var(--page)', cardBg: 'var(--card)', zoneBg: 'var(--zone)',
  green: 'var(--g)', gMid: 'var(--gMid)', gLight: 'var(--gLight)', gRing: 'var(--gRing)',
  gGlow: 'var(--gGlow)', ink: 'var(--ink)', sub: 'var(--sub)',
  hint: 'var(--hint)', line: 'var(--line)', lineHi: 'var(--lineHi)',
  red: 'var(--red)', redBg: 'var(--redBg)', redLine: 'var(--redLine)',
};

export default function GameScreen({ 
  question, 
  timeLeft, 
  streak, 
  currentScore,
  opponentScore,
  onAnswer,
  selectedOption,
  isCorrect,
  questionNumber,
  totalQuestions,
  opponentAnswered = false
}) {
  const [startTime] = useState(Date.now());

  const handleOptionClick = (index) => {
    if (selectedOption !== null) return;
    const responseTime = (Date.now() - startTime) / 1000;
    onAnswer(index, responseTime);
  };

  const timerPercentage = (timeLeft / 10) * 100;

  return (
    <div style={{ 
      maxWidth: 900, 
      margin: '0 auto',
      animation: 'sp-fadein 0.3s ease'
    }}>
      {/* Top Bar: Scores + Streak + Timer */}
      <div style={{ 
        background: T.cardBg, 
        border: `1px solid ${T.line}`, 
        borderRadius: 16, 
        padding: '16px 20px', 
        marginBottom: 16,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        {/* Scores */}
        <div style={{ display: 'flex', gap: 20 }}>
          <div>
            <p style={{ 
              fontFamily: "'Plus Jakarta Sans', sans-serif", 
              fontSize: 11, 
              color: T.hint, 
              fontWeight: 600, 
              textTransform: 'uppercase',
              marginBottom: 4
            }}>
              You
            </p>
            <p style={{ 
              fontFamily: "'Plus Jakarta Sans', sans-serif", 
              fontSize: 20, 
              fontWeight: 800, 
              color: T.green 
            }}>
              {currentScore}
            </p>
          </div>
          <div style={{ 
            width: 1, 
            background: T.line, 
            margin: '4px 0' 
          }} />
          <div>
            <p style={{ 
              fontFamily: "'Plus Jakarta Sans', sans-serif", 
              fontSize: 11, 
              color: T.hint, 
              fontWeight: 600, 
              textTransform: 'uppercase',
              marginBottom: 4
            }}>
              Opponent
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <p style={{ 
                fontFamily: "'Plus Jakarta Sans', sans-serif", 
                fontSize: 20, 
                fontWeight: 800, 
                color: T.ink 
              }}>
                {opponentScore}
              </p>
              {opponentAnswered && selectedOption === null && (
                <span style={{ 
                  fontSize: 12, 
                  color: T.green,
                  animation: 'sp-pulse 1s ease infinite'
                }}>
                  ✓
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Streak */}
        {streak > 0 && (
          <div style={{ 
            background: T.gLight, 
            border: `1px solid ${T.gRing}`, 
            borderRadius: 8, 
            padding: '6px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            <span style={{ fontSize: 16 }}>🔥</span>
            <span style={{ 
              fontFamily: "'Plus Jakarta Sans', sans-serif", 
              fontSize: 14, 
              fontWeight: 700, 
              color: T.green 
            }}>
              {streak} Streak
            </span>
          </div>
        )}

        {/* Question Progress */}
        <div style={{ 
          fontFamily: "'Plus Jakarta Sans', sans-serif", 
          fontSize: 13, 
          fontWeight: 600, 
          color: T.sub 
        }}>
          {questionNumber}/{totalQuestions}
        </div>
      </div>

      {/* Timer Bar */}
      <div style={{ 
        height: 8, 
        background: T.zoneBg, 
        borderRadius: 99, 
        overflow: 'hidden', 
        marginBottom: 20,
        border: `1px solid ${T.line}`
      }}>
        <div style={{ 
          height: '100%', 
          width: `${timerPercentage}%`, 
          background: timerPercentage > 50 
            ? 'linear-gradient(90deg, #10B981, #34D399)' 
            : timerPercentage > 25 
              ? 'linear-gradient(90deg, #F59E0B, #FBBF24)' 
              : 'linear-gradient(90deg, #EF4444, #F87171)',
          transition: 'width 0.1s linear',
          borderRadius: 99
        }} />
      </div>

      {/* Question Card */}
      <div style={{ 
        background: T.cardBg, 
        border: `1px solid ${T.line}`, 
        borderRadius: 20, 
        overflow: 'hidden',
        boxShadow: '0 0 0 1px rgba(0,0,0,0.04), 0 2px 4px rgba(0,0,0,0.04), 0 12px 40px rgba(0,0,0,0.07)'
      }}>
        <div style={{ 
          height: 3, 
          background: 'linear-gradient(90deg, #F59E0B, #FBBF24, transparent)' 
        }} />
        
        <div style={{ padding: 28 }}>
          <span style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif", 
            fontWeight: 700, 
            fontSize: 11,
            background: T.gLight, 
            border: `1px solid ${T.gRing}`, 
            color: T.green,
            borderRadius: 99, 
            padding: '3px 10px', 
            display: 'inline-block', 
            marginBottom: 16,
          }}>
            {question.topic}
          </span>

          <h3 style={{ 
            fontFamily: "'Plus Jakarta Sans', sans-serif", 
            fontWeight: 700, 
            fontSize: 20, 
            color: T.ink, 
            lineHeight: 1.45, 
            marginBottom: 28 
          }}>
            {question.question}
          </h3>

          {/* Options */}
          <div style={{ display: 'grid', gap: 12 }}>
            {question.options.map((option, i) => {
              const isSelected = selectedOption === i;
              const isCorrectOpt = i === question.correctOption;
              let bg = T.zoneBg, border = T.line, color = T.ink;
              
              if (selectedOption !== null) {
                if (isCorrectOpt) { 
                  bg = T.gLight; 
                  border = T.gRing; 
                  color = T.green; 
                }
                else if (isSelected) { 
                  bg = T.redBg; 
                  border = T.redLine; 
                  color = T.red; 
                }
              }

              return (
                <button 
                  key={i} 
                  onClick={() => handleOptionClick(i)} 
                  style={{
                    padding: '16px 18px', 
                    borderRadius: 12, 
                    border: `2px solid ${border}`,
                    background: bg, 
                    textAlign: 'left', 
                    cursor: selectedOption === null ? 'pointer' : 'default',
                    transition: 'all 0.2s ease', 
                    fontFamily: "'DM Sans', sans-serif", 
                    fontSize: 15, 
                    color,
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    fontWeight: 500
                  }}
                  onMouseEnter={e => { 
                    if (selectedOption === null) { 
                      e.currentTarget.style.borderColor = T.gRing; 
                      e.currentTarget.style.background = T.gLight;
                      e.currentTarget.style.transform = 'translateX(4px)';
                    } 
                  }}
                  onMouseLeave={e => { 
                    if (selectedOption === null) { 
                      e.currentTarget.style.borderColor = T.line; 
                      e.currentTarget.style.background = T.zoneBg;
                      e.currentTarget.style.transform = 'translateX(0)';
                    } 
                  }}
                >
                  <span>
                    <span style={{ 
                      fontFamily: "'Plus Jakarta Sans', sans-serif", 
                      fontWeight: 700, 
                      marginRight: 10, 
                      opacity: 0.6,
                      fontSize: 14
                    }}>
                      {String.fromCharCode(65 + i)}.
                    </span>
                    {option}
                  </span>
                  {selectedOption !== null && isCorrectOpt && (
                    <span style={{ 
                      fontSize: 13, 
                      fontWeight: 700, 
                      color: T.green 
                    }}>
                      ✓
                    </span>
                  )}
                  {selectedOption !== null && isSelected && !isCorrectOpt && (
                    <span style={{ 
                      fontSize: 13, 
                      fontWeight: 700, 
                      color: T.red 
                    }}>
                      ✗
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes sp-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}} />
    </div>
  );
}

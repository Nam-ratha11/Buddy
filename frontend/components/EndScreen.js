"use client";

const T = {
  pageBg: 'var(--page)', cardBg: 'var(--card)', zoneBg: 'var(--zone)',
  green: 'var(--g)', gMid: 'var(--gMid)', gLight: 'var(--gLight)', gRing: 'var(--gRing)',
  gGlow: 'var(--gGlow)', ink: 'var(--ink)', sub: 'var(--sub)',
  hint: 'var(--hint)', line: 'var(--line)', lineHi: 'var(--lineHi)',
  red: 'var(--red)', redBg: 'var(--redBg)', redLine: 'var(--redLine)',
};

export default function EndScreen({ players, onRematch, onExit }) {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const winner = sortedPlayers[0];
  const currentPlayer = players.find(p => p.isCurrentUser);
  const isWinner = currentPlayer?.id === winner.id;
  const isTie = sortedPlayers[0].score === sortedPlayers[1]?.score;

  return (
    <div style={{ 
      maxWidth: 600, 
      margin: '0 auto',
      animation: 'sp-fadein 0.4s ease'
    }}>
      <div style={{ 
        background: T.cardBg, 
        border: `2px solid ${isWinner && !isTie ? T.gRing : T.line}`, 
        borderRadius: 20, 
        padding: '40px',
        textAlign: 'center',
        boxShadow: '0 0 0 1px rgba(0,0,0,0.04), 0 2px 4px rgba(0,0,0,0.04), 0 20px 60px rgba(0,0,0,0.1)'
      }}>
        {/* Celebration Icon */}
        <div style={{ 
          fontSize: 80, 
          marginBottom: 16,
          animation: isTie ? 'sp-pulse 2s ease infinite' : isWinner ? 'sp-bounce 1s ease' : 'none'
        }}>
          {isTie ? '🤝' : isWinner ? '🏆' : '💪'}
        </div>

        {/* Result Title */}
        <div style={{ 
          fontFamily: "'Plus Jakarta Sans', sans-serif", 
          fontWeight: 700, 
          fontSize: 12, 
          color: isTie ? T.hint : isWinner ? T.green : T.sub, 
          textTransform: 'uppercase', 
          letterSpacing: '1px', 
          marginBottom: 8 
        }}>
          {isTie ? 'It\'s a Tie!' : isWinner ? 'Victory!' : 'Good Effort!'}
        </div>

        <h2 style={{ 
          fontFamily: "'Plus Jakarta Sans', sans-serif", 
          fontWeight: 800, 
          fontSize: 32, 
          color: T.ink, 
          marginBottom: 8,
          lineHeight: 1.2
        }}>
          {isTie ? 'Evenly Matched!' : isWinner ? 'You Won!' : `${winner.name} Wins!`}
        </h2>

        <p style={{ 
          fontFamily: "'DM Sans', sans-serif", 
          fontSize: 15, 
          color: T.sub, 
          marginBottom: 32 
        }}>
          {isTie 
            ? 'Both players scored the same!' 
            : isWinner 
              ? 'Excellent performance in this battle!' 
              : 'Keep practicing to improve your score!'}
        </p>

        {/* Final Scoreboard */}
        <div style={{ 
          background: T.zoneBg, 
          border: `1px solid ${T.line}`, 
          borderRadius: 16, 
          padding: '24px', 
          marginBottom: 24
        }}>
          <p style={{ 
            fontFamily: "'Plus Jakarta Sans', sans-serif", 
            fontSize: 11, 
            color: T.hint, 
            fontWeight: 700, 
            textTransform: 'uppercase', 
            letterSpacing: '0.8px', 
            marginBottom: 16 
          }}>
            Final Scores
          </p>

          <div style={{ display: 'grid', gap: 12 }}>
            {sortedPlayers.map((player, idx) => (
              <div 
                key={player.id}
                style={{ 
                  background: player.isCurrentUser ? T.gLight : T.cardBg, 
                  border: `2px solid ${player.isCurrentUser ? T.gRing : T.line}`, 
                  borderRadius: 12, 
                  padding: '16px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 28 }}>
                    {idx === 0 && !isTie ? '👑' : '👤'}
                  </span>
                  <div style={{ textAlign: 'left' }}>
                    <p style={{ 
                      fontFamily: "'Plus Jakarta Sans', sans-serif", 
                      fontSize: 16, 
                      fontWeight: 700, 
                      color: T.ink,
                      marginBottom: 2
                    }}>
                      {player.name}
                      {player.isCurrentUser && (
                        <span style={{ 
                          fontSize: 11, 
                          color: T.green, 
                          marginLeft: 6,
                          fontWeight: 600
                        }}>
                          (You)
                        </span>
                      )}
                    </p>
                    <p style={{ 
                      fontFamily: "'DM Sans', sans-serif", 
                      fontSize: 12, 
                      color: T.sub 
                    }}>
                      Max Streak: {player.maxStreak || 0} 🔥
                    </p>
                  </div>
                </div>
                <div style={{ 
                  fontFamily: "'Plus Jakarta Sans', sans-serif", 
                  fontSize: 28, 
                  fontWeight: 800, 
                  color: idx === 0 && !isTie ? T.green : T.ink 
                }}>
                  {player.score}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Score Difference */}
        {!isTie && (
          <div style={{
            background: T.cardBg,
            border: `1px solid ${T.line}`,
            borderRadius: 12,
            padding: '12px 16px',
            marginBottom: 32,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 8
          }}>
            <span style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              color: T.sub
            }}>
              Victory margin:
            </span>
            <span style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 16,
              fontWeight: 700,
              color: T.green
            }}>
              {sortedPlayers[0].score - sortedPlayers[1].score} points
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={onRematch}
            style={{
              padding: '14px 28px',
              borderRadius: 12,
              border: 'none',
              background: 'linear-gradient(135deg, #F59E0B, #D97706)',
              color: 'white',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 700,
              fontSize: 15,
              cursor: 'pointer',
              boxShadow: `0 4px 14px ${T.gGlow}`,
              transition: 'transform 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            🔄 Rematch
          </button>
          <button
            onClick={onExit}
            style={{
              padding: '14px 28px',
              borderRadius: 12,
              border: `2px solid ${T.line}`,
              background: T.zoneBg,
              color: T.ink,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 700,
              fontSize: 15,
              cursor: 'pointer',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            Exit to Practice
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes sp-bounce {
          0%, 100% { transform: translateY(0); }
          25% { transform: translateY(-20px); }
          50% { transform: translateY(0); }
          75% { transform: translateY(-10px); }
        }
        @keyframes sp-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(0.95); }
        }
      `}} />
    </div>
  );
}

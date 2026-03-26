"use client";

const T = {
  pageBg: 'var(--page)', cardBg: 'var(--card)', zoneBg: 'var(--zone)',
  green: 'var(--g)', gMid: 'var(--gMid)', gLight: 'var(--gLight)', gRing: 'var(--gRing)',
  gGlow: 'var(--gGlow)', ink: 'var(--ink)', sub: 'var(--sub)',
  hint: 'var(--hint)', line: 'var(--line)', lineHi: 'var(--lineHi)',
};

export default function QuestionLeaderboard({ players, pointsEarned }) {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const currentPlayer = players.find(p => p.isCurrentUser);

  return (
    <div style={{ 
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      animation: 'sp-fadein 0.2s ease'
    }}>
      <div style={{ 
        background: T.cardBg, 
        border: `2px solid ${T.gRing}`, 
        borderRadius: 20, 
        padding: '32px 40px',
        maxWidth: 500,
        width: '90%',
        textAlign: 'center',
        animation: 'sp-slideup 0.3s ease',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>
          {currentPlayer?.pointsEarned > 0 ? '🎯' : '💭'}
        </div>
        
        <h3 style={{ 
          fontFamily: "'Plus Jakarta Sans', sans-serif", 
          fontWeight: 800, 
          fontSize: 22, 
          color: T.ink, 
          marginBottom: 8 
        }}>
          {currentPlayer?.pointsEarned > 0 ? 'Nice!' : 'Keep Going!'}
        </h3>

        {currentPlayer?.pointsEarned > 0 && (
          <p style={{ 
            fontFamily: "'Plus Jakarta Sans', sans-serif", 
            fontSize: 16, 
            fontWeight: 700, 
            color: T.green, 
            marginBottom: 24 
          }}>
            +{currentPlayer.pointsEarned} points
          </p>
        )}

        {/* Leaderboard */}
        <div style={{ 
          display: 'grid', 
          gap: 12, 
          marginTop: 20 
        }}>
          {sortedPlayers.map((player, idx) => (
            <div 
              key={player.id}
              style={{ 
                background: player.isCurrentUser ? T.gLight : T.zoneBg, 
                border: `2px solid ${player.isCurrentUser ? T.gRing : T.line}`, 
                borderRadius: 12, 
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'all 0.3s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ 
                  fontSize: 24,
                  width: 32,
                  textAlign: 'center'
                }}>
                  {idx === 0 ? '👑' : '👤'}
                </span>
                <div>
                  <p style={{ 
                    fontFamily: "'Plus Jakarta Sans', sans-serif", 
                    fontSize: 15, 
                    fontWeight: 700, 
                    color: T.ink 
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
                  {player.pointsEarned > 0 && (
                    <p style={{ 
                      fontFamily: "'DM Sans', sans-serif", 
                      fontSize: 12, 
                      color: T.green,
                      fontWeight: 600
                    }}>
                      +{player.pointsEarned} pts
                    </p>
                  )}
                </div>
              </div>
              <div style={{ 
                fontFamily: "'Plus Jakarta Sans', sans-serif", 
                fontSize: 20, 
                fontWeight: 800, 
                color: idx === 0 ? T.green : T.ink 
              }}>
                {player.score}
              </div>
            </div>
          ))}
        </div>

        <p style={{ 
          fontFamily: "'DM Sans', sans-serif", 
          fontSize: 12, 
          color: T.hint, 
          marginTop: 20,
          fontStyle: 'italic'
        }}>
          Next question loading...
        </p>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes sp-slideup {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}} />
    </div>
  );
}

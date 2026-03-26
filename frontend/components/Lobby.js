"use client";

const T = {
  pageBg: 'var(--page)', cardBg: 'var(--card)', zoneBg: 'var(--zone)',
  green: 'var(--g)', gMid: 'var(--gMid)', gLight: 'var(--gLight)', gRing: 'var(--gRing)',
  gGlow: 'var(--gGlow)', ink: 'var(--ink)', sub: 'var(--sub)',
  hint: 'var(--hint)', line: 'var(--line)', lineHi: 'var(--lineHi)',
};

export default function Lobby({ players, topicInfo, isReady, onReady, onLeave }) {
  const currentPlayer = players.find(p => p.isCurrentUser);
  const opponent = players.find(p => !p.isCurrentUser);
  const allReady = players.every(p => p.ready);
  
  // Use server's ready state, not local isReady prop
  const myReadyState = currentPlayer?.ready || false;

  return (
    <div style={{ 
      background: T.cardBg, 
      border: `1px solid ${T.line}`, 
      borderRadius: 20, 
      padding: '32px',
      animation: 'sp-fadein 0.3s ease'
    }}>
      <button
        onClick={onLeave}
        style={{
          background: 'none',
          border: 'none',
          color: T.gMid,
          cursor: 'pointer',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 13,
          marginBottom: 20,
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 5
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
        Leave Room
      </button>

      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⚡</div>
        <h3 style={{ 
          fontFamily: "'Plus Jakarta Sans', sans-serif", 
          fontWeight: 700, 
          fontSize: 20, 
          color: T.ink, 
          marginBottom: 8 
        }}>
          Battle Lobby
        </h3>
        <p style={{ 
          fontFamily: "'DM Sans', sans-serif", 
          fontSize: 14, 
          color: T.sub 
        }}>
          {players.length < 2 ? 'Waiting for opponent to join...' : allReady ? '🚀 Starting battle...' : 'Both players in — click Ready when set!'}
        </p>
      </div>

      {/* Topic Display */}
      <div style={{ 
        background: T.gLight, 
        border: `2px solid ${T.gRing}`, 
        borderRadius: 12, 
        padding: '16px', 
        marginBottom: 24,
        textAlign: 'center'
      }}>
        <p style={{ 
          fontFamily: "'Plus Jakarta Sans', sans-serif", 
          fontSize: 11, 
          color: T.green, 
          fontWeight: 700, 
          textTransform: 'uppercase', 
          letterSpacing: '0.8px', 
          marginBottom: 6 
        }}>
          Battle Topic
        </p>
        <p style={{ 
          fontFamily: "'Plus Jakarta Sans', sans-serif", 
          fontSize: 18, 
          fontWeight: 700, 
          color: T.green 
        }}>
          {!topicInfo ? '⏳ Loading topic...' : topicInfo.mode === 'AUTO' ? '🎯 Auto (Weak Topics)' : `📚 ${topicInfo.topics?.[0] || 'Unknown'}`}
        </p>
      </div>

      {/* Players Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: 16, 
        marginBottom: 24 
      }}>
        {/* Current Player */}
        <div style={{ 
          background: currentPlayer?.ready ? T.gLight : T.zoneBg, 
          border: `2px solid ${currentPlayer?.ready ? T.gRing : T.line}`, 
          borderRadius: 12, 
          padding: '20px', 
          textAlign: 'center',
          transition: 'all 0.3s'
        }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>
            {currentPlayer?.ready ? '✅' : '👤'}
          </div>
          <p style={{ 
            fontFamily: "'Plus Jakarta Sans', sans-serif", 
            fontSize: 14, 
            fontWeight: 700, 
            color: T.ink, 
            marginBottom: 4 
          }}>
            {currentPlayer?.name || 'You'}
          </p>
          <p style={{ 
            fontFamily: "'DM Sans', sans-serif", 
            fontSize: 12, 
            color: currentPlayer?.ready ? T.green : T.hint,
            fontWeight: 600
          }}>
            {currentPlayer?.ready ? 'Ready!' : 'Not Ready'}
          </p>
        </div>

        {/* Opponent */}
        <div style={{ 
          background: opponent?.ready ? T.gLight : T.zoneBg, 
          border: `2px solid ${opponent?.ready ? T.gRing : T.line}`, 
          borderRadius: 12, 
          padding: '20px', 
          textAlign: 'center',
          transition: 'all 0.3s'
        }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>
            {opponent ? (opponent.ready ? '✅' : '👤') : '⏳'}
          </div>
          <p style={{ 
            fontFamily: "'Plus Jakarta Sans', sans-serif", 
            fontSize: 14, 
            fontWeight: 700, 
            color: T.ink, 
            marginBottom: 4 
          }}>
            {opponent?.name || 'Waiting...'}
          </p>
          <p style={{ 
            fontFamily: "'DM Sans', sans-serif", 
            fontSize: 12, 
            color: opponent?.ready ? T.green : T.hint,
            fontWeight: 600
          }}>
            {opponent ? (opponent.ready ? 'Ready!' : 'Not Ready') : 'Joining...'}
          </p>
        </div>
      </div>

      {/* Ready Button — show as long as we're in the lobby */}
      <button
        onClick={onReady}
        disabled={myReadyState}
        style={{
          width: '100%',
          padding: '16px',
          borderRadius: 12,
          border: 'none',
          background: myReadyState
            ? T.gLight
            : 'linear-gradient(135deg, #F59E0B, #D97706)',
          color: myReadyState ? T.green : 'white',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontWeight: 700,
          fontSize: 16,
          cursor: myReadyState ? 'default' : 'pointer',
          boxShadow: myReadyState ? 'none' : `0 4px 14px ${T.gGlow}`,
          transition: 'all 0.3s'
        }}
      >
        {myReadyState ? '✓ Ready! Waiting for opponent...' : '🎮 I\'m Ready!'}
      </button>

      {/* Starting Message */}
      {allReady && players.length === 2 && (
        <div style={{ 
          marginTop: 16, 
          textAlign: 'center',
          animation: 'sp-pulse 1s ease infinite'
        }}>
          <p style={{ 
            fontFamily: "'Plus Jakarta Sans', sans-serif", 
            fontSize: 14, 
            fontWeight: 700, 
            color: T.green 
          }}>
            🚀 Starting battle...
          </p>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes sp-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}} />
    </div>
  );
}

"use client";
import { useState, useEffect } from 'react';

const T = {
  pageBg: 'var(--page)', cardBg: 'var(--card)', zoneBg: 'var(--zone)',
  green: 'var(--g)', gMid: 'var(--gMid)', gLight: 'var(--gLight)', gRing: 'var(--gRing)',
  gGlow: 'var(--gGlow)', ink: 'var(--ink)', sub: 'var(--sub)',
  hint: 'var(--hint)', line: 'var(--line)', lineHi: 'var(--lineHi)',
};

// role: 'HOST' | 'GUEST'
export default function BattleSetup({ role, playerId, topicSelection, onCreateRoom, onJoinRoom, joinError }) {
  const [roomCode, setRoomCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [joining, setJoining] = useState(false);
  
  // Reset joining state when there's an error
  useEffect(() => {
    if (joinError) {
      setJoining(false);
    }
  }, [joinError]);

  const handleCopyPlayerId = () => {
    navigator.clipboard.writeText(playerId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (role === 'HOST') {
    return (
      <div style={{
        background: T.cardBg, border: `1px solid ${T.line}`,
        borderRadius: 20, padding: '32px', animation: 'sp-fadein 0.3s ease'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎮</div>
          <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 20, color: T.ink, marginBottom: 8 }}>
            Host a Battle
          </h3>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: T.sub, marginBottom: 24 }}>
            Share your Player ID with a friend to start
          </p>

          {/* Player ID */}
          <div style={{ background: T.gLight, border: `2px solid ${T.gRing}`, borderRadius: 12, padding: '16px', marginBottom: 16 }}>
            <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: T.green, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>
              Your Player ID
            </p>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 28, fontWeight: 800, color: T.green, letterSpacing: '2px', marginBottom: 12 }}>
              {playerId}
            </div>
            <button
              onClick={handleCopyPlayerId}
              style={{
                padding: '8px 16px', borderRadius: 8, border: `1px solid ${T.gRing}`,
                background: 'white', color: T.green,
                fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 13, cursor: 'pointer'
              }}
            >
              {copied ? '✓ Copied!' : '📋 Copy ID'}
            </button>
          </div>

          {/* Topic info */}
          <div style={{ background: T.zoneBg, border: `1px solid ${T.line}`, borderRadius: 10, padding: '12px', marginBottom: 24 }}>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: T.sub }}>
              📚 Topic:{' '}
              <span style={{ fontWeight: 600, color: T.ink }}>
                {topicSelection?.mode === 'AUTO'
                  ? 'Auto (Weak Topics)'
                  : topicSelection?.topics?.[0] || 'Not set'}
              </span>
            </p>
          </div>

          <button
            onClick={() => onCreateRoom(topicSelection)}
            style={{
              width: '100%', padding: '14px', borderRadius: 12, border: 'none',
              background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: 'white',
              fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 15,
              cursor: 'pointer', boxShadow: `0 4px 14px ${T.gGlow}`
            }}
          >
            Create Battle Room →
          </button>
        </div>
        <style dangerouslySetInnerHTML={{ __html: `@keyframes sp-fadein { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }` }} />
      </div>
    );
  }

  // GUEST join screen
  return (
    <div style={{
      background: T.cardBg, border: `1px solid ${T.line}`,
      borderRadius: 20, padding: '32px', animation: 'sp-fadein 0.3s ease'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🚀</div>
        <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 20, color: T.ink, marginBottom: 8 }}>
          Join a Battle
        </h3>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: T.sub, marginBottom: 24 }}>
          Enter the host's Player ID to join
        </p>

        <input
          type="text"
          value={roomCode}
          onChange={e => setRoomCode(e.target.value.toUpperCase())}
          placeholder="Enter Player ID (e.g., SPR4821)"
          style={{
            width: '100%', padding: '14px', borderRadius: 10,
            border: `2px solid ${T.line}`, background: T.zoneBg,
            fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16,
            fontWeight: 600, textAlign: 'center', letterSpacing: '2px',
            color: T.ink, marginBottom: 16, outline: 'none', boxSizing: 'border-box'
          }}
          onFocus={e => e.target.style.borderColor = T.gRing}
          onBlur={e => e.target.style.borderColor = T.line}
          onKeyDown={e => { if (e.key === 'Enter' && roomCode.trim() && !joining) { setJoining(true); onJoinRoom(roomCode.trim()); } }}
        />

        <button
          onClick={() => { 
            if (roomCode.trim() && !joining) { 
              setJoining(true); 
              onJoinRoom(roomCode.trim()); 
            } 
          }}
          disabled={!roomCode.trim() || joining}
          style={{
            width: '100%', padding: '14px', borderRadius: 12, border: 'none',
            background: (!roomCode.trim() || joining) ? T.line : 'linear-gradient(135deg, #F59E0B, #D97706)',
            color: (!roomCode.trim() || joining) ? T.hint : 'white',
            fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 15,
            cursor: (!roomCode.trim() || joining) ? 'not-allowed' : 'pointer',
            boxShadow: (!roomCode.trim() || joining) ? 'none' : `0 4px 14px ${T.gGlow}`,
            transition: 'all 0.2s'
          }}
        >
          {joining ? 'Connecting...' : 'Join Battle →'}
        </button>
        
        {joinError && (
          <p style={{
            marginTop: 12,
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            color: '#EF4444',
            textAlign: 'center'
          }}>
            {joinError}
          </p>
        )}
      </div>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes sp-fadein { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }` }} />
    </div>
  );
}

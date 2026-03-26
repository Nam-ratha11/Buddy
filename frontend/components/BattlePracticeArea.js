"use client";
import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import TopicSelector from './TopicSelector';
import BattleSetup from './BattleSetup';
import Lobby from './Lobby';
import GameScreen from './GameScreen';
import QuestionLeaderboard from './QuestionLeaderboard';
import EndScreen from './EndScreen';
import PracticeArea from './PracticeArea';

const T = {
  pageBg: 'var(--page)', cardBg: 'var(--card)', zoneBg: 'var(--zone)',
  green: 'var(--g)', gMid: 'var(--gMid)', gLight: 'var(--gLight)', gRing: 'var(--gRing)',
  gGlow: 'var(--gGlow)', ink: 'var(--ink)', sub: 'var(--sub)',
  hint: 'var(--hint)', line: 'var(--line)', lineHi: 'var(--lineHi)',
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

const BackBtn = ({ onClick, label = 'Back' }) => (
  <button
    onClick={onClick}
    style={{
      background: 'none', border: 'none', color: T.gMid, cursor: 'pointer',
      fontFamily: "'DM Sans', sans-serif", fontSize: 13, marginBottom: 20,
      padding: 0, display: 'flex', alignItems: 'center', gap: 5
    }}
  >
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M19 12H5M12 5l-7 7 7 7"/>
    </svg>
    {label}
  </button>
);

export default function BattlePracticeArea({ onBack, studentClass, syllabusTopics = {} }) {
  // Top-level mode: null | 'SOLO' | 'BATTLE'
  const [mode, setMode] = useState(null);
  // Battle role: null | 'HOST' | 'GUEST'
  const [battleRole, setBattleRole] = useState(null);
  // Topic selection object (set after TopicSelector confirms)
  const [topicSelection, setTopicSelection] = useState(null);

  const [playerId] = useState(() => `SPR${Math.floor(1000 + Math.random() * 9000)}`);
  const [weakTopics, setWeakTopics] = useState({});
  const [topicsLoading, setTopicsLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/profile`)
      .then(r => r.json())
      .then(data => { if (data?.weakTopics) setWeakTopics(data.weakTopics); })
      .catch(() => {})
      .finally(() => setTopicsLoading(false));
  }, []);

  // Battle state machine
  const socketRef = useRef(null);
  // No socket state — always use socketRef.current to avoid stale closures
  const mySocketIdRef = useRef(null); // stable self-identity, set on connect or room-joined
  const battleRoleRef = useRef(null); // track role in ref for socket handlers
  const [battleState, setBattleState] = useState('SETUP'); // SETUP | LOBBY | GAME | LEADERBOARD | END
  const battleStateRef = useRef('SETUP'); // ref for socket handlers
  const [roomId, setRoomId] = useState(null);
  const roomIdRef = useRef(null); // ref so socket handlers always see latest roomId
  const [players, setPlayers] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [totalQuestions] = useState(10);
  const [timeLeft, setTimeLeft] = useState(10);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [streak, setStreak] = useState(0);
  // isReady removed — Lobby uses server's player.ready state instead
  
  // Join error state for guest
  const [joinError, setJoinError] = useState(null);
  
  // Track if opponent has answered current question
  const [opponentAnswered, setOpponentAnswered] = useState(false);

  // Keep refs in sync with state for socket handlers
  useEffect(() => {
    battleRoleRef.current = battleRole;
  }, [battleRole]);

  useEffect(() => {
    battleStateRef.current = battleState;
  }, [battleState]);

  // Solo state
  const [soloPracticeSet, setSoloPracticeSet] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Socket setup — only when entering BATTLE mode
  useEffect(() => {
    if (mode !== 'BATTLE') return;
    if (socketRef.current) return;

    console.log('[Battle] Initializing socket connection to:', API_URL);
    const sock = io(API_URL);
    socketRef.current = sock;

    // Register ALL listeners BEFORE any emits can happen
    sock.on('connect', () => {
      mySocketIdRef.current = sock.id;
      console.log('[Battle] Socket connected:', sock.id);
    });
    
    sock.on('room-created', ({ roomId }) => {
      console.log('[room-created] Received:', roomId);
      mySocketIdRef.current = sock.id;
      roomIdRef.current = roomId;
      setRoomId(roomId);
      setBattleState('LOBBY');
    });
    
    // room-joined: only fires on the guest who just joined — gives them their identity + full room state
    sock.on('room-joined', ({ players, topicInfo, roomId: rid, yourSocketId }) => {
      console.log('[room-joined] Event received! Data:', { rid, yourSocketId, topicInfo, playersCount: players?.length });
      
      // Set refs FIRST (synchronous)
      mySocketIdRef.current = yourSocketId;
      roomIdRef.current = rid;
      
      // Then set state (may batch)
      setRoomId(rid);
      setPlayers(players);
      setTopicSelection(topicInfo);
      
      // Transition to lobby LAST to ensure refs are set before render
      setBattleState('LOBBY');
      
      console.log('[room-joined] State updated - mySocketId:', mySocketIdRef.current, 'roomId:', roomIdRef.current, 'battleState: LOBBY');
    });
    
    // player-joined: fires to everyone when room state changes (player joins, ready state updates)
    sock.on('player-joined', ({ players, topicInfo, roomId: rid }) => {
      console.log('[player-joined] Received:', { rid, playersCount: players?.length, currentRoomId: roomIdRef.current, mySocketId: mySocketIdRef.current, battleState: battleStateRef.current, battleRole: battleRoleRef.current });
      setPlayers(players);
      
      // CRITICAL: Ensure roomId is always set (fallback for guest if room-joined didn't fire)
      if (rid && !roomIdRef.current) {
        console.log('[player-joined] Setting roomId fallback:', rid);
        roomIdRef.current = rid;
        setRoomId(rid);
      }
      
      // CRITICAL: Ensure mySocketId is set (fallback if room-joined missed)
      if (!mySocketIdRef.current && sock.id) {
        console.log('[player-joined] Setting mySocketId fallback:', sock.id);
        mySocketIdRef.current = sock.id;
      }
      
      // CRITICAL: If we have players and roomId but still in SETUP, transition to LOBBY (guest fallback)
      if (rid && players.length >= 1 && battleStateRef.current === 'SETUP' && battleRoleRef.current === 'GUEST') {
        console.log('[player-joined] Guest fallback: transitioning SETUP → LOBBY');
        if (topicInfo) setTopicSelection(topicInfo);
        setBattleState('LOBBY');
      }
      
      // Update topic if provided
      if (topicInfo) setTopicSelection(prev => prev || topicInfo);
      
      // Host: transition SETUP→LOBBY when first player-joined arrives
      if (battleRoleRef.current === 'HOST' && battleStateRef.current === 'SETUP') {
        setBattleState('LOBBY');
      }
    });
    sock.on('game-start', ({ question, questionNumber }) => {
      setBattleState('GAME');
      setCurrentQuestion(question);
      setQuestionNumber(questionNumber);
      setTimeLeft(10);
      setSelectedOption(null);
      setIsCorrect(null);
      setOpponentAnswered(false); // Reset for new question
    });
    sock.on('score-update', ({ players }) => {
      console.log('[Battle] Score update received:', players);
      setPlayers(players);
      const me = players.find(p => p.id === mySocketIdRef.current);
      const opp = players.find(p => p.id !== mySocketIdRef.current);
      if (me) setStreak(me.streak || 0);
      // Check if opponent answered (they have a score increase or answered this question)
      if (opp && selectedOption === null) {
        setOpponentAnswered(true);
      }
    });
    sock.on('question-result', ({ players }) => {
      setSelectedOption(null);
      setIsCorrect(null);
      setPlayers(players);
      const me = players.find(p => p.id === mySocketIdRef.current);
      if (me) setStreak(me.streak || 0);
      setOpponentAnswered(false); // Reset for next question
      setBattleState('LEADERBOARD');
      setTimeout(() => setBattleState('GAME'), 1500);
    });
    sock.on('next-question', ({ question, questionNumber }) => {
      setCurrentQuestion(question);
      setQuestionNumber(questionNumber);
      setTimeLeft(10);
      setSelectedOption(null);
      setIsCorrect(null);
      setOpponentAnswered(false); // Reset for new question
    });
    sock.on('game-end', ({ players }) => { setPlayers(players); setBattleState('END'); });
    sock.on('join-error', ({ message }) => {
      console.error('[Battle] Join error event received:', message);
      setJoinError(message);
    });
    
    sock.on('game-error', ({ message }) => {
      console.error('[Battle] Game error event received:', message);
      alert(message); // Show alert for game errors
    });
    
    sock.on('error', (err) => {
      console.error('[Battle] Socket.io error:', err);
      setJoinError('Connection error. Please try again.');
    });

    console.log('[Battle] All socket listeners registered');

    return () => { 
      console.log('[Battle] Cleaning up socket connection');
      sock.close(); 
      socketRef.current = null; 
    };
  }, [mode]);

  // Timer countdown
  useEffect(() => {
    if (battleState === 'GAME' && timeLeft > 0 && selectedOption === null) {
      const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && selectedOption === null && battleState === 'GAME') {
      handleAnswer(-1, 10);
    }
  }, [battleState, timeLeft, selectedOption]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleTopicSelect = (selection) => {
    setTopicSelection(selection);
    if (mode === 'SOLO') generateSoloPractice(selection);
  };

  const generateSoloPractice = async (selection) => {
    setIsGenerating(true);
    try {
      const res = await fetch(`${API_URL}/api/generate-practice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topics: selection.topics,
          studentClass: studentClass || '6th CBSE',
          selectedTypes: ['Multiple Choice']
        })
      });
      setSoloPracticeSet(await res.json());
    } catch {
      alert('Failed to generate practice questions. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateRoom = (topicInfo) => {
    const sock = socketRef.current;
    if (sock) {
      sock.emit('create-room', { playerId, playerName: 'Player 1', topicInfo });
    }
  };

  const handleJoinRoom = (hostPlayerId) => {
    const sock = socketRef.current;
    console.log('[Join] Attempting to join room:', hostPlayerId, 'socket ready:', !!sock, 'connected:', sock?.connected);
    
    // Clear any previous error
    setJoinError(null);
    
    if (!sock) {
      console.error('[Join] Socket not initialized');
      setJoinError('Connection error. Please try again.');
      return;
    }
    
    // Wait for socket to be fully connected before emitting
    const attemptJoin = () => {
      if (sock.connected) {
        console.log('[Join] Socket connected, emitting join-room');
        sock.emit('join-room', { roomId: hostPlayerId, playerId, playerName: 'Player 2' });
        
        // Set timeout for server response
        const joinTimeout = setTimeout(() => {
          console.error('[Join] Timeout fired - no response after 10s');
          const errorMsg = 'Could not join room. The room may not exist or the host may not be ready. Please check the Player ID and try again.';
          console.log('[Join] Calling setJoinError with:', errorMsg);
          setJoinError(errorMsg);
          console.log('[Join] setJoinError called');
        }, 10000);
        
        // Clear timeout when we receive room-joined
        const clearJoinTimeout = () => {
          console.log('[Join] Clearing timeout - room-joined received');
          clearTimeout(joinTimeout);
          sock.off('room-joined', clearJoinTimeout);
          sock.off('join-error', handleJoinError);
          sock.off('player-joined', handlePlayerJoined);
        };
        
        const handleJoinError = (data) => {
          console.log('[Join] Join-error event received:', data);
          clearTimeout(joinTimeout);
          sock.off('room-joined', clearJoinTimeout);
          sock.off('join-error', handleJoinError);
          sock.off('player-joined', handlePlayerJoined);
        };
        
        // Also clear timeout if we get player-joined (fallback success)
        const handlePlayerJoined = () => {
          console.log('[Join] Clearing timeout - player-joined received');
          clearTimeout(joinTimeout);
          sock.off('room-joined', clearJoinTimeout);
          sock.off('join-error', handleJoinError);
          sock.off('player-joined', handlePlayerJoined);
        };
        
        sock.once('room-joined', clearJoinTimeout);
        sock.once('player-joined', handlePlayerJoined);
        sock.once('join-error', handleJoinError);
      } else {
        console.log('[Join] Socket not connected yet, waiting...');
        // Wait for connection
        let attempts = 0;
        const checkInterval = setInterval(() => {
          attempts++;
          console.log('[Join] Waiting for connection, attempt', attempts);
          if (sock.connected) {
            clearInterval(checkInterval);
            console.log('[Join] Socket connected after', attempts, 'attempts');
            sock.emit('join-room', { roomId: hostPlayerId, playerId, playerName: 'Player 2' });
            
            // Add timeout here too
            const joinTimeout = setTimeout(() => {
              console.error('[Join] Timeout fired (delayed) - no response after 10s');
              setJoinError('Could not join room. The room may not exist or the host may not be ready. Please check the Player ID and try again.');
            }, 10000);
            
            const clearTimeoutOnSuccess = () => {
              clearTimeout(joinTimeout);
            };
            
            sock.once('room-joined', clearTimeoutOnSuccess);
            sock.once('player-joined', clearTimeoutOnSuccess);
            sock.once('join-error', clearTimeoutOnSuccess);
          } else if (attempts >= 50) {
            clearInterval(checkInterval);
            console.error('[Join] Connection timeout after 5s');
            setJoinError('Connection timeout. Please try again.');
          }
        }, 100);
      }
    };
    
    attemptJoin();
  };

  const handleReady = () => {
    const rid = roomIdRef.current || roomId; // fallback to state if ref not set
    const sock = socketRef.current;
    console.log('[Ready] Clicked. roomId (ref):', roomIdRef.current, 'roomId (state):', roomId, 'socket:', sock?.id, 'myId:', mySocketIdRef.current);
    if (sock && rid) {
      sock.emit('player-ready', { roomId: rid });
      console.log('[Ready] Emitted player-ready to room:', rid);
    } else {
      console.error('[Ready] BLOCKED - missing socket or roomId. sock:', !!sock, 'rid:', rid, 'roomIdRef:', roomIdRef.current, 'roomId state:', roomId);
    }
  };

  const handleAnswer = (optionIndex, responseTime) => {
    setSelectedOption(optionIndex);
    setIsCorrect(optionIndex === currentQuestion.correctOption);
    const rid = roomIdRef.current;
    const sock = socketRef.current;
    if (sock && rid) {
      sock.emit('submit-answer', {
        roomId: rid, answer: optionIndex, responseTime,
        correct: optionIndex === currentQuestion.correctOption
      });
    }
  };

  const handleRematch = () => {
    const rid = roomIdRef.current;
    const sock = socketRef.current;
    if (sock && rid) {
      sock.emit('rematch', { roomId: rid });
      setBattleState('LOBBY');
      setQuestionNumber(0);
      setStreak(0);
    }
  };

  const handleLeaveRoom = () => {
    const rid = roomIdRef.current;
    const sock = socketRef.current;
    if (sock && rid) sock.emit('leave-room', { roomId: rid });
    roomIdRef.current = null;
    mySocketIdRef.current = null;
    setMode(null);
    setBattleRole(null);
    setTopicSelection(null);
    setBattleState('SETUP');
    setRoomId(null);
    setPlayers([]);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  // 1. Mode selector
  if (!mode) {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', animation: 'sp-fadein 0.3s ease' }}>
        <BackBtn onClick={onBack} label="Back to Feedback" />
        <div style={{
          background: T.cardBg, border: `1px solid ${T.line}`,
          borderRadius: 20, padding: '32px', textAlign: 'center'
        }}>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 24, color: T.ink, marginBottom: 8 }}>
            Practice Mode
          </h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: T.sub, marginBottom: 32 }}>
            Choose how you want to practice
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { key: 'SOLO', emoji: '📚', label: 'Solo Practice', desc: 'Practice at your own pace', accent: false },
              { key: 'BATTLE', emoji: '⚡', label: 'Battle Mode', desc: 'Challenge a friend in real-time', accent: true },
            ].map(({ key, emoji, label, desc, accent }) => (
              <button
                key={key}
                onClick={() => setMode(key)}
                style={{
                  padding: '24px', borderRadius: 16, cursor: 'pointer', textAlign: 'center',
                  border: `2px solid ${accent ? T.gRing : T.line}`,
                  background: accent ? T.gLight : T.zoneBg,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 8px 20px ${T.gGlow}`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ fontSize: 48, marginBottom: 12 }}>{emoji}</div>
                <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 18, color: accent ? T.green : T.ink, marginBottom: 6 }}>{label}</h3>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: accent ? T.green : T.sub }}>{desc}</p>
              </button>
            ))}
          </div>
        </div>
        <style dangerouslySetInnerHTML={{ __html: `@keyframes sp-fadein { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }` }} />
      </div>
    );
  }

  // 2. SOLO: topic selector → practice
  if (mode === 'SOLO') {
    if (!topicSelection) {
      return (
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <BackBtn onClick={() => setMode(null)} />
          <TopicSelector
            onSelect={handleTopicSelect}
            weakTopics={weakTopics}
            syllabusTopics={syllabusTopics}
            loading={topicsLoading}
            studentClass={studentClass || '7th CBSE'}
          />
        </div>
      );
    }

    if (isGenerating) {
      return (
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ width: 48, height: 48, border: `4px solid ${T.line}`, borderTopColor: T.green, borderRadius: '50%', display: 'inline-block', animation: 'sp-spin 0.8s linear infinite', marginBottom: 20 }} />
          <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 600, color: T.ink }}>Generating practice questions...</p>
          <style dangerouslySetInnerHTML={{ __html: `@keyframes sp-spin { to { transform: rotate(360deg); } }` }} />
        </div>
      );
    }

    return (
      <PracticeArea
        practiceSet={soloPracticeSet}
        onBack={() => { setMode(null); setTopicSelection(null); setSoloPracticeSet(null); }}
        onReattempt={() => generateSoloPractice(topicSelection)}
      />
    );
  }

  // 3. BATTLE: role selector (HOST / GUEST)
  if (mode === 'BATTLE' && !battleRole) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', animation: 'sp-fadein 0.3s ease' }}>
        <BackBtn onClick={() => setMode(null)} />
        <div style={{ background: T.cardBg, border: `1px solid ${T.line}`, borderRadius: 20, padding: '32px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚡</div>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 24, color: T.ink, marginBottom: 8 }}>Battle Mode</h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: T.sub, marginBottom: 32 }}>
            Challenge a friend to a real-time quiz battle!
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            <button
              onClick={() => setBattleRole('HOST')}
              style={{
                padding: '16px 28px', borderRadius: 12, border: 'none',
                background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: 'white',
                fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 15,
                cursor: 'pointer', transition: 'transform 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              🎮 Host a Battle
            </button>
            <button
              onClick={() => setBattleRole('GUEST')}
              style={{
                padding: '16px 28px', borderRadius: 12,
                border: `2px solid ${T.gRing}`, background: T.gLight, color: T.green,
                fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 15,
                cursor: 'pointer', transition: 'transform 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              🚀 Join a Battle
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. HOST: pick topic first
  if (mode === 'BATTLE' && battleRole === 'HOST' && !topicSelection) {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <BackBtn onClick={() => setBattleRole(null)} />
        <TopicSelector
          onSelect={handleTopicSelect}
          weakTopics={weakTopics}
          syllabusTopics={syllabusTopics}
          loading={topicsLoading}
          studentClass={studentClass || '7th CBSE'}
        />
      </div>
    );
  }

  // 5. HOST: topic chosen → show host setup card (create room)
  if (mode === 'BATTLE' && battleRole === 'HOST' && topicSelection && battleState === 'SETUP') {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <BackBtn onClick={() => setTopicSelection(null)} />
        <BattleSetup
          role="HOST"
          playerId={playerId}
          topicSelection={topicSelection}
          onCreateRoom={handleCreateRoom}
        />
      </div>
    );
  }

  // 6. GUEST: show join screen directly
  if (mode === 'BATTLE' && battleRole === 'GUEST' && battleState === 'SETUP') {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <BackBtn onClick={() => { setBattleRole(null); setJoinError(null); }} />
        <BattleSetup
          role="GUEST"
          playerId={playerId}
          onJoinRoom={handleJoinRoom}
          joinError={joinError}
        />
      </div>
    );
  }

  // 7. LOBBY
  if (battleState === 'LOBBY') {
    const myId = mySocketIdRef.current;
    const rid = roomIdRef.current;
    
    // Safety: if roomId not set yet, show loading
    if (!rid) {
      return (
        <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ width: 40, height: 40, border: `4px solid ${T.line}`, borderTopColor: T.green, borderRadius: '50%', display: 'inline-block', animation: 'sp-spin 0.8s linear infinite', marginBottom: 16 }} />
          <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15, fontWeight: 600, color: T.ink }}>Joining lobby...</p>
          <style dangerouslySetInnerHTML={{ __html: `@keyframes sp-spin { to { transform: rotate(360deg); } }` }} />
        </div>
      );
    }
    
    const lobbyPlayers = players.map(p => ({ ...p, isCurrentUser: p.id === myId }));
    return (
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <Lobby
          players={lobbyPlayers}
          topicInfo={topicSelection}
          onReady={handleReady}
          onLeave={handleLeaveRoom}
        />
      </div>
    );
  }

  // 8. GAME
  if (battleState === 'GAME') {
    if (!currentQuestion) {
      return (
        <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ width: 40, height: 40, border: `4px solid ${T.line}`, borderTopColor: T.green, borderRadius: '50%', display: 'inline-block', animation: 'sp-spin 0.8s linear infinite', marginBottom: 16 }} />
          <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15, fontWeight: 600, color: T.ink }}>Loading question...</p>
          <style dangerouslySetInnerHTML={{ __html: `@keyframes sp-spin { to { transform: rotate(360deg); } }` }} />
        </div>
      );
    }
    const myId = mySocketIdRef.current;
    const me = players.find(p => p.id === myId);
    const opp = players.find(p => p.id !== myId);
    return (
      <GameScreen
        question={currentQuestion}
        timeLeft={timeLeft}
        streak={streak}
        currentScore={me?.score || 0}
        opponentScore={opp?.score || 0}
        onAnswer={handleAnswer}
        selectedOption={selectedOption}
        isCorrect={isCorrect}
        questionNumber={questionNumber}
        totalQuestions={totalQuestions}
        opponentAnswered={opponentAnswered}
      />
    );
  }

  // 9. LEADERBOARD
  if (battleState === 'LEADERBOARD') {
    const myId = mySocketIdRef.current;
    return (
      <QuestionLeaderboard
        players={players.map(p => ({ ...p, isCurrentUser: p.id === myId }))}
      />
    );
  }

  // 10. END
  if (battleState === 'END') {
    const myId = mySocketIdRef.current;
    return (
      <EndScreen
        players={players.map(p => ({ ...p, isCurrentUser: p.id === myId }))}
        onRematch={handleRematch}
        onExit={handleLeaveRoom}
      />
    );
  }

  return null;
}

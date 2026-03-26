# Socket.io & Battle Mode — Complete Technical Documentation

## OVERVIEW

Battle Mode is a real-time multiplayer quiz feature where two students compete head-to-head.
Built using Socket.io for bidirectional communication between frontend and backend.

**Architecture:**
- Backend: Socket.io server integrated into Express.js (port 5001)
- Frontend: Socket.io client in React components
- Data flow: Real-time events (no polling, no REST for game state)
- Storage: In-memory Map (battleRooms) — no database persistence

**Key Features:**
- Real-time score updates
- 10-second timer per question
- Streak bonuses (3+ correct = +25 points)
- Auto-resolve when both players answer or timeout
- Rematch functionality
- Graceful error handling with custom event names

---

## LIBRARIES ADDED

### Backend (Buddy/backend/package.json)

| Library | Version | Purpose |
|---|---|---|
| socket.io | ^4.x | WebSocket server — handles real-time bidirectional events |
| http | built-in | Creates HTTP server to attach Socket.io to Express |

### Frontend (Buddy/frontend/package.json)

| Library | Version | Purpose |
|---|---|---|
| socket.io-client | ^4.x | WebSocket client — connects to backend Socket.io server |

---

## NEW FILES ADDED

### Backend
- `Buddy/backend/src/server.js` — Socket.io server logic added (lines 370-650)

### Frontend Components

| File | Purpose |
|---|---|
| `BattlePracticeArea.js` | Main orchestrator — manages socket connection, state machine, event handlers |
| `TopicSelector.js` | Topic selection UI — AUTO (weak topics) or CHOOSE (subject→topic drill-down) |
| `BattleSetup.js` | Host/Guest split screen — room creation and joining |
| `Lobby.js` | Two-player ready screen — shows both players, topic, ready states |
| `GameScreen.js` | Live quiz UI — question, timer, options, scores, streak |
| `QuestionLeaderboard.js` | Between-question score flash — shows points earned |
| `EndScreen.js` | Final scoreboard — winner announcement, stats, rematch/exit buttons |

### Backend Data Files
| File | Purpose |
|---|---|
| `history_{studentId}.json` | Stores answer sheet analysis history (used for weak topic detection) |
| `user_profile.json` | Tracks weak topics across sessions (used for Auto mode) |
| `syllabus.json` | CBSE syllabus topics per grade (used for CHOOSE mode) |

---

## SOCKET.IO SERVER SETUP (Backend)

### Initialization (server.js lines 27-30)

```javascript
const http = require('http');
const { Server } = require('socket.io');

const httpServer = http.createServer(app);  // Wrap Express app
const io = new Server(httpServer, {
    cors: { 
        origin: process.env.ALLOWED_ORIGIN || 'http://localhost:3000', 
        methods: ['GET', 'POST'] 
    }
});
```

**Why http.createServer?**
- Express app alone can't handle WebSocket upgrades
- http.createServer wraps Express and allows Socket.io to attach
- Same server handles both HTTP (REST API) and WebSocket (Socket.io) traffic

**CORS Configuration:**
- Allows frontend (localhost:3000) to connect to Socket.io server (localhost:5001)
- Without this, browser blocks WebSocket handshake


### In-Memory Data Store (server.js line 375)

```javascript
const battleRooms = new Map();
```

**Structure:**
```javascript
battleRooms.set('SPR3629', {
    id: 'SPR3629',                    // Room ID (same as host's playerId)
    topicInfo: {                      // Selected topic for battle
        mode: 'AUTO',                 // or 'CHOOSE'
        topics: ['Photosynthesis'],
        subject: 'Science'
    },
    players: [                        // Array of 2 players
        {
            id: 'socket_id_abc123',   // Socket.io connection ID
            playerId: 'SPR3629',      // Random player ID (SPR + 4 digits)
            name: 'Player 1',
            score: 275,
            streak: 5,
            maxStreak: 5,
            ready: true,
            isHost: true,
            pointsEarned: 100         // Points from last question (for leaderboard)
        },
        {
            id: 'socket_id_def456',
            playerId: 'SPR7841',
            name: 'Player 2',
            score: 200,
            streak: 0,
            maxStreak: 3,
            ready: true,
            isHost: false,
            pointsEarned: 0
        }
    ],
    questions: [...],                 // Array of 10 generated MCQs
    currentQuestionIndex: 3,          // Current question (0-9)
    answers: {                        // Tracks who answered what
        0: {                          // Question index
            'socket_id_abc123': { answer: 2, points: 100, correct: true },
            'socket_id_def456': { answer: 1, points: 0, correct: false }
        },
        1: { ... },
        // ...
    },
    state: 'GAME'                     // LOBBY | GENERATING | GAME | END
});
```

**Why Map instead of Object?**
- Faster lookups: `battleRooms.get(roomId)` vs `battleRooms[roomId]`
- Built-in size property: `battleRooms.size`
- Easier iteration: `for (const [roomId, room] of battleRooms.entries())`


---

## SOCKET.IO EVENT FLOW

### Connection Lifecycle

```
Client connects → socket.on('connection') fires
    ↓
Client emits events (create-room, join-room, player-ready, submit-answer)
    ↓
Server processes event → updates battleRooms Map
    ↓
Server emits response events (room-created, room-joined, game-start, score-update)
    ↓
All clients in room receive updates via io.to(roomId).emit()
    ↓
Client disconnects → socket.on('disconnect') fires → cleanup
```

### Event Naming Convention

**Custom Events (our app):**
- `create-room`, `join-room`, `player-ready`, `submit-answer`, `rematch`, `leave-room`
- `room-created`, `room-joined`, `player-joined`, `game-start`, `next-question`
- `question-result`, `game-end`, `score-update`
- `join-error`, `game-error` (custom error events to avoid Socket.io built-in `error`)

**Built-in Events (Socket.io):**
- `connection` — fires when a client connects
- `disconnect` — fires when a client disconnects
- `error` — Socket.io's built-in error event (we avoid using this for custom errors)

**Why custom error events?**
Socket.io's built-in `error` event has special behavior that can interfere with our error handling.
We use `join-error` and `game-error` instead for predictable behavior.


---

## BACKEND EVENT HANDLERS (server.js lines 377-550)

### 1. Connection Handler

```javascript
io.on('connection', (socket) => {
    console.log(`[Battle] Player connected: ${socket.id}`);
    // ... register all event listeners
});
```

**What happens:**
- Fires when a client successfully connects via WebSocket
- `socket` object represents this specific client connection
- `socket.id` is a unique identifier (e.g., "vfqp7o4iZsrHHRMmAABv")

---

### 2. create-room Event

**Client emits:**
```javascript
socket.emit('create-room', { 
    playerId: 'SPR3629', 
    playerName: 'Player 1', 
    topicInfo: { mode: 'AUTO', topics: [...] } 
});
```

**Server handler:**
```javascript
socket.on('create-room', async ({ playerId, playerName, topicInfo }) => {
    const roomId = playerId;  // Room ID = Host's Player ID
    
    // Check if room already exists (React StrictMode double-invoke protection)
    if (battleRooms.has(roomId)) {
        const room = battleRooms.get(roomId);
        const existing = room.players.find(p => p.playerId === playerId);
        if (existing) existing.id = socket.id;  // Update socket ID
        socket.join(roomId);
        socket.emit('room-created', { roomId });
        io.to(roomId).emit('player-joined', { players: room.players, topicInfo, roomId });
        return;
    }
    
    // Create new room
    const room = {
        id: roomId,
        topicInfo,
        players: [{
            id: socket.id,
            playerId,
            name: playerName || playerId,
            score: 0,
            streak: 0,
            maxStreak: 0,
            ready: false,
            isHost: true
        }],
        questions: [],
        currentQuestionIndex: 0,
        answers: {},
        state: 'LOBBY'
    };
    
    battleRooms.set(roomId, room);
    socket.join(roomId);  // Join Socket.io room (for broadcasting)
    socket.emit('room-created', { roomId });
    io.to(roomId).emit('player-joined', { players: room.players, topicInfo, roomId });
    console.log(`[Battle] Room created: ${roomId}`);
});
```

**Key concepts:**
- `socket.join(roomId)` — adds this socket to a Socket.io "room" (broadcast group)
- `socket.emit()` — sends event to THIS socket only
- `io.to(roomId).emit()` — sends event to ALL sockets in the room
- Room ID = Host's Player ID (e.g., "SPR3629") for easy sharing


---

### 3. join-room Event

**Client emits:**
```javascript
socket.emit('join-room', { 
    roomId: 'SPR3629',  // Host's Player ID
    playerId: 'SPR7841', 
    playerName: 'Player 2' 
});
```

**Server handler:**
```javascript
socket.on('join-room', ({ roomId, playerId, playerName }) => {
    console.log(`[Battle] join-room received from ${socket.id} for room ${roomId}`);
    
    const room = battleRooms.get(roomId);
    if (!room) {
        console.error(`[Battle] Room ${roomId} not found`);
        socket.emit('join-error', { message: 'Room not found. Check the Player ID and try again.' });
        return;
    }
    
    // Check if room is full
    const existing = room.players.find(p => p.playerId === playerId);
    if (!existing && room.players.length >= 2) {
        console.error(`[Battle] Room ${roomId} is full`);
        socket.emit('join-error', { message: 'Room is full.' });
        return;
    }
    
    // Add player or reconnect existing player
    if (existing) {
        existing.id = socket.id;  // Reconnect (update socket ID)
        console.log(`[Battle] Reconnected player ${playerId} to room ${roomId}`);
    } else {
        room.players.push({
            id: socket.id,
            playerId,
            name: playerName || playerId,
            score: 0,
            streak: 0,
            maxStreak: 0,
            ready: false,
            isHost: false
        });
        console.log(`[Battle] Added new player ${playerId} to room ${roomId}`);
    }
    
    socket.join(roomId);
    
    // Send dedicated event to joining socket (includes their socket ID)
    socket.emit('room-joined', { 
        players: room.players, 
        topicInfo: room.topicInfo, 
        roomId, 
        yourSocketId: socket.id 
    });
    console.log(`[Battle] Emitted room-joined to ${socket.id}`);
    
    // Broadcast updated player list to everyone in room
    io.to(roomId).emit('player-joined', { 
        players: room.players, 
        topicInfo: room.topicInfo, 
        roomId 
    });
    console.log(`[Battle] Player joined room: ${roomId}, total players: ${room.players.length}`);
});
```

**Why two events (room-joined + player-joined)?**
- `room-joined` — sent ONLY to the joining player, includes `yourSocketId` for identity
- `player-joined` — broadcast to ALL players (including host), updates player list


---

### 4. player-ready Event

**Client emits:**
```javascript
socket.emit('player-ready', { roomId: 'SPR3629' });
```

**Server handler:**
```javascript
socket.on('player-ready', async ({ roomId }) => {
    const room = battleRooms.get(roomId);
    if (!room) {
        console.error('[Battle] player-ready: room not found:', roomId);
        return;
    }
    
    const player = room.players.find(p => p.id === socket.id);
    console.log('[Battle] player-ready from', socket.id, 'in room', roomId, 'player found:', !!player);
    
    if (player) player.ready = true;
    
    // Broadcast updated ready states
    io.to(roomId).emit('player-joined', { 
        players: room.players, 
        topicInfo: room.topicInfo, 
        roomId 
    });
    
    // Check if both players are ready
    const allReady = room.players.length === 2 && room.players.every(p => p.ready);
    console.log('[Battle] Ready check: players:', room.players.length, 'allReady:', allReady, 'state:', room.state);
    
    if (allReady && room.state === 'LOBBY') {
        room.state = 'GENERATING';
        console.log('[Battle] Starting question generation...');
        
        try {
            // Generate 10 MCQs using Gemini
            room.questions = await generateBattleQuestions(room.topicInfo);
            room.currentQuestionIndex = 0;
            room.state = 'GAME';
            
            const q = room.questions[0];
            io.to(roomId).emit('game-start', { question: q, questionNumber: 1 });
            startQuestionTimer(roomId);  // Start 10-second countdown
            
            console.log('[Battle] Game started with', room.questions.length, 'questions');
        } catch (e) {
            console.error('[Battle] Question generation failed:', e.message);
            io.to(roomId).emit('game-error', { message: 'Failed to generate questions. Please try again.' });
            
            // Reset to lobby
            room.state = 'LOBBY';
            room.players.forEach(p => p.ready = false);
            io.to(roomId).emit('player-joined', { players: room.players, topicInfo: room.topicInfo, roomId });
        }
    }
});
```

**Flow:**
1. Player clicks "I'm Ready" → emits `player-ready`
2. Server marks player as ready, broadcasts updated state
3. When BOTH players ready → generate questions → emit `game-start`
4. Start 10-second timer for first question


---

### 5. submit-answer Event

**Client emits:**
```javascript
socket.emit('submit-answer', { 
    roomId: 'SPR3629', 
    answer: 2,           // Selected option index (0-3)
    responseTime: 3.5,   // Seconds taken to answer
    correct: true        // Client's check (server re-validates)
});
```

**Server handler:**
```javascript
socket.on('submit-answer', ({ roomId, answer, responseTime, correct }) => {
    const room = battleRooms.get(roomId);
    if (!room || room.state !== 'GAME') return;
    
    const qIdx = room.currentQuestionIndex;
    if (!room.answers[qIdx]) room.answers[qIdx] = {};
    if (room.answers[qIdx][socket.id] !== undefined) return;  // Already answered
    
    const question = room.questions[qIdx];
    const isCorrect = answer === question.correctOption;
    let points = 0;
    
    if (isCorrect) {
        points = calcPoints(responseTime);  // 100/75/50 based on speed
        const player = room.players.find(p => p.id === socket.id);
        
        if (player) {
            player.streak = (player.streak || 0) + 1;
            if (player.streak >= 3) points += 25;  // Streak bonus
            player.maxStreak = Math.max(player.maxStreak || 0, player.streak);
            player.score = (player.score || 0) + points;
        }
    } else {
        const player = room.players.find(p => p.id === socket.id);
        if (player) player.streak = 0;  // Reset streak on wrong answer
    }
    
    room.answers[qIdx][socket.id] = { answer, points, correct: isCorrect };
    
    // Attach pointsEarned for leaderboard display
    const player = room.players.find(p => p.id === socket.id);
    if (player) player.pointsEarned = points;
    
    // Broadcast updated scores immediately (real-time update)
    io.to(roomId).emit('score-update', { players: room.players });
    
    // If both players answered, resolve immediately
    const answeredCount = Object.keys(room.answers[qIdx]).length;
    if (answeredCount >= room.players.length) {
        resolveQuestion(roomId);
    }
});
```

**Scoring System:**
```javascript
function calcPoints(responseTime) {
    if (responseTime <= 3) return 100;      // Fast (0-3s)
    if (responseTime <= 6) return 75;       // Medium (3-6s)
    return 50;                              // Slow (6-10s)
}
```

**Streak Bonus:**
- 3+ correct in a row = +25 points per question
- Resets to 0 on wrong answer or timeout


---

### 6. Question Resolution & Timer

**Timer System:**
```javascript
const questionTimers = new Map();  // Stores timeout IDs per room

function startQuestionTimer(roomId) {
    if (questionTimers.has(roomId)) clearTimeout(questionTimers.get(roomId));
    
    const timer = setTimeout(() => {
        resolveQuestion(roomId);
    }, 11000);  // 10s + 1s buffer
    
    questionTimers.set(roomId, timer);
}

function resolveQuestion(roomId) {
    if (questionTimers.has(roomId)) {
        clearTimeout(questionTimers.get(roomId));
        questionTimers.delete(roomId);
    }
    
    const room = battleRooms.get(roomId);
    if (!room || room.state !== 'GAME') return;
    
    const qIdx = room.currentQuestionIndex;
    const question = room.questions[qIdx];
    
    // Copy players array for leaderboard (includes pointsEarned)
    const playersForLeaderboard = room.players.map(p => ({ ...p }));
    
    // Emit question result (shows leaderboard screen)
    io.to(roomId).emit('question-result', {
        players: playersForLeaderboard,
        correctOption: question.correctOption
    });
    
    // Reset pointsEarned after broadcasting
    room.players.forEach(p => p.pointsEarned = 0);
    
    const nextIdx = qIdx + 1;
    
    if (nextIdx >= room.questions.length) {
        // Game over
        setTimeout(() => {
            room.state = 'END';
            io.to(roomId).emit('game-end', { players: room.players });
        }, 1600);  // 1.6s delay for leaderboard animation
    } else {
        // Next question
        setTimeout(() => {
            room.currentQuestionIndex = nextIdx;
            const nextQ = room.questions[nextIdx];
            io.to(roomId).emit('next-question', { 
                question: nextQ, 
                questionNumber: nextIdx + 1 
            });
            startQuestionTimer(roomId);
        }, 1600);
    }
}
```

**Flow:**
1. Question starts → `startQuestionTimer(roomId)` sets 11-second timeout
2. Player answers → `submit-answer` handler checks if both answered
3. If both answered → `resolveQuestion()` fires immediately (clears timer)
4. If timeout hits → `resolveQuestion()` fires automatically
5. Show leaderboard for 1.6s → next question or game end


---

### 7. rematch & leave-room Events

**Rematch:**
```javascript
socket.on('rematch', ({ roomId }) => {
    const room = battleRooms.get(roomId);
    if (!room) return;
    
    // Reset all player stats
    room.players.forEach(p => {
        p.score = 0;
        p.streak = 0;
        p.maxStreak = 0;
        p.ready = false;
        p.pointsEarned = 0;
    });
    
    // Clear game data
    room.questions = [];
    room.currentQuestionIndex = 0;
    room.answers = {};
    room.state = 'LOBBY';
    
    // Send players back to lobby
    io.to(roomId).emit('player-joined', { 
        players: room.players, 
        topicInfo: room.topicInfo, 
        roomId 
    });
});
```

**Leave Room:**
```javascript
socket.on('leave-room', ({ roomId }) => {
    socket.leave(roomId);  // Remove from Socket.io room
    
    const room = battleRooms.get(roomId);
    if (room) {
        room.players = room.players.filter(p => p.id !== socket.id);
        
        if (room.players.length === 0) {
            battleRooms.delete(roomId);  // Delete empty room
        } else {
            io.to(roomId).emit('player-joined', { 
                players: room.players, 
                topicInfo: room.topicInfo, 
                roomId 
            });
        }
    }
});
```

**Disconnect (automatic cleanup):**
```javascript
socket.on('disconnect', () => {
    console.log(`[Battle] Player disconnected: ${socket.id}`);
    
    for (const [roomId, room] of battleRooms.entries()) {
        const idx = room.players.findIndex(p => p.id === socket.id);
        
        if (idx !== -1) {
            room.players.splice(idx, 1);
            
            if (room.players.length === 0) {
                battleRooms.delete(roomId);
            } else {
                io.to(roomId).emit('player-joined', { 
                    players: room.players, 
                    topicInfo: room.topicInfo, 
                    roomId 
                });
            }
            break;
        }
    }
});
```


---

## FRONTEND SOCKET.IO CLIENT (BattlePracticeArea.js)

### Socket Connection Setup

```javascript
import { io } from 'socket.io-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

// Inside component
const socketRef = useRef(null);
const mySocketIdRef = useRef(null);
const battleRoleRef = useRef(null);
const battleStateRef = useRef('SETUP');
const roomIdRef = useRef(null);

useEffect(() => {
    if (mode !== 'BATTLE') return;
    if (socketRef.current) return;  // Already connected
    
    console.log('[Battle] Initializing socket connection to:', API_URL);
    const sock = io(API_URL);
    socketRef.current = sock;
    
    // Register all event listeners...
    
    return () => {
        console.log('[Battle] Cleaning up socket connection');
        sock.close();
        socketRef.current = null;
    };
}, [mode]);
```

**Why useRef instead of useState for socket?**
- Socket object should NOT trigger re-renders
- Refs persist across renders without causing updates
- Prevents stale closures in event handlers

**Why multiple refs (mySocketIdRef, roomIdRef, etc.)?**
- Event handlers are registered once in useEffect
- They capture state values at registration time (stale closure problem)
- Refs always point to current values, avoiding stale data


---

### Event Listeners (Client Side)

```javascript
// Connection established
sock.on('connect', () => {
    mySocketIdRef.current = sock.id;
    console.log('[Battle] Socket connected:', sock.id);
});

// Host: room created successfully
sock.on('room-created', ({ roomId }) => {
    console.log('[room-created] Received:', roomId);
    mySocketIdRef.current = sock.id;
    roomIdRef.current = roomId;
    setRoomId(roomId);
    setBattleState('LOBBY');
});

// Guest: joined room successfully
sock.on('room-joined', ({ players, topicInfo, roomId: rid, yourSocketId }) => {
    console.log('[room-joined] Event received!', { rid, yourSocketId, playersCount: players?.length });
    
    mySocketIdRef.current = yourSocketId;  // Set identity
    roomIdRef.current = rid;
    
    setRoomId(rid);
    setPlayers(players);
    setTopicSelection(topicInfo);
    setBattleState('LOBBY');
});

// Player list updated (ready states, new player joined)
sock.on('player-joined', ({ players, topicInfo, roomId: rid }) => {
    console.log('[player-joined] Received:', { rid, playersCount: players?.length });
    setPlayers(players);
    
    // Fallback: if guest missed room-joined, set roomId here
    if (rid && !roomIdRef.current) {
        roomIdRef.current = rid;
        setRoomId(rid);
    }
    
    // Fallback: if mySocketId not set, use sock.id
    if (!mySocketIdRef.current && sock.id) {
        mySocketIdRef.current = sock.id;
    }
    
    // Guest fallback: transition to LOBBY if still in SETUP
    if (rid && players.length >= 1 && battleStateRef.current === 'SETUP' && battleRoleRef.current === 'GUEST') {
        if (topicInfo) setTopicSelection(topicInfo);
        setBattleState('LOBBY');
    }
    
    if (topicInfo) setTopicSelection(prev => prev || topicInfo);
    
    // Host: transition SETUP→LOBBY
    if (battleRoleRef.current === 'HOST' && battleStateRef.current === 'SETUP') {
        setBattleState('LOBBY');
    }
});
```

**Why fallback logic in player-joined?**
- Network issues can cause `room-joined` to be missed
- `player-joined` is broadcast to everyone, so it's more reliable
- Fallback ensures guest can still join even if `room-joined` fails


---

### Game Event Listeners

```javascript
// Game starts (first question)
sock.on('game-start', ({ question, questionNumber }) => {
    setBattleState('GAME');
    setCurrentQuestion(question);
    setQuestionNumber(questionNumber);
    setTimeLeft(10);
    setSelectedOption(null);
    setIsCorrect(null);
    setOpponentAnswered(false);
});

// Real-time score update (when opponent answers)
sock.on('score-update', ({ players }) => {
    console.log('[Battle] Score update received:', players);
    setPlayers(players);
    
    const me = players.find(p => p.id === mySocketIdRef.current);
    const opp = players.find(p => p.id !== mySocketIdRef.current);
    
    if (me) setStreak(me.streak || 0);
    
    // Show checkmark next to opponent's score if they answered first
    if (opp && selectedOption === null) {
        setOpponentAnswered(true);
    }
});

// Question resolved (show leaderboard)
sock.on('question-result', ({ players }) => {
    setSelectedOption(null);
    setIsCorrect(null);
    setPlayers(players);
    
    const me = players.find(p => p.id === mySocketIdRef.current);
    if (me) setStreak(me.streak || 0);
    
    setOpponentAnswered(false);
    setBattleState('LEADERBOARD');
    
    setTimeout(() => setBattleState('GAME'), 1500);  // Back to game after 1.5s
});

// Next question
sock.on('next-question', ({ question, questionNumber }) => {
    setCurrentQuestion(question);
    setQuestionNumber(questionNumber);
    setTimeLeft(10);
    setSelectedOption(null);
    setIsCorrect(null);
    setOpponentAnswered(false);
});

// Game ended
sock.on('game-end', ({ players }) => {
    setPlayers(players);
    setBattleState('END');
});

// Error handling
sock.on('join-error', ({ message }) => {
    console.error('[Battle] Join error:', message);
    setJoinError(message);  // Display in UI
});

sock.on('game-error', ({ message }) => {
    console.error('[Battle] Game error:', message);
    alert(message);
});

sock.on('error', (err) => {
    console.error('[Battle] Socket.io error:', err);
    setJoinError('Connection error. Please try again.');
});
```


---

### Client-Side Event Emitters

```javascript
// Host creates room
const handleCreateRoom = (topicInfo) => {
    const sock = socketRef.current;
    if (sock) {
        sock.emit('create-room', { 
            playerId, 
            playerName: 'Player 1', 
            topicInfo 
        });
    }
};

// Guest joins room
const handleJoinRoom = (hostPlayerId) => {
    const sock = socketRef.current;
    setJoinError(null);  // Clear previous errors
    
    if (!sock) {
        setJoinError('Connection error. Please try again.');
        return;
    }
    
    const attemptJoin = () => {
        if (sock.connected) {
            sock.emit('join-room', { 
                roomId: hostPlayerId, 
                playerId, 
                playerName: 'Player 2' 
            });
            
            // Set 10-second timeout
            const joinTimeout = setTimeout(() => {
                setJoinError('Could not join room. The room may not exist or the host may not be ready.');
            }, 10000);
            
            // Clear timeout on success
            sock.once('room-joined', () => clearTimeout(joinTimeout));
            sock.once('player-joined', () => clearTimeout(joinTimeout));
            sock.once('join-error', () => clearTimeout(joinTimeout));
        } else {
            // Wait for connection
            let attempts = 0;
            const checkInterval = setInterval(() => {
                attempts++;
                if (sock.connected) {
                    clearInterval(checkInterval);
                    sock.emit('join-room', { roomId: hostPlayerId, playerId, playerName: 'Player 2' });
                } else if (attempts >= 50) {
                    clearInterval(checkInterval);
                    setJoinError('Connection timeout. Please try again.');
                }
            }, 100);
        }
    };
    
    attemptJoin();
};

// Player clicks Ready
const handleReady = () => {
    const rid = roomIdRef.current || roomId;
    const sock = socketRef.current;
    
    if (sock && rid) {
        sock.emit('player-ready', { roomId: rid });
    } else {
        console.error('[Ready] BLOCKED - missing socket or roomId');
    }
};

// Player submits answer
const handleAnswer = (optionIndex, responseTime) => {
    setSelectedOption(optionIndex);
    setIsCorrect(optionIndex === currentQuestion.correctOption);
    
    const rid = roomIdRef.current;
    const sock = socketRef.current;
    
    if (sock && rid) {
        sock.emit('submit-answer', {
            roomId: rid,
            answer: optionIndex,
            responseTime,
            correct: optionIndex === currentQuestion.correctOption
        });
    }
};

// Rematch
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

// Leave room
const handleLeaveRoom = () => {
    const rid = roomIdRef.current;
    const sock = socketRef.current;
    
    if (sock && rid) sock.emit('leave-room', { roomId: rid });
    
    // Reset all state
    roomIdRef.current = null;
    mySocketIdRef.current = null;
    setMode(null);
    setBattleRole(null);
    setTopicSelection(null);
    setBattleState('SETUP');
    setRoomId(null);
    setPlayers([]);
};
```


---

## STATE MACHINE (Battle Flow)

### Mode Selection
```
null → 'SOLO' or 'BATTLE'
```

### Battle Role Selection (if BATTLE)
```
null → 'HOST' or 'GUEST'
```

### Battle State Machine
```
SETUP → LOBBY → GAME → LEADERBOARD → GAME → ... → END
  ↓       ↓       ↓         ↓           ↓         ↓
Create  Ready  Answer   Show pts    Next Q    Final
 Room                                          Score
```

**State Transitions:**

| From | To | Trigger |
|---|---|---|
| null | SETUP | User selects HOST or GUEST |
| SETUP | LOBBY | Host creates room OR Guest joins room |
| LOBBY | GAME | Both players click Ready + questions generated |
| GAME | LEADERBOARD | Both players answer OR 10s timeout |
| LEADERBOARD | GAME | After 1.5s delay (if more questions) |
| LEADERBOARD | END | After 1.5s delay (if last question) |
| END | LOBBY | Player clicks Rematch |
| Any | null | Player clicks Exit/Leave |


---

## COMPONENT BREAKDOWN

### 1. BattlePracticeArea.js (Main Orchestrator)

**Responsibilities:**
- Socket connection management
- State machine (mode, battleRole, battleState)
- Event handler registration
- Routing to correct sub-component based on state

**Key State:**
```javascript
const [mode, setMode] = useState(null);                    // null | 'SOLO' | 'BATTLE'
const [battleRole, setBattleRole] = useState(null);        // null | 'HOST' | 'GUEST'
const [battleState, setBattleState] = useState('SETUP');   // SETUP | LOBBY | GAME | LEADERBOARD | END
const [roomId, setRoomId] = useState(null);                // Room ID (host's playerId)
const [players, setPlayers] = useState([]);                // Array of 2 players
const [currentQuestion, setCurrentQuestion] = useState(null);
const [questionNumber, setQuestionNumber] = useState(0);
const [timeLeft, setTimeLeft] = useState(10);
const [selectedOption, setSelectedOption] = useState(null);
const [streak, setStreak] = useState(0);
const [opponentAnswered, setOpponentAnswered] = useState(false);
const [joinError, setJoinError] = useState(null);
```

**Render Logic:**
```javascript
if (!mode) return <ModeSelector />;
if (mode === 'SOLO') return <SoloFlow />;
if (mode === 'BATTLE' && !battleRole) return <RoleSelector />;
if (battleRole === 'HOST' && !topicSelection) return <TopicSelector />;
if (battleRole === 'HOST' && battleState === 'SETUP') return <BattleSetup role="HOST" />;
if (battleRole === 'GUEST' && battleState === 'SETUP') return <BattleSetup role="GUEST" />;
if (battleState === 'LOBBY') return <Lobby />;
if (battleState === 'GAME') return <GameScreen />;
if (battleState === 'LEADERBOARD') return <QuestionLeaderboard />;
if (battleState === 'END') return <EndScreen />;
```

---

### 2. TopicSelector.js

**Purpose:** Choose battle topic (AUTO or CHOOSE mode)

**AUTO Mode:**
- Fetches weak topics from `/api/profile`
- Shows topics where student scored < 75% in past tests
- Automatically selects all weak topics

**CHOOSE Mode:**
- Fetches syllabus from `/api/syllabus/:grade`
- Shows subject buttons → chapter grid
- User selects one chapter

**Props:**
```javascript
{
    onSelect: (selection) => void,  // Callback with { mode, topics, subject }
    weakTopics: {},                 // From user_profile.json
    loading: boolean,
    studentClass: string            // e.g., "7th CBSE"
}
```


---

### 3. BattleSetup.js

**Purpose:** Host creates room, Guest joins room

**Host View:**
- Shows Player ID (e.g., "SPR3629")
- Copy button for sharing
- Shows selected topic
- "Create Battle Room" button → emits `create-room`

**Guest View:**
- Input field for host's Player ID
- "Join Battle" button → emits `join-room`
- Shows error message if room not found
- "Connecting..." state while joining

**Props:**
```javascript
{
    role: 'HOST' | 'GUEST',
    playerId: string,              // Random SPR#### ID
    topicSelection: {},            // (HOST only) Selected topic
    onCreateRoom: (topicInfo) => void,
    onJoinRoom: (hostPlayerId) => void,
    joinError: string | null       // (GUEST only) Error message
}
```

---

### 4. Lobby.js

**Purpose:** Two-player ready screen

**Display:**
- Topic badge (Auto or specific chapter)
- Two player cards (You + Opponent)
- Ready status (✅ or 👤)
- "I'm Ready!" button
- "Leave Room" button

**Props:**
```javascript
{
    players: [                     // Array of 2 players
        { id, name, ready, isCurrentUser },
        { id, name, ready, isCurrentUser }
    ],
    topicInfo: {},                 // Selected topic
    onReady: () => void,           // Emit player-ready
    onLeave: () => void            // Emit leave-room
}
```

**Logic:**
- Button disabled if already ready
- Shows "✓ Ready! Waiting for opponent..." when ready
- Shows "🚀 Starting battle..." when both ready


---

### 5. GameScreen.js

**Purpose:** Live quiz interface

**Display:**
- Top bar: Your score | Opponent score | Streak badge | Question progress
- Timer bar (green → yellow → red as time runs out)
- Question card with topic badge
- 4 MCQ options (A, B, C, D)
- After answering: shows correct (green) and wrong (red) options

**Props:**
```javascript
{
    question: {
        topic: string,
        question: string,
        options: [string, string, string, string],
        correctOption: number
    },
    timeLeft: number,              // 10 → 0
    streak: number,                // Current streak
    currentScore: number,          // Your score
    opponentScore: number,         // Opponent's score
    onAnswer: (optionIndex, responseTime) => void,
    selectedOption: number | null,
    isCorrect: boolean | null,
    questionNumber: number,        // 1-10
    totalQuestions: number,        // 10
    opponentAnswered: boolean      // Show checkmark if opponent answered first
}
```

**Timer Logic:**
```javascript
useEffect(() => {
    if (battleState === 'GAME' && timeLeft > 0 && selectedOption === null) {
        const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
        return () => clearTimeout(timer);
    } else if (timeLeft === 0 && selectedOption === null) {
        handleAnswer(-1, 10);  // Auto-submit wrong answer on timeout
    }
}, [battleState, timeLeft, selectedOption]);
```

---

### 6. QuestionLeaderboard.js

**Purpose:** Between-question score flash

**Display:**
- Two player cards sorted by score
- Shows points earned this question
- Crown emoji for current leader
- "You" label for current player

**Props:**
```javascript
{
    players: [
        { 
            id, 
            name, 
            score, 
            pointsEarned,      // Points from last question
            isCurrentUser 
        },
        { ... }
    ]
}
```

**Duration:** Shows for 1.5 seconds, then auto-transitions to next question


---

### 7. EndScreen.js

**Purpose:** Final scoreboard

**Display:**
- Winner announcement (🏆 You Won! / 💪 Good Effort! / 🤝 It's a Tie!)
- Final scores for both players
- Max streak for each player
- Victory margin (point difference)
- Rematch button
- Exit to Practice button

**Props:**
```javascript
{
    players: [
        { 
            id, 
            name, 
            score, 
            maxStreak, 
            isCurrentUser 
        },
        { ... }
    ],
    onRematch: () => void,         // Emit rematch event
    onExit: () => void             // Emit leave-room event
}
```

**Logic:**
```javascript
const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
const winner = sortedPlayers[0];
const currentPlayer = players.find(p => p.isCurrentUser);
const isWinner = currentPlayer?.id === winner.id;
const isTie = sortedPlayers[0].score === sortedPlayers[1]?.score;
```

---

## QUESTION GENERATION (Backend)

```javascript
async function generateBattleQuestions(topicInfo, studentClass = '6th CBSE') {
    const topicNames = topicInfo.topics || [];
    const topicStr = topicNames.join(', ');
    
    // Retrieve RAG context for each topic
    const ragResults = [];
    for (const topic of topicNames) {
        const chunks = await retrieve(`${studentClass} ${topic}`, 3);
        ragResults.push(...chunks);
    }
    
    const context = ragResults.map(r => r.metadata.text).join('\n\n');
    
    const prompt = `
        You are a CBSE exam question generator for ${studentClass}.
        Topics: ${topicStr}
        
        Context from textbook:
        ${context}
        
        Generate EXACTLY 10 multiple-choice questions.
        Mix difficulty: 4 easy, 4 medium, 2 hard.
        
        Return JSON: { questions: [{id, topic, type, question, options:[], correctOption:0}] }.
        Use only "Multiple Choice" type. Exactly 10 questions.
    `;
    
    const aiResponse = await generateWithFallback(prompt);
    const result = extractJSON(aiResponse);
    return result.questions || [];
}
```

**RAG Integration:**
- Retrieves 3 textbook chunks per topic
- Injects context into prompt
- Ensures questions are curriculum-aligned


---

## COMPLETE DATA FLOW (End-to-End)

### 1. Room Creation (Host)

```
User clicks "Host a Battle"
    ↓
BattlePracticeArea: setMode('BATTLE'), setBattleRole('HOST')
    ↓
Socket connects: io(API_URL)
    ↓
TopicSelector: User selects topic (AUTO or CHOOSE)
    ↓
BattleSetup (HOST): Shows Player ID, "Create Battle Room" button
    ↓
User clicks button → handleCreateRoom(topicInfo)
    ↓
Client emits: socket.emit('create-room', { playerId, playerName, topicInfo })
    ↓
Server: Creates room in battleRooms Map, socket.join(roomId)
    ↓
Server emits: socket.emit('room-created', { roomId })
    ↓
Server broadcasts: io.to(roomId).emit('player-joined', { players, topicInfo, roomId })
    ↓
Client receives: room-created → setBattleState('LOBBY')
    ↓
Lobby: Shows "Waiting for opponent to join..."
```

---

### 2. Room Joining (Guest)

```
User clicks "Join a Battle"
    ↓
BattlePracticeArea: setMode('BATTLE'), setBattleRole('GUEST')
    ↓
Socket connects: io(API_URL)
    ↓
BattleSetup (GUEST): Input field for Player ID
    ↓
User enters "SPR3629" → clicks "Join Battle"
    ↓
handleJoinRoom('SPR3629')
    ↓
Client emits: socket.emit('join-room', { roomId: 'SPR3629', playerId, playerName })
    ↓
Server: Checks if room exists
    ↓
If NOT found → socket.emit('join-error', { message: 'Room not found...' })
    ↓
If found → Add player to room.players, socket.join(roomId)
    ↓
Server emits: socket.emit('room-joined', { players, topicInfo, roomId, yourSocketId })
    ↓
Server broadcasts: io.to(roomId).emit('player-joined', { players, topicInfo, roomId })
    ↓
Client receives: room-joined → setBattleState('LOBBY')
    ↓
Lobby: Shows both players, "I'm Ready!" button
```

---

### 3. Game Start

```
Both players in Lobby
    ↓
Player 1 clicks "I'm Ready!" → socket.emit('player-ready', { roomId })
    ↓
Server: Sets player.ready = true, broadcasts player-joined
    ↓
Player 2 clicks "I'm Ready!" → socket.emit('player-ready', { roomId })
    ↓
Server: Sets player.ready = true, checks if allReady
    ↓
allReady = true → room.state = 'GENERATING'
    ↓
Server: await generateBattleQuestions(topicInfo) → 10 MCQs
    ↓
room.state = 'GAME', room.questions = [...]
    ↓
Server broadcasts: io.to(roomId).emit('game-start', { question, questionNumber: 1 })
    ↓
Server: startQuestionTimer(roomId) → 11-second timeout
    ↓
Both clients receive: game-start → setBattleState('GAME')
    ↓
GameScreen: Shows question, timer starts counting down
```


---

### 4. Answering Questions

```
Player 1 clicks option B (index 1) after 3.5 seconds
    ↓
handleAnswer(1, 3.5)
    ↓
Client: setSelectedOption(1), setIsCorrect(true/false)
    ↓
Client emits: socket.emit('submit-answer', { roomId, answer: 1, responseTime: 3.5, correct: true })
    ↓
Server: Validates answer, calculates points (100/75/50 based on speed)
    ↓
If correct: player.score += points, player.streak++, if streak >= 3: points += 25
    ↓
If wrong: player.streak = 0
    ↓
Server: room.answers[qIdx][socket.id] = { answer, points, correct }
    ↓
Server broadcasts: io.to(roomId).emit('score-update', { players })
    ↓
Both clients receive: score-update → setPlayers(players)
    ↓
GameScreen: Scores update in real-time, opponent sees checkmark ✓
    ↓
Player 2 clicks option C (index 2) after 7 seconds
    ↓
Same flow as Player 1...
    ↓
Server: answeredCount = 2 (both answered) → resolveQuestion(roomId)
    ↓
Server: clearTimeout(questionTimer)
    ↓
Server broadcasts: io.to(roomId).emit('question-result', { players, correctOption })
    ↓
Both clients receive: question-result → setBattleState('LEADERBOARD')
    ↓
QuestionLeaderboard: Shows points earned, sorted by score
    ↓
After 1.6 seconds...
    ↓
Server: room.currentQuestionIndex++
    ↓
If more questions → io.to(roomId).emit('next-question', { question, questionNumber })
    ↓
If last question → io.to(roomId).emit('game-end', { players })
    ↓
Both clients: setBattleState('GAME') or setBattleState('END')
```

---

### 5. Game End & Rematch

```
Last question resolved
    ↓
Server: room.state = 'END'
    ↓
Server broadcasts: io.to(roomId).emit('game-end', { players })
    ↓
Both clients receive: game-end → setBattleState('END')
    ↓
EndScreen: Shows winner, final scores, max streaks, victory margin
    ↓
Player clicks "🔄 Rematch"
    ↓
handleRematch() → socket.emit('rematch', { roomId })
    ↓
Server: Resets all player stats, room.state = 'LOBBY'
    ↓
Server broadcasts: io.to(roomId).emit('player-joined', { players, topicInfo, roomId })
    ↓
Both clients: setBattleState('LOBBY')
    ↓
Back to Lobby, both players click Ready again...
```

---

## ERROR HANDLING & EDGE CASES

### 1. Room Not Found
```
Guest enters invalid Player ID → Server emits join-error → UI shows error message
```

### 2. Connection Timeout
```
Guest clicks Join → 10-second timeout → No response → UI shows "Could not join room..."
```

### 3. Socket Disconnect During Game
```
Player disconnects → socket.on('disconnect') fires → Remove player from room
    ↓
If room empty → battleRooms.delete(roomId)
    ↓
If opponent still in room → io.to(roomId).emit('player-joined', { players })
    ↓
Opponent sees player count drop to 1
```

### 4. Question Generation Failure
```
Gemini API error → catch block → room.state = 'LOBBY'
    ↓
Server emits: io.to(roomId).emit('game-error', { message: 'Failed to generate questions...' })
    ↓
Both players: Reset ready states, stay in Lobby
```

### 5. React StrictMode Double-Invoke
```
In development, React calls useEffect twice
    ↓
First call: Creates room "SPR3629"
    ↓
Second call: Tries to create same room
    ↓
Server: if (battleRooms.has(roomId)) → Re-emit room-created, don't create duplicate
```


---

## TESTING & DEBUGGING

### Running the Application

**Terminal 1 (Backend):**
```bash
cd Buddy/backend
node src/server.js
```
Output:
```
Server running on port 5001
[Battle] Player connected: abc123...
```

**Terminal 2 (Frontend):**
```bash
cd Buddy/frontend
npm run dev
```
Output:
```
▲ Next.js 16.1.6
- Local: http://localhost:3000
```

**Browser 1 (Host):**
```
http://localhost:3000/analyze
→ Practice tab → Battle Mode → Host a Battle
→ Select topic → Create Battle Room
→ Copy Player ID: SPR3629
```

**Browser 2 (Guest):**
```
http://localhost:3000/analyze (incognito/different browser)
→ Practice tab → Battle Mode → Join a Battle
→ Paste Player ID: SPR3629 → Join Battle
```

---

### Console Logs to Watch

**Backend:**
```
[Battle] Player connected: vfqp7o4iZsrHHRMmAABv
[Battle] Room created: SPR3629
[Battle] join-room received from HyXMA2I1qI2XJGK4AABt for room SPR3629
[Battle] Added new player SPR7841 to room SPR3629
[Battle] Emitted room-joined to HyXMA2I1qI2XJGK4AABt
[Battle] Player joined room: SPR3629, total players: 2
[Battle] player-ready from vfqp7o4iZsrHHRMmAABv in room SPR3629
[Battle] player-ready from HyXMA2I1qI2XJGK4AABt in room SPR3629
[Battle] Ready check: players: 2 allReady: true state: LOBBY
[Battle] Starting question generation...
[Battle] Game started with 10 questions
```

**Frontend (Host):**
```
[Battle] Initializing socket connection to: http://localhost:5001
[Battle] Socket connected: vfqp7o4iZsrHHRMmAABv
[room-created] Received: SPR3629
[player-joined] Received: { rid: 'SPR3629', playersCount: 1 }
[player-joined] Received: { rid: 'SPR3629', playersCount: 2 }
[Ready] Clicked. roomId (ref): SPR3629
[Ready] Emitted player-ready to room: SPR3629
[Battle] Score update received: [...]
```

**Frontend (Guest):**
```
[Battle] Socket connected: HyXMA2I1qI2XJGK4AABt
[Join] Attempting to join room: SPR3629
[Join] Socket connected, emitting join-room
[room-joined] Event received! { rid: 'SPR3629', yourSocketId: 'HyXMA2I1qI2XJGK4AABt' }
[player-joined] Received: { rid: 'SPR3629', playersCount: 2 }
[Ready] Clicked. roomId (ref): SPR3629
[Battle] Score update received: [...]
```

---

### Common Issues & Solutions

**Issue:** Guest stuck on "Connecting..."
**Cause:** `room-joined` event not received
**Solution:** Check server logs for `join-room received` and `Emitted room-joined`. If present, issue is client-side listener timing. Fallback logic in `player-joined` should handle this.

**Issue:** Ready button doesn't work
**Cause:** `roomId` is null
**Solution:** Check `roomIdRef.current` in console logs. Should be set by `room-joined` or `player-joined` fallback.

**Issue:** Scores not updating in real-time
**Cause:** `score-update` event not registered
**Solution:** Check socket listener registration in useEffect. Should see `[Battle] Score update received` in console.

**Issue:** Game doesn't start after both players ready
**Cause:** Question generation failed
**Solution:** Check backend logs for `[Battle] Question generation failed`. Verify Gemini API key is valid.

**Issue:** Timer doesn't count down
**Cause:** `timeLeft` state not updating
**Solution:** Check useEffect with `timeLeft` dependency. Should decrement every second.


---

## PERFORMANCE & SCALABILITY

### Current Limitations

**In-Memory Storage:**
- All rooms stored in `battleRooms` Map
- Data lost on server restart
- No persistence between sessions

**Single Server:**
- All connections to one Node.js process
- No horizontal scaling
- Limited to ~10,000 concurrent connections

**No Authentication:**
- Player IDs are random (SPR####)
- No user accounts or session management
- Anyone with room ID can join

---

### Production Improvements (Future)

**1. Redis for Room State:**
```javascript
const redis = require('redis');
const client = redis.createClient();

// Store room in Redis instead of Map
await client.set(`room:${roomId}`, JSON.stringify(room));
const room = JSON.parse(await client.get(`room:${roomId}`));
```

**2. Socket.io Redis Adapter (Multi-Server):**
```javascript
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');

const pubClient = createClient({ host: 'localhost', port: 6379 });
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));
```
Allows multiple backend servers to share Socket.io rooms.

**3. Database for History:**
```javascript
// Store battle results in MongoDB/PostgreSQL
await db.battles.insert({
    roomId,
    players: [...],
    winner: playerId,
    finalScores: {...},
    timestamp: Date.now()
});
```

**4. JWT Authentication:**
```javascript
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    jwt.verify(token, SECRET, (err, decoded) => {
        if (err) return next(new Error('Authentication error'));
        socket.userId = decoded.userId;
        next();
    });
});
```

**5. Rate Limiting:**
```javascript
const rateLimiter = new Map();

socket.on('submit-answer', ({ roomId, answer }) => {
    const key = `${socket.id}:submit`;
    const now = Date.now();
    const lastSubmit = rateLimiter.get(key) || 0;
    
    if (now - lastSubmit < 500) {  // Max 1 submit per 500ms
        return socket.emit('error', { message: 'Too many requests' });
    }
    
    rateLimiter.set(key, now);
    // ... process answer
});
```

---

## ENVIRONMENT VARIABLES

**Backend (.env):**
```
GEMINI_API_KEY=AIzaSy...           # Google AI Studio API key
GROQ_API_KEY=gsk_...               # Groq API key (fallback)
ALLOWED_ORIGIN=http://localhost:3000   # CORS whitelist
```

**Frontend (.env.local):**
```
NEXT_PUBLIC_API_URL=http://localhost:5001   # Backend URL
```

---

## FILE SUMMARY

### Backend Files Modified/Added
- `Buddy/backend/src/server.js` — Added Socket.io server, battle event handlers (lines 27-30, 370-650)
- `Buddy/backend/package.json` — Added `socket.io` dependency

### Frontend Files Added
- `Buddy/frontend/components/BattlePracticeArea.js` — Main orchestrator (700+ lines)
- `Buddy/frontend/components/TopicSelector.js` — Topic selection UI (400+ lines)
- `Buddy/frontend/components/BattleSetup.js` — Host/Guest setup screens (200+ lines)
- `Buddy/frontend/components/Lobby.js` — Ready screen (200+ lines)
- `Buddy/frontend/components/GameScreen.js` — Live quiz UI (300+ lines)
- `Buddy/frontend/components/QuestionLeaderboard.js` — Score flash (150+ lines)
- `Buddy/frontend/components/EndScreen.js` — Final scoreboard (250+ lines)
- `Buddy/frontend/package.json` — Added `socket.io-client` dependency

### Data Files Used
- `Buddy/backend/data/history_{studentId}.json` — Answer sheet analysis history (for weak topics)
- `Buddy/backend/data/user_profile.json` — Weak topics tracker (for Auto mode)
- `Buddy/backend/data/syllabus.json` — CBSE syllabus (for Choose mode)

---

## CONCLUSION

Battle Mode is a complete real-time multiplayer quiz system built on Socket.io. It demonstrates:

✅ Bidirectional WebSocket communication
✅ Room-based broadcasting
✅ Real-time state synchronization
✅ Event-driven architecture
✅ Graceful error handling
✅ Responsive UI with live updates
✅ Integration with existing RAG system for question generation

The implementation is production-ready for small-scale use (< 100 concurrent users) and can be scaled with Redis and load balancing for larger deployments.

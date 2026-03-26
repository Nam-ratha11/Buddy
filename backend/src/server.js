const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Groq = require("groq-sdk");
const fs = require('fs');
const path = require('path');
const { retrieve } = require('./rag');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config({ path: path.join(__dirname, '../.env') });

const PROFILE_PATH = path.join(__dirname, '../data/user_profile.json');
function getProfile() {
    if (!fs.existsSync(PROFILE_PATH)) return { weakTopics: {} };
    try { return JSON.parse(fs.readFileSync(PROFILE_PATH, 'utf8')); } catch (e) { return { weakTopics: {} }; }
}
function saveProfile(profile) {
    fs.writeFileSync(PROFILE_PATH, JSON.stringify(profile, null, 2));
}

const app = express();
const port = 5001;

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
    cors: { origin: process.env.ALLOWED_ORIGIN || 'http://localhost:3000', methods: ['GET', 'POST'] }
});

app.use(cors({ origin: process.env.ALLOWED_ORIGIN || 'http://localhost:3000' }));
app.use(express.json());

const generalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(generalLimiter);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

const HISTORY_FILE = path.join(__dirname, '../data/history.json');
if (!fs.existsSync(path.join(__dirname, '../data'))) fs.mkdirSync(path.join(__dirname, '../data'));
const readHistory = async (studentId) => {
    try {
        const file = path.join(__dirname, `../data/history_${studentId}.json`);
        if (!fs.existsSync(file)) return [];
        return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (e) { return []; }
};
const saveHistory = async (studentId, history) => {
    const file = path.join(__dirname, `../data/history_${studentId}.json`);
    fs.writeFileSync(file, JSON.stringify(history, null, 2));
};

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
let syllabusData = {};
try {
    const syllabusPath = path.join(__dirname, '../data/syllabus.json');
    if (fs.existsSync(syllabusPath)) syllabusData = JSON.parse(fs.readFileSync(syllabusPath, 'utf8'));
} catch (e) { console.error("Syllabus Load Error:", e.message); }

function extractJSON(text) {
    try { return JSON.parse(text); } catch {}
    const match = text.match(/\{[\s\S]*\}/s);
    if (match) return JSON.parse(match[0]);
    throw new Error('No JSON found');
}

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Sleep helper for quota backoff
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- FALLBACK-ENABLED AI HANDLER ---
async function generateWithFallback(prompt, parts = [], temperature = 0.7, forceJSON = false) {
    const geminiModels = ["gemini-2.0-flash", "gemini-flash-latest", "gemini-pro-latest", "gemini-2.5-flash-lite"];
    let lastError = null;

    // 1. Try Gemini Models
    for (const modelName of geminiModels) {
        try {
            console.log(`[AI] Attempting ${modelName}...`);
            const modelConfig = { model: modelName };
            
            // Enable JSON mode for Gemini if requested
            if (forceJSON) {
                modelConfig.generationConfig = {
                    responseMimeType: "application/json"
                };
            }
            
            const model = genAI.getGenerativeModel(modelConfig);
            const result = await model.generateContent([prompt, ...parts]);
            return (await result.response).text();
        } catch (e) {
            lastError = e;
            console.error(`[AI] ${modelName} Failed:`, e.message);
            // Continue to next model on any error
            if (e.message.includes("429") || e.message.includes("quota") || e.message.includes("limit") || e.message.includes("503")) {
                console.log(`[AI] ${modelName} unavailable, trying next model...`);
                await sleep(1000);
                continue;
            }
            // For other errors, also continue to next model
            console.log(`[AI] ${modelName} error, trying next model...`);
            continue;
        }
    }

    // 2. Final Fallback to Groq (if it's a text-only prompt)
    if (parts.length === 0) {
        try {
            console.log(`[AI] Gemini exhausted. Attempting Groq (llama-3.3-70b-versatile)...`);
            const requestConfig = {
                messages: [{ role: "user", content: prompt }],
                model: "llama-3.3-70b-versatile",
                temperature: temperature,
            };
            
            // Enable JSON mode for Groq if requested
            if (forceJSON) {
                requestConfig.response_format = { type: "json_object" };
            }
            
            const completion = await groq.chat.completions.create(requestConfig);
            return completion.choices[0].message.content;
        } catch (e) {
            console.error(`[AI] Groq Fallback Failed:`, e.message);
            lastError = e;
        }
    }

    throw new Error(`AI exhausted all fallbacks. Last error: ${lastError.message}`);
}

async function analyzeAnswerSheet(questionFile, answerFile, studentClass = "6th CBSE", subject = null) {
    const syllabusContext = JSON.stringify(syllabusData[studentClass] || {});
    const prompt = `
        Vision Teacher. Extract human markings for score/mistakes from sheet. Map to syllabus: ${syllabusContext}
        Return JSON: {overallScore, totalMarks, questions: [{id, topic, question, studentAnswer, correctAnswer, marksObtained, maxMarks, feedback, mistakeType}]}.
    `;

    const parts = [];
    if (questionFile) parts.push({ inlineData: { data: questionFile.buffer.toString("base64"), mimeType: questionFile.mimetype } });
    parts.push({ inlineData: { data: answerFile.buffer.toString("base64"), mimeType: answerFile.mimetype } });

    const aiResponse = await generateWithFallback(prompt, parts);
    const resultJson = extractJSON(aiResponse);

    if (resultJson.questions) {
        for (let q of resultJson.questions) {
            if (q.marksObtained < q.maxMarks) {
                try {
                    const proofs = await retrieve(`${q.topic}: ${q.question}`, 1);
                    if (proofs.length > 0) {
                        q.proof = { source: proofs[0].source, page: proofs[0].page || proofs[0].chunk || "Curriculum", text: proofs[0].text };
                    }
                } catch (e) {}
            }
        }
    }
    return resultJson;
}

app.post('/api/analyze', upload.fields([{ name: 'questionFile' }, { name: 'answerFile' }]), async (req, res) => {
    try {
        const studentId = req.body.studentId || 'default';
        const evaluation = await analyzeAnswerSheet(req.files?.['questionFile']?.[0], req.files?.['answerFile']?.[0], req.body.studentClass, req.body.subject);
        const history = await readHistory(studentId);
        const newItem = { timestamp: Date.now(), data: { ...evaluation, studentClass: req.body.studentClass || '6th CBSE' } };
        saveHistory(studentId, [newItem, ...history].slice(0, 50));

        const profile = getProfile();
        evaluation.questions.forEach(q => {
            if (q.marksObtained < q.maxMarks) {
                profile.weakTopics[q.topic.toLowerCase().trim()] = { name: q.topic, status: 'Pending', lastSeen: new Date().toISOString() };
            }
        });
        saveProfile(profile);
        res.json(newItem);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/syllabus/:grade', (req, res) => res.json(syllabusData[req.params.grade] || {}));
app.get('/api/history', async (req, res) => res.json(await readHistory(req.query.studentId || 'default')));
app.delete('/api/history/:timestamp', async (req, res) => {
    const studentId = req.query.studentId || 'default';
    let history = await readHistory(studentId);
    history = history.filter(h => h.timestamp !== parseInt(req.params.timestamp));
    saveHistory(studentId, history);
    res.json({ success: true });
});

app.get('/api/proof', async (req, res) => {
    try {
        const { topic, question } = req.query;
        const proofs = await retrieve(`${topic}: ${question}`, 1);
        if (proofs.length > 0) {
            res.json({
                source: proofs[0].source,
                page: proofs[0].page || proofs[0].chunk || "Curriculum",
                text: proofs[0].text
            });
        } else {
            res.json(null);
        }
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/profile', (req, res) => res.json(getProfile()));

app.post('/api/remediate', async (req, res) => {
    try {
        console.log('[remediate] API called - VERSION 3.0');
        const { topic, grade, mistakeType, feedback } = req.body;
        console.log('[remediate] Request:', { topic, grade });
        
        // Skip RAG retrieval to reduce token usage and complexity
        const prompt = `You are a JSON API for ${grade} CBSE education. Return ONLY valid JSON for topic: "${topic}"

JSON Schema (REQUIRED - fill every field):
{
  "topic": "${topic}",
  "hook": {"title": "catchy title", "explanation": "2 sentences"},
  "chapterExplanation": {
    "overview": "4 sentences about ${topic}",
    "keyConcepts": [
      {"heading": "concept name", "explanation": "3 sentences", "example": "real example"}
    ],
    "importantTerms": [{"term": "term", "definition": "definition"}]
  },
  "conceptMap": "flowchart TD\\n  A[${topic}] --> B[Concept1]\\n  A --> C[Concept2]",
  "youtubeSearchQuery": "Class ${grade} ${topic} NCERT",
  "commonMistakes": [{"mistake": "error", "correction": "fix", "example": "example"}],
  "proTips": ["tip1", "tip2", "tip3"]
}

Rules:
1. Return ONLY the JSON object
2. conceptMap must be valid mermaid flowchart syntax
3. Include 2+ keyConcepts, 2+ terms, 2+ mistakes, 3+ tips
4. NO markdown, NO extra text`;

        let aiResponse;
        let lesson;
        
        try {
            aiResponse = await generateWithFallback(prompt, [], 0.7, true);
            console.log('[remediate] Raw AI response length:', aiResponse.length);
            console.log('[remediate] First 200 chars:', aiResponse.substring(0, 200));
            lesson = extractJSON(aiResponse);
        } catch (parseError) {
            console.error('[remediate] JSON parse failed, using fallback structure');
            // If JSON parsing fails completely, create a basic structure from the text
            lesson = {
                topic: topic,
                hook: {
                    title: `Understanding ${topic}`,
                    explanation: `Let's explore ${topic} in an easy way.`
                },
                chapterExplanation: {
                    overview: aiResponse.substring(0, 500) || `${topic} is an important concept in ${grade} CBSE curriculum.`,
                    keyConcepts: [
                        {
                            heading: `Core Concept of ${topic}`,
                            explanation: aiResponse.substring(500, 800) || `This concept helps understand ${topic} better.`,
                            example: `Example related to ${topic}`
                        }
                    ],
                    importantTerms: [
                        { term: topic, definition: `Key term in this lesson` }
                    ]
                },
                commonMistakes: [
                    { mistake: "Common error", correction: "Correct approach", example: "Example" }
                ],
                proTips: ["Study regularly", "Practice problems", "Ask questions"]
            };
        }
        
        // ALWAYS ensure these fields exist
        if (!lesson.conceptMap) {
            lesson.conceptMap = `flowchart TD\n  A[${topic}] --> B[Definition]\n  A --> C[Applications]\n  B --> D[Key Points]\n  C --> E[Examples]\n  D --> F[Remember]\n  E --> F`;
            console.log('[remediate] Added fallback conceptMap');
        }
        
        if (!lesson.youtubeSearchQuery) {
            lesson.youtubeSearchQuery = `Class ${grade} CBSE ${topic} NCERT explanation`;
            console.log('[remediate] Added fallback youtubeSearchQuery');
        }
        
        console.log('[remediate] Final lesson has conceptMap:', !!lesson.conceptMap);
        console.log('[remediate] Final lesson has youtubeSearchQuery:', !!lesson.youtubeSearchQuery);
        
        // Add empty sources array
        lesson.sources = [];

        res.json(lesson);
    } catch (e) { 
        console.error('[remediate] Error:', e.message);
        res.status(500).json({ error: e.message }); 
    }
});

app.post('/api/flashcards', async (req, res) => {
    try {
        const { topic, subject, grade } = req.body;
        const ragChunks = await retrieve(`${grade} ${subject} ${topic}`, 6);
        const prompt = `
You are an expert teacher. Create a set of 6 flashcards on the topic "${topic}" (Subject: ${subject}, Grade: ${grade}).
Context from textbook: ${JSON.stringify(ragChunks)}.

Return ONLY valid JSON with this exact structure:
{
  "cards": [
    {
      "topic": "sub-topic or concept name",
      "subject": "${subject}",
      "summary": "1-2 sentence plain-language summary shown on the front of the card",
      "keyPoints": ["concise point 1", "concise point 2", "concise point 3"],
      "memoryTip": "a short mnemonic or memory trick (optional, can be null)"
    }
  ]
}
Make each card cover a distinct concept within the topic. Keep language simple for Grade ${grade} students.`;
        const aiResponse = await generateWithFallback(prompt);
        res.json(extractJSON(aiResponse));
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/chat', async (req, res) => {
    try {
        const { message, grade, topic, history } = req.body;
        
        // Detect if user is asking for a topic explanation (trigger structured response)
        const explainKeywords = ['explain', 'what is', 'tell me about', 'teach me', 'help me understand', 'how does', 'define'];
        const isExplanationRequest = explainKeywords.some(keyword => message.toLowerCase().includes(keyword));
        
        // If it's an explanation request and we can extract a topic, use remediate format
        if (isExplanationRequest) {
            console.log('[chat] Detected explanation request, using structured format');
            
            // Extract topic from message (e.g., "explain me heat" -> "heat")
            let extractedTopic = topic || 'General';
            const words = message.toLowerCase().replace(/explain|tell me about|what is|teach me|help me understand|how does|define|me|about/g, '').trim();
            if (words.length > 0 && words.length < 50) {
                extractedTopic = words;
            }
            
            const prompt = `You are a JSON API for ${grade} CBSE education. Create a lesson on: "${extractedTopic}"

Return ONLY valid JSON (no markdown, no extra text):
{
  "topic": "${extractedTopic}",
  "hook": {"title": "catchy title", "explanation": "2 sentences"},
  "chapterExplanation": {
    "overview": "4 sentences about the topic",
    "keyConcepts": [
      {"heading": "concept name", "explanation": "3 sentences", "example": "real example"}
    ],
    "importantTerms": [{"term": "term", "definition": "definition"}]
  },
  "conceptMap": "flowchart TD\\n  A[${extractedTopic}] --> B[Concept1]\\n  A --> C[Concept2]",
  "youtubeSearchQuery": "Class ${grade} ${extractedTopic} NCERT",
  "commonMistakes": [{"mistake": "error", "correction": "fix", "example": "example"}],
  "proTips": ["tip1", "tip2", "tip3"]
}

Rules: conceptMap must be valid mermaid flowchart, include 2+ keyConcepts, 2+ terms, 2+ mistakes, 3+ tips`;

            let aiResponse;
            let lesson;
            
            try {
                aiResponse = await generateWithFallback(prompt, [], 0.7, true);
                lesson = extractJSON(aiResponse);
            } catch (parseError) {
                console.error('[chat] JSON parse failed, creating fallback');
                lesson = {
                    topic: extractedTopic,
                    hook: { title: `Understanding ${extractedTopic}`, explanation: `Let's explore ${extractedTopic}.` },
                    chapterExplanation: {
                        overview: aiResponse?.substring(0, 500) || `${extractedTopic} is an important concept.`,
                        keyConcepts: [{ heading: `Core Concept`, explanation: aiResponse?.substring(500, 800) || `Key information about ${extractedTopic}.`, example: `Example` }],
                        importantTerms: [{ term: extractedTopic, definition: `Key term` }]
                    },
                    commonMistakes: [{ mistake: "Common error", correction: "Correct approach", example: "Example" }],
                    proTips: ["Study regularly", "Practice problems", "Ask questions"]
                };
            }
            
            // ALWAYS ensure these fields exist
            if (!lesson.conceptMap) {
                lesson.conceptMap = `flowchart TD\n  A[${extractedTopic}] --> B[Definition]\n  A --> C[Applications]\n  B --> D[Key Points]\n  C --> E[Examples]`;
            }
            if (!lesson.youtubeSearchQuery) {
                lesson.youtubeSearchQuery = `Class ${grade} ${extractedTopic} NCERT explanation`;
            }
            
            lesson.sources = [];
            
            // Return as explanation type message
            res.json({ role: 'bot', type: 'explanation', data: lesson });
        } else {
            // Regular chat response (follow-up questions, clarifications)
            const ragChunks = await retrieve(`${grade} ${topic} ${message}`, 3);
            const contextStr = ragChunks.map(c => c.text).join('\n').substring(0, 800);
            
            let conversationContext = '';
            if (history && history.length > 0) {
                conversationContext = history.slice(-4).map(h => `${h.role}: ${h.content}`).join('\n');
            }
            
            const prompt = `You are a ${grade} CBSE tutor. Answer the student's question clearly and concisely.

${conversationContext ? `Previous conversation:\n${conversationContext}\n` : ''}
Context: ${contextStr}

Student question: ${message}

Provide a helpful, friendly response in 2-3 sentences.`;

            const aiResponse = await generateWithFallback(prompt);
            res.json({ role: 'bot', type: 'text', content: aiResponse });
        }
    } catch (e) { 
        console.error('[chat] Error:', e.message);
        res.status(500).json({ error: e.message }); 
    }
});

app.post('/api/mastery', (req, res) => {
    const profile = getProfile();
    const topicKey = req.body.topic.toLowerCase().trim();
    if (profile.weakTopics[topicKey]) { profile.weakTopics[topicKey].status = 'Resolved'; saveProfile(profile); }
    res.json({ success: true });
});

app.post('/api/generate-practice', async (req, res) => {
    try {
        const { topics, studentClass, selectedTypes } = req.body;
        
        console.log('[generate-practice] Request:', { topics, studentClass, selectedTypes });
        
        // Skip vector store retrieval to avoid token limits
        // Generate questions based on topic names only
        const topicsList = topics.join(', ');

        // Ultra-concise prompt
        const prompt = `Generate 5 ${selectedTypes[0] || 'Multiple Choice'} questions for ${studentClass} students on: ${topicsList}

Return ONLY this JSON format:
{"questions":[{"id":1,"topic":"${topics[0]}","type":"${selectedTypes[0] || 'Multiple Choice'}","question":"...","options":["A","B","C","D"],"correctOption":0,"modelAnswer":"..."}]}`;

        console.log('[generate-practice] Prompt length:', prompt.length);
        const aiResponse = await generateWithFallback(prompt);
        const result = extractJSON(aiResponse);
        console.log('[generate-practice] Generated questions:', result.questions?.length || 0);
        res.json(result);
    } catch (e) { 
        console.error('[generate-practice] Error:', e.message);
        res.status(500).json({ error: e.message }); 
    }
});

app.post('/api/evaluate-practice-solution', async (req, res) => {
    try {
        const { question, studentAnswer, modelAnswer } = req.body;
        const prompt = `
            Question: ${question}
            Model Answer: ${modelAnswer}
            Student's Answer: ${studentAnswer}
            Grade accurately. Return ONLY valid JSON with this exact structure:
            { "score": 0-100, "feedback": "overall feedback string", "analysis": { "strengths": ["strength1", "strength2"], "improvements": ["missing point 1", "missing point 2"] } }
        `;
        const aiResponse = await generateWithFallback(prompt);
        res.json(extractJSON(aiResponse));
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── SOCKET.IO BATTLE MODE ───────────────────────────────────────────────────

const battleRooms = new Map(); // roomId -> room state

function calcPoints(responseTime) {
    if (responseTime <= 3) return 100;
    if (responseTime <= 6) return 75;
    return 50;
}

async function generateBattleQuestions(topicInfo, studentClass = '6th CBSE') {
    const topics = topicInfo.topics || [];
    const topicsList = topics.join(', ');
    
    // Ultra-concise prompt without vector store retrieval
    const prompt = `Generate 10 Multiple Choice questions for ${studentClass} on: ${topicsList}

Return ONLY this JSON:
{"questions":[{"id":1,"topic":"${topics[0] || 'General'}","type":"Multiple Choice","question":"...","options":["A","B","C","D"],"correctOption":0}]}`;
    
    console.log('[Battle] Prompt length:', prompt.length);
    const aiResponse = await generateWithFallback(prompt);
    const result = extractJSON(aiResponse);
    return result.questions || [];
}

io.on('connection', (socket) => {
    console.log(`[Battle] Player connected: ${socket.id}`);

    socket.on('create-room', async ({ playerId, playerName, topicInfo }) => {
        const roomId = playerId;
        // If room already exists (StrictMode double-invoke), just re-emit
        if (battleRooms.has(roomId)) {
            const room = battleRooms.get(roomId);
            const existing = room.players.find(p => p.playerId === playerId);
            if (existing) existing.id = socket.id;
            socket.join(roomId);
            socket.emit('room-created', { roomId });
            io.to(roomId).emit('player-joined', { players: room.players, topicInfo: room.topicInfo, roomId });
            return;
        }
        const room = {
            id: roomId, topicInfo,
            players: [{ id: socket.id, playerId, name: playerName || playerId, score: 0, streak: 0, maxStreak: 0, ready: false, isHost: true }],
            questions: [], currentQuestionIndex: 0, answers: {}, state: 'LOBBY'
        };
        battleRooms.set(roomId, room);
        socket.join(roomId);
        socket.emit('room-created', { roomId });
        io.to(roomId).emit('player-joined', { players: room.players, topicInfo: room.topicInfo, roomId });
        console.log(`[Battle] Room created: ${roomId}`);
    });

    socket.on('join-room', ({ roomId, playerId, playerName }) => {
        console.log(`[Battle] join-room received from ${socket.id} for room ${roomId}`);
        const room = battleRooms.get(roomId);
        if (!room) {
            console.error(`[Battle] Room ${roomId} not found`);
            socket.emit('join-error', { message: 'Room not found. Check the Player ID and try again.' });
            return;
        }
        // Allow if room has space OR this playerId is already in the room (reconnect)
        const existing = room.players.find(p => p.playerId === playerId);
        if (!existing && room.players.length >= 2) {
            console.error(`[Battle] Room ${roomId} is full`);
            socket.emit('join-error', { message: 'Room is full.' });
            return;
        }
        if (existing) {
            existing.id = socket.id;
            console.log(`[Battle] Reconnected player ${playerId} to room ${roomId}`);
        } else {
            room.players.push({
                id: socket.id, playerId, name: playerName || playerId,
                score: 0, streak: 0, maxStreak: 0, ready: false, isHost: false
            });
            console.log(`[Battle] Added new player ${playerId} to room ${roomId}`);
        }
        socket.join(roomId);
        // Send dedicated event to the joining socket so they know their own ID and the topic
        socket.emit('room-joined', { players: room.players, topicInfo: room.topicInfo, roomId, yourSocketId: socket.id });
        console.log(`[Battle] Emitted room-joined to ${socket.id}`);
        // Broadcast updated player list to everyone in the room (including host)
        io.to(roomId).emit('player-joined', { players: room.players, topicInfo: room.topicInfo, roomId });
        console.log(`[Battle] Player joined room: ${roomId}, total players: ${room.players.length}`);
    });

    socket.on('player-ready', async ({ roomId }) => {
        const room = battleRooms.get(roomId);
        if (!room) {
            console.error('[Battle] player-ready: room not found:', roomId);
            return;
        }
        const player = room.players.find(p => p.id === socket.id);
        console.log('[Battle] player-ready from', socket.id, 'in room', roomId, 'player found:', !!player);
        if (player) player.ready = true;
        io.to(roomId).emit('player-joined', { players: room.players, topicInfo: room.topicInfo, roomId });

        const allReady = room.players.length === 2 && room.players.every(p => p.ready);
        console.log('[Battle] Ready check: players:', room.players.length, 'allReady:', allReady, 'state:', room.state);
        if (allReady && room.state === 'LOBBY') {
            room.state = 'GENERATING';
            console.log('[Battle] Starting question generation...');
            try {
                room.questions = await generateBattleQuestions(room.topicInfo);
                room.currentQuestionIndex = 0;
                room.state = 'GAME';
                const q = room.questions[0];
                io.to(roomId).emit('game-start', { question: q, questionNumber: 1 });
                startQuestionTimer(roomId);
                console.log('[Battle] Game started with', room.questions.length, 'questions');
            } catch (e) {
                console.error('[Battle] Question generation failed:', e.message);
                io.to(roomId).emit('game-error', { message: 'Failed to generate questions. Please try again.' });
                room.state = 'LOBBY';
                room.players.forEach(p => p.ready = false);
                io.to(roomId).emit('player-joined', { players: room.players, topicInfo: room.topicInfo, roomId });
            }
        }
    });

    socket.on('submit-answer', ({ roomId, answer, responseTime, correct }) => {
        const room = battleRooms.get(roomId);
        if (!room || room.state !== 'GAME') return;
        const qIdx = room.currentQuestionIndex;
        if (!room.answers[qIdx]) room.answers[qIdx] = {};
        if (room.answers[qIdx][socket.id] !== undefined) return; // already answered

        const question = room.questions[qIdx];
        const isCorrect = answer === question.correctOption;
        let points = 0;
        if (isCorrect) {
            points = calcPoints(responseTime);
            const player = room.players.find(p => p.id === socket.id);
            if (player) {
                player.streak = (player.streak || 0) + 1;
                if (player.streak >= 3) points += 25; // streak bonus
                player.maxStreak = Math.max(player.maxStreak || 0, player.streak);
                player.score = (player.score || 0) + points;
            }
        } else {
            const player = room.players.find(p => p.id === socket.id);
            if (player) player.streak = 0;
        }

        room.answers[qIdx][socket.id] = { answer, points, correct: isCorrect };

        // Attach pointsEarned to player for leaderboard display
        const player = room.players.find(p => p.id === socket.id);
        if (player) player.pointsEarned = points;

        // Broadcast updated scores to both players immediately
        io.to(roomId).emit('score-update', { players: room.players });

        // If both players answered, resolve immediately
        const answeredCount = Object.keys(room.answers[qIdx]).length;
        if (answeredCount >= room.players.length) {
            resolveQuestion(roomId);
        }
    });

    socket.on('rematch', ({ roomId }) => {
        const room = battleRooms.get(roomId);
        if (!room) return;
        room.players.forEach(p => {
            p.score = 0;
            p.streak = 0;
            p.maxStreak = 0;
            p.ready = false;
            p.pointsEarned = 0;
        });
        room.questions = [];
        room.currentQuestionIndex = 0;
        room.answers = {};
        room.state = 'LOBBY';
        io.to(roomId).emit('player-joined', { players: room.players, topicInfo: room.topicInfo, roomId });
    });

    socket.on('leave-room', ({ roomId }) => {
        socket.leave(roomId);
        const room = battleRooms.get(roomId);
        if (room) {
            room.players = room.players.filter(p => p.id !== socket.id);
            if (room.players.length === 0) {
                battleRooms.delete(roomId);
            } else {
                io.to(roomId).emit('player-joined', { players: room.players, topicInfo: room.topicInfo, roomId });
            }
        }
    });

    socket.on('disconnect', () => {
        console.log(`[Battle] Player disconnected: ${socket.id}`);
        for (const [roomId, room] of battleRooms.entries()) {
            const idx = room.players.findIndex(p => p.id === socket.id);
            if (idx !== -1) {
                room.players.splice(idx, 1);
                if (room.players.length === 0) {
                    battleRooms.delete(roomId);
                } else {
                    io.to(roomId).emit('player-joined', { players: room.players, topicInfo: room.topicInfo, roomId });
                }
                break;
            }
        }
    });
});

const questionTimers = new Map();

function startQuestionTimer(roomId) {
    // Clear any existing timer
    if (questionTimers.has(roomId)) clearTimeout(questionTimers.get(roomId));
    
    const timer = setTimeout(() => {
        resolveQuestion(roomId);
    }, 11000); // 10s + 1s buffer
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

    // Reset pointsEarned for next question display
    const playersForLeaderboard = room.players.map(p => ({ ...p }));

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
        }, 1600);
    } else {
        setTimeout(() => {
            room.currentQuestionIndex = nextIdx;
            const nextQ = room.questions[nextIdx];
            io.to(roomId).emit('next-question', { question: nextQ, questionNumber: nextIdx + 1 });
            startQuestionTimer(roomId);
        }, 1600);
    }
}

// ─────────────────────────────────────────────────────────────────────────────

httpServer.listen(port, () => console.log(`Server running on port ${port}`));

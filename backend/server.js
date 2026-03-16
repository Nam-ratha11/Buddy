const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Groq = require("groq-sdk");
const fs = require('fs');
const path = require('path');

dotenv.config();

const app = express();
const port = 5001;

// --- CORS ---
app.use(cors({
    origin: process.env.ALLOWED_ORIGIN || 'http://localhost:3000'
}));

// --- Rate Limiting ---
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' }
});

const analyzeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many analyze requests, please try again in 15 minutes.' }
});

const practiceLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many practice requests, please try again in 15 minutes.' }
});

app.use(generalLimiter);

app.get('/', (req, res) => {
    res.json({
        status: "🌱 Sprout Backend is running properly!",
        endpoints: {
            analyze: "POST /api/analyze",
            practice: "POST /api/generate-practice"
        }
    });
});

app.use(express.json());

// --- File Upload Validation ---
const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf'
];

const fileFilter = (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type: ${file.mimetype}. Only images (JPEG, PNG, WebP, GIF) and PDFs are allowed.`), false);
    }
};

const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB per file
    fileFilter
});

// --- History File ---
const HISTORY_FILE = path.join(__dirname, 'data', 'history.json');

const readHistory = async () => {
    try {
        try {
            await fs.promises.access(HISTORY_FILE);
        } catch {
            return [];
        }
        const data = await fs.promises.readFile(HISTORY_FILE, 'utf8');
        return JSON.parse(data);
    } catch (e) {
        console.error("Error reading history:", e);
        return [];
    }
};

const saveHistory = async (history) => {
    try {
        await fs.promises.writeFile(HISTORY_FILE, JSON.stringify(history, null, 2));
    } catch (e) {
        console.error("Error saving history:", e);
    }
};

// --- AI Clients ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

// --- Syllabus ---
let syllabusData = {};
try {
    const syllabusPath = path.join(__dirname, 'syllabus.json');
    if (fs.existsSync(syllabusPath)) {
        syllabusData = JSON.parse(fs.readFileSync(syllabusPath, 'utf8'));
    }
} catch (e) {
    console.error("Failed to load syllabus.json:", e.message);
}

const VALID_CLASSES = Object.keys(syllabusData);
const VALID_QUESTION_TYPES = ['Multiple Choice', 'Short Answer', 'Long Answer'];

// --- JSON Parsing Helper ---
function extractJSON(text) {
    try {
        return JSON.parse(text);
    } catch {}
    const match = text.match(/\{[\s\S]*\}/s);
    if (match) {
        try {
            return JSON.parse(match[0]);
        } catch (e) {
            throw new Error(`Failed to parse AI response as JSON: ${e.message}`);
        }
    }
    throw new Error('No valid JSON found in AI response');
}

// --- Analyze Answer Sheet ---
async function analyzeAnswerSheet(questionFile, answerFile, studentClass = "6th CBSE") {
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
            const relevantSyllabus = syllabusData[studentClass] || {};
            const syllabusContext = JSON.stringify(relevantSyllabus, null, 2);
            const hasQuestionFile = !!questionFile;

            const prompt = `
                You are an expert ${studentClass} (NCERT) Teacher.
                STRICT REQUIREMENT: You must EVALUATE ONLY according to the ${studentClass} standards.
                DO NOT use any grading criteria or topics from other grade levels.

                I am providing you with:
                ${hasQuestionFile ? '1. A Question Paper\n2. A Student\'s Handwritten Answer Sheet' : '1. A Student\'s Handwritten Answer Sheet'}

                ${!hasQuestionFile ? 'IMPORTANT: I have NOT provided a Question Paper. Please infer the questions and their marks from the student\'s handwritten answer sheet and evaluate accordingly.' : ''}

                Reference Syllabus for ${studentClass}:
                ${syllabusContext}

                Your task is to:
                1. Identify or infer the questions ${hasQuestionFile ? 'from the Question Paper' : 'from the student\'s answer sheet'}.
                2. Evaluate the Student's answers against those questions with the strictness expected ONLY for ${studentClass}.
                3. Map each question to a specific topic ONLY from the provided ${studentClass} syllabus.
                4. Provide a detailed evaluation.

                Return the output ONLY as a valid JSON object in the following format:
                {
                  "overallScore": number,
                  "totalMarks": number,
                  "studentClass": "${studentClass}",
                  "curriculum": "NCERT",
                  "questions": [
                    {
                      "id": number,
                      "subject": string,
                      "topic": string,
                      "question": string,
                      "studentAnswer": string,
                      "correctAnswer": string,
                      "marksObtained": number,
                      "maxMarks": number,
                      "feedback": string,
                      "mistakeType": string
                    }
                  ]
                }
            `;

            const parts = [prompt];
            if (hasQuestionFile) {
                parts.push({ inlineData: { data: questionFile.buffer.toString("base64"), mimeType: questionFile.mimetype } });
            }
            parts.push({ inlineData: { data: answerFile.buffer.toString("base64"), mimeType: answerFile.mimetype } });

            const result = await model.generateContent(parts);
            const text = (await result.response).text();
            console.log("Gemini Response:", text);
            return extractJSON(text);
        } catch (e) {
            console.error("Gemini Analysis Failed, trying Groq fallback...", e.message);
        }
    }

    if (groq) {
        try {
            const relevantSyllabus = syllabusData[studentClass] || {};
            const syllabusContext = JSON.stringify(relevantSyllabus);
            const hasQuestionFile = !!questionFile;

            const prompt = `
                You are an expert ${studentClass} (NCERT) Teacher.
                STRICT REQUIREMENT: Evaluate ONLY based on ${studentClass} standards.
                Analyze the provided ${hasQuestionFile ? 'Question Paper and Student\'s Answer Sheet' : 'Student\'s Answer Sheet'} for ${studentClass}.
                ${!hasQuestionFile ? 'IMPORTANT: I have NOT provided a Question Paper. Please infer the questions and marks from the student\'s handwritten answer sheet and evaluate accordingly.' : ''}
                Reference Syllabus for ${studentClass}: ${syllabusContext}

                Your task is to evaluate the student's answers and map them ONLY to the provided ${studentClass} syllabus topics.

                Return the output ONLY as a valid JSON object in the following format:
                {
                  "overallScore": number,
                  "totalMarks": number,
                  "studentClass": "${studentClass}",
                  "curriculum": "NCERT",
                  "questions": [
                    {
                      "id": number,
                      "subject": string,
                      "topic": string,
                      "question": string,
                      "studentAnswer": string,
                      "correctAnswer": string,
                      "marksObtained": number,
                      "maxMarks": number,
                      "feedback": string,
                      "mistakeType": string
                    }
                  ]
                }
            `;

            const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
            const isQuestionImage = hasQuestionFile && IMAGE_MIME_TYPES.includes(questionFile.mimetype);
            const isAnswerImage = IMAGE_MIME_TYPES.includes(answerFile.mimetype);

            if (!isAnswerImage) {
                throw new Error("Groq requires image files (JPEG, PNG, WebP, GIF). PDF answer sheets are not supported by Groq.");
            }

            // Rebuild prompt if question paper is a PDF (skip it for Groq)
            const groqPrompt = isQuestionImage ? prompt : prompt.replace(
                /I am providing you with:\s*1\. A Question Paper\n2\. A Student's Handwritten Answer Sheet/,
                "I am providing you with:\n1. A Student's Handwritten Answer Sheet\n\nIMPORTANT: The Question Paper was provided as a PDF which cannot be processed. Please infer the questions from the student's answers."
            );

            const content = [{ type: "text", text: groqPrompt }];
            if (isQuestionImage) {
                content.push({
                    type: "image_url",
                    image_url: { url: `data:${questionFile.mimetype};base64,${questionFile.buffer.toString("base64")}` },
                });
            }
            content.push({
                type: "image_url",
                image_url: { url: `data:${answerFile.mimetype};base64,${answerFile.buffer.toString("base64")}` },
            });

            const chatCompletion = await groq.chat.completions.create({
                messages: [{ role: "user", content }],
                model: "meta-llama/llama-4-scout-17b-16e-instruct",
                response_format: { type: "json_object" }
            });
            const groqResponseContent = chatCompletion.choices[0].message.content;
            console.log("Groq Vision Response:", groqResponseContent);
            return extractJSON(groqResponseContent);
        } catch (e) {
            console.error("Groq Vision Analysis Failed:", e.message);
        }
    }
    throw new Error("No working AI provider configured or available.");
}

app.post('/api/analyze', analyzeLimiter, upload.fields([
    { name: 'questionFile', maxCount: 1 },
    { name: 'answerFile', maxCount: 1 }
]), async (req, res) => {
    try {
        const questionFile = req.files?.['questionFile']?.[0] ?? null;
        const answerFile = req.files?.['answerFile']?.[0] ?? null;
        const studentClass = req.body.studentClass || "6th CBSE";

        if (!answerFile) {
            return res.status(400).json({ error: "Answer sheet is required" });
        }

        if (VALID_CLASSES.length > 0 && !VALID_CLASSES.includes(studentClass)) {
            return res.status(400).json({
                error: `Unsupported grade: ${studentClass}. Allowed: ${VALID_CLASSES.join(", ")}`
            });
        }

        const evaluation = await analyzeAnswerSheet(questionFile, answerFile, studentClass);

        try {
            const history = await readHistory();
            const newItem = { timestamp: Date.now(), data: evaluation };
            const updatedHistory = [newItem, ...history].slice(0, 20);
            await saveHistory(updatedHistory);
            return res.json(newItem);
        } catch (hErr) {
            console.error("Failed to save history:", hErr);
            return res.json({ timestamp: Date.now(), data: evaluation });
        }
    } catch (error) {
        console.error("Analysis Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// --- Syllabus Endpoint ---
app.get('/api/syllabus/:grade', (req, res) => {
    const grade = req.params.grade;
    if (VALID_CLASSES.length > 0 && !VALID_CLASSES.includes(grade)) {
        return res.status(400).json({ error: `Unsupported grade: ${grade}. Allowed: ${VALID_CLASSES.join(", ")}` });
    }
    res.json(syllabusData[grade] || {});
});

// --- History Endpoints ---
app.get('/api/history', async (_req, res) => {
    res.json(await readHistory());
});

app.delete('/api/history/:timestamp', async (req, res) => {
    try {
        const timestamp = parseInt(req.params.timestamp);
        if (isNaN(timestamp)) {
            return res.status(400).json({ error: "Invalid timestamp" });
        }
        let history = await readHistory();
        history = history.filter(item => item.timestamp !== timestamp);
        await saveHistory(history);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Generate Practice ---
app.post('/api/generate-practice', practiceLimiter, async (req, res) => {
    try {
        const { topics, studentClass = "6th CBSE", selectedTypes = ['Multiple Choice', 'Short Answer', 'Long Answer'] } = req.body;

        if (!topics || !Array.isArray(topics) || topics.length === 0) {
            return res.status(400).json({ error: "No topics provided for practice" });
        }

        const invalidTopic = topics.find(t => typeof t !== 'string' || t.trim().length === 0 || t.length > 200);
        if (invalidTopic !== undefined) {
            return res.status(400).json({ error: "Each topic must be a non-empty string under 200 characters" });
        }

        if (VALID_CLASSES.length > 0 && !VALID_CLASSES.includes(studentClass)) {
            return res.status(400).json({
                error: `Unsupported grade: ${studentClass}. Allowed: ${VALID_CLASSES.join(", ")}`
            });
        }

        if (!Array.isArray(selectedTypes) || selectedTypes.length === 0) {
            return res.status(400).json({ error: "selectedTypes must be a non-empty array" });
        }
        const invalidType = selectedTypes.find(t => !VALID_QUESTION_TYPES.includes(t));
        if (invalidType !== undefined) {
            return res.status(400).json({
                error: `Invalid question type: "${invalidType}". Allowed: ${VALID_QUESTION_TYPES.join(", ")}`
            });
        }

        const relevantSyllabus = syllabusData[studentClass] || {};
        const syllabusContext = JSON.stringify(relevantSyllabus);

        const typeBreakdown = selectedTypes.map(type => {
            if (type === 'Multiple Choice') return `- Multiple Choice Questions (options + correct index)`;
            if (type === 'Short Answer') return `- Short Answer Questions (concise 1-2 sentence ideal answer)`;
            if (type === 'Long Answer') return `- Long Answer Questions (detailed paragraph-length ideal answer)`;
            return '';
        }).join('\n');

        const prompt = `
            You are an expert ${studentClass} (NCERT) Teacher.
            STRICT REQUIREMENT: Generate questions based ONLY on the ${studentClass} curriculum.
            Reference Syllabus: ${syllabusContext}

            Generate a 5-question practice quiz for the following topics in ${studentClass}: ${topics.join(", ")}.

            CRITICAL CONSTRAINTS:
            1. You MUST ONLY include the following question types: ${selectedTypes.join(', ')}.
            2. If ONLY "Multiple Choice" is selected, you MUST provide 5 Multiple Choice questions.
            3. DO NOT include Short or Long answers if "Multiple Choice" is the ONLY selected type.
            4. If Multiple Choice is selected, you MUST provide "options" (array of 4) and "correctOption" (index 0-3).
            5. If Short or Long Answer is selected, you MUST provide a "modelAnswer".

            Type Breakdown:
            ${typeBreakdown}

            Return the output ONLY as a valid JSON object in the following format:
            {
              "topics": ${JSON.stringify(topics)},
              "studentClass": "${studentClass}",
              "selectedTypes": ${JSON.stringify(selectedTypes)},
              "questions": [
                {
                  "id": number,
                  "topic": string,
                  "question": string,
                  "type": "Must be exactly one of: ${selectedTypes.join(', ')}",
                  "options": [string, string, string, string],
                  "correctOption": number,
                  "modelAnswer": string
                }
              ]
            }
        `;

        if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
            try {
                const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
                const result = await model.generateContent(prompt);
                const text = (await result.response).text();
                return res.json(extractJSON(text));
            } catch (e) {
                console.error("Gemini Practice Generation Failed, trying Groq fallback...", e.message);
            }
        }

        if (groq) {
            try {
                const completion = await groq.chat.completions.create({
                    messages: [{ role: "user", content: prompt }],
                    model: "llama-3.3-70b-versatile",
                    response_format: { type: "json_object" }
                });
                const content = completion.choices[0].message.content;
                console.log("Groq Practice Response:", content);
                return res.json(extractJSON(content));
            } catch (e) {
                console.error("Groq Practice Generation Failed:", e.message);
            }
        }

        throw new Error("No AI provider available for practice generation.");
    } catch (error) {
        console.error("Practice Generation Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// --- Evaluate Practice Solution ---
app.post('/api/evaluate-practice-solution', practiceLimiter, async (req, res) => {
    try {
        const { question, studentAnswer, modelAnswer } = req.body;

        if (!question || typeof question !== 'string' || question.trim().length === 0) {
            return res.status(400).json({ error: "Question is required and must be a non-empty string" });
        }
        if (!studentAnswer || typeof studentAnswer !== 'string' || studentAnswer.trim().length === 0) {
            return res.status(400).json({ error: "Student answer is required and must be a non-empty string" });
        }
        if (question.length > 5000 || studentAnswer.length > 5000) {
            return res.status(400).json({ error: "Question and student answer must each be under 5000 characters" });
        }

        const prompt = `
            You are an expert teacher. Evaluate the following student's answer against the given question and model answer.

            Question: ${question}
            Model Answer: ${modelAnswer}
            Student's Answer: ${studentAnswer}

            Provide a detailed evaluation that includes:
            1. A score from 0 to 100 based on accuracy and completeness.
            2. Specific feedback on what was correct and what was missing or incorrect.
            3. A short encouraging comment.

            Return the output ONLY as a valid JSON object in the following format:
            {
              "score": number,
              "feedback": string,
              "analysis": {
                "strengths": [string],
                "improvements": [string]
              }
            }
        `;

        if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
            try {
                const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
                const result = await model.generateContent(prompt);
                const text = (await result.response).text();
                return res.json(extractJSON(text));
            } catch (e) {
                console.error("Gemini Evaluation Failed, trying Groq fallback...", e.message);
            }
        }

        if (groq) {
            try {
                const completion = await groq.chat.completions.create({
                    messages: [{ role: "user", content: prompt }],
                    model: "llama-3.3-70b-versatile",
                    response_format: { type: "json_object" }
                });
                return res.json(extractJSON(completion.choices[0].message.content));
            } catch (e) {
                console.error("Groq Evaluation Failed:", e.message);
            }
        }

        throw new Error("AI Evaluation failed");
    } catch (error) {
        console.error("Evaluation Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// --- Remediate (AI Tutor for Weak Topics) ---
app.post('/api/remediate', practiceLimiter, async (req, res) => {
    try {
        const { topic, grade, mistakeType, feedback } = req.body;

        if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
            return res.status(400).json({ error: "Topic is required and must be a non-empty string" });
        }
        if (topic.length > 200) {
            return res.status(400).json({ error: "Topic must be under 200 characters" });
        }
        if (!grade || (VALID_CLASSES.length > 0 && !VALID_CLASSES.includes(grade))) {
            return res.status(400).json({
                error: `Unsupported grade: ${grade}. Allowed: ${VALID_CLASSES.join(", ")}`
            });
        }

        const prompt = `
            You are the Sprout AI Tutor. A student in Grade ${grade} (CBSE/NCERT) is weak in the chapter/topic "${topic}".
            ${mistakeType ? `In their recent evaluation, the type of mistake was: "${mistakeType}".` : ''}
            ${feedback ? `The teacher's feedback was: "${feedback}".` : ''}

            Your job is to TEACH THE ENTIRE CHAPTER "${topic}" as it appears in the ${grade} NCERT textbook. Do NOT limit your explanation to just the mistake — cover the full chapter so the student builds a complete understanding.

            Follow this structure:

            Step 1 - The Hook (Introduction):
            Start with a relatable real-world analogy or story that connects to "${topic}" and makes a ${grade} student curious. Keep it engaging and under 2 paragraphs.

            Step 2 - Full Chapter Explanation:
            Teach the complete chapter "${topic}" as covered in the ${grade} NCERT textbook. Include:
            - The main definition and what this chapter is about
            - ALL key concepts, sub-topics, and important terms from this chapter
            - Important formulas, rules, or principles (if any)
            - Common examples that NCERT uses to explain this topic
            Be thorough — cover everything a student would need to know for their exam.

            Step 3 - Visual Concept Map:
            Generate a Mermaid.js flowchart diagram that visually represents the key concepts, relationships, or processes in "${topic}".
            RULES for Mermaid diagram:
            - Use "graph TD" (top-down) or "graph LR" (left-right) format
            - Keep it simple: 5-10 nodes maximum
            - Use short labels (under 30 characters per node)
            - Do NOT use special characters like parentheses, quotes, colons, or semicolons inside node labels
            - Use only alphanumeric characters, spaces, hyphens and arrows
            - Example format: graph TD\\n    A[Main Topic] --> B[Sub Topic 1]\\n    A --> C[Sub Topic 2]\\n    B --> D[Detail]
            - Make it educational — show how concepts connect to each other

            Step 4 - Common Mistakes Students Make:
            List 3-4 common mistakes or misconceptions that ${grade} students have in this chapter, and explain why they are wrong.

            Step 5 - Pro Tips for Scoring:
            Give 2-3 specific exam tips for scoring full marks on questions from this chapter in CBSE exams. Include keywords/phrases that CBSE examiners look for.

            Step 6 - Check for Understanding:
            Generate exactly ONE Multiple Choice Question (MCQ) that tests a core concept from this chapter. The MCQ must have 4 options.

            Return the output ONLY as a valid JSON object in the following format:
            {
                "topic": "${topic}",
                "grade": "${grade}",
                "hook": {
                    "title": string,
                    "explanation": string
                },
                "chapterExplanation": {
                    "overview": string (2-3 sentence summary of what this chapter covers),
                    "keyConcepts": [
                        {
                            "heading": string,
                            "explanation": string
                        }
                    ],
                    "importantTerms": [
                        {
                            "term": string,
                            "definition": string
                        }
                    ],
                    "formulas": [string],
                    "ncertExamples": [string]
                },
                "conceptMap": string (valid Mermaid.js diagram code starting with "graph TD" or "graph LR"),
                "commonMistakes": [
                    {
                        "mistake": string,
                        "correction": string
                    }
                ],
                "proTips": [string],
                "mcq": {
                    "question": string,
                    "options": [string, string, string, string],
                    "correctOption": number
                }
            }
        `;

        if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
            try {
                const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
                const result = await model.generateContent(prompt);
                const text = (await result.response).text();
                console.log("Gemini Remediation Response:", text);
                return res.json(extractJSON(text));
            } catch (e) {
                console.error("Gemini Remediation Failed, trying Groq fallback...", e.message);
            }
        }

        if (groq) {
            try {
                const completion = await groq.chat.completions.create({
                    messages: [{ role: "user", content: prompt }],
                    model: "llama-3.3-70b-versatile",
                    response_format: { type: "json_object" }
                });
                const content = completion.choices[0].message.content;
                console.log("Groq Remediation Response:", content);
                return res.json(extractJSON(content));
            } catch (e) {
                console.error("Groq Remediation Failed:", e.message);
            }
        }

        throw new Error("No AI provider available for remediation.");
    } catch (error) {
        console.error("Remediation Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// --- Multer / general error handler ---
app.use((err, _req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large. Maximum size is 10 MB.' });
        }
        return res.status(400).json({ error: `File upload error: ${err.message}` });
    }
    if (err && err.message && err.message.startsWith('Invalid file type')) {
        return res.status(400).json({ error: err.message });
    }
    next(err);
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Backend server running at http://localhost:${port}`);
});

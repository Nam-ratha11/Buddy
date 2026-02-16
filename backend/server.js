const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const { GoogleGenerativeAI } = require("@google/generative-ai");

dotenv.config();

const app = express();
const port = 5001;

app.use(cors());
app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY);

async function analyzeAnswerSheet(fileBuffer, mimeType) {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
    You are an expert CBSE Class 6 (NCERT) Teacher. 
    Analyze the attached handwritten answer sheet and provide a detailed evaluation.
    
    Return the output ONLY as a valid JSON object in the following format:
    {
      "overallScore": number,
      "totalMarks": number,
      "studentClass": "6th CBSE",
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

    const result = await model.generateContent([
        prompt,
        {
            inlineData: {
                data: fileBuffer.toString("base64"),
                mimeType: mimeType
            }
        }
    ]);

    const response = await result.response;
    const text = response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
    }
    throw new Error("Failed to parse AI response into JSON");
}

app.post('/api/analyze', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const evaluation = await analyzeAnswerSheet(req.file.buffer, req.file.mimetype);
        res.json(evaluation);
    } catch (error) {
        console.error("Analysis Error:", error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/generate-practice', async (req, res) => {
    try {
        const { topics } = req.body;
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Simplified quiz generation for demo
        const questions = topics.map((topic, index) => ({
            id: index + 1,
            topic,
            question: `Practice for ${topic}: [NCERT Class 6 Concept]`,
            options: ["Option A", "Option B", "Option C", "Option D"],
            correctOption: 0,
            type: "Multiple Choice"
        }));

        res.json({ topics, questions });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Backend server running at http://localhost:${port}`);
});

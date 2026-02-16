import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function analyzeAnswerSheet(fileBuffer, mimeType) {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
    You are an expert CBSE Class 6 (NCERT) Teacher. 
    Analyze the attached handwritten answer sheet and provide a detailed evaluation.
    
    Guidelines:
    1. Identify the Subject (Science, Mathematics, History, Geography, etc.).
    2. Extract individual questions and the student's handwritten answers.
    3. Compare with correct NCERT-aligned answers.
    4. Provide specific feedback for each question.
    5. Categorize mistakes: "Conceptual Gap", "Silly Mistake", or "Topic Gap".
    6. Provide references to NCERT Class 6 textbooks.

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

    // Extract JSON from the response (sometimes Gemini wraps it in ```json)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
    }

    throw new Error("Failed to parse AI response into JSON");
}

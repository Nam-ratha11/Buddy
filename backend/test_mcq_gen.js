const Groq = require("groq-sdk");
require('dotenv').config();

async function testMCQ() {
    const key = process.env.GROQ_API_KEY;
    if (!key) {
        console.error("No GROQ_API_KEY found");
        process.exit(1);
    }
    const groq = new Groq({ apiKey: key });

    const topics = ["Science", "Photosynthesis"];
    const studentClass = "6th CBSE";
    const selectedTypes = ["Multiple Choice"];

    const typeBreakdown = selectedTypes.map(type => {
        if (type === 'Multiple Choice') return `- Multiple Choice Questions (options + correct index)`;
        if (type === 'Short Answer') return `- Short Answer Questions (concise 1-2 sentence ideal answer)`;
        if (type === 'Long Answer') return `- Long Answer Questions (detailed paragraph-length ideal answer)`;
        return '';
    }).join('\n');

    const prompt = `
        You are an expert ${studentClass} (NCERT) Teacher.
        STRICT REQUIREMENT: Generate questions based ONLY on the ${studentClass} curriculum.
        
        Generate a 5-question practice quiz for the following topics in ${studentClass}: ${topics.join(", ")}.
        
        CRITICAL CONSTRAINTS:
        1. You MUST ONLY include the following question types: ${selectedTypes.join(', ')}.
        2. If only one type is selected, ALL 100% of questions must be of that type.
        3. If Multiple Choice is selected, you MUST provide "options" (array of 4) and "correctOption" (index 0-3).
        4. If Short or Long Answer is selected, you MUST provide a "modelAnswer".
        
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

    console.log("Testing Practice Generation with ONLY Multiple Choice...");
    try {
        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" }
        });
        const content = JSON.parse(completion.choices[0].message.content);
        console.log("Response Types:", content.questions.map(q => q.type));
        console.log("Full Sample Question:", JSON.stringify(content.questions[0], null, 2));

        const allMCQ = content.questions.every(q => q.type === "Multiple Choice");
        const hasOptions = content.questions.every(q => q.options && q.options.length === 4);

        if (allMCQ && hasOptions) {
            console.log("SUCCESS: Backend correctly generated MCQs.");
        } else {
            console.error("FAILURE: Backend did not meet constraints.");
        }
        process.exit(0);
    } catch (e) {
        console.error("Test Failed:", e.message);
        process.exit(1);
    }
}

testMCQ();

const Groq = require("groq-sdk");
require('dotenv').config();

async function testVision() {
    const key = process.env.GROQ_API_KEY;
    if (!key) {
        console.error("No GROQ_API_KEY found");
        process.exit(1);
    }
    const groq = new Groq({ apiKey: key });

    // Tiny valid base64 encoded 1x1 pixel image to test API
    const base64Image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

    console.log("Testing Groq Vision model: meta-llama/llama-4-scout-17b-16e-instruct");
    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: "What is in this image?" },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:image/png;base64,${base64Image}`,
                            },
                        },
                    ],
                },
            ],
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
        });
        console.log("Success! Vision Response:", chatCompletion.choices[0].message.content);
        process.exit(0);
    } catch (e) {
        console.error("Groq Vision Test Failed:", e.message);
        process.exit(1);
    }
}

testVision();

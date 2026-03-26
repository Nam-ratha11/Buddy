const Groq = require("groq-sdk");
require('dotenv').config();

async function verify() {
    const key = process.env.GROQ_API_KEY;
    if (!key) {
        console.error("No GROQ_API_KEY found in .env");
        process.exit(1);
    }
    console.log("Verifying Groq key starting with:", key.substring(0, 8));
    const groq = new Groq({ apiKey: key });
    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: "user", content: "Hello" }],
            model: "llama-3.3-70b-versatile",
        });
        console.log("Success! Response:", chatCompletion.choices[0].message.content);
        process.exit(0);
    } catch (e) {
        console.error("Groq Verification Failed:", e.message);
        process.exit(1);
    }
}

verify();

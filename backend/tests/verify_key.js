const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function verify() {
    const key = process.env.GEMINI_API_KEY;
    console.log("Verifying key starting with:", key.substring(0, 8));
    const genAI = new GoogleGenerativeAI(key);
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro-latest" });
        const result = await model.generateContent("Hello");
        console.log("Success! Response:", result.response.text());
        process.exit(0);
    } catch (e) {
        console.error("Key Verification Failed:", e.message);
        process.exit(1);
    }
}

verify();

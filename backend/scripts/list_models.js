const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function list() {
    const key = process.env.GEMINI_API_KEY;
    console.log("Listing models for key starting with:", key.substring(0, 8));
    const genAI = new GoogleGenerativeAI(key);
    try {
        // The SDK might not have a direct listModels, we might need to use the base API
        // But let's try a very common one first
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent("test");
        console.log("gemini-pro works!");
    } catch (e) {
        console.error("gemini-pro failed:", e.message);
    }
}
list();

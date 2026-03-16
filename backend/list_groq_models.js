const Groq = require("groq-sdk");
require('dotenv').config();

async function listModels() {
    const key = process.env.GROQ_API_KEY;
    if (!key) {
        console.error("No GROQ_API_KEY found");
        return;
    }
    const groq = new Groq({ apiKey: key });
    try {
        const models = await groq.models.list();
        console.log("Available Groq Models:");
        models.data.forEach(m => console.log(`- ${m.id}`));
    } catch (e) {
        console.error("Failed to list Groq models:", e.message);
    }
}

listModels();

const { LocalIndex } = require('vectra');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
const INDEX_DIR = path.join(__dirname, 'vector-store');

async function test() {
    const index = new LocalIndex(INDEX_DIR);
    const query = "Autotrophs: The mode of nutrition in which organisms make food themselves";
    
    console.log("Query:", query);
    const result = await embeddingModel.embedContent(query);
    const vector = result.embedding.values;
    
    const results = await index.queryItems(vector, 10);
    console.log("Top 10 Results:");
    results.forEach((r, i) => {
        console.log(`[${i}] Score: ${r.score.toFixed(4)} | Source: ${r.item.metadata.source} | Text: ${r.item.metadata.text.substring(0, 50)}...`);
    });
}

test();

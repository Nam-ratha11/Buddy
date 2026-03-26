/**
 * rag.js — Retrieval helper using Gemini embeddings.
 * Returns relevant textbook chunks for a given topic query.
 * Falls back gracefully to empty array if no index exists.
 */

require('dotenv').config();
const path = require('path');
const { LocalIndex } = require('vectra');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
const INDEX_PATH = path.join(__dirname, '../data/vector-store');

let _index = null;
let _indexExists = null;

async function getIndex() {
  if (!_index) _index = new LocalIndex(INDEX_PATH);
  return _index;
}

/**
 * Retrieve top-k relevant chunks for a given query.
 * Returns [] if the vector store hasn't been built yet.
 */
async function retrieve(query, topK = 5) {
  try {
    const idx = await getIndex();

    if (_indexExists === null) {
      _indexExists = await idx.isIndexCreated();
    }
    if (!_indexExists) return [];

    const result = await embeddingModel.embedContent(query);
    const queryVector = result.embedding.values;

    const results = await idx.queryItems(queryVector, topK);
    return results.map(r => r.item.metadata);
  } catch (err) {
    console.error('[RAG] Retrieval error:', err.message);
    return [];
  }
}

module.exports = { retrieve };

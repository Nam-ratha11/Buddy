/**
 * ingest.js — Run once to index PDFs into the local vector store.
 * Usage: node ingest.js
 * Drop your NCERT PDF files into Buddy/backend/pdfs/ before running.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const { LocalIndex } = require('vectra');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });

const PDF_DIR = path.join(__dirname, 'pdfs');
const INDEX_DIR = path.join(__dirname, 'vector-store');
const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 150;

function chunkText(text, size = CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
  const clean = text.replace(/\s+/g, ' ').trim();
  const chunks = [];
  let start = 0;
  while (start < clean.length) {
    const end = Math.min(start + size, clean.length);
    const chunk = clean.slice(start, end).trim();
    if (chunk.length > 80) chunks.push(chunk);
    start += size - overlap;
  }
  return chunks;
}

async function embedText(text) {
  const result = await embeddingModel.embedContent(text);
  return result.embedding.values;
}

async function ingest() {
  if (!fs.existsSync(PDF_DIR)) {
    fs.mkdirSync(PDF_DIR, { recursive: true });
    console.log(`Created pdfs/ folder at ${PDF_DIR}`);
    console.log('Drop your NCERT PDF files there and run this script again.');
    return;
  }

  const files = fs.readdirSync(PDF_DIR).filter(f => f.toLowerCase().endsWith('.pdf'));
  if (files.length === 0) {
    console.log('No PDFs found in', PDF_DIR);
    console.log('Add your NCERT lesson PDFs and re-run.');
    return;
  }

  const index = new LocalIndex(INDEX_DIR);
  if (!await index.isIndexCreated()) {
    await index.createIndex();
    console.log('Vector store created at', INDEX_DIR);
  }

  const { execSync } = require('child_process');

  for (const file of files) {
    console.log(`\nProcessing: ${file}`);
    const filePath = path.join(PDF_DIR, file);
    
    let text = '';
    try {
      // Use the pdf-parse CLI for reliable extraction
      console.log(`  Extracting text via CLI...`);
      text = execSync(`npx pdf-parse text "${filePath}"`, { encoding: 'utf8' });
    } catch (e) {
      console.error(`  Failed to parse ${file} via CLI:`, e.message);
      continue;
    }
    
    const chunks = chunkText(text);
    console.log(`  ${chunks.length} chunks generated`);

    for (let i = 0; i < chunks.length; i++) {
      const vector = await embedText(chunks[i]);
      await index.insertItem({
        vector,
        metadata: { source: file, chunk: i, text: chunks[i] },
      });
      process.stdout.write(`\r  Indexed ${i + 1}/${chunks.length}`);
    }
    console.log(`\n  Done: ${file}`);
  }

  console.log('\nIngestion complete. Vector store is ready.');
}

ingest().catch(console.error);

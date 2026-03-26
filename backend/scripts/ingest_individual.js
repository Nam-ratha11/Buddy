/**
 * ingest_individual.js — Ingest a single PDF file with page-level tracking.
 * Usage: node ingest_individual.js "/path/to/your/document.pdf"
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const pdfParse = require('pdf-parse');
const { LocalIndex } = require('vectra');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
const INDEX_DIR = path.join(__dirname, '../data/vector-store');

async function embedText(text) {
    try {
        const result = await embeddingModel.embedContent(text);
        return result.embedding.values;
    } catch (e) {
        console.error('Embedding error:', e.message);
        return null;
    }
}

async function extractPagesByPage(buffer) {
    const { PDFParse } = pdfParse;
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    await parser.destroy();
    return result.pages.map(p => p.text);
}

function chunkPageText(text, maxChars = 900) {
    if (text.length <= maxChars) return [text];
    const chunks = [];
    let start = 0;
    while (start < text.length) {
        chunks.push(text.slice(start, start + maxChars).trim());
        start += maxChars - 100;
    }
    return chunks.filter(c => c.length > 80);
}

async function run() {
    const filePath = process.argv[2];
    if (!filePath) {
        console.error("Usage: node ingest_individual.js \"path/to/file.pdf\"");
        process.exit(1);
    }
    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        process.exit(1);
    }

    const fileName = path.basename(filePath);
    const index = new LocalIndex(INDEX_DIR);
    if (!await index.isIndexCreated()) await index.createIndex();

    console.log(`\nIndexing: ${fileName}`);
    const buffer = fs.readFileSync(filePath);

    let pages = [];
    try {
        pages = await extractPagesByPage(buffer);
        console.log(`  Extracted ${pages.length} pages`);
    } catch (e) {
        console.error(`  Page extraction failed, falling back:`, e.message);
        const { PDFParse } = pdfParse;
        const parser = new PDFParse({ data: buffer });
        const result = await parser.getText();
        await parser.destroy();
        pages = result.pages.map(p => p.text);
    }

    let totalChunks = 0;
    for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
        const pageNum = pageIdx + 1;
        const pageText = pages[pageIdx].trim();
        if (pageText.length < 50) continue;

        const chunks = chunkPageText(pageText);
        for (let ci = 0; ci < chunks.length; ci++) {
            const vector = await embedText(chunks[ci]);
            if (!vector) continue;
            await index.insertItem({
                vector,
                metadata: { source: fileName, page: pageNum, chunk: ci, text: chunks[ci] }
            });
            totalChunks++;
            process.stdout.write(`\r  Page ${pageNum}/${pages.length} — ${totalChunks} chunks indexed...`);
        }
    }
    console.log(`\n  Successfully ingested: ${fileName} (${totalChunks} chunks with page numbers)`);
}

run().catch(console.error);

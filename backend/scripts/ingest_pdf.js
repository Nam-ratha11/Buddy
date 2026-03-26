/**
 * ingest_pdf.js — Ingest PDFs into vector store with page tracking.
 * Usage: node ingest_pdf.js [/optional/path/to/pdf/folder]
 * 
 * Optimisations:
 *  - Concurrent embedding calls (batch of 5 at a time)
 *  - 429 rate-limit backoff with retry
 *  - Skips already-indexed sources so re-runs are safe
 *  - Progress checkpoint per file
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const fs = require('fs');
const pdfParse = require('pdf-parse');
const { LocalIndex } = require('vectra');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });

const INDEX_DIR = path.join(__dirname, '../data/vector-store');
// Allow passing a custom PDF folder as CLI arg
const PDF_DIR = process.argv[2] || path.join(__dirname, '../resources/pdfs');

const CONCURRENCY = 5;   // parallel embedding calls
const CHUNK_SIZE  = 900;
const CHUNK_OVERLAP = 100;

// ── helpers ──────────────────────────────────────────────────────────────────

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function embedWithRetry(text, retries = 5) {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await embeddingModel.embedContent(text);
            return res.embedding.values;
        } catch (e) {
            const is429 = e.message?.includes('429') || e.message?.includes('quota') || e.message?.includes('RESOURCE_EXHAUSTED');
            if (is429 && i < retries - 1) {
                const wait = 2000 * (i + 1);
                process.stdout.write(`\n  [rate-limit] waiting ${wait / 1000}s...\n`);
                await sleep(wait);
            } else {
                console.error(`  [embed error] ${e.message}`);
                return null;
            }
        }
    }
    return null;
}

// Run up to `limit` async tasks concurrently
async function pMap(items, fn, limit) {
    const results = [];
    let idx = 0;
    async function worker() {
        while (idx < items.length) {
            const i = idx++;
            results[i] = await fn(items[i], i);
        }
    }
    const workers = Array.from({ length: Math.min(limit, items.length) }, worker);
    await Promise.all(workers);
    return results;
}

function chunkText(text) {
    const clean = text.replace(/\s+/g, ' ').trim();
    if (clean.length <= CHUNK_SIZE) return [clean];
    const chunks = [];
    let start = 0;
    while (start < clean.length) {
        const chunk = clean.slice(start, start + CHUNK_SIZE).trim();
        if (chunk.length > 80) chunks.push(chunk);
        start += CHUNK_SIZE - CHUNK_OVERLAP;
    }
    return chunks;
}

async function extractPages(buffer) {
    const { PDFParse } = pdfParse;
    const parser = new PDFParse({ data: buffer, verbosity: 0 });
    const result = await parser.getText();
    await parser.destroy();
    return result.pages.map(p => p.text); // index 0 = page 1
}

// ── main ─────────────────────────────────────────────────────────────────────

async function run() {
    if (!fs.existsSync(PDF_DIR)) {
        console.error(`PDF folder not found: ${PDF_DIR}`);
        process.exit(1);
    }

    const index = new LocalIndex(INDEX_DIR);
    if (!await index.isIndexCreated()) {
        await index.createIndex();
        console.log('Created vector store at', INDEX_DIR);
    }

    // Find already-indexed sources so we can skip them
    let indexed = new Set();
    try {
        const existing = await index.listItems();
        existing.forEach(item => {
            if (item.metadata?.source) indexed.add(item.metadata.source);
        });
        if (indexed.size) console.log(`Already indexed: ${[...indexed].join(', ')}`);
    } catch (_) {}

    const files = fs.readdirSync(PDF_DIR)
        .filter(f => f.toLowerCase().endsWith('.pdf'))
        .sort();

    console.log(`\nFound ${files.length} PDF(s) in ${PDF_DIR}\n`);

    for (const file of files) {
        if (indexed.has(file)) {
            console.log(`Skipping (already indexed): ${file}`);
            continue;
        }

        console.log(`Processing: ${file}`);
        const buffer = fs.readFileSync(path.join(PDF_DIR, file));

        let pages;
        try {
            pages = await extractPages(buffer);
            console.log(`  ${pages.length} pages extracted`);
        } catch (e) {
            console.error(`  Failed to parse ${file}:`, e.message);
            continue;
        }

        // Build flat list of all chunks with metadata
        const allChunks = [];
        for (let pi = 0; pi < pages.length; pi++) {
            const pageText = pages[pi]?.trim();
            if (!pageText || pageText.length < 50) continue;
            const chunks = chunkText(pageText);
            chunks.forEach((text, ci) => allChunks.push({ text, page: pi + 1, chunk: ci }));
        }

        console.log(`  ${allChunks.length} chunks to embed (concurrency: ${CONCURRENCY})`);

        let done = 0;
        await pMap(allChunks, async ({ text, page, chunk }) => {
            const vector = await embedWithRetry(text);
            if (!vector) return;
            await index.insertItem({
                vector,
                metadata: { source: file, page, chunk, text }
            });
            done++;
            process.stdout.write(`\r  ${done}/${allChunks.length} chunks embedded...`);
        }, CONCURRENCY);

        console.log(`\n  Done: ${file}`);
    }

    console.log('\nIngestion complete.');
}

run().catch(console.error);

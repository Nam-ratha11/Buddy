async function testFallback() {
    console.log("Testing backend fallback to Groq...");
    try {
        const response = await fetch('http://localhost:5001/api/generate-practice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topics: ['Algebra', 'Fractions'] })
        });
        const data = await response.json();
        if (data.questions) {
            console.log("Success! Questions generated via Groq fallback:");
            data.questions.forEach(q => console.log(`- ${q.question}`));
        } else {
            console.log("Failed. Response:", JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error("Test failed:", e.message);
    }
}

testFallback();

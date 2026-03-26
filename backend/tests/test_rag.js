const { retrieve } = require('./rag');

async function test() {
    try {
        console.log("Searching for: 'Nutrition in Plants: Which of the following Organism is not an Autotroph?'");
        const results = await retrieve("Autotrophs: The mode of nutrition in which organisms make food themselves", 1);
        console.log("Results Found:", JSON.stringify(results, null, 2));
    } catch (e) {
        console.error("Test failed:", e.message);
    }
}

test();

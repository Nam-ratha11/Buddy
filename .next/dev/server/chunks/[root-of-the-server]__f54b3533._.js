module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/Desktop/sprout/app/api/generate-practice/route.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$sprout$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/sprout/node_modules/next/server.js [app-route] (ecmascript)");
;
async function POST(req) {
    try {
        const { topics } = await req.json();
        // Simulate generation delay
        await new Promise((resolve)=>setTimeout(resolve, 1500));
        // Mock Practice Questions aligned with NCERT Class 6
        const ncertPracticeData = {
            "Components of Food": [
                {
                    question: "Which of the following is known as 'Energy Giving Food'?",
                    options: [
                        "Proteins",
                        "Carbohydrates and Fats",
                        "Vitamins",
                        "Minerals"
                    ],
                    correctOption: 1
                }
            ],
            "What, Where, How and When?": [
                {
                    question: "Manuscripts were usually written on:",
                    options: [
                        "Palm leaves",
                        "Stone",
                        "Iron plates",
                        "Paper"
                    ],
                    correctOption: 0
                }
            ],
            "The Earth in the Solar System": [
                {
                    question: "Which is the third nearest planet to the sun?",
                    options: [
                        "Venus",
                        "Earth",
                        "Mars",
                        "Jupiter"
                    ],
                    correctOption: 1
                }
            ]
        };
        const questions = topics.map((topic, index)=>{
            const specialized = ncertPracticeData[topic];
            if (specialized) {
                return {
                    id: index + 1,
                    topic,
                    ...specialized[0],
                    type: "Multiple Choice"
                };
            }
            return {
                id: index + 1,
                topic,
                question: `NCERT Class 6 Practice: Explore the core concepts of '${topic}'. [Simulated Question]`,
                options: [
                    "Option A",
                    "Option B",
                    "Option C",
                    "Option D"
                ],
                correctOption: 0,
                type: "Multiple Choice"
            };
        });
        return __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$sprout$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            topics,
            questions
        });
    } catch (error) {
        console.error("Practice Generation Error:", error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$sprout$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Failed to generate practice questions"
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__f54b3533._.js.map
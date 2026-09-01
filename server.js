import express from 'express';
import 'dotenv/config'; 

import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.GEMINI_API_KEY
const ai = new GoogleGenAI({ apiKey: API_KEY });

console.log("Gemini API key loaded:", Boolean(API_KEY));

const PORT = process.env.PORT || 3000;

const app = express();

app.use(express.json());
app.use(express.static("."));

// NOTE: UPDATE ONCE COMPLETED AND ADD STREAMING FOR GENERATED RESPONSE, ALSO ADD OPTION TO USE PDF FILES
app.post("/api/summarize", async (req, res) => {
    try {
        if (!req.body?.content) {
            return res.status(400).json({
                status: 400,
                error: "No note content was provided."
            });
        }
        
        const interaction = await ai.interactions.create({
            model: "gemini-3.7-flash",
            input: "Summarize the most important piece of these notes given, be specific, be straight to the point, and only answer if the given notes are school or academic related, otherwise inform the user to please provide academic notes.\n\n" + req.body.content,
        }, {
            // Keep diagnostic tests from automatically creating extra API attempts.
            maxRetries: 0
        });

        let result = interaction.output_text;

        res.json({ result });
    } catch (error) {
        const errorStatus = Number(error.status ?? error.statusCode);
        const status = errorStatus >= 400 && errorStatus <= 599 ? errorStatus : 500;
        const message = error.message || "The Gemini request failed.";

        console.error("Gemini request failed:", {
            name: error.name,
            status: status,
            message: message
        });

        res.status(status).json({
            status: status,
            error: message
        });
    }
});

// Report JSON parsing and request-size errors that happen before the route runs.
app.use((error, req, res, next) => {
    const errorStatus = Number(error.status ?? error.statusCode);
    const status = errorStatus >= 400 && errorStatus <= 599 ? errorStatus : 500;
    const message = error.message || "The server could not process the request.";

    console.error("Request failed:", {
        name: error.name,
        status: status,
        message: message
    });

    res.status(status).json({
        status: status,
        error: message
    });
});

app.listen(PORT, "0.0.0.0", () => {
    console.log("Running on port: " + PORT);
});

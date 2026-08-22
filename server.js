import express from 'express';
import 'dotenv/config'; 

import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.GEMINI_API_KEY
const ai = new GoogleGenAI({ apiKey: API_KEY });

const PORT = process.env.PORT || 3000;

const app = express();

app.use(express.json());
app.use(express.static("."));

// NOTE: UPDATE ONCE COMPLETED AND ADD STREAMING FOR GENERATED RESPONSE, ALSO ADD OPTION TO USE PDF FILES
app.post("/api/summarize", async (req, res) => {
    try {
        
        const interaction = await ai.interactions.create({
            model: "gemini-3.7-flash",
            input: "Summarize the most important piece of these notes given, be specific, be straight to the point, and only answer if the given notes are school or academic related, otherwise inform the user to please provide academic notes.\n\n" + req.body.content,
        });

        let result = interaction.output_text;

        res.json({ result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, "0.0.0,0", () => {
    console.log("Running on port: " + PORT);
});
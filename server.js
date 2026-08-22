import express from 'express';
import 'dotenv/config'; 

import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.GEMINI_API_KEY
const ai = new GoogleGenAI({ apiKey: API_KEY });

const app = express();

app.use(express.static("."));

app.post("/api/summarize", async (req, res) => {
    try {
        // const result = await

        const interaction = await ai.interactions.create({
            model: "gemini-3.7-flash",
            input: "Explain how AI works in a few words",
        });

        let result = interaction.output_text;

        res.json({ result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000, () => {
    console.log("Open http://localhost:3000");
});
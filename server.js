require("dotenv").config();

import { GoogleGenAI } from "@google/genai";
require("dotenv").config();

const API_KEY = process.env.GEMINI_API_KEY
const ai = new GoogleGenAI({ apiKey: API_KEY });

const express = require("express");

const app = express();

app.use(express.static("."));

app.get("/convert", async (req, res) => {
    try {
        const result = await //NOTE: FINISH

        res.json({ result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000, () => {
    console.log("Open http://localhost:3000");
});
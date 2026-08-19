import { GoogleGenAI } from "@google/genai";
require("dotenv").config();

const API_KEY = process.env.GEMINI_API_KEY
const ai = new GoogleGenAI({ apiKey: API_KEY });
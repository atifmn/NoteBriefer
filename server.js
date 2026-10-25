import express from 'express';
import 'dotenv/config'; 

import { GoogleGenAI } from "@google/genai";
import { createClient } from '@supabase/supabase-js';

// These are public project credentials, the same ones used by the frontend.
const supabase = createClient(
    'https://owaivsmckmdbqktrjisl.supabase.co',
    'sb_publishable_-PpuNLLEnz_BQXxMWL9p7g_1h7ALI2E',
    { auth: { persistSession: false, autoRefreshToken: false } }
);

const API_KEY = process.env.GEMINI_API_KEY
const ai = new GoogleGenAI({ apiKey: API_KEY });

console.log("Gemini API key loaded:", Boolean(API_KEY));

const PORT = process.env.PORT || 3000;

const app = express();

app.use(express.json());
app.use(express.static("."));

async function requireUser(req, res, next) {
    const token = req.get('Authorization')?.match(/^Bearer\s+(\S+)$/i)?.[1];

    if (!token) {
        return res.status(401).json({ status: 401, error: 'Please sign in to generate a summary.' });
    }

    try {
        // Verify with Supabase; never trust a user ID supplied by the browser.
        const { data, error } = await supabase.auth.getUser(token);
        if (error || !data.user) {
            return res.status(401).json({ status: 401, error: 'Your session is invalid or expired. Please sign in again.' });
        }

        req.user = data.user;
        next();
    } catch (error) {
        next(error);
    }
}

// TODO: Add support for PDF files.
app.post("/api/summarize", requireUser, async (req, res) => {
    const timeoutSignal = AbortSignal.timeout(120_000); // Two minutes.
    const controller = new AbortController();
    res.on('close', () => controller.abort());
    try {
        if (!req.body?.content) {
            return res.status(400).json({
                status: 400,
                error: "No note content was provided."
            });
        }
        
        const stream = await ai.interactions.create({
            model: "gemini-3.5-flash-lite",
            stream: true,
            input: "Summarize the most important piece of these notes given, be specific, be straight to the point, and only answer if the given notes are school or academic related, otherwise inform the user to please provide academic notes.\n\n" + req.body.content,
        }, {
            // Keep diagnostic tests from automatically creating extra API attempts.
            maxRetries: 0,
            fetchOptions: { signal: AbortSignal.any([timeoutSignal, controller.signal]) }
        });

        let hasText = false;
        for await (const event of stream) {
            timeoutSignal.throwIfAborted();
            if (event.event_type === 'step.delta' && event.delta?.type === 'text' && event.delta.text) {
                if (!hasText) {
                    res.set({
                        'Content-Type': 'text/plain; charset=utf-8',
                        'Cache-Control': 'no-cache, no-transform',
                        'X-Accel-Buffering': 'no'
                    });
                    hasText = true;
                }
                res.write(event.delta.text);
            } else if (event.event_type === 'error') {
                throw new Error(event.error?.message || 'Summary generation failed.');
            } else if (event.event_type === 'interaction.completed') {
                if (!hasText || event.interaction.status !== 'completed') {
                    throw new Error('The AI could not finish the summary. Please try again later.');
                }
                res.end();
                return;
            }
        }

        throw new Error('The summary stream ended unexpectedly.');
    } catch (error) {
        // Once text has been sent, close the stream so the browser detects the failure.
        if (res.headersSent) {
            console.error('Summary stream failed:', error.message);
            res.destroy();
            return;
        }

        if (timeoutSignal.aborted) {
            return res.status(504).json({
                status: 504,
                error: 'Summary generation took longer than two minutes. Please try again later.'
            });
        }

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

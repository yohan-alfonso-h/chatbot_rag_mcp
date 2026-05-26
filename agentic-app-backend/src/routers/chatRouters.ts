import express from 'express';
import GeminiService from "../services/gemini.service.js";

const router = express.Router();
async function handleChat(req: express.Request, res: express.Response) {
    const { message, prompt } = req.body;
    const userMessage = message ?? prompt;

    if (!userMessage) {
        return res.status(400).json({ error: 'Message is required' });
    }

    try {
        const geminiService = new GeminiService(process.env.GEMINI_API_KEY || '', process.env.GEMINI_MODEL_NAME || '');
        const response = await geminiService.generateResponse(userMessage);
        res.json({ reply: response, response });
    }catch (error: any) {
        console.error("Error in /generate-response from gemini service:", error?.message);
        switch (error?.code) {
            case "AUTH":
                return res.status(401).json({ error: "Invalid Gemini API key or unauthorized access." });
            case "RATE_LIMIT":
                return res.status(429).json({ error: "Gemini rate limit reached. Please retry in a moment." });
            case "MODEL":
                return res.status(400).json({ error: "Invalid Gemini model configuration." });
            case "EMPTY_RESPONSE":
                return res.status(502).json({ error: "Gemini returned an empty response." });
            default:
                return res.status(500).json({ error: "Failed to generate response from the AI." });
        }
    }
}

router.post('/generate-response', handleChat);
router.post('/chat', handleChat);
router.post('/message', handleChat);
router.get('/chat', (_req, res) => {
    res.json({ status: 'ok', endpoint: '/api/chat', method: 'POST' });
});

export default router;

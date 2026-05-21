import geminiProvider from './geminiProvider.js';

//create an instance of express
import { Router } from 'express';
import ragProvider from './rag.js';

const router = Router();
let faqVectorCache;

async function getFaqVectors(gemini) {
    if (!faqVectorCache) {
        faqVectorCache = (async () => {
            const faqData = ragProvider.fetchDocumentData('faqs.json');
            const faqEmbeddings = await gemini.generateEmbeddings(
                faqData.map((item) => ragProvider.createFaqEmbeddingText(item)),
                "RETRIEVAL_DOCUMENT",
            );

            return faqData.map((faq, index) => ({
                ...faq,
                vector: faqEmbeddings[index],
            }));
        })().catch((error) => {
            faqVectorCache = null;
            throw error;
        });
    }

    return faqVectorCache;
}

//sample chat route
router.post('/chat', async (req, res) => {
    const { message } = req.body;
    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    console.log("Received message:", message);

    try {
        const localAnswer = ragProvider.findAnswer(message);

        if (localAnswer) {
            return res.json({ reply: localAnswer });
        }

        const gemini = new geminiProvider(
            process.env.GEMINI_API_KEY ?? process.env.GEMINI_APP_KEY,
            process.env.GEMINI_MODEL_NAME ?? process.env.GEMINI_MODULE_NAME
        );

        // const promt =  ragProvider.prepareSimplerRagPrompt(message);
        // For Rag with Embeddings, we will prepare the prompt differently, by including the retrieved relevant information from the knowledge base.

        const queryVector = await gemini.generateEmbedding(message, "RETRIEVAL_QUERY");
        const faqVectors = await getFaqVectors(gemini);
        const fallbackFaq = ragProvider.rankBySimilarity(queryVector, faqVectors, 1)[0];
        const prompt = ragProvider.prepareRagPrompt(message, queryVector, faqVectors);

        console.log('Prepared prompt:', prompt);

        let response;
        try {
            response = await gemini.generateResponse(prompt);
        } catch (error) {
            if (fallbackFaq?.score >= 0.2) {
                console.warn('Gemini response failed; returning best FAQ match instead.', error);
                return res.json({ reply: fallbackFaq.answer });
            }

            throw error;
        }
        // const response = await gemini.generateResponse(message);
        console.log('Generated response:', response);

        res.json({ reply: response });
    } catch (error) {
        console.error("Error generating response from Gemini API:", error);
        res.status(500).json({ error: 'Failed to generate response from AI' });
    }
});

export default router;

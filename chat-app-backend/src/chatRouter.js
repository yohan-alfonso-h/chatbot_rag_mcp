import geminiProvider from './geminiProvider.js';

//create an instance of express
import { Router } from 'express';
import ragProvider from './rag.js';

const router = Router();
let faqVectorCache;

async function getFaqVectors(gemini) {
    if (!faqVectorCache) {
        faqVectorCache = (async () => {
            try {
                console.log("Loading FAQ data...");
                const faqData = ragProvider.fetchDocumentData('faqs.json');
                console.log(`Loaded ${faqData.length} FAQs`);
                
                console.log("Generating embeddings for FAQs...");
                const faqTexts = faqData.map((item) => ragProvider.createFaqEmbeddingText(item));
                console.log(`Generating embeddings for ${faqTexts.length} FAQ texts`);
                
                const faqEmbeddings = await gemini.generateEmbeddings(
                    faqTexts,
                    "RETRIEVAL_DOCUMENT",
                );
                console.log(`Generated ${faqEmbeddings.length} embeddings`);

                const result = faqData.map((faq, index) => ({
                    ...faq,
                    vector: faqEmbeddings[index],
                }));
                console.log("FAQ vectors cached successfully");
                return result;
            } catch (error) {
                console.error("Error generating FAQ vectors:", error);
                faqVectorCache = null;
                throw error;
            }
        })();
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
            console.log("Found local FAQ answer");
            return res.json({ reply: localAnswer });
        }

        console.log("No local FAQ match found, querying Gemini API...");
        
        const gemini = new geminiProvider(
            process.env.GEMINI_API_KEY ?? process.env.GEMINI_APP_KEY,
            process.env.GEMINI_MODEL_NAME ?? process.env.GEMINI_MODULE_NAME
        );

        console.log("Generating query embedding...");
        const queryVector = await gemini.generateEmbedding(message, "RETRIEVAL_QUERY");
        console.log("Query embedding generated");
        
        console.log("Fetching FAQ vectors...");
        const faqVectors = await getFaqVectors(gemini);
        console.log("FAQ vectors retrieved");
        
        const fallbackFaq = ragProvider.rankBySimilarity(queryVector, faqVectors, 1)[0];
        const prompt = ragProvider.prepareRagPrompt(message, queryVector, faqVectors);

        console.log('Prepared prompt, calling Gemini API...');

        let response;
        try {
            response = await gemini.generateResponse(prompt);
        } catch (error) {
            console.error('Gemini API error:', error.message);
            if (fallbackFaq?.score >= 0.2) {
                console.warn('Gemini response failed; returning best FAQ match instead.');
                return res.json({ reply: fallbackFaq.answer });
            }

            throw error;
        }
        
        console.log('Generated response successfully');

        res.json({ reply: response });
    } catch (error) {
        console.error("Error generating response:", error);
        res.status(500).json({ 
            error: 'Failed to generate response from AI',
            details: error.message 
        });
    }
});

export default router;

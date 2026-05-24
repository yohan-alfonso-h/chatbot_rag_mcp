import geminiProvider from './geminiProvider.js';
import openaiProvider from './openaiProvider.js';
import ProviderFactory from './providerFactory.js';

//create an instance of express
import { Router } from 'express';
import ragProvider from './rag.js';

const router = Router();
let faqVectorCache = {}; // Cache per provider

async function getFaqVectors(aiProvider) {
    const providerName = aiProvider.constructor.name;
    
    if (!faqVectorCache[providerName]) {
        faqVectorCache[providerName] = (async () => {
            try {
                console.log(`Loading FAQ data for ${providerName}...`);
                const faqData = ragProvider.fetchDocumentData('faqs.json');
                console.log(`Loaded ${faqData.length} FAQs`);
                
                console.log("Generating embeddings for FAQs...");
                const faqTexts = faqData.map((item) => ragProvider.createFaqEmbeddingText(item));
                console.log(`Generating embeddings for ${faqTexts.length} FAQ texts using ${providerName}`);
                
                const faqEmbeddings = await aiProvider.generateEmbeddings(
                    faqTexts,
                    "RETRIEVAL_DOCUMENT",
                );
                console.log(`Generated ${faqEmbeddings.length} embeddings`);

                const result = faqData.map((faq, index) => ({
                    ...faq,
                    vector: faqEmbeddings[index],
                }));
                console.log(`FAQ vectors cached successfully for ${providerName}`);
                return result;
            } catch (error) {
                console.error(`Error generating FAQ vectors for ${providerName}:`, error.message);
                faqVectorCache[providerName] = null;
                throw error;
            }
        })();
    }

    return faqVectorCache[providerName];
}

//sample chat route
router.post('/chat', async (req, res) => {
    const { message, provider } = req.body;
    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    console.log("Received message:", message);
    const selectedProvider = provider || process.env.AI_PROVIDER || 'gemini';
    console.log(`Using provider: ${selectedProvider}`);

    try {
        const localAnswer = ragProvider.findAnswer(message);

        if (localAnswer) {
            console.log("Found local FAQ answer");
            return res.json({ reply: localAnswer, provider: 'local_faq' });
        }

        console.log("No local FAQ match found, querying AI provider...");
        
        // Get provider instance
        let aiProvider;
        try {
            aiProvider = ProviderFactory.getProvider(selectedProvider);
        } catch (error) {
            console.error("Provider initialization error:", error.message);
            const availableProviders = ProviderFactory.getAvailableProviders();
            return res.status(400).json({
                error: `Provider '${selectedProvider}' not available`,
                availableProviders: availableProviders,
                message: error.message
            });
        }

        console.log("Generating query embedding...");
        const queryVector = await aiProvider.generateEmbedding(message, "RETRIEVAL_QUERY");
        console.log("Query embedding generated");
        
        console.log("Fetching FAQ vectors...");
        const faqVectors = await getFaqVectors(aiProvider);
        console.log("FAQ vectors retrieved");
        
        const fallbackFaq = ragProvider.rankBySimilarity(queryVector, faqVectors, 1)[0];
        const prompt = ragProvider.prepareRagPrompt(message, queryVector, faqVectors);

        console.log('Prepared prompt, calling AI provider...');

        let response;
        try {
            response = await aiProvider.generateResponse(prompt);
        } catch (error) {
            console.error(`${selectedProvider} API error:`, error.message);
            if (fallbackFaq?.score >= 0.2) {
                console.warn('AI provider failed; returning best FAQ match instead.');
                return res.json({ 
                    reply: fallbackFaq.answer, 
                    provider: `${selectedProvider}_fallback_faq`,
                    fallbackReason: error.message
                });
            }

            throw error;
        }
        
        console.log('Generated response successfully');

        res.json({ 
            reply: response, 
            provider: selectedProvider
        });
    } catch (error) {
        console.error("Error generating response:", error.message);
        const availableProviders = ProviderFactory.getAvailableProviders();
        res.status(500).json({ 
            error: 'Failed to generate response from AI',
            details: error.message,
            availableProviders: availableProviders
        });
    }
});

export default router;

// Additional routes for provider management
router.get('/providers', (req, res) => {
    try {
        const availableProviders = ProviderFactory.getAvailableProviders();
        const defaultProvider = ProviderFactory.getDefaultProvider();
        
        res.json({
            available: availableProviders,
            default: defaultProvider,
            info: {
                gemini: {
                    name: "Google Gemini",
                    models: ["gemini-2.5-flash", "gemini-1.5-pro"],
                    embeddingModel: "gemini-embedding-001",
                    embeddingDimensions: 3072,
                    configured: availableProviders.includes("gemini")
                },
                openai: {
                    name: "OpenAI",
                    models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"],
                    embeddingModel: "text-embedding-3-small",
                    embeddingDimensions: 1536,
                    configured: availableProviders.includes("openai")
                }
            }
        });
    } catch (error) {
        console.error("Error fetching providers info:", error.message);
        res.status(500).json({
            error: "Failed to fetch provider information",
            details: error.message
        });
    }
});

export default router;

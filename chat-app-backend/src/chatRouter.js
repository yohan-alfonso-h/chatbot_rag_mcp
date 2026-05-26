import { Router } from 'express';
import ProviderFactory from './providerFactory.js';
import ragProvider from './rag.js';

const router = Router();

// Cache de embeddings de FAQs por proveedor.
// Importante: Gemini y OpenAI generan embeddings con dimensiones distintas,
// por eso no se deben mezclar vectores entre proveedores.
const faqVectorCache = {};

const SUPPORTED_PROVIDERS = ['gemini', 'openai'];

function normalizeProvider(provider) {
    return String(provider || '').trim().toLowerCase();
}

function getSelectedProvider(requestedProvider) {
    const provider = normalizeProvider(
        requestedProvider || process.env.AI_PROVIDER || 'gemini'
    );

    if (!SUPPORTED_PROVIDERS.includes(provider)) {
        throw new Error(
            `Invalid provider '${provider}'. Supported providers: ${SUPPORTED_PROVIDERS.join(', ')}`
        );
    }

    return provider;
}

async function getFaqVectors(aiProvider, providerName) {
    const cacheKey = `${providerName}_faq_vectors`;

    if (!faqVectorCache[cacheKey]) {
        faqVectorCache[cacheKey] = (async () => {
            try {
                console.log(`Loading FAQ data for ${providerName}...`);

                const faqData = ragProvider.fetchDocumentData('faqs.json');
                console.log(`Loaded ${faqData.length} FAQs`);

                const faqTexts = faqData.map((item) =>
                    ragProvider.createFaqEmbeddingText(item)
                );

                console.log(
                    `Generating embeddings for ${faqTexts.length} FAQ texts using ${providerName}`
                );

                const faqEmbeddings = await aiProvider.generateEmbeddings(
                    faqTexts,
                    'RETRIEVAL_DOCUMENT'
                );

                console.log(`Generated ${faqEmbeddings.length} embeddings`);

                const result = faqData.map((faq, index) => ({
                    ...faq,
                    vector: faqEmbeddings[index]
                }));

                console.log(`FAQ vectors cached successfully for ${providerName}`);
                return result;
            } catch (error) {
                console.error(
                    `Error generating FAQ vectors for ${providerName}:`,
                    error.message
                );

                delete faqVectorCache[cacheKey];
                throw error;
            }
        })();
    }

    return faqVectorCache[cacheKey];
}

// Chat route
router.post('/chat', async (req, res) => {
    const { message, provider } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({
            error: 'Message is required'
        });
    }

    let selectedProvider;

    try {
        selectedProvider = getSelectedProvider(provider);
    } catch (error) {
        return res.status(400).json({
            error: error.message,
            availableProviders: ProviderFactory.getAvailableProviders()
        });
    }

    console.log('Received message:', message);
    console.log(`Using provider: ${selectedProvider}`);

    try {
        // Step 1: local FAQ fast path
        const localAnswer = ragProvider.findAnswer(message);

        if (localAnswer) {
            console.log('Found local FAQ answer');

            return res.json({
                reply: localAnswer,
                provider: 'local_faq'
            });
        }

        console.log('No local FAQ match found, querying AI provider...');

        // Step 2: provider selection
        let aiProvider;

        try {
            aiProvider = ProviderFactory.getProvider(selectedProvider);
        } catch (error) {
            console.error('Provider initialization error:', error.message);

            return res.status(400).json({
                error: `Provider '${selectedProvider}' not available`,
                availableProviders: ProviderFactory.getAvailableProviders(),
                message: error.message
            });
        }

        // Step 3: query embedding
        console.log('Generating query embedding...');

        const queryVector = await aiProvider.generateEmbedding(
            message,
            'RETRIEVAL_QUERY'
        );

        console.log('Query embedding generated');

        // Step 4: FAQ embeddings cache by provider
        console.log('Fetching FAQ vectors...');

        const faqVectors = await getFaqVectors(aiProvider, selectedProvider);

        console.log('FAQ vectors retrieved');

        // Step 5: similarity ranking + prompt creation
        const fallbackFaq = ragProvider.rankBySimilarity(
            queryVector,
            faqVectors,
            1
        )[0];

        const prompt = ragProvider.prepareRagPrompt(
            message,
            queryVector,
            faqVectors
        );

        console.log('Prepared prompt, calling AI provider...');

        // Step 6: generate answer
        let response;

        try {
            response = await aiProvider.generateResponse(prompt);
        } catch (error) {
            console.error(`${selectedProvider} API error:`, error.message);

            if (fallbackFaq?.score >= 0.2) {
                console.warn(
                    'AI provider failed; returning best FAQ match instead.'
                );

                return res.json({
                    reply: fallbackFaq.answer,
                    provider: `${selectedProvider}_fallback_faq`,
                    fallbackReason: error.message,
                    score: fallbackFaq.score
                });
            }

            throw error;
        }

        console.log('Generated response successfully');

        return res.json({
            reply: response,
            provider: selectedProvider
        });
    } catch (error) {
        console.error('Error generating response:', error.message);

        return res.status(500).json({
            error: 'Failed to generate response from AI',
            details: error.message,
            availableProviders: ProviderFactory.getAvailableProviders()
        });
    }
});

// Provider management route
router.get('/providers', (req, res) => {
    try {
        const availableProviders = ProviderFactory.getAvailableProviders();
        const defaultProvider = ProviderFactory.getDefaultProvider();

        return res.json({
            available: availableProviders,
            default: defaultProvider,
            info: {
                gemini: {
                    name: 'Google Gemini',
                    models: ['gemini-2.5-flash', 'gemini-1.5-pro'],
                    embeddingModel: 'gemini-embedding-001',
                    embeddingDimensions: 3072,
                    configured: availableProviders.includes('gemini')
                },
                openai: {
                    name: 'OpenAI',
                    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
                    embeddingModel: 'text-embedding-3-small',
                    embeddingDimensions: 1536,
                    configured: availableProviders.includes('openai')
                }
            }
        });
    } catch (error) {
        console.error('Error fetching providers info:', error.message);

        return res.status(500).json({
            error: 'Failed to fetch provider information',
            details: error.message
        });
    }
});

export default router;
import ProviderFactory from "./src/providerFactory.js";
import ragProvider from "./src/rag.js";

async function testBothProviders() {
  console.log("🔍 Testing Both AI Providers (Gemini vs OpenAI)\n");
  console.log("=" .repeat(60));

  const availableProviders = ProviderFactory.getAvailableProviders();
  console.log(`Available providers: ${availableProviders.join(", ")}\n`);

  for (const providerName of availableProviders) {
    console.log(`\n🚀 Testing ${providerName.toUpperCase()}`);
    console.log("-".repeat(60));

    try {
      const provider = ProviderFactory.getProvider(providerName);
      console.log(`✓ ${providerName} provider initialized`);

      // Test 1: Generate response
      console.log(`\n1️⃣  Text Generation Test`);
      const testPrompt = "What is your refund policy? Answer in one sentence.";
      console.log(`   Prompt: "${testPrompt}"`);
      
      const startTime = Date.now();
      const response = await provider.generateResponse(testPrompt);
      const duration = Date.now() - startTime;
      
      console.log(`   ✓ Response (${duration}ms):`);
      console.log(`   "${response.substring(0, 100)}..."\n`);

      // Test 2: Generate embeddings
      console.log(`2️⃣  Embeddings Generation Test`);
      const testTexts = [
        "How do I reset my password?",
        "What is your refund policy?",
        "Do you provide phone support?"
      ];

      const embStart = Date.now();
      const embeddings = await provider.generateEmbeddings(testTexts, "RETRIEVAL_DOCUMENT");
      const embDuration = Date.now() - embStart;

      console.log(`   Embedding ${testTexts.length} texts (${embDuration}ms):`);
      console.log(`   ✓ Generated ${embeddings.length} embeddings`);
      console.log(`   ✓ Embedding dimensions: ${embeddings[0].length}\n`);

      // Test 3: RAG flow
      console.log(`3️⃣  RAG Pipeline Test`);
      const userQuestion = "How do I reset my password?";
      console.log(`   User question: "${userQuestion}"`);

      const ragStart = Date.now();
      
      // Generate query embedding
      const queryVector = await provider.generateEmbedding(userQuestion, "RETRIEVAL_QUERY");
      
      // Load and embed FAQs
      const faqData = ragProvider.fetchDocumentData('faqs.json');
      const faqTexts = faqData.map((item) => ragProvider.createFaqEmbeddingText(item));
      const faqEmbeddings = await provider.generateEmbeddings(faqTexts, "RETRIEVAL_DOCUMENT");
      const faqVectors = faqData.map((faq, index) => ({
        ...faq,
        vector: faqEmbeddings[index],
      }));

      // Rank by similarity
      const ranked = ragProvider.rankBySimilarity(queryVector, faqVectors, 1)[0];
      
      // Build prompt
      const prompt = ragProvider.prepareRagPrompt(userQuestion, queryVector, faqVectors);
      
      // Generate response
      const ragResponse = await provider.generateResponse(prompt);
      const ragDuration = Date.now() - ragStart;

      console.log(`   ✓ Top FAQ match: "${ranked.question}"`);
      console.log(`   ✓ Match score: ${(ranked.score * 100).toFixed(2)}%`);
      console.log(`   ✓ RAG response (${ragDuration}ms):`);
      console.log(`   "${ragResponse.substring(0, 100)}..."\n`);

      console.log(`✅ ${providerName.toUpperCase()} Provider Tests Passed!\n`);

    } catch (error) {
      console.error(`❌ ${providerName.toUpperCase()} Provider Test Failed:`);
      console.error(`   Error: ${error.message}\n`);
    }
  }

  console.log("=" .repeat(60));
  console.log("\n📊 Test Summary:");
  console.log(`   Tested providers: ${availableProviders.join(", ")}`);
  console.log(`   All tests completed!\n`);
}

testBothProviders().catch(console.error);

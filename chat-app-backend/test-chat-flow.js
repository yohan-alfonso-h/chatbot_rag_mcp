import geminiProvider from "./src/geminiProvider.js";
import ragProvider from "./src/rag.js";

async function testFullChatFlow() {
  console.log("🔍 Testing Full Chat Flow...\n");

  try {
    // Test 1: Initialize Gemini
    console.log("1️⃣  Initializing Gemini provider...");
    const gemini = new geminiProvider(
      process.env.GEMINI_APP_KEY ?? process.env.GEMINI_API_KEY,
      process.env.GEMINI_MODEL_NAME ?? "gemini-2.5-flash"
    );
    console.log("   ✓ Gemini provider initialized\n");

    // Test 2: Load FAQ data
    console.log("2️⃣  Loading FAQ data...");
    const faqData = ragProvider.fetchDocumentData('faqs.json');
    console.log(`   ✓ Loaded ${faqData.length} FAQs\n`);

    // Test 3: Generate query embedding
    console.log("3️⃣  Testing query embedding...");
    const testMessage = "How do I reset my password?";
    const queryVector = await gemini.generateEmbedding(testMessage, "RETRIEVAL_QUERY");
    console.log(`   ✓ Generated query embedding (${queryVector.length} dimensions)\n`);

    // Test 4: Generate FAQ embeddings
    console.log("4️⃣  Generating FAQ embeddings...");
    const faqTexts = faqData.map((item) => ragProvider.createFaqEmbeddingText(item));
    console.log(`   Preparing ${faqTexts.length} FAQ texts...`);
    const faqEmbeddings = await gemini.generateEmbeddings(faqTexts, "RETRIEVAL_DOCUMENT");
    console.log(`   ✓ Generated ${faqEmbeddings.length} FAQ embeddings\n`);

    // Test 5: Create FAQ vectors
    console.log("5️⃣  Creating FAQ vectors...");
    const faqVectors = faqData.map((faq, index) => ({
      ...faq,
      vector: faqEmbeddings[index],
    }));
    console.log(`   ✓ Created ${faqVectors.length} FAQ vectors\n`);

    // Test 6: Rank by similarity
    console.log("6️⃣  Ranking FAQs by similarity...");
    const ranked = ragProvider.rankBySimilarity(queryVector, faqVectors, 1);
    console.log(`   ✓ Ranked FAQs: ${ranked[0]?.question}\n`);

    // Test 7: Prepare RAG prompt
    console.log("7️⃣  Preparing RAG prompt...");
    const prompt = ragProvider.prepareRagPrompt(testMessage, queryVector, faqVectors);
    console.log(`   ✓ Prompt prepared (${prompt.length} characters)\n`);

    // Test 8: Generate response
    console.log("8️⃣  Generating Gemini response...");
    const response = await gemini.generateResponse(prompt);
    console.log(`   ✓ Response received\n`);
    console.log("   Response:", response.substring(0, 100) + "...\n");

    console.log("✅ Full chat flow test passed!");
    console.log("\nYour backend should now work correctly.");
    console.log("Try sending a message through the frontend.");

  } catch (error) {
    console.error("❌ Error during chat flow test:\n");
    console.error("Error type:", error.constructor.name);
    console.error("Error message:", error.message);
    console.error("\nStack trace:");
    console.error(error.stack);
    
    console.error("\n⚠️  Troubleshooting tips:");
    console.error("1. Check that .env file has GEMINI_APP_KEY");
    console.error("2. Verify faqs.json and knowledgeBase.json exist in data/");
    console.error("3. Check that @google/genai package is installed");
    console.error("4. Look at the specific error message above for details");
    
    process.exit(1);
  }
}

testFullChatFlow();

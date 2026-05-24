import ProviderFactory from "./src/providerFactory.js";

async function testOpenAIProvider() {
  console.log("🔍 Testing OpenAI Provider...\n");

  try {
    const provider = ProviderFactory.getProvider("openai");
    console.log("✓ OpenAI provider initialized\n");

    // Test 1: Text generation
    console.log("1️⃣  Testing text generation...");
    const response = await provider.generateResponse("Say 'Hello from OpenAI' in one sentence.");
    console.log("   ✓ Success! Response:");
    console.log(`   "${response}"\n`);

    // Test 2: Single embedding
    console.log("2️⃣  Testing single embedding generation...");
    const embedding = await provider.generateEmbedding("Hello world");
    console.log(`   ✓ Generated embedding with ${embedding.length} dimensions\n`);

    // Test 3: Multiple embeddings
    console.log("3️⃣  Testing multiple embeddings generation...");
    const embeddings = await provider.generateEmbeddings([
      "What is your refund policy?",
      "How do I reset my password?",
      "Do you provide phone support?"
    ], "RETRIEVAL_DOCUMENT");
    console.log(`   ✓ Generated ${embeddings.length} embeddings\n`);

    console.log("✅ All OpenAI tests passed!");

  } catch (error) {
    console.error("❌ OpenAI Provider Test Failed:\n");
    console.error("Error type:", error.constructor.name);
    console.error("Error message:", error.message);
    console.error("\nTroubleshooting:");
    console.error("1. Ensure OPENAI_API_KEY is set in .env file");
    console.error("2. Check that the API key is valid and not expired");
    console.error("3. Verify your OpenAI account has available credits");
    console.error("4. Check models: gpt-4o-mini (text) and text-embedding-3-small (embeddings)");
    process.exit(1);
  }
}

testOpenAIProvider();

import { GoogleGenAI } from "@google/genai";

async function testGeminiConnection() {
  console.log("🔍 Testing Gemini API Connection...\n");

  const apiKey = process.env.GEMINI_APP_KEY;
  const modelName = process.env.GEMINI_MODEL_NAME || "gemini-2.5-flash";

  console.log("Configuration:");
  console.log(`  API Key: ${apiKey ? apiKey.substring(0, 10) + "..." : "NOT SET"}`);
  console.log(`  Model: ${modelName}\n`);

  if (!apiKey) {
    console.error("❌ GEMINI_APP_KEY is not set in environment");
    process.exit(1);
  }

  try {
    console.log("1. Initializing GoogleGenAI client...");
    const genAI = new GoogleGenAI({ apiKey });
    console.log("   ✓ Client initialized successfully\n");

    console.log("2. Testing generateContent (text generation)...");
    const response = await genAI.models.generateContent({
      model: modelName,
      contents: "Say 'Hello from Gemini API' in one sentence.",
    });
    console.log("   ✓ Success! Response:");
    console.log(`   "${response.text}"\n`);

    console.log("3. Testing generateEmbeddings (embeddings generation)...");
    const embeddingResponse = await genAI.models.embedContent({
      model: "gemini-embedding-001",
      contents: ["Hello world"],
      config: {
        taskType: "RETRIEVAL_QUERY",
      },
    });
    console.log("   ✓ Success! Generated embedding:");
    console.log(`   Vector dimensions: ${embeddingResponse.embeddings[0]?.values?.length || "N/A"}\n`);

    console.log("✅ All tests passed! Your Gemini API is working correctly.");
    console.log("\nYour .env configuration is valid. If you're still getting 500 errors:");
    console.log("1. Check the full error message in the backend console");
    console.log("2. Make sure the backend is sending requests to the correct endpoint");
    console.log("3. Verify the chat message format matches what the backend expects");

  } catch (error) {
    console.error("❌ Error testing Gemini API:\n");
    console.error("Error type:", error.constructor.name);
    console.error("Error message:", error.message);
    
    if (error.message.includes("API key") || error.message.includes("INVALID_ARGUMENT")) {
      console.error("\n⚠️  Issue: Invalid or expired API key");
      console.error("   Solution: Get a new API key from https://aistudio.google.com/");
    } else if (error.message.includes("429")) {
      console.error("\n⚠️  Issue: Rate limit exceeded");
      console.error("   Solution: Wait a few minutes before trying again");
    } else if (error.message.includes("model")) {
      console.error("\n⚠️  Issue: Model not found");
      console.error("   Solution: Verify GEMINI_MODEL_NAME is correct");
    }
    
    console.error("\nFull error details:");
    console.error(error);
    process.exit(1);
  }
}

testGeminiConnection();

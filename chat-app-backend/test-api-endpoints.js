import fetch from 'node-fetch';

async function testChatAPI() {
  console.log("🧪 Testing Chat API with Provider Selection\n");
  console.log("=" .repeat(70));

  const baseURL = "http://localhost:3000";
  let testsPassed = 0;
  let testsFailed = 0;

  // Test 1: Local FAQ (No provider needed, fastest)
  console.log("\n1️⃣  Test: Local FAQ Match");
  console.log("   Sending: 'How do I reset my password?'");
  
  try {
    const response = await fetch(`${baseURL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        message: "How do I reset my password?" 
      })
    });

    const data = await response.json();
    console.log(`   ✓ Status: ${response.status}`);
    console.log(`   ✓ Provider Used: ${data.provider}`);
    console.log(`   ✓ Reply: "${data.reply.substring(0, 60)}..."`);
    testsPassed++;
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    testsFailed++;
  }

  // Test 2: Gemini Provider
  console.log("\n2️⃣  Test: Gemini Provider (Complex Question)");
  console.log("   Sending: 'What is your complete refund policy and shipping details?'");
  
  try {
    const response = await fetch(`${baseURL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        message: "What is your complete refund policy and shipping details?",
        provider: "gemini"
      })
    });

    const data = await response.json();
    console.log(`   ✓ Status: ${response.status}`);
    console.log(`   ✓ Provider Used: ${data.provider}`);
    console.log(`   ✓ Reply: "${data.reply.substring(0, 60)}..."`);
    testsPassed++;
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    testsFailed++;
  }

  // Test 3: OpenAI Provider (if configured)
  console.log("\n3️⃣  Test: OpenAI Provider (if available)");
  console.log("   Sending: 'What is your complete refund policy and shipping details?'");
  
  try {
    const response = await fetch(`${baseURL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        message: "What is your complete refund policy and shipping details?",
        provider: "openai"
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`   ✓ Status: ${response.status}`);
      console.log(`   ✓ Provider Used: ${data.provider}`);
      console.log(`   ✓ Reply: "${data.reply.substring(0, 60)}..."`);
      testsPassed++;
    } else {
      const data = await response.json();
      console.log(`   ⚠️  Status: ${response.status}`);
      console.log(`   ⚠️  Message: ${data.message || data.error}`);
      console.log(`   ⚠️  Available: ${data.availableProviders?.join(", ")}`);
      testsFailed++;
    }
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    testsFailed++;
  }

  // Test 4: Get Provider Info
  console.log("\n4️⃣  Test: Get Available Providers");
  console.log("   GET /api/providers");
  
  try {
    const response = await fetch(`${baseURL}/api/providers`);
    const data = await response.json();
    
    console.log(`   ✓ Status: ${response.status}`);
    console.log(`   ✓ Available: ${data.available.join(", ")}`);
    console.log(`   ✓ Default: ${data.default}`);
    console.log(`   ✓ Gemini Dims: ${data.info.gemini.embeddingDimensions}`);
    console.log(`   ✓ OpenAI Dims: ${data.info.openai.embeddingDimensions}`);
    testsPassed++;
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    testsFailed++;
  }

  // Test 5: Invalid Provider
  console.log("\n5️⃣  Test: Invalid Provider Handling");
  console.log("   Sending with provider: 'claude' (not supported)");
  
  try {
    const response = await fetch(`${baseURL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        message: "Hello",
        provider: "claude"
      })
    });

    if (response.status === 400) {
      const data = await response.json();
      console.log(`   ✓ Status: ${response.status} (correctly rejected)`);
      console.log(`   ✓ Error: ${data.error}`);
      console.log(`   ✓ Available: ${data.availableProviders?.join(", ")}`);
      testsPassed++;
    } else {
      console.log(`   ❌ Expected 400, got ${response.status}`);
      testsFailed++;
    }
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    testsFailed++;
  }

  // Summary
  console.log("\n" + "=" .repeat(70));
  console.log("\n📊 Test Summary:");
  console.log(`   Tests Passed: ${testsPassed} ✅`);
  console.log(`   Tests Failed: ${testsFailed} ❌`);
  console.log(`   Total Tests: ${testsPassed + testsFailed}`);
  console.log(`   Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(0)}%\n`);

  if (testsFailed === 0) {
    console.log("🎉 All tests passed! Your multi-provider setup is working perfectly!\n");
  } else {
    console.log("⚠️  Some tests failed. Check the backend server and API keys.\n");
  }
}

// Check if backend is running
console.log("🔌 Checking backend connection...\n");

fetch("http://localhost:3000/api/providers")
  .then(() => {
    console.log("✅ Backend is running on http://localhost:3000\n");
    testChatAPI().catch(console.error);
  })
  .catch(() => {
    console.error("❌ Backend is not running!");
    console.error("\nTo start the backend, run:");
    console.error("  cd chat-app-backend");
    console.error("  npm start\n");
  });

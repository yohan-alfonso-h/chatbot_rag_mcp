# OpenAI Integration Guide

## Overview

Your chatbot RAG system now supports **multiple AI providers**:
- ✅ **Google Gemini** (default) - Free tier available, powerful embeddings (3072 dimensions)
- ✅ **OpenAI** (optional) - Powerful GPT models, reliable embeddings (1536 dimensions)

You can switch between providers at runtime or set a default in your `.env` file.

---

## Setup Instructions

### 1. Get OpenAI API Key

1. Go to https://platform.openai.com/account/api-keys
2. Create a new API key
3. Copy the key (it starts with `sk-proj-`)

### 2. Update `.env` File

Add your OpenAI credentials:

```bash
# AI Provider Selection (gemini or openai)
AI_PROVIDER=gemini

# OpenAI Configuration
OPENAI_API_KEY=sk-proj-your_key_here
OPENAI_MODEL_NAME=gpt-4o-mini
```

**Model Options:**
- `gpt-4o-mini` - Fastest, cheapest (recommended for development)
- `gpt-4o` - More capable, higher cost
- `gpt-4-turbo` - Balance of cost and capability

### 3. Install Dependencies

```bash
npm install openai
```

(Already installed in your project)

---

## Usage

### Send Message with Default Provider

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "How do I reset my password?"}'
```

**Response:**
```json
{
  "reply": "To reset your password, go to Account Settings...",
  "provider": "gemini"
}
```

### Send Message with Specific Provider

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "How do I reset my password?", "provider": "openai"}'
```

**Response:**
```json
{
  "reply": "To reset your password, visit the Account Settings page...",
  "provider": "openai"
}
```

### Check Available Providers

```bash
curl http://localhost:3000/api/providers
```

**Response:**
```json
{
  "available": ["gemini", "openai"],
  "default": "gemini",
  "info": {
    "gemini": {
      "name": "Google Gemini",
      "models": ["gemini-2.5-flash", "gemini-1.5-pro"],
      "embeddingModel": "gemini-embedding-001",
      "embeddingDimensions": 3072,
      "configured": true
    },
    "openai": {
      "name": "OpenAI",
      "models": ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"],
      "embeddingModel": "text-embedding-3-small",
      "embeddingDimensions": 1536,
      "configured": true
    }
  }
}
```

---

## Testing

### Test OpenAI Provider Only

```bash
cd chat-app-backend
npm run dev  # or npm start
# In another terminal:
node --env-file=.env test-openai.js
```

### Compare Both Providers

```bash
node --env-file=.env test-both-providers.js
```

Output:
```
🔍 Testing Both AI Providers (Gemini vs OpenAI)

============================================================
Available providers: gemini, openai

🚀 Testing GEMINI
------------------------------------------------------------
✓ gemini provider initialized

1️⃣  Text Generation Test
   Prompt: "What is your refund policy? Answer in one sentence."
   ✓ Response (1250ms):
   "We offer refunds within 30 days..."

2️⃣  Embeddings Generation Test
   Embedding 3 texts (2100ms):
   ✓ Generated 3 embeddings
   ✓ Embedding dimensions: 3072

3️⃣  RAG Pipeline Test
   User question: "How do I reset my password?"
   ✓ Top FAQ match: "How do I reset my password?"
   ✓ Match score: 98.45%
   ✓ RAG response (1500ms):
   "To reset your password..."

✅ GEMINI Provider Tests Passed!

🚀 Testing OPENAI
------------------------------------------------------------
✓ openai provider initialized
[... similar tests ...]
✅ OPENAI Provider Tests Passed!
```

---

## Provider Comparison

| Feature | Gemini | OpenAI |
|---------|--------|--------|
| **Free Tier** | ✅ Yes (50 RPM) | ❌ No |
| **Text Generation** | Excellent | Excellent |
| **Embedding Model** | gemini-embedding-001 (3072-dim) | text-embedding-3-small (1536-dim) |
| **Cost** | Very cheap | Moderate |
| **Speed** | Fast | Fast |
| **Reliability** | Good | Excellent |
| **Best For** | Cost-effective RAG | Production applications |

### Performance Notes

**Gemini:**
- Free tier available with rate limits
- Large embeddings (3072 dimensions) = better semantic understanding
- Good for cost-sensitive applications

**OpenAI:**
- No free tier, but very reliable
- Smaller embeddings (1536 dimensions) = faster processing
- Better for high-volume production systems

---

## Architecture

```
┌─────────────────────┐
│   Chat Request      │
│  {message, provider}│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│      Provider Factory                   │
│  selectProvider(provider || default)    │
└──────────┬──────────────────────────────┘
           │
      ┌────┴────┐
      ▼         ▼
┌──────────┐  ┌──────────┐
│  Gemini  │  │ OpenAI   │
│ Provider │  │ Provider │
└────┬─────┘  └────┬─────┘
     │             │
     └─────┬───────┘
           ▼
    ┌──────────────┐
    │ RAG Pipeline │
    │ - Query embed│
    │ - FAQ embed  │
    │ - Similarity │
    │ - Generate   │
    └──────┬───────┘
           ▼
    ┌──────────────┐
    │   Response   │
    │{reply, prov} │
    └──────────────┘
```

---

## Common Issues & Solutions

### ❌ "OpenAI API key not set"
**Solution:** Add `OPENAI_API_KEY` to `.env` file

### ❌ "Invalid or expired OpenAI API key"
**Solution:** 
- Check key starts with `sk-proj-`
- Verify key hasn't expired at https://platform.openai.com/account/api-keys
- Check account has available credits

### ❌ "Model 'gpt-5-nano' not found"
**Solution:** Use valid model names: `gpt-4o`, `gpt-4o-mini`, or `gpt-4-turbo`

### ❌ "Rate limit exceeded"
**Solution:** 
- Wait a few minutes before retrying
- For production, implement exponential backoff
- Consider upgrading OpenAI plan

### ❌ Embeddings have different dimensions
**Solution:** Normal behavior - each provider has different embedding sizes
- Gemini: 3072 dimensions
- OpenAI: 1536 dimensions
- Separate FAQ caches per provider to avoid conflicts

---

## Code Examples

### Use OpenAI as Default Provider

Update `.env`:
```bash
AI_PROVIDER=openai
OPENAI_API_KEY=sk-proj-your-key
OPENAI_MODEL_NAME=gpt-4o-mini
```

### Programmatic Provider Selection

```javascript
// In your application
const message = "How do I reset my password?";
const provider = req.query.provider || 'gemini'; // from query param

const response = await fetch('http://localhost:3000/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message, provider })
});

const data = await response.json();
console.log(`Response from ${data.provider}: ${data.reply}`);
```

### Custom Provider Selection Logic

```javascript
// src/chatRouter.js - add before the chat route

// Example: Use OpenAI for complex questions, Gemini for simple FAQ
router.post('/chat', async (req, res) => {
  const { message } = req.body;
  
  // Determine provider based on message complexity
  const wordCount = message.split(' ').length;
  const provider = wordCount > 5 ? 'openai' : 'gemini';
  
  // ... rest of handler
});
```

---

## Cost Estimation

### Gemini (Monthly)
- 50 requests/min free tier: ~$0
- 100 requests/min: ~$1-5/month

### OpenAI (Monthly)
- 1000 chat completions: ~$5-10/month
- 1000 embeddings: ~$0.02/month
- **Total typical usage: ~$5-15/month**

---

## Future Enhancements

- [ ] Add Claude AI support
- [ ] Implement provider load balancing
- [ ] Add provider performance metrics
- [ ] Support provider fallback chains
- [ ] Add cost tracking per provider

---

## Support

For issues with:
- **Gemini**: https://ai.google.dev/
- **OpenAI**: https://platform.openai.com/docs/

For issues with this integration, check:
- Backend console logs: `npm start`
- Diagnostic script: `node --env-file=.env test-both-providers.js`
- Provider info: `curl http://localhost:3000/api/providers`

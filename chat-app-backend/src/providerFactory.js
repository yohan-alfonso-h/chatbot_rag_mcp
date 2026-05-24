import geminiProvider from './geminiProvider.js';
import openaiProvider from './openaiProvider.js';

class ProviderFactory {
  static getProvider(providerName = "gemini") {
    const provider = providerName.toLowerCase();

    if (provider === "openai") {
      const apiKey = process.env.OPENAI_API_KEY;
      const modelName = process.env.OPENAI_MODEL_NAME || "gpt-4o-mini";

      if (!apiKey) {
        throw new Error("OPENAI_API_KEY not set in environment variables");
      }

      const instance = new openaiProvider(apiKey, modelName);
      try {
        console.log(`selected provider: openai, using model: ${modelName}`);
      } catch (e) {}
      return instance;
    }

    if (provider === "gemini") {
      const apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_APP_KEY;
      const modelName = process.env.GEMINI_MODEL_NAME || "gemini-2.5-flash";

      if (!apiKey) {
        throw new Error("GEMINI_API_KEY or GEMINI_APP_KEY not set in environment variables");
      }

      const instance = new geminiProvider(apiKey, modelName);
      try {
        console.log(`selected provider: gemini, using model: ${modelName}`);
      } catch (e) {}
      return instance;
    }

    throw new Error(
      `Unknown provider: ${providerName}. Supported providers: 'gemini', 'openai'`
    );
  }

  static getAvailableProviders() {
    const available = [];

    if (process.env.GEMINI_API_KEY || process.env.GEMINI_APP_KEY) {
      available.push("gemini");
    }

    if (process.env.OPENAI_API_KEY) {
      available.push("openai");
    }

    return available;
  }

  static getDefaultProvider() {
    const availableProviders = this.getAvailableProviders();

    if (availableProviders.length === 0) {
      throw new Error("No AI providers configured. Set GEMINI_APP_KEY or OPENAI_API_KEY in .env");
    }

    const defaultProvider = process.env.AI_PROVIDER || "gemini";

    if (availableProviders.includes(defaultProvider)) {
      return defaultProvider;
    }

    return availableProviders[0];
  }
}

export default ProviderFactory;

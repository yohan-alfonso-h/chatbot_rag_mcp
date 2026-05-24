import { GoogleGenAI } from "@google/genai";

class geminiProvider {
  constructor(apiKey, moduleName) {
    this.apiKey = apiKey;
    this.moduleName = moduleName;

    if (!this.apiKey) {
      throw new Error("API key is required for GeminiProvider");
    }
    if (!this.moduleName) {
      throw new Error("Module name is required for GeminiProvider");
    }

    this.genAI = new GoogleGenAI({ apiKey: this.apiKey });

    // Log the model being used for transparency
    try {
      console.log(`using model: ${this.moduleName} (Gemini)`);
    } catch (e) {
      // ignore logging errors
    }
  }

  async generateResponse(prompt) {
    try {
      if (!prompt) {
        throw new Error("Prompt cannot be empty");
      }
      
      const response = await this.genAI.models.generateContent({
        model: this.moduleName,
        contents: prompt,
      });
      
      if (!response.text) {
        throw new Error("Gemini returned an empty response");
      }
      
      return response.text.trim();
    } catch (error) {
      console.error("Error generating response from Gemini API:", error.message);
      if (error.message.includes("API key")) {
        throw new Error("Invalid or expired API key");
      }
      throw error;
    }
  }

  async generateEmbedding(text, taskType = "RETRIEVAL_QUERY") {
    const [embedding] = await this.generateEmbeddings([text], taskType);
    return embedding;
  }

  async generateEmbeddings(data, taskType = "RETRIEVAL_QUERY") {
    const contents = Array.isArray(data) ? data : [data];

    if (contents.length === 0 || contents.some((item) => !String(item).trim())) {
      throw new Error("At least one non-empty text value is required for embeddings");
    }

    try {
      console.log(`Requesting embeddings for ${contents.length} items with taskType: ${taskType}`);
      
      const response = await this.genAI.models.embedContent({
        model: "gemini-embedding-001",
        contents,
        config: {
          taskType,
        },
      });

      const embeddings = response.embeddings?.map((embedding) => embedding.values ?? []) ?? [];

      if (!embeddings || embeddings.length === 0) {
        throw new Error("Gemini returned no embeddings");
      }

      if (embeddings.length !== contents.length) {
        throw new Error(`Embedding count mismatch: expected ${contents.length}, got ${embeddings.length}`);
      }

      if (embeddings.some((embedding) => !embedding || embedding.length === 0)) {
        throw new Error("Gemini returned invalid embeddings (empty vectors)");
      }

      console.log(`Successfully generated ${embeddings.length} embeddings with ${embeddings[0].length} dimensions`);
      return embeddings;
    } catch (error) {
      console.error("Error generating embeddings from Gemini API:", error.message);
      if (error.message.includes("API key") || error.message.includes("INVALID_ARGUMENT")) {
        throw new Error("Invalid API key or request format for embeddings");
      }
      if (error.message.includes("429")) {
        throw new Error("Rate limit exceeded - please wait before retrying");
      }
      throw error;
    }
  }
}

export default geminiProvider;

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
  }

  async generateResponse(prompt) {
    try {
      const response = await this.genAI.models.generateContent({
        model: this.moduleName,
        contents: prompt,
      });
      return (response.text ?? "").trim();
    } catch (error) {
      console.error("Error generating response from Gemini API:", error);
      throw new Error("Failed to generate response from Gemini API");
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
      const response = await this.genAI.models.embedContent({
        model: "gemini-embedding-001",
        contents,
        config: {
          taskType,
        },
      });

      const embeddings = response.embeddings?.map((embedding) => embedding.values ?? []) ?? [];

      if (embeddings.length !== contents.length || embeddings.some((embedding) => embedding.length === 0)) {
        throw new Error("Gemini returned an invalid embedding response");
      }

      return embeddings;
    } catch (error) {
      console.error("Error generating embeddings from Gemini API:", error);
      throw new Error("Failed to generate embeddings from Gemini API");
    }
  }
}

export default geminiProvider;

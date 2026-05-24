import OpenAI from "openai";

class openaiProvider {
  constructor(apiKey, modelName = "gpt-4o-mini") {
    this.apiKey = apiKey;
    this.modelName = modelName;

    if (!this.apiKey) {
      throw new Error("API key is required for OpenAI Provider");
    }

    this.client = new OpenAI({ apiKey: this.apiKey });
    // Log the model being used for transparency
    try {
      console.log(`using model: ${this.modelName} (OpenAI)`);
    } catch (e) {
      // ignore logging errors
    }
  }

  async generateResponse(prompt) {
    try {
      if (!prompt) {
        throw new Error("Prompt cannot be empty");
      }

      console.log(`Calling OpenAI ${this.modelName} for text generation...`);
      
      const response = await this.client.chat.completions.create({
        model: this.modelName,
        messages: [
          {
            role: "system",
            content: "You are a helpful customer service assistant.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      if (!response.choices || response.choices.length === 0) {
        throw new Error("OpenAI returned no response");
      }

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("OpenAI returned empty content");
      }

      console.log("✓ OpenAI response generated successfully");
      return content.trim();
    } catch (error) {
      console.error("Error generating response from OpenAI API:", error.message);
      if (error.message.includes("API key") || error.message.includes("401")) {
        throw new Error("Invalid or expired OpenAI API key");
      }
      if (error.message.includes("429")) {
        throw new Error("OpenAI rate limit exceeded - please wait before retrying");
      }
      if (error.message.includes("model")) {
        throw new Error(`OpenAI model '${this.modelName}' not found or not available`);
      }
      throw error;
    }
  }

  async generateEmbedding(text, taskType = "RETRIEVAL_QUERY") {
    const [embedding] = await this.generateEmbeddings([text], taskType);
    return embedding;
  }

  async generateEmbeddings(data, taskType = "RETRIEVAL_QUERY") {
    const texts = Array.isArray(data) ? data : [data];

    if (texts.length === 0 || texts.some((item) => !String(item).trim())) {
      throw new Error("At least one non-empty text value is required for embeddings");
    }

    try {
      console.log(`Requesting embeddings for ${texts.length} items from OpenAI...`);

      const response = await this.client.embeddings.create({
        model: "text-embedding-3-small",
        input: texts,
        encoding_format: "float",
      });

      if (!response.data || response.data.length === 0) {
        throw new Error("OpenAI returned no embeddings");
      }

      const embeddings = response.data
        .sort((a, b) => a.index - b.index)
        .map((item) => item.embedding);

      if (embeddings.length !== texts.length) {
        throw new Error(
          `Embedding count mismatch: expected ${texts.length}, got ${embeddings.length}`
        );
      }

      if (embeddings.some((embedding) => !embedding || embedding.length === 0)) {
        throw new Error("OpenAI returned invalid embeddings (empty vectors)");
      }

      console.log(
        `✓ Successfully generated ${embeddings.length} embeddings with ${embeddings[0].length} dimensions`
      );
      return embeddings;
    } catch (error) {
      console.error("Error generating embeddings from OpenAI API:", error.message);
      if (error.message.includes("API key") || error.message.includes("401")) {
        throw new Error("Invalid or expired OpenAI API key");
      }
      if (error.message.includes("429")) {
        throw new Error("OpenAI rate limit exceeded - please wait before retrying");
      }
      if (error.message.includes("model")) {
        throw new Error("OpenAI embedding model not available");
      }
      throw error;
    }
  }
}

export default openaiProvider;
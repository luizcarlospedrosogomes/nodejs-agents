// src/models/index.ts
import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";

interface ModelConfig {
  provider: "gemini" | "openai";
  model?: string;
  apiKey?: string;
  [key: string]: any;
}

export function createModel(config: ModelConfig): BaseChatModel {
  const modelName = config.model || (config.provider === "gemini" ? "gemini-2.0-flash" : "gpt-4");
  const apiKey = config.apiKey || process.env.GOOGLE_API_KEY || process.env.OPENAI_API_KEY;

  switch (config.provider) {
    case "gemini":
      return new ChatGoogleGenerativeAI({
        model: modelName,
        apiKey,
        maxOutputTokens: 4096,
        temperature: 0.7,
        topK: 40,
        topP: 0.9,
      });
    case "openai":
      return new ChatOpenAI({
        modelName,
        openAIApiKey: apiKey,
        temperature: 0.7,
      });
    default:
      throw new Error(`Unsupported model provider: ${config.provider}`);
  }
}

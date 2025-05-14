import "dotenv/config";
import path from "path";
import { initializeAgentExecutorWithOptions } from "langchain/agents";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { NestJSTestGeneratorTool } from "./tools/NestJSTestGeneratorTool";

/**
 * Função exportável para uso programático.
 */
export async function runTestAgent(filePath: string): Promise<string> {
  const absolutePath = path.resolve(filePath);

  const model = new ChatGoogleGenerativeAI({
    model: "gemini-pro",
    apiKey: process.env.GOOGLE_API_KEY,
    maxOutputTokens: 2048,
  });

  const tools = [new NestJSTestGeneratorTool()];

  const executor = await initializeAgentExecutorWithOptions(tools, model, {
    agentType: "openai-functions", // Funciona com Gemini também
    verbose: true,
  });

  const result = await executor.call({
    input: `Gere um teste unitário Jest para o arquivo NestJS localizado em: ${absolutePath}`,
  });

  return result.output;
}

/**
 * Execução direta via CLI
 */
if (process.argv[1] === __filename) {
  const file = process.argv[2];

  if (!file) {
    console.error("❌ Você deve fornecer o caminho de um arquivo NestJS como argumento.");
    process.exit(1);
  }

  runTestAgent(file)
    .then((output) => console.log("🧪 Resultado:\n", output))
    .catch((err) => {
      console.error("Erro ao executar agente:", err);
      process.exit(1);
    });
}

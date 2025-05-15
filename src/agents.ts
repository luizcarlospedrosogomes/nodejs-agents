import "dotenv/config";
import path from "path";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { NestJSTestGeneratorTool } from "./tools/NestJSTestGeneratorTool";
import { SystemMessage } from "@langchain/core/messages";
import { ChatPromptTemplate } from "@langchain/core/prompts";

/**
 * Função exportável para uso programático.
 */
export async function runTestAgent(filePath: string): Promise<string> {

  const absolutePath = path.resolve(filePath);

  // 1. Inicializar o modelo Gemini
  const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.0-flash",
    apiKey: process.env.GOOGLE_API_KEY,
    maxOutputTokens: 2048,
    temperature: 0.7,
    topK: 40,
    topP: 0.9,
  });

  // 2. Definir as ferramentas
  const tools = [new NestJSTestGeneratorTool()];

  // 3. Criar o prompt template corretamente
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", `Você é um especialista em testes NestJS. 
      Gere testes unitários completos usando Jest para o arquivo em {input}.
      Inclua:
      - Casos de teste para todas funcionalidades principais
      - Mocks adequados para dependências
      - Asserções claras e descritivas
      - Boas práticas de teste do NestJS`],
    ["human", "{input}"],
    ["placeholder", "{agent_scratchpad}"],
  ]);


  // 4. Criar o agente com a nova API
  const agent = await createToolCallingAgent({
    llm: model,
    tools,
    prompt,
  });

  // 5. Criar o executor do agente
  const executor = new AgentExecutor({
    agent,
    tools,
    verbose: true,
     returnIntermediateSteps: false,
  });

  // 6. Executar o agente
  const result = await executor.invoke({
    input: `Por favor, gere testes unitários para o arquivo em ${absolutePath}`,
  });

  return result.output;
}

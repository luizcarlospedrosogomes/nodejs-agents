import "dotenv/config";
import path from "path";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { ChatPromptTemplate } from "@langchain/core/prompts";

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenAI } from "@langchain/openai";

import { toolFactory } from "./tools";

interface Config {
  modelName?: "gemini" | "openai";
  apiKey?: string;
  tools?: string[]; // ex: ['nestjs', 'odata']
}

export async function runTestAgent(
  filePath: string,
  config: Config = {},
  args: any
): Promise<string> {
  const absolutePath = path.resolve(filePath);

  // Inicializa o LLM
  let llm;

  switch ((config.modelName || "gemini").toLowerCase()) {
    case "openai":
      if (!config.apiKey && !process.env.OPENAI_API_KEY)
        throw new Error("OpenAI API key is required");
      llm = new ChatOpenAI({
        openAIApiKey: config.apiKey || process.env.OPENAI_API_KEY,
        temperature: 0.7,
        maxTokens: 4096,
      });
      break;

    case "gemini":
    default:
      if (!config.apiKey && !process.env.GOOGLE_API_KEY)
        throw new Error("Google API key is required");
      llm = new ChatGoogleGenerativeAI({
        apiKey: config.apiKey || process.env.GOOGLE_API_KEY,
        model: config.modelName ||"gemini-2.0-flash",
        temperature: 0.7,
        maxOutputTokens: 4096,
      });
      break;
  }

  // Seleciona as ferramentas conforme config.tools, default para todas disponíveis
  let selectedToolsNames = config.tools && config.tools.length > 0
    ? config.tools
    : Object.keys(toolFactory);

  selectedToolsNames.filter((toolName) => {
   return args.forEach((arg) => {
    if(arg.startsWith("--tool=")){
        const tool = arg.replace("--tool=", "");
        return tool === toolName
      }
    })
  })
  const tools = selectedToolsNames.map((toolName) => {
    const ToolClass = toolFactory[toolName];
    if (!ToolClass) throw new Error(`Ferramenta desconhecida: ${toolName}`);
    return new ToolClass({ llm });
  });

  // Prompt genérico para o agente
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", "Você é um agente para geração de testes unitários."],
    ["human", "{input}"],
    ["placeholder", "{agent_scratchpad}"],
  ]);

  // Cria o agente e executor
  const agent = await createToolCallingAgent({
    llm,
    tools,
    prompt,
  });

  const executor = new AgentExecutor({
    agent,
    tools,
    verbose: true,
  });

  const result = await executor.invoke({
    input: `Gere os testes para o arquivo ${absolutePath}`,
  });

  return result.output;
}

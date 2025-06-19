import "dotenv/config";
import path from "path";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { ChatPromptTemplate } from "@langchain/core/prompts";

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenAI } from "@langchain/openai";

import { toolFactory } from "./tools";

interface Config {
  modelName?: "gemini" | "openai";
  api_key?: string;
  tools?: string[]; // ex: ['nestjs', 'odata']
}

export async function runTestAgent(filePath: string, config: Config = {}, args: any): Promise<string> {
  const absolutePath = path.resolve(filePath);
 
  // Inicializa o LLM
  let llm;

  switch ((config.modelName || "gemini").toLowerCase()) {
    case "openai":
      if (!config.api_key && !process.env.OPENAI_API_KEY)
        throw new Error("OpenAI API key is required");
      llm = new ChatOpenAI({
        openAIApiKey: config.api_key || process.env.OPENAI_API_KEY,
        temperature: 0.7,
        maxTokens: 4096,
      });
      break;

    case "gemini":
    default:
      if (!config.api_key && !process.env.GOOGLE_API_KEY)
        throw new Error("Google API key is required");
      llm = new ChatGoogleGenerativeAI({
        apiKey: config.api_key || process.env.GOOGLE_API_KEY,
        model: config.modelName ||"gemini-2.0-flash",
        temperature: 0.7,
        maxOutputTokens: 32000,
      });
      break;
  }

  // Seleciona as ferramentas conforme config.tools, default para todas disponíveis
  let selectedToolsNames = config.tools && config.tools.length > 0
    ? config.tools
    : Object.keys(toolFactory);

  const toolsFromArgs = args
  .filter((arg: any) => arg.startsWith("--tool="))
  .map((arg: any) => arg.replace("--tool=", ""));

  selectedToolsNames = selectedToolsNames.filter(tool => toolsFromArgs.includes(tool));
  if(selectedToolsNames.length === 0){
    throw new Error("Choose tool: odata_test_generator or nestjs_test_generator")
  }

  const templateArg = args
    .filter((arg: any) => arg.startsWith("--template="))
    .map((arg: any) => arg.replace("--template=", ""));
  const template = templateArg.length === 1 ? templateArg[0] : "";

  const toolNameUsed = selectedToolsNames[0];
  const tools = selectedToolsNames.map((toolName) => {
    const ToolClass = toolFactory[toolName];
    if (!ToolClass) throw new Error(`Ferramenta desconhecida: ${toolName}`);
    return new ToolClass({ llm });
  });

  const prompt = ChatPromptTemplate.fromMessages([
  ["system", `Você é um agente especializado em geração de testes automatizados.

  Use exclusivamente a ferramenta '${toolNameUsed}' para processar o caminho de um arquivo XML que será fornecido como input.

  Não tente escrever o teste você mesmo — apenas chame a ferramenta passando o caminho como argumento.`],
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
    
    input: `${absolutePath}|${template}`,
  });

  return result.output;
}

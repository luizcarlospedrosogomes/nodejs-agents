import fs from "fs";
import { runTestAgent } from "../index";

interface Config {
  projects: {
    name: string;
    model: string;
    api_key: string;
    templates?: any[];
  }[];
}

export async function handleGenerate(args: string[], configPath: string): Promise<void> {
  const filePath = args[0];

  if (!filePath) {
    console.error("❌ Você deve fornecer o caminho de um arquivo NestJS.");
    process.exit(1);
  }

  if (!fs.existsSync(configPath)) {
    console.error("❌ Nenhuma configuração encontrada. Execute 'config' primeiro.");
    process.exit(1);
  }

  // 🧠 Lê e interpreta a configuração
  let configData: Config;

  try {
    configData = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  } catch (err) {
    console.error("❌ Erro ao ler a configuração:", err);
    process.exit(1);
  }

  // 🔍 Extrai o projeto (ex: --project=meu)
  const projectArg = args.find(arg => arg.startsWith("--project="));
  const projectName = projectArg?.split("=")[1] || "default";

  const projectConfig = configData.projects.find(p => p.name === projectName);

  if (!projectConfig) {
    console.error(`❌ Projeto "${projectName}" não encontrado em config.json`);
    process.exit(1);
  }

  try {
    const output = await runTestAgent(filePath, projectConfig, args);
    console.log("🧪 Resultado:\n", output);
  } catch (err) {
    console.error("❌ Erro ao gerar o teste:", err);
    process.exit(1);
  }
}

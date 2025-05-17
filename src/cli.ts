#!/usr/bin/env node
import "dotenv/config";
import fs from "fs";
import path from "path";
import { runTestAgent } from "./index";

// Arquivo para salvar a configuração
const CONFIG_PATH = path.resolve(__dirname, "config.json");

const [command, ...args] = process.argv.slice(2);

switch (command) {
  case "config":
    handleConfig(args);
    break;
  case "generate":
    handleGenerate(args);
    break;
  default:
    console.error("❌ Comando inválido. Use 'config' ou 'generate'.");
    process.exit(1);
}

function handleConfig(args: string[]) {
  const config: { model?: string; api_key?: string } = {};

  args.forEach((arg) => {
    if (arg.startsWith("--model=")) {
      config.model = arg.replace("--model=", "");
    } else if (arg.startsWith("--api_key=")) {
      config.api_key = arg.replace("--api_key=", "");
    }
  });

  if (!config.model || !config.api_key) {
    console.error("❌ Você deve fornecer --model e --api_key.");
    process.exit(1);
  }

  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  console.log("✅ Configuração salva com sucesso.");
}

function handleGenerate(args: string[]) {
  const filePath = args[0];

  if (!filePath) {
    console.error("❌ Você deve fornecer o caminho de um arquivo NestJS.");
    process.exit(1);
  }

  if (!fs.existsSync(CONFIG_PATH)) {
    console.error("❌ Nenhuma configuração encontrada. Execute 'config' primeiro.");
    process.exit(1);
  }

  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));

  runTestAgent(filePath, config, args)
    .then((output) => {
      console.log("🧪 Resultado:\n", output);
    })
    .catch((err) => {
      console.error("Erro ao gerar o teste:", err);
      process.exit(1);
    });
}

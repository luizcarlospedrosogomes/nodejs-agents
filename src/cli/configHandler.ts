import fs from "fs";

interface Config {
  model?: string;
  api_key?: string;
}

export function handleConfig(args: string[], configPath: string): void {
  const config: Config = {};

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

  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log("✅ Configuração salva com sucesso.");
  } catch (err) {
    console.error("❌ Erro ao salvar a configuração:", err);
    process.exit(1);
  }
}

import { exec } from "child_process";
import fs from "fs";

export function openConfigFile(args: any, configPath: string): void {
  // Cria o arquivo se ele não existir
  if (!fs.existsSync(configPath)) {
    const defaultConfig = {
      projects: [
        {
          name: "default",
          modelName: "gemini",
          api_key: "",
          templates: [
            {
              name: "typescript_template",
              tool: "odata_test_generator"
            },
            {
              name: "javascript_template",
              tool: "odata_test_generator"
            },
          ],
        },
      ],
    };
    try {
      fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
      console.log("📝 Arquivo de configuração criado.");
    } catch (err) {
      console.error("❌ Erro ao criar o arquivo de configuração:", err);
      process.exit(1);
    }
  }

   const isWSL = fs.existsSync("/proc/version") && fs.readFileSync("/proc/version", "utf8").toLowerCase().includes("microsoft");
  const platform = process.platform;

  let command: string;

  if (isWSL) {
    // VS Code precisa estar acessível via 'code'
    command = `code "${configPath}"`;
  } else if (platform === "win32") {
    command = `start "" "${configPath}"`;
  } else if (platform === "darwin") {
    command = `open "${configPath}"`;
  } else {
    command = `xdg-open "${configPath}"`;
  }

  exec(command, (error) => {
    if (error) {
      console.error(
        "❌ Não foi possível abrir o arquivo de configuração:",
        error.message
      );
      process.exit(1);
    } else {
      console.log("📂 Arquivo de configuração aberto no editor padrão.");
    }
  });
}

import path from "path";
import fs from "fs";

// Caminho da pasta de configuração dentro do pacote NPM
export function getGlobalConfigPath() : string {
  // __dirname aponta para o diretório atual do arquivo, dentro do pacote
  const configFolder = path.join(__dirname, "config");

  // Garante que a pasta exista
  if (!fs.existsSync(configFolder)) {
    fs.mkdirSync(configFolder, { recursive: true });
  }

  return path.join(configFolder, "config.json");
}

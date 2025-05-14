#!/usr/bin/env node

import "dotenv/config";
import path from "path";
import { runTestAgent } from "./index";  // Ajuste para onde a função está localizada

// Pega o caminho do arquivo passado como argumento
const filePath = process.argv[2];

if (!filePath) {
  console.error("❌ Você deve fornecer o caminho de um arquivo NestJS como argumento.");
  process.exit(1);
}

runTestAgent(filePath)
  .then((output) => {
    console.log("🧪 Resultado:\n", output);
  })
  .catch((err) => {
    console.error("Erro ao gerar o teste:", err);
    process.exit(1);
  });

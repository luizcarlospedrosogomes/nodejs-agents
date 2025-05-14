import { Tool } from "langchain/tools";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import fs from "fs-extra";
import path from "path";

/**
 * Ferramenta para gerar testes Jest automaticamente para serviços NestJS.
 */
export class NestJSTestGeneratorTool extends Tool {
  name = "nestjs_test_generator";
  description = "Gera um arquivo de teste Jest para um serviço NestJS fornecido como caminho de arquivo.";

  private model: ChatGoogleGenerativeAI;

  constructor() {
    super();
    this.model = new ChatGoogleGenerativeAI({
      model: "gemini-pro",
      maxOutputTokens: 2048,
      apiKey: process.env.GOOGLE_API_KEY,
    });
  }

  async _call(filePath: string): Promise<string> {
    const absolutePath = path.resolve(filePath);

    if (!fs.existsSync(absolutePath)) {
      return `Arquivo não encontrado: ${absolutePath}`;
    }

    const code = await fs.readFile(absolutePath, "utf-8");

    const prompt = `
Você é um especialista em NestJS e testes unitários com Jest.
Com base no código abaixo, gere um teste unitário cobrindo os principais métodos e fluxos.

Código:
\`\`\`ts
${code}
\`\`\`

Responda apenas com o conteúdo do arquivo de teste Jest (.spec.ts).
`;

    const res = await this.model.invoke([
      ["human", prompt]
    ]);
    
    const generated = Array.isArray(res?.content)
  ? res.content
      .filter((c): c is { text: string } => typeof c === "object" && "text" in c && typeof c.text === "string")
      .map(c => c.text)
      .join("\n")
  : typeof res?.content === "string"
  ? res.content
  : "";

    if (!generated.trim()) {
      return "Nenhum teste foi gerado.";
    }

    const outputPath = absolutePath.replace(/\.ts$/, ".spec.ts");
    await fs.writeFile(outputPath, generated);

    return `✅ Teste gerado com sucesso em: ${outputPath}`;
  }
}

import { Tool } from "langchain/tools";
import fs from "fs-extra";
import path from "path";
import { HumanMessage } from "@langchain/core/messages";

interface LLMModel {
  invoke(messages: HumanMessage[]): Promise<{ content: string } | any>;
}

interface GeneratorToolConfig {
  llm?: LLMModel;
}

export class NestJSTestGeneratorTool extends Tool {
  name = "nestjs_test_generator";
  description =
    "Gera um arquivo de teste Jest completo para um serviço NestJS, incluindo mocks e casos de teste para todos os métodos.";

  private model: LLMModel;

  constructor(config: GeneratorToolConfig = {}) {
    super();
    if (!config.llm) {
      throw new Error("Um modelo LLM deve ser fornecido para a ferramenta");
    }
    this.model = config.llm;
  }

  async _call(filePath: string): Promise<string> {
    try {
      const absolutePath = path.resolve(filePath);

      if (!(await fs.pathExists(absolutePath))) {
        throw new Error(`Arquivo não encontrado: ${absolutePath}`);
      }

      if (!absolutePath.endsWith(".ts")) {
        throw new Error("O arquivo deve ser um TypeScript (.ts)");
      }

      const code = await fs.readFile(absolutePath, "utf-8");
      const outputPath = absolutePath.replace(/\.ts$/, ".spec.ts");

      if (await fs.pathExists(outputPath)) {
        throw new Error(`Arquivo de teste já existe: ${outputPath}`);
      }

      const promptMessage = new HumanMessage(
        `Você é um especialista em NestJS e Jest. Gere um teste unitário completo para o serviço abaixo.

          Requisitos:
          1. Crie um describe() principal para a classe de serviço
          2. Para cada método público:
            - Crie um describe() específico
            - Inclua testes para casos de sucesso
            - Inclua testes para casos de erro
            - Mock todas as dependências
          3. Use padrões modernos de teste:
            - beforeEach() para configuração
            - Variáveis com nomes descritivos
            - Asserções específicas
          4. Formato final deve ser um arquivo .spec.ts válido

          Código do serviço:
          ${code}

          Responda APENAS com o código do teste completo, pronto para ser salvo em um arquivo .spec.ts, sem comentários adicionais.`
                );

      const res = await this.model.invoke([promptMessage]);

      const generatedTest = this.extractGeneratedCode(res);

      if (!generatedTest.trim()) {
        throw new Error("O modelo não retornou um teste válido.");
      }

      await fs.writeFile(outputPath, generatedTest);

      if (!(await fs.pathExists(outputPath))) {
        throw new Error("Falha ao criar o arquivo de teste.");
      }

      return `✅ Teste gerado com sucesso em: ${outputPath}\n\nDica: Revise sempre os testes gerados antes de usar em produção.`;
    } catch (error: any) {
      console.error(`Erro na geração de testes: ${error.message}`);
      return `❌ Falha ao gerar teste: ${error.message}`;
    }
  }

  private extractGeneratedCode(response: any): string {
    if (!response) return "";

    if (typeof response.content === "string") {
      return response.content;
    }

    if (Array.isArray(response.content)) {
      return response.content
        .filter((part: any) => part.type === "text" && part.text)
        .map((part: any) => part.text)
        .join("\n");
    }

    if (response.content && response.content.parts) {
      return response.content.parts
        .filter((part: any) => part.text)
        .map((part: any) => part.text)
        .join("\n");
    }

    return "";
  }
}

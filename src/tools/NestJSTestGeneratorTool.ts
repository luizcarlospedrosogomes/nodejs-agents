import { Tool } from "langchain/tools";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import fs from "fs-extra";
import path from "path";
import { HumanMessage } from "@langchain/core/messages";

/**
 * Ferramenta avançada para gerar testes Jest para serviços NestJS
 */
export class NestJSTestGeneratorTool extends Tool {
  name = "nestjs_test_generator";
  description = "Gera um arquivo de teste Jest completo para um serviço NestJS, incluindo mocks e casos de teste para todos os métodos.";

  private model: ChatGoogleGenerativeAI;

  constructor() {
    super();
    this.model = new ChatGoogleGenerativeAI({
      model: "gemini-2.0-flash",// Modelo mais recente e capaz
      maxOutputTokens: 4096, // Mais espaço para testes complexos
      apiKey: process.env.GOOGLE_API_KEY,
      temperature: 0.3, // Menos criatividade, mais precisão
    });
  }

  async _call(filePath: string): Promise<string> {
    try {
      const absolutePath = path.resolve(filePath);
      
      // Validações do arquivo
      if (!(await fs.pathExists(absolutePath))) {
        throw new Error(`Arquivo não encontrado: ${absolutePath}`);
      }
      
      if (!absolutePath.endsWith('.ts')) {
        throw new Error('O arquivo deve ser um TypeScript (.ts)');
      }

      const code = await fs.readFile(absolutePath, "utf-8");
      const outputPath = absolutePath.replace(/\.ts$/, ".spec.ts");

      // Evitar sobrescrever testes existentes sem confirmação
      if (await fs.pathExists(outputPath)) {
        throw new Error(`Arquivo de teste já existe: ${outputPath}`);
      }

      // Prompt mais estruturado e completo
      const prompt = new HumanMessage({
        content: [
          {
            type: "text",
            text: `Você é um especialista em NestJS e Jest. Gere um teste unitário completo para o serviço abaixo.

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
\`\`\`typescript
${code}
\`\`\`

Responda APENAS com o código do teste completo, pronto para ser salvo em um arquivo .spec.ts, sem comentários adicionais.`
          }
        ]
      });

      // Gerar o teste
      const res = await this.model.invoke([prompt]);
      
      // Processamento mais robusto da resposta
      const generatedTest = this.extractGeneratedCode(res);
      
      if (!generatedTest.trim()) {
        throw new Error("O modelo não retornou um teste válido.");
      }

      // Salvar o arquivo
      await fs.writeFile(outputPath, generatedTest);
      
      // Verificar se o arquivo foi criado
      if (!(await fs.pathExists(outputPath))) {
        throw new Error("Falha ao criar o arquivo de teste.");
      }

      return `✅ Teste gerado com sucesso em: ${outputPath}\n\nDica: Revise sempre os testes gerados antes de usar em produção.`;
      
    } catch (error:any) {
      console.error(`Erro na geração de testes: ${error.message}`);
      return `❌ Falha ao gerar teste: ${error.message}`;
    }
  }

  /**
   * Extrai o código gerado da resposta do modelo
   */
  private extractGeneratedCode(response: any): string {
    if (!response) return '';
    
    // Caso 1: Resposta direta como string
    if (typeof response.content === 'string') {
      return response.content;
    }
    
    // Caso 2: Array de partes de conteúdo
    if (Array.isArray(response.content)) {
      return response.content
        .filter((part:any) => part.type === 'text' && part.text)
        .map((part: any) => part.text)
        .join('\n');
    }
    
    // Caso 3: Estrutura complexa (como do Gemini)
    if (response.content && response.content.parts) {
      return response.content.parts
        .filter((part:any) => part.text)
        .map((part:any) => part.text)
        .join('\n');
    }
    
    return '';
  }
}
import { Tool } from "langchain/tools";
import fs from "fs-extra";
import path from "path";
import { HumanMessage } from "@langchain/core/messages";
import { parseStringPromise } from "xml2js";

interface LLMModel {
  invoke(messages: HumanMessage[]): Promise<{ content: string } | any>;
}

interface GeneratorToolConfig {
  llm?: LLMModel;
}

export class OdataTestGeneratorTool extends Tool {
  name = "odata_test_generator";
  description = "Gera um arquivo de teste Jest para cada entidade encontrada no metadata de um serviço OData";

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

      if (!absolutePath.endsWith(".xml")) {
        throw new Error("O arquivo deve ser um XML (.xml)");
      }

      const xmlContent = await fs.readFile(absolutePath, "utf-8");
      const parsed = await parseStringPromise(xmlContent);

      const entityTypes = parsed?.["edmx:Edmx"]?.["edmx:DataServices"]?.[0]?.["Schema"]
        ?.flatMap((schema: any) => schema?.EntityType || []) || [];

      if (entityTypes.length === 0) {
        throw new Error("Nenhuma entidade encontrada no metadata.");
      }

      const outputs: string[] = [];

      for (const entity of entityTypes) {
        const entityName = entity.$.Name;
        const properties = (entity.Property || []).map((prop: any) => {
          return {
            name: prop.$.Name,
            type: prop.$.Type,
            maxLength: prop.$["MaxLength"] ? parseInt(prop.$["MaxLength"]) : undefined,
          };
        });

        const propertiesText = JSON.stringify(properties, null, 2);
        const promptMessage = new HumanMessage(
          `
        Você é um especialista em testes automatizados e2e com WDIO.

        Gere um arquivo .test.js completo com o seguinte conteúdo:
        - Um teste da entidade "${entityName}"
        - Usando as propriedades: \n${propertiesText}

        Use este modelo base:

        \`\`\`js
        const MetadataHelper = require("../helpers/MetadataHelper");
        const assert = require('assert');

        describe('Testar metadata de ${entityName}', function() {
          this.timeout(30000);
          it('deve verificar o endpoint ${entityName}', async () => {
            const metadataHelper = new MetadataHelper();
            const entity = "${entityName}";
            const expectedFields = ${propertiesText};

            console.table(expectedFields);

            const isValid = await metadataHelper.validateEntity("GATEWAY", entity, expectedFields);

            if (!isValid) {
              console.error('❌ Metadata da entidade "${entityName}" não está válido.');
            }

            expect(isValid).toBeTruthy();
          });
        });
        \`\`\`

        Responda somente com o conteúdo do arquivo de teste.
        `
        );


        const res = await this.model.invoke([promptMessage]);
        console.log(`📦 Gerando teste para: ${entityName}`);
      console.log("📨 Prompt enviado:", promptMessage.content);
        console.log("📬 Resposta recebida:", res);
        const testCode = this.extractGeneratedCode(res);

        if (!testCode.trim()) {
          throw new Error(`O modelo não retornou um teste válido para a entidade ${entityName}`);
        }

        const outputPath = absolutePath.replace(/\.xml$/, `_${entityName}.test.js`);
        await fs.writeFile(outputPath, testCode);
        outputs.push(outputPath);
      }

      return `✅ ${outputs.length} testes gerados com sucesso:\n` + outputs.map(o => `- ${o}`).join("\n");
    } catch (error: any) {
      console.error(`Erro na geração de testes: ${error.message}`);
      return `❌ Falha ao gerar testes: ${error.message}`;
    }
  }

  private extractGeneratedCode(response: any): string {
    if (!response) return "";

    if (typeof response.content === "string") {
      return response.content;
    }

    if (Array.isArray(response.content)) {
      return response.content
        .filter((part: any) => part?.text)
        .map((part: any) => part.text)
        .join("\n");
    }

    if (response.content?.parts) {
      return response.content.parts
        .filter((part: any) => part?.text)
        .map((part: any) => part.text)
        .join("\n");
    }

    return "";
  }
}

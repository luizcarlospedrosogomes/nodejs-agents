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


export class OdataTestGeneratorTool extends Tool {
    name = "odata_test_generator";
    description = "Gera um arquivo de teste integrado Jest completo para um serviço Odata";
    
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

            const code = await fs.readFile(absolutePath, "utf-8");
            const outputPath = absolutePath.replace(/\.ts$/, ".spec.ts");

            const promptMessage = new HumanMessage(
                `
                Você é um especialista em testes automatizados usando Jest. Gere um teste usando Jest para verificar o metadata de um serviço OData.

                O serviço OData está disponível em: http://localhost:4004/odata/v4/myservice/$metadata

                Use axios para buscar o metadata e xml2js para parsear o XML.

                O teste deve:
                
                - Usar a lista "fonte de verdade" fornecida para validar as entidades e suas propriedades
                - A fonte de verdade é um array com a seguinte estrutura:

                const expectedMetadata = [
                {
                    entity: 'EntityName',
                    properties: [
                    { name: 'PropertyName', type: 'Edm.String', maxLength: 40 },
                    { name: 'OtherProperty', type: 'Edm.Decimal' }
                    ]
                }
                ]
                Verifique os seguintes pontos:
                - A entidade "{{entityName}}" existe
                - A entidade "{{entityName}}" possui uma propriedade "{{propertyName}}"
                - O nome da propriedade está correto
                - O tipo da propriedade é "{{propertyType}}"
                - Se houver tamanho máximo definido (maxLength), valide esse valor


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
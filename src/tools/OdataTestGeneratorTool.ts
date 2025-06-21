import { Tool } from "langchain/tools";
import fs from "fs-extra";
import path from "path";
import { HumanMessage } from "@langchain/core/messages";
import { parseStringPromise } from "xml2js";

import os from "os";
import { getGlobalConfigPath } from "../cli/getGlobalConfigPath";

interface LLMModel {
  invoke(messages: HumanMessage[]): Promise<{ content: string } | any>;
}

interface GeneratorToolConfig {
  llm?: LLMModel;
}

export class OdataTestGeneratorTool extends Tool {
  name = "odata_test_generator";
  description =
    "Gera um arquivo de teste Jest para cada entidade encontrada no metadata de um serviço OData";

  private model: LLMModel;

  constructor(config: GeneratorToolConfig = {}) {
    super();
    if (!config.llm) {
      throw new Error("Um modelo LLM deve ser fornecido para a ferramenta");
    }
    this.model = config.llm;
  }

  async _call(input: string): Promise<string> {
    const [filePath, rest = "default"] = input.split("|");
    const parts = rest.trim().split(/\s+/);
    const template = parts[0];
    const flags = parts.slice(1);

    const hasForceFlag = flags.includes("--force");
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

      const entityTypes =
        parsed?.["edmx:Edmx"]?.["edmx:DataServices"]?.[0]?.["Schema"]?.flatMap(
          (schema: any) => schema?.EntityType || []
        ) || [];

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
            maxLength: prop.$["MaxLength"]
              ? parseInt(prop.$["MaxLength"])
              : undefined,
          };
        });

        const propertiesText = JSON.stringify(properties, null, 2);
        const prompt = this.getPromptForTemplate(
          template,
          entityName,
          propertiesText
        );

        const promptMessage = new HumanMessage(prompt);
        const res = await this.model.invoke([promptMessage]);

        const testCode = this.extractGeneratedCode(res);

        if (!testCode.trim()) {
          throw new Error(
            `O modelo não retornou um teste válido para a entidade ${entityName}`
          );
        }
        let outputPath = "";
        if (template.toLowerCase().includes("javascript")) {
          outputPath = absolutePath.replace(/\.xml$/, `_${entityName}.test.js`);
        } else {
          outputPath = absolutePath.replace(/\.xml$/, `_${entityName}.test.ts`);
        }

        if ((await fs.pathExists(outputPath)) && !hasForceFlag) {
          console.log(
            `⚠️ Arquivo já existe e será ignorado (use --force para sobrescrever): ${outputPath}`
          );
          continue;
        }

        await fs.writeFile(outputPath, testCode);
        outputs.push(outputPath);
      }

      return (
        `✅ ${outputs.length} testes gerados com sucesso:\n` +
        outputs.map((o) => `- ${o}`).join("\n")
      );
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

  private getPromptForTemplate( templateName: string, entityName: string, propertiesText: string, projectName = "default"): string {
     const configPath = getGlobalConfigPath();

    if (!fs.existsSync(configPath)) {
      throw new Error(
        `Arquivo de configuração não encontrado em ${configPath}`
      );
    }

    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    const project = config.projects?.find((p: any) => p.name === projectName);

    if (!project) {
      throw new Error(`Projeto "${projectName}" não encontrado no config.json`);
    }

    const template = project.templates?.find(
      (t: any) => t.name === templateName
    );

    if (!template) {
      throw new Error(
        `Template "${templateName}" não encontrado no projeto "${projectName}"`
      );
    }

    //const templatePath = template.file;
    const templatePath = path.join(__dirname, "../..", "templates", `${template.name}.md`);
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Arquivo de template não encontrado: ${templatePath}`);
    }
    
    const content = fs.readFileSync(templatePath, "utf-8");

    return content
      .replace(/\$\{entityName\}/g, entityName)
      .replace(/\$\{propertiesText\}/g, propertiesText);

    return content;
  }
}

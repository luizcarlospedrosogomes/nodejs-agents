import fs from "fs";
import path from "path";
import { exec } from "child_process";

interface Template {
  name: string;
  tool: string;
  file: string;
}

interface Project {
  name: string;
  modelName: string;
  api_key: string;
  templates: Template[];
}

interface Config {
  projects: Project[];
}

export function handleCreateTemplate(args: string[], configPath: string): void {
  const params = Object.fromEntries(
    args
      .filter(arg => arg.startsWith("--"))
      .map(arg => {
        const [key, value] = arg.replace(/^--/, "").split("=");
        return [key, value];
      })
  );

  const { name, tool, project = "default" } = params;

  if (!name || !tool) {
    console.error("❌ Parâmetros obrigatórios: --name=<nome> --tool=<ferramenta>");
    process.exit(1);
  }

  // Diretório onde está o config.json
const configDir = path.dirname(configPath);

// Caminho do diretório de templates (mesmo nível do config.json)
const templatesDir = path.join(configDir, "templates");
if (!fs.existsSync(templatesDir)) {
  fs.mkdirSync(templatesDir, { recursive: true });
}

// Caminho completo do arquivo Markdown do template
const templatePath = path.join(templatesDir, `${name}.md`);

  // Só cria se não existir ainda
  if (!fs.existsSync(templatePath)) {
    const templateContent = `---
        name: ${name}
        tool: ${tool}
        project: ${project}
        ---

        # ${name}

        <!-- Escreva abaixo o conteúdo do agente. -->
        `;
    fs.writeFileSync(templatePath, templateContent);
    console.log(`📄 Template criado: ${templatePath}`);
  } else {
    console.log(`⚠️ Template já existe: ${templatePath}`);
  }

  // Atualiza config.json
  let config: Config;

  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  } else {
    config = { projects: [] };
  }

  let projectEntry = config.projects.find(p => p.name === project);
  if (!projectEntry) {
    projectEntry = {
      name: project,
      modelName: "gemini",
      api_key: "",
      templates: [],
    };
    config.projects.push(projectEntry);
  }

  const alreadyRegistered = projectEntry.templates.some(t => t.name === name);
  if (!alreadyRegistered) {
    projectEntry.templates.push({
      name,
      tool,
      file: templatePath,
    });

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log("✅ Template registrado no projeto:", project);
  } else {
    console.log("ℹ️ Template já está registrado no projeto.");
  }

  // Abre no editor padrão do sistema
  const platform = process.platform;
  let command = "";

  if (platform === "win32") {
    command = `start "" "${templatePath}"`;
  } else if (platform === "darwin") {
    command = `open "${templatePath}"`;
  } else {
    command = `xdg-open "${templatePath}"`;
  }

  exec(command, (err) => {
    if (err) {
      console.error("❌ Erro ao abrir o template:", err.message);
    } else {
      console.log("✏️  Template aberto no editor padrão.");
    }
  });
}

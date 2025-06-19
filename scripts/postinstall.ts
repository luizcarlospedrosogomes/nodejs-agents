import fs from "fs-extra";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";

const isWindows = process.platform === "win32";
const configDir = isWindows
  ? path.join(process.env.APPDATA || "", "agents")
  : path.join(os.homedir(), ".config", "agents");
const templatesTargetDir = path.join(configDir, "templates");

// Caminho relativo ao pacote instalado
//const __dirname = path.dirname(fileURLToPath(import.meta.url));
//const __dirname = path.resolve();
const templatesSourceDir = path.resolve(__dirname, "../templates");

async function postInstall() {
  try {
    await fs.ensureDir(templatesTargetDir);
    await fs.ensureDir(configDir);

    const configPath = path.join(configDir, "config.json");
    const defaultConfig = {
      projects: [
        {
          name: "default",
          modelName: "gemini",
          api_key: "",
          templates: [],
        },
      ],
    };

    if (!(await fs.pathExists(configPath))) {
      await fs.writeJson(configPath, defaultConfig, { spaces: 2 });
      console.log("✅ config.json criado em", configPath);
    }

    const templateFiles = await fs.readdir(templatesSourceDir);
    for (const file of templateFiles) {
      const src = path.join(templatesSourceDir, file);
      const dest = path.join(templatesTargetDir, file);

      if (!(await fs.pathExists(dest))) {
        await fs.copyFile(src, dest);
        console.log(`📄 Template copiado: ${file}`);
      }
    }

    console.log("🎉 Instalação finalizada com sucesso!");
  } catch (err: any) {
    console.error("❌ Erro no postinstall:", err.message);
  }
}

postInstall();

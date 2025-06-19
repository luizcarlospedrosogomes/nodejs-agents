import fs from "fs-extra";
import path from "path";

async function copyTemplates() {
  const source = path.resolve("./templates");
  const dest = path.resolve("dist/templates");

  try {
    await fs.copy(source, dest);
    console.log("✅ Templates copiados para dist/templates");
  } catch (err) {
    console.error("❌ Erro ao copiar templates:", err);
    process.exit(1);
  }
}

copyTemplates();

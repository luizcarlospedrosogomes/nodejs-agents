import path from "path";
import fs from "fs";
import os from "os";

export function getGlobalConfigPath(): string {
  const appFolder =
    process.platform === "win32"
      ? path.join(process.env.APPDATA || "", "agents")
      : path.join(os.homedir(), ".config", "agents");

  // Garante que a pasta exista
  if (!fs.existsSync(appFolder)) {
    fs.mkdirSync(appFolder, { recursive: true });
  }

  return path.join(appFolder, "config.json");
}

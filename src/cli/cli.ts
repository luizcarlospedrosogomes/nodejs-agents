#!/usr/bin/env node
import "dotenv/config";
import path from "path";
import { handleConfig } from "./configHandler";
import { handleGenerate } from "./generateHandler";
import { openConfigFile } from "./openConfigFile";
import { getGlobalConfigPath } from "./getGlobalConfigPath";
import { handleCreateTemplate } from "./createTemplateHandler";
import { handleHelp } from "./help";

const CONFIG_PATH = getGlobalConfigPath();

const [command, ...args] = process.argv.slice(2);

switch (command) {
  case "config":
    handleConfig(args, CONFIG_PATH);
    break;
  case "generate":
    handleGenerate(args, CONFIG_PATH);
    break;
  case "open-config":
    openConfigFile(args, CONFIG_PATH);
    break;
  case "create-template":
    handleCreateTemplate(args, CONFIG_PATH);
    break;
  case "help":
  case "--help":
  case "-h":
    handleHelp();
    break;
  default:
    console.error("❌ Comando inválido. Use 'config' ou 'generate'.");
    process.exit(1);
}

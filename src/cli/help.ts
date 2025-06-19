export function handleHelp() {
  console.log(`
🧠 CLI - Agente de Geração de Testes

Comandos disponíveis:

  config --model=<modelo> --api_key=<chave>
    🔧 Salva a configuração do modelo LLM.
    Ex: agents config --model=gemini --api_key=abc123

  generate <caminho-do-arquivo> [--project=<projeto>] [--template=<nome-template>]
    🧪 Gera testes automáticos a partir de um arquivo (ex: metadata.xml).
    Ex: agents generate ./odata/$metadata.xml --project=default --template=typescript_template

  create-template --name=<nome> --tool=<ferramenta> [--project=<projeto>]
    ✍️ Cria um novo template (.md) e abre no editor padrão.
    Ex: agents create-template --name=meu_template --tool=odata_test_generator

  help
    📘 Exibe este menu de ajuda.

📁 Configuração:
  O arquivo config.json e os templates são armazenados em:
  - Windows: %APPDATA%\\agents\\
  - Linux/macOS: ~/.config/agents/

📄 Formato do template:
  Os templates devem ser arquivos Markdown contendo placeholders como \${entityName} e \${propertiesText}.

🌐 Exemplos:
  - agents generate ./service.xml --project=default
  - agents create-template --name=novo --tool=odata_test_generator

`);
}

---
name: javascript_template
tool: odata_test_generator
project: default
---

Gere um teste automatizado em formato `.test.js` para a entidade **"${entityName}"** com as seguintes propriedades:

${propertiesText}

Use o framework **WDIO + Mocha + CommonJS**.

Responda apenas com o conteúdo do arquivo `.test.js` gerado.

Use este template como base:

```js
const MetadataHelper = require("../helpers/MetadataHelper");
const assert = require("assert");

describe("Testar metadata de ${entityName}", function () {
  this.timeout(30000);

  it("deve verificar o endpoint ${entityName}", async () => {
    const metadataHelper = new MetadataHelper();
    const entity = "${entityName}";
    const expectedFields = ${propertiesText};

    console.table(expectedFields);

    const isValid = await metadataHelper.validateEntity("GATEWAY", entity, expectedFields);

    if (!isValid) {
      console.error("❌ Metadata da entidade '${entityName}' não está válido.");
    }

    assert.strictEqual(isValid, true, "Metadata inválido.");
  });
});

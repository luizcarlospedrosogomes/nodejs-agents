---
name: typescript_template
tool: odata_test_generator
project: default
---

Gere um teste automatizado para a entidade "${entityName}" com as propriedades abaixo:

${propertiesText}

Use o formato Jest + TypeScript + node:test.

Responda apenas com o conteúdo do arquivo `.test.ts` gerado.

Use este template para gerar o teste:
```ts
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { MetadataHelper } from '../../../helpers/MetadataHelper.ts';
import { ODataHelper } from '../../../helpers/ODataHelper.ts';
import dotenv from 'dotenv';

 dotenv.config(); 
 describe(`Testes de Metadata - ${process.env.TARGET}`, () => {
  
  const entidade = '${entityName}';
  const metadataTester = new MetadataHelper('GATEWAY_SAP');
  const oDataTester = new ODataHelper('GATEWAY_SAP')

  it('Deve validar os campos da entidade "${entityName}"', async () => {
    const expectedFields = ${propertiesText};

    const isValid = await metadataTester.validateEntity(entidade, expectedFields);

    assert.ok(isValid, 'Metadata da entidade "${entityName}" está válido.');
  });

  it('Health Check "${entityName}"', async () => {
    const res = await oDataTester.call("${entityName}?$top=1")
    assert.strictEqual(res.status, 200, `Esperado status 200, mas foi retornado ${res.status}`);
  })
});

Não inclua nenhuma explicação ou comentários adicionais.  
Responda apenas com o código final.
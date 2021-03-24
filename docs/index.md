## Functions

<dl>
<dt><a href="#createSchemaBq">createSchemaBq(result, queryString, schemaName)</a> ⇒ <code>Array</code></dt>
<dd><p>Monta as linhas para serem inseridas no BQ</p>
</dd>
<dt><a href="#addTimestamp">addTimestamp(data)</a> ⇒ <code>Object</code></dt>
<dd><p>Adiciona o atributo data para o objeto, contendo o timestamp do momento da execução</p>
</dd>
<dt><a href="#insertRowsAsStream">insertRowsAsStream(data)</a></dt>
<dd><p>Realiza a persistências dos dados por Stream no BigQuery</p>
</dd>
<dt><a href="#downloadSchemas">downloadSchemas(listSchemaNames)</a> ⇒ <code>Array</code></dt>
<dd><p>Baixa os arquivos .json do GSC para serem usados na validação dataLayer</p>
</dd>
<dt><a href="#loadPenguinConfig">loadPenguinConfig()</a></dt>
<dd><p>Carrega o arquivo de configuração armazenado no GCS</p>
</dd>
<dt><a href="#trace">trace(log)</a></dt>
<dd><p>Enviado o log para o stdout, se somente se, a variável debugging = true</p>
</dd>
</dl>

<a name="createSchemaBq"></a>

## createSchemaBq(result, queryString, schemaName) ⇒ <code>Array</code>

Monta as linhas para serem inseridas no BQ

**Kind**: global function  
**Returns**: <code>Array</code> - Dados estruturados para o BQ

| Param       | Type                | Description                                  |
| ----------- | ------------------- | -------------------------------------------- |
| result      | <code>Array</code>  | Status das chaves validadas                  |
| queryString | <code>Object</code> |                                              |
| schemaName  | <code>String</code> | Identificação do schema usado para validação |

<a name="addTimestamp"></a>

## addTimestamp(data) ⇒ <code>Object</code>

Adiciona o atributo data para o objeto, contendo o timestamp do momento da execução

**Kind**: global function  
**Returns**: <code>Object</code> - Objeto com o atributo no padrão yyyy-mm-ddThh:mm:ss

| Param | Type                | Description |
| ----- | ------------------- | ----------- |
| data  | <code>Object</code> | Objeto      |

<a name="insertRowsAsStream"></a>

## insertRowsAsStream(data)

Realiza a persistências dos dados por Stream no BigQuery

**Kind**: global function

| Param | Type               | Description                                        |
| ----- | ------------------ | -------------------------------------------------- |
| data  | <code>Array</code> | Dados estruturados no padrão de persistência do BQ |

<a name="downloadSchemas"></a>

## downloadSchemas(listSchemaNames) ⇒ <code>Array</code>

Baixa os arquivos .json do GSC para serem usados na validação dataLayer

**Kind**: global function  
**Returns**: <code>Array</code> - De Schemas de validação

| Param           | Type               | Description                  |
| --------------- | ------------------ | ---------------------------- |
| listSchemaNames | <code>Array</code> | Contendo o nome dos arquivos |

<a name="loadPenguinConfig"></a>

## loadPenguinConfig()

Carrega o arquivo de configuração armazenado no GCS

**Kind**: global function  
<a name="trace"></a>

## trace(log)

Enviado o log para o stdout, se somente se, a variável debugging = true

**Kind**: global function

| Param | Type                | Description                    |
| ----- | ------------------- | ------------------------------ |
| log   | <code>Object</code> | Que será apresentado no stdout |

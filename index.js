const fs = require('fs');
const datalayerCore = require('@dp6/penguin-datalayer-core');
const { BigQuery } = require('@google-cloud/bigquery');
const { Storage } = require('@google-cloud/storage');
const BUCKET_GCS = process.env.PENGUIN_DATALAYER_BUCKET_GCS;
const FOLDER_PENGUIN = 'penguin-datalayer-collect'
let peguinConfig = {};
let debugging = false;

exports.peguinDatalayerCollect = async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Credentials', 'true');

  // Liberação de CROS
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'GET, POST');
    res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.set('Access-Control-Max-Age', '3600');
    res.sendStatus(204);
  } else {
    let query = req.query;
    debugging = query.debugging; //Se true habilita o log do json de validação 

    if (!query[peguinConfig.PARAM_QUERY_STRING_SCHEMA]) {
      return;
    }
    
    peguinConfig = await loadPenguinConfig();
    const deparaSchema = peguinConfig.DEPARA_SCHEMA;

    //Pega a lista de schemas do dataLayer para validação 
    //com base schema informado na requisição, caso contrário usa o default
    let listaSchema = deparaSchema[query[peguinConfig.PARAM_QUERY_STRING_SCHEMA]];
    let jsonSchemas = await downloadSchemas(listaSchema || deparaSchema.global);
    trace(jsonSchemas);

    let result = [];
    jsonSchemas.forEach(schema => {
      req.body.forEach(eventoDataLayer => {
        let eventsValid = datalayerCore.validate(JSON.parse(schema.json), eventoDataLayer, function() {});
         result = result.concat(createSchemaBq(eventsValid, query, `${query[peguinConfig.PARAM_QUERY_STRING_SCHEMA]}:${schema.name}`));
      })
    });

    trace(result);
    insertRowsAsStream(result);

    res.status(200).send(debugging ? result : 'sucesso!');
  }
};

/**
 * Monta as linhas para serem inseridas no BQ
 * @param {Array} result Status das chaves validadas
 * @param {Object} queryString 
 * @param {String} schemaName Identificação do schema usado para validação
 * @returns {Array} Dados estruturados para o BQ
 */
function createSchemaBq(result, queryString, schemaName) {
  const schemaBQ = [];
  const schema = {schema: schemaName}
  const objectQuery = transformarQueryStringInObject(queryString);
  result.forEach(item => {
    schemaBQ.push({...objectQuery, ...schema,...item});
  });

  return schemaBQ;
}

/**
 * Unifica todos os atributos de todos os objetos do array em um único objeto
 * @param {Array} data Array de objetos 
 * @returns {Object} Objeto com todos as atributos unificados
 */
function transformarQueryStringInObject(data) {
  let [date, time] = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }).split(' ');
  date = date.split('/');
  let timestamp = `${date[2]}-${date[1]}-${date[0]}T${time}`;

  return Object.keys(data).reduce(
    (obj, item) => ((obj[item] = data[item]), obj),
    {
      data: timestamp
    }
  );
}

/**
 * Realiza a persistências dos dados por Stream no BigQuery
 * @param {Array} data Dados estruturados no padrão de persistência do BQ
 */
async function insertRowsAsStream(data) {
  const bigquery = new BigQuery();
  const datasetId = peguinConfig.BQ_DATASET_ID;
  const tableId = peguinConfig.BQ_TABLE_ID_RAWDATA;
  const rows = data;

  const options = {
    schema: peguinConfig.BQ_SCHEMA_RAWDATA
  };

  // Insert data into a table
  await bigquery
    .dataset(datasetId)
    .table(tableId)
    .insert(rows, options, insertHandler);

  console.log(`Inserted ${rows.length} rows`);
}

/**
 * Baixa os arquivos .json do GSC para serem usados na validação dataLayer
 * @param {Array} listSchemaNames Contendo o nome dos arquivos
 * @returns {Array} De Schemas de validação
 */
async function downloadSchemas(listSchemaNames) {
  const storage = new Storage();
  const bucket = storage.bucket(BUCKET_GCS);
  const jsonSchemas = [];

  const promisse =  listSchemaNames.map(async nameSchema => {
    let file = bucket.file(`${FOLDER_PENGUIN}/schemas/${nameSchema}`);
    let json = (await file.download())[0].toString();
    jsonSchemas.push({name: nameSchema, json: json});
  });
  
  await Promise.all(promisse);

  return jsonSchemas;
}

/**
 * Carrega o arquivo de configuração armazenado no GCS
 */
async function loadPenguinConfig() {
  const storage = new Storage();
  const bucket = storage.bucket(BUCKET_GCS);

  let file = bucket.file(`${FOLDER_PENGUIN}/config.json`);
  let peguinConfig = (await file.download())[0].toString();
 
  return JSON.parse(peguinConfig);
}

function insertHandler(err, apiResponse) {
  if (err) {
    console.log(err.name, err);
  }
}

/**
 * Enviado o log para o stdout, se somente se, a variável debugging = true 
 * @param {Object} log Que será apresentado no stdout 
 */
function trace(log) {
  if (debugging) {
    console.log(log);
  }
}

const datalayerCore = require('@dp6/penguin-datalayer-core');
const { BigQuery } = require('@google-cloud/bigquery');
const { Storage } = require('@google-cloud/storage');
const BUCKET_GCS = process.env.PENGUIN_DATALAYER_BUCKET_GCS;
const BQ_DATASET_ID = process.env.BQ_DATASET_ID;
const FOLDER_PENGUIN = 'penguin-datalayer-collect';
let penguinConfig = {};
let debugging = false;

const penguinDatalayerCollect = async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Credentials', 'true');

  // Liberação de CROS
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'GET, POST');
    res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.set('Access-Control-Max-Age', '3600');
    res.sendStatus(204);
  } else {
    penguinConfig = await loadPenguinConfig();
    const deparaSchema = penguinConfig.DEPARA_SCHEMA;
    const query = req.query;
    debugging = query.debugging; //Se true habilita o log do json de validação
    delete query.debugging;

    // Verificação se o identificado de schema foi passado por parâmetro
    if (!query[penguinConfig.PARAM_QUERY_STRING_SCHEMA]) {
      res
        .status(400)
        .send(
          `${debugging ? 'debugging' : ''}${
            penguinConfig.PARAM_QUERY_STRING_SCHEMA
          } não informado como parâmetro queryString`
        );
      return;
    }

    //Pega a lista de schemas do dataLayer para validação
    //com base schema informado na requisição, caso contrário usa o default
    let listaSchema = deparaSchema[query[penguinConfig.PARAM_QUERY_STRING_SCHEMA]];
    let jsonSchemas = await downloadSchemas(listaSchema || deparaSchema.global);
    trace('SCHEMAS', jsonSchemas);

    let result = [];
    jsonSchemas.forEach((schema) => {
      req.body.forEach((eventoDataLayer) => {
        let eventsValid = datalayerCore.validate(JSON.parse(schema.json), eventoDataLayer, function () {});
        result = result.concat(
          createSchemaBq(eventsValid, query, `${query[penguinConfig.PARAM_QUERY_STRING_SCHEMA]}:${schema.name}`)
        );
      });
    });

    trace('RESULT VALID', result);
    insertRowsAsStream(result);
    res.status(200).send(debugging ? { debugging: debugging, result: result } : 'sucesso!');
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
  const schema = { schema: schemaName };
  const objectQuery = addTimestamp(queryString);
  result.forEach((item) => {
    schemaBQ.push({ ...objectQuery, ...schema, ...item });
  });

  return schemaBQ;
}

/**
 * Adiciona o atributo data para o objeto, contendo o timestamp do momento da execução
 * @param {Object} data Objeto
 * @returns {Object} Objeto com o atributo no padrão yyyy-mm-ddThh:mm:ss
 */
function addTimestamp(data) {
  let [date, time] = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }).split(' ');
  date = date.split('/');
  let timestamp = `${date[2]}-${date[1]}-${date[0]}T${time}`;
  data.data = timestamp;
  return data;
}

/**
 * Realiza a persistências dos dados por Stream no BigQuery
 * @param {Array} data Dados estruturados no padrão de persistência do BQ
 */
async function insertRowsAsStream(data) {
  const bigquery = new BigQuery();
  const options = {
    schema: penguinConfig.BQ_SCHEMA_RAWDATA,
    skipInvalidRows: true,
    ignoreUnknownValues: true,
  };

  trace(data);
  // Insert data into a table
  await bigquery
    .dataset(BQ_DATASET_ID)
    .table(penguinConfig.BQ_TABLE_ID_RAWDATA)
    .insert(data, options, insertHandler);

  console.log(`Inserted ${data.length} rows`);
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

  const promisse = listSchemaNames.map(async (nameSchema) => {
    let file = bucket.file(`${FOLDER_PENGUIN}/schemas/${nameSchema}`);
    let json = (await file.download())[0].toString();
    jsonSchemas.push({ name: nameSchema, json: json });
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
  let penguinConfig = (await file.download())[0].toString();

  return JSON.parse(penguinConfig);
}

function insertHandler(err, apiResponse) {
  if (err) {
    console.error(err.name, JSON.stringify(err));
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

module.exports = {
  createSchemaBq,
  addTimestamp,
  downloadSchemas,
  loadPenguinConfig,
  insertRowsAsStream,
  penguinDatalayerCollect,
};

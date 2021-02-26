const fs = require('fs');
const datalayerCore = require('@dp6/peguin-datalayer-core');
const { BigQuery } = require('@google-cloud/bigquery');
const { Storage } = require('@google-cloud/storage');
const BUCKET_GCS = process.env.PEGUIN_DATALAYER_BUCKET_GCS;
let peguinConfig = {};

exports.peguinDatalayerCollect = async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    // Send response to OPTIONS requests
    res.set('Access-Control-Allow-Methods', 'GET, POST');
    res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.set('Access-Control-Max-Age', '3600');
    res.sendStatus(204);
  } else {
    
    let query = req.query;

    if (!query.ambiente) {
      return;
    }
    
    peguinConfig = await loadPeguinConfig();
    const deparaSchema = peguinConfig.DEPARA_SCHEMA;

    //Pega a lista de schemas do dataLayer para validação com base no template da página
    let listaSchema = deparaSchema[query[peguinConfig.PARAM_QUERY_STRING_SCHEMA]];
    let jsonSchemas = await downloadSchemas(listaSchema || deparaSchema.global);
    console.log(jsonSchemas);

    let eventsValid = [];
    jsonSchemas.forEach(schema => {
      req.body.forEach(eventoDataLayer => {
        let result = datalayerCore.validate(JSON.parse(schema.json), eventoDataLayer, function() {});
        eventsValid = eventsValid.concat(result);
      })
    })

    const teste = await createSchemaBq(eventsValid, req.query);
    insertRowsAsStream(teste);
    res.status(200).send(teste);
  }
};

async function createSchemaBq(result, queryString) {
  const schemaBQ = [];
  const objectQuery = transformarQueryStringInObject(queryString);
  result.forEach(item => {
    schemaBQ.push({...objectQuery, ...item});
  });

  return schemaBQ;
}

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

async function downloadSchemas(listaSchemas) {
  const storage = new Storage();
  const bucket = storage.bucket(BUCKET_GCS);
  const jsonSchemas = [];

  const promisse =  listaSchemas.map(async nameSchema => {
    let file = bucket.file(`datalayer-peguin/schemas/${nameSchema}`);
    let json = (await file.download())[0].toString();
    jsonSchemas.push({name: nameSchema, json: json});
  });
  
  await Promise.all(promisse);

  return jsonSchemas;
}

async function loadPeguinConfig() {
  const storage = new Storage();
  const bucket = storage.bucket(BUCKET_GCS);

  let file = bucket.file(`datalayer-peguin/config.json`);
  let peguinConfig = (await file.download())[0].toString();
 
  return JSON.parse(peguinConfig);
}

function insertHandler(err, apiResponse) {
  if (err) {
    console.log(err.name, err);
  }
}

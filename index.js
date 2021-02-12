const fs = require('fs');
let ajv = require('./bowser-core');
//const { PubSub } = require('@google-cloud/pubsub');
const { BigQuery } = require('@google-cloud/bigquery');
const { Storage } = require('@google-cloud/storage');
const deparaSchema = { produto: ['camada_global.json', 'detalhamento_produto.json'], comprafinalizada: ['camada_global.json', 'compra_efetuada.json'], global: ['camada_global.json'] };

exports.bowserjrCollect = async (req, res) => {
  let query = req.query;

  if (!query.ambiente) {
    return;
  }

  //Pega a lista de schemas do dataLayer para validação com base no template da página
  let listaSchema = deparaSchema[query.templatePagina];
  let jsonSchemas = await downloadSchemas(listaSchema || deparaSchema.global);
  console.log(jsonSchemas);

  let eventsValid = [];
  jsonSchemas.forEach(schema => {
    req.body.forEach(eventoDataLayer => {
      let result = ajv.validateObject(JSON.parse(schema.json), eventoDataLayer, function() {});
      eventsValid = eventsValid.concat(result);
    })
  })

  const teste = await createSchemaBq(eventsValid, req.query);
  insertRowsAsStream(teste);
  res.status(200).send(teste);
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
  let [date, time] = new Date().toLocaleString('pt-BR').split(' ');
  date = date.split('/');
  let timestamp = `${date[2]}-${date[1]}-${date[0]}T${time}`;

  return Object.keys(data).reduce(
    (obj, item) => ((obj[item] = data[item]), obj),
    {
      data: timestamp
    }
  );
}

async function sendMessage(data) {
  const pubSubClient = new PubSub();

  async function publishMessage() {
    const dataBuffer = Buffer.from(JSON.stringify(data));

    const messageId = await pubSubClient.topic(topicName).publish(dataBuffer);
    console.log(`Message ${messageId} published.`);
  }

  publishMessage().catch(console.error);
}

async function insertRowsAsStream(data) {
  const bigquery = new BigQuery();
  const datasetId = 'dq_raft_suite';
  const tableId = 'bowserjr_raw';
  const rows = data;

  const options = {
    schema: 'data: DATETIME, bandeira: STRING, ambiente: STRING, pagina: STRING, templatePagina: STRING, status: STRING, message: STRING, dataLayerObject: STRING, objectName: STRING, keyName: STRING'
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
  const bucket = storage.bucket('vv-raft-suite');
  const jsonSchemas = [];

  const promisse =  listaSchemas.map(async nameSchema => {
    let file = bucket.file(`datalayer-peguin/schemas/${nameSchema}`);
    let json = (await file.download())[0].toString();
    jsonSchemas.push({name: nameSchema, json: json});
  });
  
  await Promise.all(promisse);

  return jsonSchemas;
}

function insertHandler(err, apiResponse) {
  if (err) {
    console.log(err.name, err);
  }
}

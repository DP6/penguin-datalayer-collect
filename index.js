const fs = require('fs');
let ajv = require('./bowser-core');
//const { PubSub } = require('@google-cloud/pubsub');
const {BigQuery} = require('@google-cloud/bigquery');
const {Storage} = require('@google-cloud/storage');


exports.bowserjrCollect = async  (req, res) => {
    let query = req.query;

    //let depara =  {global: "/schema/global", pdp: ["/schema/pdp", "/schema/global/", "/schema/produto-clicado"]};

    //depara["pdp"] chamar GCS
    const storage = new Storage();
    const bucket = storage.bucket('vv-raft-suite');
    let file = bucket.file('datalayer-peguin/schemas/camada_global.json');

    //let schema = fs.readFileSync('schema.json');
    let jsonSchema =  (await file.download())[0].toString();
    console.log(jsonSchema);

    let eventsValid = [];
    req.body.forEach(item => {
        eventsValid = eventsValid.concat(ajv.validateObject(JSON.parse(jsonSchema), item, save));
    })

    function save(eventsValid) {
        console.log(eventsValid);
        
    }
    console.log(eventsValid)
    res.status(200).send(eventsValid);


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
        const datasetId = 'stargate';
        const tableId = 'realtime';
        const rows = [data];

        // Insert data into a table
        await bigquery
          .dataset(datasetId)
          .table(tableId)
          .insert(rows);
        console.log(`Inserted ${rows.length} rows`);
      }
  };
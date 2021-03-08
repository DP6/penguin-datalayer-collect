const { assert } = require('chai');
const fs = require('fs');
const chai = require('chai');
const expect = chai.expect;

describe('Arquivo de configuração', () => {
  let config;
  before(() => {
    config = JSON.parse(
      fs.readFileSync('terraform/files-copy-to-gcs/penguin-datalayer-collect/config.json').toString()
    );
  });
  it('Deve possuir o atributo DEPARA_SCHEMA', async () => {
    expect(config).to.have.own.property('DEPARA_SCHEMA');
  });
  it('Deve possuir o atributo PARAM_QUERY_STRING_SCHEMA', async () => {
    expect(config).to.have.own.property('PARAM_QUERY_STRING_SCHEMA');
  });
  it('Deve possuir o atributo BQ_DATASET_ID', async () => {
    expect(config).to.have.own.property('BQ_DATASET_ID');
    expect(config.BQ_DATASET_ID).to.equal('raft_suite');
  });
  it('Deve possuir o atributo BQ_TABLE_ID_RAWDATA', async () => {
    expect(config).to.have.own.property('BQ_TABLE_ID_RAWDATA');
    expect(config.BQ_TABLE_ID_RAWDATA).to.equal('penguin_datalayer_raw');
  });
  it('Deve possuir o atributo BQ_SCHEMA_RAWDATA', async () => {
    expect(config).to.have.own.property('BQ_SCHEMA_RAWDATA');
  });
});

const chai = require('chai');
const expect = chai.expect;
const assert = chai.assert;
const execPromise = require('child-process-promise').exec;
const path = require('path');
const requestRetry = require('requestretry');
const uuid = require('uuid');

const PORT = process.env.PORT || 8080;
process.env.PENGUIN_DATALAYER_BUCKET_GCS = 'teste-raft-suite'; //bucket com arquivo de configuração publico
const BASE_URL = `http://localhost:${PORT}`;
const cwd = path.join(__dirname, './../../');
let ffProc;

describe('Execução cloud function penguinDataleyerCollect', async () => {
  // Run the functions-framework instance to host functions locally
  before(() => {
    // exec's 'timeout' param won't kill children of "shim" /bin/sh process
    // Workaround: include "& sleep <TIMEOUT>; kill $!" in executed command
    ffProc = execPromise(
      `functions-framework --target=penguinDatalayerCollect --signature-type=http --port ${PORT} & sleep 14; kill $!`,
      { shell: true, cwd }
    );
  });

  after(async () => {
    // Wait for the functions framework to stop
    await ffProc;
  });

  it('Deve retornar http status code 400, quando o parâmentro de depara não é informado', async () => {
    const response = await requestEndpoint();

    assert.strictEqual(response.statusCode, 400);
    expect(response.body).that.contains('não informado como parâmetro queryString');
  });

  it('Deve retornar a identificação que o modo debugging está ativado', async () => {
    const response = await requestEndpoint();

    assert.strictEqual(response.statusCode, 400);
    expect(response.body).that.contains('debugging');
  });
});

async function requestEndpoint() {
  return requestRetry({
    url: `${BASE_URL}/penguinDatalayerCollect?debugging=true`,
    method: 'POST',
    body: { attr: 'sss' },
    retryDelay: 200,
    json: true,
  });
}

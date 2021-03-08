/**?
describe(): It's used to group, which you can nest as deep;
it(): It's the test case;
before(): It's a hook to run before the first it() or describe();
beforeEach(): It’s a hook to run before each it() or describe();
after(): It’s a hook to run after it() or describe();
afterEach(): It’s a hook to run after each it() or describe(); 
 */

const { assert } = require('chai');
const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const uuid = require('uuid');
process.env.PENGUIN_DATALAYER_BUCKET_GCS = 'teste-raft-suite';

const core = require('./../../index');

describe('Penguin datalayer collect', () => {
  describe('#penguinDatalayerCollect()', () => {
    it('Deve ser uma function', () => {
      assert.isFunction(core.penguinDatalayerCollect);
    });
    it('Deve processar req e resp retornando http status code 400', async () => {
      const req = {
        query: {},
        body: {
          id: uuid.v4(),
        },
      };

      let tmpResponse = { status: '' };
      let tmpFunctionStatus = (s) => {
        tmpResponse.status = s;
      };
      const res = {
        set: () => {},
        sendStatus: tmpFunctionStatus,
        send: tmpFunctionStatus,
        status: (s) => {
          tmpFunctionStatus(s);
          return { send: () => {} };
        },
      };

      await core.penguinDatalayerCollect(req, res);
      assert.strictEqual(tmpResponse.status, 400);
    });
    it('Deve processar req e resp retornando http status code 204', async () => {
      const req = {
        query: {},
        method: 'OPTIONS',
        body: {
          id: uuid.v4(),
        },
      };

      let tmpResponse = { status: '' };
      let tmpFunctionStatus = (s) => {
        tmpResponse.status = s;
      };
      const res = {
        set: () => {},
        sendStatus: tmpFunctionStatus,
        send: tmpFunctionStatus,
      };

      await core.penguinDatalayerCollect(req, res);
      assert.strictEqual(tmpResponse.status, 204);
    });
    it('Deve processar req e resp retornando http status code 200', async () => {
      const req = {
        query: { schema: 'global' },
        body: [
          {
            event: 'update',
            usuario: { idUsuario: '24413751', statusLogin: 'logado' },
            'gtm.uniqueEventId': 3,
          },
        ],
      };

      let tmpResponse = { status: '' };
      let tmpFunctionStatus = (s) => {
        tmpResponse.status = s;
      };
      const res = {
        set: () => {},
        sendStatus: tmpFunctionStatus,
        send: tmpFunctionStatus,
        status: (s) => {
          tmpFunctionStatus(s);
          return { send: () => {} };
        },
      };

      await core.penguinDatalayerCollect(req, res);
      assert.strictEqual(tmpResponse.status, 200);
    });
  });

  describe('#createSchemaBq()', () => {
    let array = [{ att: 'a' }, { att: 'b' }];
    let obj = { c: 'c' };
    let string = 'teste';

    it('Deve ser uma function', () => {
      assert.isFunction(core.createSchemaBq);
    });
    it('Deve retornar um array com objetos', () => {
      expect(core.createSchemaBq(array, obj, string)).to.be.an('array').that.not.empty;
    });
    it('Array deve ter objeto com a propriedade data', () => {
      expect(core.createSchemaBq(array, obj, string)[0]).to.have.own.property('data');
    });
    it('Array deve ter objeto com a propriedade schema', () => {
      expect(core.createSchemaBq(array, obj, string)[1]).to.have.own.property('schema');
    });
  });

  describe('#addTimestamp()', () => {
    let patternTimestamp = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})$/;
    let obj = { attr: 'attr' };
    it('Deve ser uma function', () => {
      assert.isFunction(core.addTimestamp);
    });

    it('Deve possuir o atributo data', () => {
      expect(core.addTimestamp(obj)).to.have.own.property('data');
    });
    it('Data deve estar no padrão yyyy-mm-ddThh:mm:ss', () => {
      expect(patternTimestamp.test(core.addTimestamp(obj).data)).to.be.true;
    });
  });

  describe('#downloadSchemas()', () => {
    it('Deve retornar um array com schema', async () => {
      expect(await core.downloadSchemas(['camada_global.json'])).to.be.an('array').that.not.empty;
    });
  });

  describe('#loadPenguinConfig()', () => {
    it('Deve retornar o objeto de configuração', async () => {
      expect(await core.loadPenguinConfig()).to.have.own.property('DEPARA_SCHEMA');
    });
  });
});

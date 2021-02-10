const schemaParser = require("./schema_parser");
const Ajv = require("ajv");
let fullValidation = [];

const ajv = new Ajv({
  schemaId: "auto",
  allErrors: true,
  verbose: true,
  ownProperties: true,
});


function validationResult(status, message, dlObject) {
  console.log(`${status}, ${message}, ${dlObject}`);
  fullValidation.push({status: status, message: message, dataLayerObject: dlObject});
}

function checkValidEvent(schemaItem, dataLayer) {
  for (let index = 0; index < schemaItem.length; index++) {
    //console.log("schema: "+JSON.stringify(schemaItem[index],null,2));
    //console.log("datalayer: "+JSON.stringify(dataLayer,null,2));
    let valid = ajv.validate(schemaItem[index], dataLayer);
    if (valid) {
      validationResult("OK", "Validated Successfully", JSON.stringify(dataLayer, null, 2));
      schemaItem.splice(index, 1);
      return true;
    }
  }
}

function revalidateSchema(
  shadowSchema,
  errorMessage,
  dataLayer,
  schemaIndex,
  schemaArray,
  dlObj
) {
  let tempObj = JSON.parse(JSON.stringify(dataLayer));
  let innerSchema = JSON.parse(JSON.stringify(shadowSchema)); //ajustei o innerSchema pra receber o objeto como uma nova instância, e não por referência
  let verify_required = Object.keys(innerSchema).indexOf("required"); //Verifica se existe required dentro do innerSchema


  if (verify_required == -1) {

    let found = innerSchema.contains.required.indexOf(
      errorMessage.params.missingProperty
    );

    if (found > -1) { //e caso o valor seja encontrado
      /* if (Object.keys(tempObj).length > 1) {
         dlObjProperty = Object.keys(tempObj)[1];
       } else {
         dlObjProperty = Object.keys(tempObj)[0];
       }*/
      dlObjProperty = errorMessage.params.missingProperty;

      innerSchema.contains.required = innerSchema.contains.required.filter(keyword => keyword === dlObjProperty); //Então agora ele passa a remover do required todas as propriedades que não são iguais à que está dentro do tempObj

      for (prop in innerSchema.contains.properties) {

        if (prop !== dlObjProperty) { delete innerSchema.contains.properties[prop] }; //e faz o mesmo com as propriedades do schema pra igualar e deixar ele somente com o que precisa ser validado

      }

      let isInnerSchemaEmpty = Object.entries(innerSchema.contains.properties).length === 0 && dataLayer.constructor === Object; //um safe check pra garantir que o objeto não ficou vazio



      if ((innerSchema.contains.required.length > 0 && !isInnerSchemaEmpty) && /*ajv.validate(innerSchema, tempObj) &&*/ Object.keys(innerSchema.contains.properties)[0] !== "event") { //essa validação tava cagada pq ele tava validando o event no nível de base e fodendo com a porra toda. Isso ainda pode ser um problema mais pra frente se alguém 
        validationResult(
          "ERROR",
          `Hit sent without the following property: ${errorMessage.params.missingProperty}`,
          JSON.stringify(dlObj, null, 2)
        );
        if(errorMessage.dataPath.indexOf(Object.keys(schemaArray[schemaIndex].properties)[1]) > -1) {  
          schemaArray.splice(schemaIndex, 1);
        };
      }
    } else {
      for (prop in innerSchema.properties) {
        if (
          tempObj[prop] &&
          typeof tempObj[prop] !== "string" &&
          typeof tempObj[prop] !== "number" &&
          typeof tempObj[prop] !== "array"
        ) {
          let schemaProps = innerSchema.properties[prop];
          revalidateSchema(
            schemaProps,
            errorMessage,
            tempObj[prop],
            schemaIndex,
            schemaArray,
            dlObj
          );
        }
      }
    }
  } else {

    let found = innerSchema.required.indexOf(
      errorMessage.params.missingProperty
    ); //ainda mantive esse laço que checa se o schema interno tem a propriedade descrita na mensagem de erro filtrada

    if (found > -1) { //e caso o valor seja encontrado
      if (Object.keys(tempObj).length > 1) {
        dlObjProperty = Object.keys(tempObj)[1];
      } else {
        dlObjProperty = Object.keys(tempObj)[0];
      }
      innerSchema.required = innerSchema.required.filter(keyword => keyword === dlObjProperty); //Então agora ele passa a remover do required todas as propriedades que não são iguais à que está dentro do tempObj

      for (prop in innerSchema.properties) {
        if (prop !== dlObjProperty) { delete innerSchema.properties[prop] }; //e faz o mesmo com as propriedades do schema pra igualar e deixar ele somente com o que precisa ser validado
      }
      let isInnerSchemaEmpty = Object.entries(innerSchema.properties).length === 0 && dataLayer.constructor === Object; //um safe check pra garantir que o objeto não ficou vazio

      if ((innerSchema.required.length > 0 && !isInnerSchemaEmpty) && /*ajv.validate(innerSchema, tempObj) &&*/ Object.keys(innerSchema.properties)[0] !== "event") { //essa validação tava cagada pq ele tava validando o event no nível de base e fodendo com a porra toda. Isso ainda pode ser um problema mais pra frente se alguém 
        validationResult(
          "ERROR",
          `Hit "${errorMessage.dataPath}" sent without the following property: ${errorMessage.params.missingProperty}`,
          JSON.stringify(dlObj, null, 2)
        );
        if(errorMessage.dataPath.indexOf(Object.keys(schemaArray[schemaIndex].properties)[1]) > -1) {  
          schemaArray.splice(schemaIndex, 1);
        };
      }
    } else {
      for (prop in innerSchema.properties) {
        if (
          tempObj[prop] &&
          typeof tempObj[prop] !== "string" &&
          typeof tempObj[prop] !== "number" &&
          typeof tempObj[prop] !== "array"
        ) {
          let schemaProps = innerSchema.properties[prop];
          revalidateSchema(
            schemaProps,
            errorMessage,
            tempObj[prop],
            schemaIndex,
            schemaArray,
            dlObj
          );
        }
      }
    }
  };
}

function checkMissingProperty (schemaItem, dataLayer) {
  schemaItem.forEach((item, index, arr) => {
    let valid = ajv.validate(item, dataLayer);
    let errors = ajv.errors;
    
    //console.log("retorno ajv", errors)
    if (!valid) {
      errors
        .filter(
          (error) =>
            error.schema.constructor === Object &&
            error.keyword === "required"
        )
        .map((eachError) => {
          let errorMessage = JSON.parse(JSON.stringify(eachError));
          let shadowSchema = JSON.parse(JSON.stringify(item));
          let isErrorDataEmpty =
            Object.entries(errorMessage.data).length === 0 &&
            errorMessage.data.constructor === Object;

          if (isErrorDataEmpty) {
            validationResult(
              "ERROR",
              `Hit sent without the following property: ${errorMessage.params.missingProperty}`,
              JSON.stringify(dataLayer, null, 2)
            );
          } else {
            revalidateSchema(
              shadowSchema,
              errorMessage,
              dataLayer,
              index,
              arr,
              dataLayer
            );
          }
        });
    }
  });
}

function checkErrorsPerSchema (schemaItem, dataLayer) {
  schemaItem.forEach((item, index) => {
    let valid = ajv.validate(item, dataLayer);
    let errors = ajv.errors;

    if (!valid && item.required[1] == Object.keys(dataLayer)[1]) {
      errors
        .filter((error) => {
          if (error.keyword == "enum" || error.keyword == "pattern" || error.keyword == "type") return error;
        })
        .map((eachError) => {
          switch (eachError.keyword) {

            case "pattern":
              validationResult(
                "WARNING",
                `"${eachError.dataPath.replace(/^\./g, "")}" ${eachError.message}, but Hit send: "${eachError.data}"`,
                JSON.stringify(dataLayer, null, 2)

              );
              break;

            case "enum":
              validationResult(
                "WARNING",
                `"${eachError.dataPath.replace(/^\./g, "")}" ${eachError.message}: "${eachError.schema.length > 1 ? eachError.schema.join(", ") : eachError.schema[0]}", but Hit send: "${eachError.data}"`,
                JSON.stringify(dataLayer, null, 2)
              );
              break;

            case "type":
              validationResult(
                "WARNING",
                `"${eachError.dataPath.replace(/^\./g, "")}" ${eachError.message}"`,
                JSON.stringify(dataLayer, null, 2)
              );
              break;

            default:
              break;
          }
        });
      schemaItem.splice(index, 1)
    }
  });
}

function checkMissingEvents (schemaItem, dataLayer) {
  let missingEvents = schemaParser.parseToDataLayer(schemaItem);
  missingEvents.map((event) => {
    validationResult(
      "ERROR",
      `Hit not validated or missed during test`,
      JSON.stringify(event, null, 2)
    );
  });
}

/**
 * Valida as chaves da camada de dados com base no schema informado
 * @param {object} schema Json com as regras de validação da camada
 * @param {object} dataLayer Json com as chaves da camada de dados 
 * @param {*} callback Função que será executada após o sucesso da validação, como parâmetro um array com o status das validações
 */
let validateObject = (schema, dataLayer, callback) => {
  let schemaItem = schema.array.items;
  let isSchemaEmpty = schemaItem.length === 0;
  let isObjEmpty = Object.entries(dataLayer).length === 0 && dataLayer.constructor === Object;
 
  if (isSchemaEmpty) {
    validationResult(
      "ERROR",
      `No more items to validate`,
      JSON.stringify(dataLayer)
    );
  } else if (!checkValidEvent(schemaItem, dataLayer) && !isObjEmpty) {
    checkMissingProperty(schemaItem, dataLayer);
    checkErrorsPerSchema(schemaItem, dataLayer);
  } else if (isObjEmpty) {
    checkMissingEvents(schemaItem, dataLayer);
  }

  callback(fullValidation);
  return fullValidation;
};



module.exports = {
  validateObject,
};

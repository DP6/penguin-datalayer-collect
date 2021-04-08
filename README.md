# penguin-datalayer-collect

<div align="center">
<img src="https://raw.githubusercontent.com/DP6/templates-centro-de-inovacoes/main/public/images/centro_de_inovacao_dp6.png" height="100px" />
</div>

<p align="center">
  <a href="#badge">
    <img alt="semantic-release" src="https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg">
  </a>
  <a href="https://codecov.io/gh/dp6/penguin-datalayer-collect">
    <img src="https://codecov.io/gh/dp6/penguin-datalayer-collect/branch/master/graph/badge.svg?token=AL6REB2792"/>
  </a>
  <a href="#badge">
    <img alt="Test" src="https://github.com/dp6/penguin-datalayer-collect/actions/workflows/test.yml/badge.svg">
  </a>
  <a href="https://www.codacy.com/gh/DP6/penguin-datalayer-collect/dashboard?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=DP6/penguin-datalayer-collect&amp;utm_campaign=Badge_Grade">
    <img alt="Code quality" src="https://app.codacy.com/project/badge/Grade/e8c6c0048272446684b010747ac79ff0">
  </a>
</p>

O penguin-datalayer-collect é um modulo do ecossistema raf-suite criado pela DP6 para garantir a qualidade dos dados ([Data Quality](https://en.wikipedia.org/wiki/Data_quality)) nos projetos de engenharia de dados implementados nos clientes da DP6, através de monitoramento automatizados de dados.

## Ecossistema raft-suite

O penguin-datalayer-collect consegue auxiliar as áreas de digital analytics das empresas nos seguintes pilares da qualidade de dados:

- **Disponibilidade** _(atende totalmente)_
- **Tempestividade** _(atende totalmente)_
- **Completude** _(atende totalmente)_
- **Validade** _(atende parcialmente)_
- **Consistência** _(atende parcialmente)_
- **Acurácia** _(atende parcialmente)_
- **Uniformidade** _(atende totalmente)_
- **Acessibilidade** _(atende totalmente)_
- **Segurança** _(atende parcialmente)_

Essa abrangência pode ser observada com mais detalhes na imagem abaixo que representa o ciclo de vida do dado, e em quais momentos a solução pode ser aplicada.

<img alt="Dimensões de qualidade de dados adaptadas do framework TDQM" src="https://raw.githubusercontent.com/DP6/templates-centro-de-inovacoes/main/public/images/datalayer-collect-abrangencia-ecossistema-raft-suite.jpg"/>

O ecossistema raft-suite é uma solução da DP6 que visa suprir as necessidades de monitoria do ciclo de vida dos dados para antecipar possíveis inconsistências.

[Dimensões de qualidade de dados adaptadas do framework TDQM](http://web.mit.edu/tdqm/)

# Setup penguin-datalayer-collect

## 1. Requisitos para utilização

### 1.1 Produtos do GCP

- Cloud Storage
- Cloud Function
- Bigquery
- Service account

### 1.2 Dependências ambiente local

1. [Google Cloud SDK ](https://cloud.google.com/sdk/docs/install?hl=pt-br)
2. Pacotes zip, unzip e curl
3. [Criar service Account](https://cloud.google.com/iam/docs/creating-managing-service-accounts) com as permissões (Storage Object Admin, Cloud Functions Admin, BigQuery Admin e Service Account User)
4. Variável [GOOGLE_APPLICATION_CREDENTIALS](https://cloud.google.com/docs/authentication/getting-started#setting_the_environment_variable)
5. Instalar o [Terraform](https://www.terraform.io/downloads.html)
6. Habilitar os produtos no GCP Cloud Function, BigQuery, Cloud Build API, Cloud Resource Manager API, BigQuery Data Transfer API e Cloud Storage, para uso do BigQuery é necessário ter um billing ativo

_Observação:_ Utilizando o ambiente no [Google Cloud Shell](https://cloud.google.com/shell/docs) não é necessário fazer os **1**, **2**, **4** e **5**

### 1.3 Ludwig gerador de Schemas

Para gerar o schema de validação da camada de dados acesse a documentação disponível em [penguin-datalayer-core](https://github.com/DP6/penguin-datalayer-core#11-json-schema)

## 2. Instalando o penguin-datalayer-core

Clone o projeto do github para sua máquina local ou Cloud Shell

```console
git clone https://github.com/DP6/penguin-datalayer-collect.git
```

Para fazer deploy no GCP usando o Terraform, o utilize o shell script terraform_deploy

```console
sh terraform_deploy.sh
```

## 3. Configurando a tag no GTM

### 3.1 GTM Web

Para enviar o JSON da camada de dados para a Cloud Function de validação, é necessário implementar uma tag no GTM do tipo custom html, abaixo está o código base para essa configuração.

Essa tag dar total autonomia para o engenheiro customizar o escopo da coleta da camada de dados para validação, uma coleta ativa para o ambiente de produção considerando todos os usuários terá um custo muito maior que uma baseada em amostragem, como exemplificado no código abaixo.

Outra abordagem que pode ser utilizada é fazer a coleta somente no ambiente de homologação, com base em identificadores previamente acordados com o time de TI.

```html
<script>
  /*
  *Tag responsável por enviar a camada de dados para o penguin-datalayer-collect
  */
  analyticsHelper.safeFn('Penguin Datalayer Collect ', function(helper){
    // Array do dataLyer, filtrando os eventos nativos do GTM e easyCollect
    var body = window.dataLayer.filter(function(item) {return /gtm\.+|ga_pageview|midia_pageview/.test(item.event) == false});

    if (habilitarAmostragemValidacao() === 'true') {
      var request = new XMLHttpRequest();
      //Os dados de validação podem ser enriquecidos com dados de negocios enviados como queryString
      request.open("POST", {{endpoint - penguin-datalayer - collect}} + "?schema="+ {{schema}} , true);
      request.setRequestHeader('Content-Type', 'application/json');
      request.onreadystatechange = logHttpResponse;
      request.send(JSON.stringify(body));
    }

    function habilitarAmostragemValidacao() {
      function random(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min)) + min;
      }

      var sample = 1;
      var domain = {{Cookie - Domínio}} ? {{Cookie - Domínio}} : 'auto';
      var cookie_penguin_datalayer_collect = helper.cookie('penguin_datalayer_collect');

      /* Limitador realizar o envio apenas de uma amostragem dos usuários, assim é possível reduzir
      os custos de GCP, não deixando a tag ativas para todos os usuários.*/
      if (!cookie_penguin_datalayer_collect) {
        cookie_penguin_datalayer_collect = (random(0, 100) <= sample) ? 'true' : 'false';
        helper.cookie('penguin_datalayer_collect', cookie_penguin_datalayer_collect, {'exdays': 1, 'domain': domain});
      }

      return cookie_penguin_datalayer_collect;
    }

    function logHttpResponse() {
      if ({{Debug Mode}}) {
        console.log('Penguin-datalayer-collect - Status: ', this.status);
        console.log('Penguin-datalayer-collect - Object dataLayer:', window.dataLayer);
        console.log(JSON.stringify(window.dataLayer));
      }
    }
  });
</script>
```

O código da tag fornecido acima, utiliza a biblioteca [easy-collect](https://github.com/DP6/easy-collect) também desenvolvida pela DP6 para facilitar a implementação no GTM e manipulação do DOM.

### 3.2 GTM Server-side

O penguin-datalayer-collect também pode ser utilizado para validar a coleta server-side, necessitando apenas que a coleta consiga gerar um array com as chaves implementadas.

## 4. Enriquecendo os dados com informações de negócio

A implementação do penguin-datalayer-collect disponibiliza alguns dados brutos, eles são obtidos a partir da validação da camada de dados com base nos schemas fornecido para o validador, é importante salientar que o resulto depende do schema de validação, então sempre que ocorrer uma alteração na especificação técnica da camada de dados os schemas devem refletir as mesmas.

Os dados padrões são:

<table>
  <thead>
    <tr>
      <th>Nome</th>
      <th>Tipo</th>
      <th>Opcional</th>
      <th>Descrição</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>data</td>
      <td>DATETIME</td>
      <td>Não</td>
      <td>
        Datetime com timezone America/Sao_Paulo no padrão yyyy-mm-ddThh:mm:ss
      </td>
    </tr>
    <tr>
      <td>schema</td>
      <td>STRING</td>
      <td>Não</td>
      <td>Nome do schema utilizado para validação das chaves</td>
    </tr>
    <tr>
      <td>status</td>
      <td>STRING</td>
      <td>Não</td>
      <td>Status da validação que pode ser (ERRO, WARNING ou OK)</td>
    </tr>
    <tr>
      <td>objectName</td>
      <td>STRING</td>
      <td>Sim</td>
      <td>Nome do objeto da camada de dados validada</td>
    </tr>
    <tr>
      <td>keyName</td>
      <td>STRING</td>
      <td>Sim</td>
      <td>Chave da camada de dados validada</td>
    </tr>
  </tbody>
</table>
<br/>
Os dados padrões por si só, possibilitam visualizações básicas da saúde da camada de dados, pois com esses dados as possibilidades de cruzamentos e classificação são poucas, entretanto, é muito fácil enriquecer os dados de validação com dados customizados do domínio de negócio, por meio da customização da tag base **3.1 GTM Web**.

A adição de novas dimensões é bem simples, basta disponibilizar os dados escolhidos como parâmetros query string no endoint de validação, fazendo isso os parâmetros fornecidos estarão disponíveis para todas as validações, e serão inseridos no bigquery juntos com os dados padrões, na tabela **penguin_datalayer_raw**.

Para que a inserção ocorra com sucesso é necessário apenas atualizar o schema da tabela disponível no json de configuração.

Para saber mais sobre o funcionamento do penguin-datalayer-collect e como customizar os dados acesse nossa wiki.

## 5. Dashboard de acompanhamento

A base de dados criada pelo penguin-datalayer-collect, pode ser utilizada para diversas análises fazendo o cruzamento com os dados de domínio do negócio, porém a DP6 desenvolveu um dashboard base para monitoramento das métricas de erros disponibilizada pelo módulo.

<a target="_blank" href="https://datastudio.google.com/u/1/reporting/dd3001e4-52d1-4a6c-833e-7c983bb279b1/page/LyZ7B">
  <img alt="CI - Public - penguin datalayer collect" src="https://github.com/DP6/templates-centro-de-inovacoes/raw/main/public/images/dashboar-penguin-datalayer-collect.gif" style="width: 800px;"/>
</a>

## 6. Como contribuir

Pull requests são bem-vindos! Nós vamos adorar ajuda para evoluir esse modulo. Sinta-se livre para navegar por issues abertas buscando por algo que possa fazer. Caso tenha uma nova feature ou bug, por favor abra uma nova issue para ser acompanhada pelo nosso time.

### 6.1 Requisitos obrigatórios

Só serão aceitas contribuições que estiverem seguindo os seguintes requisitos:

- [Padrão de commit](https://www.conventionalcommits.org/en/v1.0.0/)

### 7. Api Docs

- [Index.js](https://github.com/dp6/penguin-datalayer-collect/blob/master/docs/index.md)

## Suporte:

**DP6 Koopa-troopa Team**

_e-mail: <koopas@dp6.com.br>_

<img src="https://raw.githubusercontent.com/DP6/templates-centro-de-inovacoes/main/public/images/koopa.png" height="100" />

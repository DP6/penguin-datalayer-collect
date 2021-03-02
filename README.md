# ![DP6](./docs/dist/logo-dp6-cor.png)penguin-datalayer-collect

O penguin-datalayer-collect é um modulo do ecossitema raf-suite criado pela DP6 para garantir a qualidade dos dados ([Data Quality](https://en.wikipedia.org/wiki/Data_quality)) nos projetos de engenharia de dados implementados nos clientes da DP6, atráves de monitoramento e pipe-lines automatizadas de dados.

## Ecossistema raft-suite
![DP6](./docs/dist/abrangencia-ecossistema-raft-suite.jpg)


# Setup penguin-datalayer-collect

## 1. Requisitos para utilização
### 1.1 Produtos do GCP
* Cloud Storage
* Cloud Function
* Bigquery
* Service account

### 1.2 Dependências ambiente local
1. [Google Cloud SDK ](https://cloud.google.com/sdk/docs/install?hl=pt-br)
2. Pacotes zip, unzip e curl
3. [Criar service Account](https://cloud.google.com/iam/docs/creating-managing-service-accounts) com as permissões (Storage Object Admin, Cloud Functions Admin, BigQuery Admin e Service Account User)
4. Variável [GOOGLE_APPLICATION_CREDENTIALS](https://cloud.google.com/docs/authentication/getting-started#setting_the_environment_variable)
5. Instalar o [Terraform](https://www.terraform.io/downloads.html)

*Observação:* Utilizando o ambiente no [Google Cloud Shell](https://cloud.google.com/shell/docs) não é necessário fazer os **1** e **4**

## 2. Instalando o penguin-datalayer-core
TODO 
clone git
run sh

## 3. Configurando a tag no GTM
TODO
## 4. Enriquecendos os dados com informações de negócio 
TODO 

## 5. Criando o dashboard de acompanhamento


## 6. Como contribuir
TODO
### 6.1 Referências
* https://www.conventionalcommits.org/en/v1.0.0/
* https://github.com/semantic-release/semantic-release

Power by: DP6 Koopa-troopa Team
Suporte: koopas@dp6.com.br

![DP6](./docs/dist/koopa.jpg)


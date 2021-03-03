<div align="center">
<img src="https://raw.githubusercontent.com/DP6/penguin-datalayer-collect/master/docs/dist/centro_de_inovacao_dp6.png"  />

# 
 <tile style="font-size: 32pt">penguin-datalayer-collect</tile>

# 
</div>
<p align="center">
  <a href="#badge">
    <img alt="semantic-release" src="https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg">
  </a>
</p>

O penguin-datalayer-collect é um modulo do ecossitema raf-suite criado pela DP6 para garantir a qualidade dos dados ([Data Quality](https://en.wikipedia.org/wiki/Data_quality)) nos projetos de engenharia de dados implementados nos clientes da DP6, através de monitoramento e pipelines automatizadas de dados.

## Ecossistema raft-suite
![DP6](https://raw.githubusercontent.com/DP6/penguin-datalayer-collect/master/docs/dist/abrangencia-ecossistema-raft-suite.jpg)


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
Clonando o projeto git
```console
git clone https://github.com/DP6/penguin-datalayer-collect.git
```

Fazer deploy no GCP usando o Terraform
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
	*Tag responsável por enviar a camada de dados para o Penguin-datalayer-collect
	*/
	analyticsHelper.safeFn('Penguin Datalayer Collect ', function(helper){
		// Array do dataLyer configurado para o GTM
		var body = window.dataLayer;

		if (habilitarAmostragemValidacao() === 'true') {
			var request = new XMLHttpRequest();
			request.open("POST", {{endpoint - penguin-datalayer - collect}} + "?schema="+ {{schema}} , true); // Os dados de validação podem ser enriquecidos com dados de negocios enviados como queryString
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
			
			// Limitador realizar o envio apenas de uma amostragem dos usuários, assim é possível reduzir os custos de GCP, não deixando a tag ativas para todos os usuários.
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

## 4. Enriquecendos os dados com informações de negócio 
TODO 

## 5. Criando o dashboard de acompanhamento
TODO

## 6. Como contribuir
Pull requests são bem-vindos! Nós vamos adorar ajuda para evoluir esse modulo. Senta-se livre para navegar por open issues buscando por algo que possa fazer. Caso temha uma nova feature ou bug, por favor abra uma nova issue para ser acompanhada pelo nosso time.

### 6.1 Requisitos obrigatórios
Só serão aceito as contribuições que estiverem seguindo os seguintes requisitos:

* [Padrão de commit](https://www.conventionalcommits.org/en/v1.0.0/)

## Suporte: 

**DP6 Koopa-troopa Team**

*e-mail: <koopas@dp6.com.br>*

<img src="https://raw.githubusercontent.com/DP6/penguin-datalayer-collect/master/docs/dist/koopa.png" height="100" />


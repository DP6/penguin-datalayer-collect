# Definiçaõ do projeto GCP
provider "google" {
  project = data.google_client_config.current.project
  region  = "us-central1"
  zone    = "us-central1-c"
}

#Configurações padrões da raft suite penguin-datalayer-collect
data "raft_suite_config" "penguin_datalayer_collect" {
  cf_name = "penguin-datalayer-collect"
  cf_entry_point = "peguinDatalayerCollect"
  raft_suite_module = "penguin-datalayer-collect"
  bq_table_id = "penguin_datalayer_raw"
  bq_view = "penguin_datalayer_aggregation_view"
  git_zip_souce_code =  "https://github.com/DP6/penguin-datalayer-collect/archive/"
}

data "google_client_config" "current" {
}

data "google_client_openid_userinfo" "me" {
}

#######################################
#Arquivos de configurações local
#######################################
data "json_config" "default" {
    filename = "./config.json"
}

#Variaveis de configuração
variable "bucket_name" {
    type = string
    description = "Google Cloud Storage Bucket to create"
    default = "raft-suite"
}

variable "dataset_id" {
    type = string
    description = "Google Cloud BigQuery dataset to create"
    default = "raft_suite"
}

variable "version-penguin-datalayer-collect" {
    type = string
    description = "Versão do modulo que será utilizada para saber quais versões estão disponíveis acesse https://github.com/DP6/penguin-datalayer-collect/tags"
    default = "v1.0.0-beta"
}

######################################################
#Configurações Cloud Storage
######################################################
resource "google_storage_bucket" "my_storage" {
  name          = var.bucket_name
  location      = "US"
  force_destroy = true
  bucket_policy_only = true

  labels = {
    produto = data.raft_suite_config.penguin_datalayer_collect.raft_suite_module
  }
}

resource "google_storage_bucket_object" "schemas" {
  name   = "schemas"
  source = "teste"
  bucket = var.bucket_name
}

resource "google_storage_bucket_object" "config" {
  name   = "config.json"
  source = "config.json"
  bucket = var.bucket_name
  content = data.json_config.default
}

resource "google_storage_bucket_object" "zip" {
  output_name   = "penguin-datalayer-collect${var.version-penguin-datalayer-collect}.zip"
  source        = "penguin-datalayer-collect${var.version-penguin-datalayer-collect}.zip"
  bucket        = var.bucket_name
}

resource "null_resource" "cf_code" {
  triggers = {
    on_version_change = "${var.version-penguin-datalayer-collect}"
  }

  provisioner "local-exec" {
    command = "curl -o penguin-datalayer-collect${var.version-penguin-datalayer-collect}.zip ${data.raft_suite_config.git_zip_souce_code}/${var.version-penguin-datalayer-collect}.zip"
  }

  provisioner "local-exec" {
    when    = destroy
    command = "rm -f *.zip"
  }
}

######################################################
#Configurações bigquery
######################################################
#dataset
resource "google_bigquery_dataset" "default" {
  dataset_id                  = "${var.dataset_id}"
  friendly_name               = "raft_suite"
  description                 = "Raft Suite é solução de data quality da DP6, esse dataset contém as tabelas com os dados de monitoramento da ferramenta"
  location                    = "EU"
  delete_contents_on_destroy = true
}
  labels = {
    produto = data.raft_suite_config.penguin_datalayer_collect.raft_suite_module
  }
}

resource "google_bigquery_table" "default" {
  dataset_id  = data.google_bigquery_dataset.default.dataset_id
  table_id    = data.raft_suite_config.penguin_datalayer_collect.bq_table_id
  description = "Tabela com o status da validação das chaves da camada de dados" 
  delete_contents_on_destroy = true

  labels = {
    produto = data.raft_suite_config.penguin_datalayer_collect.raft_suite_module
  }

  schema = <<EOF
[
  {
    "name": "data",
    "type": "DATETIME",
    "mode": "REQUIRED",
    "description": "Datatime com timezone America/Sao_Paulo"
  },
  {
    "name": "message",
    "type": "STRING",
    "mode": "NULLABLE",
    "description": "Detalhamento da validação"
  },
  {
    "name": "dataLayerObject",
    "type": "STRING",
    "mode": "NULLABLE",
    "description": "Json da index da camada de dados validado"
  },
  {
    "name": "objectName",
    "type": "STRING",
    "mode": "NULLABLE",
    "description": "Nome do objeto da camada de dados validado se houver"
  },
  {
    "name": "keyName",
    "type": "STRING",
    "mode": "NULLABLE",
    "description": "Chave da camada de dados validada se houver"
  }
]
EOF
}

#View do BQ com os dados agregados da tabela raw
resource "google_bigquery_table" "default" {
  dataset_id  = data.google_bigquery_dataset.default.dataset_id
  table_id    = data.raft_suite_config.penguin_datalayer_collect.bq_view
  description = "View com os dados agregados da tabela ${data.raft_suite_config.penguin_datalayer_collect.bq_table_id}" 
  delete_contents_on_destroy = true

  labels = {
    produto = data.raft_suite_config.penguin_datalayer_collect.raft_suite_module
  }
  view = {
    query = <<EOF
SELECT
  FORMAT_DATETIME('%Y%m%d', DATA) as data,
  CONCAT(objectName, ".", keyName) AS nomeChave,
  status
FROM
  `${data.google_client_config.current.project}.${data.google_bigquery_dataset.default.dataset_id}.${data.raft_suite_config.penguin_datalayer_collect.bq_table_id}`
WHERE
  keyName IS NOT NULL AND 
  device IS NOT NULL
GROUP BY
  1,
  2,
  3
ORDER BY
  DATA DESC
]
EOF
  }
}

##################################
#Configurações Cloud Function
##################################
resource "google_storage_bucket" "bucket" {
  name = var.bucket_name
}

resource "google_storage_bucket_object" "archive" {
  name   = "index.zip"
  bucket = google_storage_bucket.bucket.name
  source = "penguin-datalayer-collect${var.version-penguin-datalayer-collect}.zip"
}

resource "google_cloudfunctions_function" "function" {
  name        = data.raft_suite_config.cf_name
  description = "CF de validação da camada de dados"
  runtime     = "nodejs14"

  available_memory_mb   = 1024
  timeout               = 120
  source_archive_bucket = google_storage_bucket.bucket.name
  source_archive_object = google_storage_bucket_object.archive.name
  trigger_http          = true
  entry_point           = data.raft_suite_config.cf_entry_point

   environment_variables = {
    PENGUIN_DATALAYER_BUCKET_GCS = var.bucket_name
  }
}

# IAM entry for all users to invoke the function
resource "google_cloudfunctions_function_iam_member" "invoker" {
  project        = google_cloudfunctions_function.function.project
  region         = google_cloudfunctions_function.function.region
  cloud_function = google_cloudfunctions_function.function.name

  role   = "roles/cloudfunctions.invoker"
  member = "allUsers"
}
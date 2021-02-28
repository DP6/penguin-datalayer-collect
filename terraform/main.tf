# Definiçaõ do projeto GCP
provider "google" {
 credentials = file("/home/jsn/workspace/dp6-estudos-service.json")
 project     = "dp6-estudos"
 region      = "us-central1"
}

#Configurações padrões da raft suite penguin-datalayer-collect
locals {
  cf_name = "penguin-datalayer-collect"
  cf_entry_point = "peguinDatalayerCollect"
  raft_suite_module = "penguin-datalayer-collect"
  bq_table_id = "penguin_datalayer_raw"
  bq_view = "penguin_datalayer_aggregation_view"
  git_zip_souce_code =  "https://codeload.github.com/DP6/penguin-datalayer-collect/zip/"
}

data "google_client_config" "current" {
}

data "google_client_openid_userinfo" "me" {
}

#######################################
#Arquivos de configurações local
#######################################

#Variaveis de configuração
variable "bucket_name" {
    type = string
    description = "Google Cloud Storage Bucket to create, recomendado raft-suite"

}

variable "dataset_id" {
    type = string
    description = "Google Cloud BigQuery dataset to create recomendado raft_suite"
}

variable "version-penguin-datalayer-collect" {
    type = string
    description = "Versão do modulo que será utilizada para saber quais versões estão disponíveis acesse https://github.com/DP6/penguin-datalayer-collect/tags"
}

######################################################
#Configurações Cloud Storage
######################################################
resource "google_storage_bucket" "my_storage" {
  name          = var.bucket_name
  location      = "US"
  force_destroy = true

  labels = {
    produto = local.raft_suite_module
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
}

resource "google_storage_bucket_object" "zip" {
  name          = "penguin-datalayer-collect${var.version-penguin-datalayer-collect}.zip"
  source        = "penguin-datalayer-collect${var.version-penguin-datalayer-collect}.zip"
  bucket        = var.bucket_name
}

resource "null_resource" "cf_code" {
  triggers = {
    on_version_change = var.version-penguin-datalayer-collect
  }

  provisioner "local-exec" {
    command = "curl ${local.git_zip_souce_code}/${var.version-penguin-datalayer-collect} --output penguin-datalayer-collect${var.version-penguin-datalayer-collect}.zip"
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
module "bigquery" {
  source            = "terraform-google-modules/bigquery/google"
  version           = "~> 4.4"
  project_id        = data.google_client_config.current.project
  dataset_id        = var.dataset_id
  dataset_name      = "raft_suite"
  description       = "Raft Suite é solução de data quality da DP6, esse dataset contém as tabelas com os dados de monitoramento da ferramenta"
  dataset_labels = {
    produto = local.raft_suite_module
  }

  tables = [
    {
      table_id    = local.bq_table_id,
      description = "Tabela com o status da validação das chaves da camada de dados",
      schema = "schema_penguin_datalayer_raw.json",
      clustering =  ["data"],
      expiration_time = null,
      time_partitioning = null,
      labels = {
        produto = local.raft_suite_module
      }
    }
  ]
  views = [
    {
      view_id    = local.bq_view,
      description = "View com os dados agregados da tabela ${local.bq_table_id}",
      use_legacy_sql = false,
      query = file("query_view.txt")
      labels = {
        produto = local.raft_suite_module
      }
    }
  ]
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
  name        = local.cf_name
  description = "CF de validação da camada de dados"
  runtime     = "nodejs14"

  available_memory_mb   = 1024
  timeout               = 120
  source_archive_bucket = google_storage_bucket.bucket.name
  source_archive_object = google_storage_bucket_object.archive.name
  trigger_http          = true
  entry_point           = local.cf_entry_point

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


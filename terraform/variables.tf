#######################################
#Arquivos de configurações local
#######################################
locals {
  cf_name = "penguin-datalayer-collect"
  cf_entry_point = "peguinDatalayerCollect"
  raft_suite_module = "penguin-datalayer-collect"
  bq_table_id = "penguin_datalayer_raw"
  bq_view_aggregation = "penguin_datalayer_aggregation_view"
  bq_view_diagnostic = "penguin_datalayer_diagnostic_view"
  git_zip_souce_code =  "https://codeload.github.com/DP6/penguin-datalayer-collect/zip/"
}

#######################################
#Variaveis de configuração
#######################################
variable "bucket_name" {
    type        = string
    description = "Google Cloud Storage Bucket to create, recomendado raft-suite"
    default     =  "raft-suite"
}

variable "dataset_id" {
    type         = string
    description  = "Google Cloud BigQuery dataset to create recomendado raft_suite"
    default      =  "raft_suite"
}

variable "version-penguin-datalayer-collect" {
    type = string
    description = "Versão do modulo que será utilizada para saber quais versões estão disponíveis acesse https://github.com/DP6/penguin-datalayer-collect/tags"
}

variable "project_id" {
    type = string
    description = "Id do projeto no GCP que modulo penguin-datalayer-collect será instalado"
}

variable "region" {
    type = string
    description = "Região do GCP onde os modulos do projeto serão criados https://cloud.google.com/compute/docs/regions-zones?hl=pt-br default us-central1"
    default = "us-central1"
}

variable "location" {
    type = string
    description = "Local onde os modulos do projeto serão criados https://cloud.google.com/compute/docs/regions-zones?hl=pt-br default us"
    default = "us"
}

variable "service_account_email" {
    type = string
    description = "Service account que será utilizadas pelo modulo penguin-datalayer-collect, as permissões necessárias são: Storage Object Admin, Cloud Functions Admin, BigQuery Admin e Service Account User"
}
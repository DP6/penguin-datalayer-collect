#######################################
#Arquivos de configurações local
#######################################
locals {
  cf_name = "${var.project_prefix}-penguin-datalayer-collect"
  cf_entry_point = "penguinDatalayerCollect"
  raft_suite_module = "penguin-datalayer-collect"
  bq_table_id_raw = "penguin_datalayer_raw"
  bq_table_id_aggregation = "penguin_datalayer_aggregation"
  bq_table_id_diagnostic = "penguin_datalayer_diagnostic"
  bq_view_aggregation = "penguin_datalayer_aggregation_view"
  bq_view_diagnostic = "penguin_datalayer_diagnostic_view"
  git_zip_souce_code =  "https://codeload.github.com/DP6/penguin-datalayer-collect/zip/"
  final_dataset_id   = "${var.project_prefix}_${var.dataset_id}"
  final_bucket_name  = "${var.project_prefix}-${var.bucket_name}"
}

#######################################
#Variaveis de configuração
#######################################
variable "bucket_name" {
    type        = string
    description = "Google Cloud Storage Bucket to create, o valor informado será usado em conjunto com o project_prefix para formar o nome do bucket"
    default = "raft-suite"
}

variable "project_prefix" {
    type        = string
    description = "Pré-fixo que será utilizado para nomear os produtos que serão utilizados e criados no GCP, exemplo para o cliente Brasil podemos usar o pré-fixo br"
    validation {
    condition     = can(regex("[a-z0-9]", var.project_prefix)) && length(var.project_prefix) <= 4
    error_message = "The prefix value must be a [a-z0-9] and size <= 4, exemple \"br01\"."
  } 
}

variable "dataset_id" {
    type         = string
    description  = "Google Cloud BigQuery dataset to create recomendado raft_suite"
    default      =  "raft_suite"
}

variable "version-penguin-datalayer-collect" {
    type = string
    description = "Default versão local parâmetro recebe local, para escolher uma versão diferente da atual acesse https://github.com/DP6/penguin-datalayer-collect/tags"
    default = "local"
}

variable "project_id" {
    type = string
    description = "Id do projeto do GCP onde o modulo penguin-datalayer-collect será instalado"
}

variable "region" {
    type = string
    description = "Região do GCP onde os modulos do projeto serão criados https://cloud.google.com/compute/docs/regions-zones?hl=pt-br default us-central1"
    default = "us-central1"
}

variable "location" {
    type = string
    description = "Localização do projeto GCP https://cloud.google.com/compute/docs/regions-zones?hl=pt-br default us"
    default = "us"
}

variable "service_account_email" {
    type = string
    description = "Service account que será utilizadas pelo modulo penguin-datalayer-collect, as permissões necessárias são: Storage Object Admin, Cloud Functions Admin, BigQuery Admin e Service Account User"
}
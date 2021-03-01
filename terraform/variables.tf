#######################################
#Arquivos de configurações local
#######################################
locals {
  cf_name = "penguin-datalayer-collect"
  cf_entry_point = "peguinDatalayerCollect"
  raft_suite_module = "penguin-datalayer-collect"
  bq_table_id = "penguin_datalayer_raw"
  bq_view = "penguin_datalayer_aggregation_view"
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
    description = "Id do projeto no GCP que moduke será instalado"
}
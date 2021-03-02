data "google_client_config" "current" {
}

data "google_client_openid_userinfo" "me" {
}

######################################################
#Configurações Cloud Storage
######################################################
resource "google_storage_bucket" "my_storage" {
  name          = var.bucket_name
  location      = var.location
  force_destroy = true
 
  labels = {
    produto = local.raft_suite_module
  }
}

resource "null_resource" "cf_code" {
  triggers = {
    on_version_change = var.version-penguin-datalayer-collect
  }

  provisioner "local-exec" {
    command = "sh download-penguin-datalayer-collect.sh ${var.version-penguin-datalayer-collect} ${var.bucket_name}"
  }
}

######################################################
#Configurações bigquery
######################################################
#dataset

module "bigquery" {
  source            = "terraform-google-modules/bigquery/google"
  version           = "~> 4.4"
  location          = var.location
  project_id        = data.google_client_config.current.project
  dataset_id        = var.dataset_id
  dataset_name      = "raft_suite"
  description       = "Raft Suite é solução de data quality da DP6, esse dataset contém as tabelas com os dados de monitoramento da ferramenta"
  delete_contents_on_destroy      = true
  
  dataset_labels = {
    produto = local.raft_suite_module
  }

  tables = [
    {
      table_id    = local.bq_table_id,
      description = "Tabela com o status da validação das chaves da camada de dados",
      schema = "bigquery/schema_penguin_datalayer_raw.json",
      clustering =  ["data"],
      expiration_time = null,
      time_partitioning = null,
      deletion_protection=false,
      time_partitioning = {
        type                     = "DAY",
        field                    = "data",
        require_partition_filter = false,
        expiration_ms            = null,
      },
      labels = {
        produto = local.raft_suite_module
      },
      deletion_protection = false
    }
  ]
  views = [
    {
      view_id    = local.bq_view_aggregation,
      description = "View com os dados agregados da tabela ${local.bq_table_id}",
      use_legacy_sql = false,
      deletion_protection=false,
      depends_on  = ["module.bigquery.google_bigquery_table.main[penguin_datalayer_raw]"],
      query = "SELECT FORMAT_DATETIME('%Y%m%d', DATA) as data, CONCAT(objectName, \".\", keyName) AS nomeChave, status FROM `${var.project_id}.${var.dataset_id}.${local.bq_table_id}` WHERE keyName IS NOT NULL GROUP BY 1, 2, 3 ORDER BY DATA DESC"
      labels = {
        produto = local.raft_suite_module
      },
      deletion_protection = false
    },
    {
      view_id    = local.bq_view_diagnostic,
      description = "View com os dados agregados do resultado geral dos erros ${local.bq_table_id}",
      use_legacy_sql = false,
      deletion_protection=false,
      depends_on  = ["module.bigquery.google_bigquery_table.main[penguin_datalayer_raw]"],
      query = "SELECT DATA, COUNT(distinct keyName) as disparos_erros, COUNTIF(status = \"OK\") as disparos_ok FROM `${var.project_id}.${var.dataset_id}.${local.bq_table_id}` GROUP BY 1 ORDER BY DATA DESC"
      labels = {
        produto = local.raft_suite_module
      },
      deletion_protection = false
    }
  ]
}

##################################
#Configurações Cloud Function
##################################
resource "google_cloudfunctions_function" "function" {
  project     = var.project_id
  name        = local.cf_name
  description = "CF de validação da camada de dados"
  runtime     = "nodejs14"
  service_account_email = var.service_account_email
  region                = var.region
  available_memory_mb   = 512
  timeout               = 120
  source_archive_bucket = google_storage_bucket.my_storage.name
  source_archive_object = "${local.raft_suite_module}/${var.version-penguin-datalayer-collect}.zip"
  trigger_http          = true
  entry_point           = local.cf_entry_point

   environment_variables = {
    PENGUIN_DATALAYER_BUCKET_GCS = var.bucket_name
  }
}

# IAM entry for all users to invoke the function
resource "google_cloudfunctions_function_iam_member" "invoker" {
  project        = var.project_id
  region         = google_cloudfunctions_function.function.region
  cloud_function = google_cloudfunctions_function.function.name

  role   = "roles/cloudfunctions.invoker"
  member = "allUsers"
}


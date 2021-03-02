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

resource "null_resource" "cf_code_zip" {
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
resource "google_bigquery_dataset" "dataset" {
  location          = var.location
  dataset_id        = var.dataset_id
  description       = "Raft Suite é solução de data quality da DP6, esse dataset contém as tabelas com os dados de monitoramento da ferramenta"
  delete_contents_on_destroy      = true
  
  labels = {
    produto = local.raft_suite_module
  }
}

resource "google_bigquery_table" "penguin-datalayer-raw" {
  dataset_id        = var.dataset_id
  table_id          = local.bq_table_id
  description       = "Tabela com o status da validação das chaves da camada de dados"
  schema            = file("bigquery/schema_penguin_datalayer_raw.json")
  clustering        =  ["data"]
  expiration_time    = null
  deletion_protection = false
  time_partitioning  {
    type                     = "DAY"
    field                    = "data"
    require_partition_filter = false
    expiration_ms            = null
  }
  labels = {
    produto = local.raft_suite_module
  }
  depends_on = [google_bigquery_dataset.dataset]
}

data "template_file" "view_aggregation" {
  template = file("bigquery/query_view_chaves_agregadas.sql")
  vars = {
   table_name = "${var.project_id}.${var.dataset_id}.${local.bq_table_id}"
  }
}

data "template_file" "view_diagnostic" {
  template = file("bigquery/query_view_diagnostico.sql")
  vars = {
   table_name = "${var.project_id}.${var.dataset_id}.${local.bq_table_id}"
  }
}

resource "google_bigquery_table" "view_aggregation" {
    dataset_id          = var.dataset_id
    table_id            = local.bq_view_aggregation
    description         = "View com os dados agregados da tabela ${local.bq_table_id}"
    deletion_protection = false
    view {
      query =  data.template_file.view_aggregation.rendered
      use_legacy_sql = false 
    }
    labels = {
      produto = local.raft_suite_module
    }
    depends_on = [google_bigquery_dataset.dataset, google_bigquery_table.penguin-datalayer-raw]
}

resource "google_bigquery_table" "view_diagnostic" {
    dataset_id          = var.dataset_id
    table_id            = local.bq_view_diagnostic
    description         = "View com os dados agregados do resultado geral dos erros ${local.bq_table_id}"
    deletion_protection = false
    view {
      query =  data.template_file.view_diagnostic.rendered
      use_legacy_sql = false
    }
    labels = {
      produto = local.raft_suite_module
    }
    depends_on = [google_bigquery_dataset.dataset, google_bigquery_table.penguin-datalayer-raw]
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
  depends_on = [null_resource.cf_code_zip]
}

# IAM entry for all users to invoke the function
resource "google_cloudfunctions_function_iam_member" "invoker" {
  project        = var.project_id
  region         = google_cloudfunctions_function.function.region
  cloud_function = google_cloudfunctions_function.function.name

  role   = "roles/cloudfunctions.invoker"
  member = "allUsers"
}


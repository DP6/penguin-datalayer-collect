# Definiçaõ do projeto GCP
provider "google" {
 project     = var.project_id
 region      = "us-central1"
 #credentials = file("/home/jsn/workspace/dp6-estudos-service.json")
}
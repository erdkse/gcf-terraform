



resource "google_bigquery_dataset" "dataset" {
  dataset_id = var.dataset_name
}

resource "google_bigquery_table" "table" {
  table_id   = var.dataset_table_name
  dataset_id = google_bigquery_dataset.dataset.dataset_id
}

resource "google_cloudfunctions_function" "function" {
  name    = var.name
  runtime = "nodejs16"

  available_memory_mb   = 128
  source_archive_bucket = google_storage_bucket.function_bucket.name
  source_archive_object = google_storage_bucket_object.source_code.name

  trigger_http = true
  entry_point  = "main"

  environment_variables = {
    PROJECT_ID   = var.project
    KEYS_FILE    = file("../keys.json")
    LOCATION     = var.location
    DATASET_NAME = google_bigquery_dataset.dataset.dataset_id
    TABLE_NAME   = google_bigquery_table.table.table_id
  }
}

resource "google_cloudfunctions_function_iam_member" "allowaccess" {
  region         = google_cloudfunctions_function.function.region
  cloud_function = google_cloudfunctions_function.function.name

  role   = "roles/cloudfunctions.invoker"
  member = "allUsers"

}

data "archive_file" "file" {
  type        = "zip"
  output_path = "/tmp/${var.name}.zip"
  source_dir  = "${path.module}/.."
  excludes    = var.excludes
}

resource "google_storage_bucket" "function_bucket" {
  name     = "evaluation_function_bucket"
  location = var.location
}

resource "google_storage_bucket_object" "source_code" {
  name   = "${var.name}.zip"
  bucket = google_storage_bucket.function_bucket.name
  source = data.archive_file.file.output_path

}

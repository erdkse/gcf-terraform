output "uri" {
  description = "The url to reach the function"
  value       = google_cloudfunctions_function.function.https_trigger_url
}

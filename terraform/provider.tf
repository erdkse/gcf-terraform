terraform {
  required_providers {
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.2.0"
    }
    google = {
      source  = "hashicorp/google"
      version = "~> 4.44.1"
    }
  }
}

provider "google" {
  project     = var.project
  region      = var.provider_region
  zone        = var.provider_zone
  credentials = "../keys.json"
}












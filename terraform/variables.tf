variable "provider_region" {
  type    = string
  default = "us-central1"
}

variable "provider_zone" {
  type    = string
  default = "us-central1-a"
}

variable "dataset_name" {
  type    = string
  default = "assignment_db"
}

variable "dataset_table_name" {
  type    = string
  default = "speeches"
}


variable "location" {
  type    = string
  default = "US"
}


variable "project" {
  type    = string
  default = "profabric"
}

variable "excludes" {
  type = list(string)
  default = [
    "node_modules",
    "package-lock.json"
  ]
}

variable "name" {
  type    = string
  default = "evaluation"
}

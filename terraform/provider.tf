provider "aws" {
  region  = "us-east-1"
  profile = "clearpath-patient-api"

  default_tags {
    tags = {
      Project   = "clearpath-patient-api"
      ManagedBy = "terraform"
    }
  }
}
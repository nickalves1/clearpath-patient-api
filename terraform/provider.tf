provider "aws" {
  region  = var.region
  profile = var.aws_profile

  default_tags {
    tags = {
      Project   = "clearpath-patient-api"
      ManagedBy = "terraform"
    }
  }
}
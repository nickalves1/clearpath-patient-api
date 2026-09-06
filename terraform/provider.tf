provider "aws" {
  region  = var.region
  profile = var.aws_profile != "" ? var.aws_profile : null

  default_tags {
    tags = {
      Project   = "clearpath-patient-api"
      ManagedBy = "terraform"
    }
  }
}
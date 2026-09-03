variable "region" {
  description = "AWS region where resources are provisioned"
  type        = string
  default     = "us-east-1"
}

variable "aws_profile" {
  description = "AWS CLI profile that Terraform uses to authenticate"
  type        = string
  default     = "clearpath-patient-api"
}
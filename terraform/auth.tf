data "aws_kms_alias" "ssm" {
  name = "alias/aws/ssm"
}

resource "random_password" "api_shared_secret" {
  length  = 40
  special = false
}

resource "aws_ssm_parameter" "api_shared_secret" {
  name  = "/clearpath/patient-api/auth/shared-secret"
  type  = "SecureString"
  value = random_password.api_shared_secret.result
}

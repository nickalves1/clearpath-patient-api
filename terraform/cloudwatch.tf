resource "aws_cloudwatch_log_group" "patient_api" {
  name              = "/clearpath/patient-api"
  retention_in_days = 30
}
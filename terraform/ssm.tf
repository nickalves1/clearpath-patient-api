locals {
  app_config_parameters = {
    "dynamodb/idempotency-keys-table-name" = aws_dynamodb_table.idempotency_keys.name
    "dynamodb/release-requests-table-name" = aws_dynamodb_table.release_requests.name
    "sqs/release-requests-queue-url"       = aws_sqs_queue.release_requests.url
    "sqs/release-requests-dlq-url"         = aws_sqs_queue.release_requests_dlq.url
    "sns/release-delivered-topic-arn"      = aws_sns_topic.release_delivered.arn
    "s3/release-packages-bucket-name"      = aws_s3_bucket.release_packages.id
  }
}

resource "aws_ssm_parameter" "app_config" {
  for_each = local.app_config_parameters

  name  = "/clearpath/patient-api/${each.key}"
  type  = "String"
  value = each.value
}
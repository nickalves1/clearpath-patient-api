output "idempotency_keys_table_name" {
  value = aws_dynamodb_table.idempotency_keys.name
}

output "release_requests_table_name" {
  value = aws_dynamodb_table.release_requests.name
}

output "release_requests_queue_url" {
  value = aws_sqs_queue.release_requests.url
}

output "release_requests_dlq_url" {
  value = aws_sqs_queue.release_requests_dlq.url
}

output "release_delivered_topic_arn" {
  value = aws_sns_topic.release_delivered.arn
}

output "release_packages_bucket_name" {
  value = aws_s3_bucket.release_packages.id
}

output "patient_api_log_group_name" {
  value = aws_cloudwatch_log_group.patient_api.name
}

output "patient_api_runtime_role_arn" {
  value = aws_iam_role.patient_api_runtime.arn
}

output "patient_api_url" {
  value = aws_apigatewayv2_stage.default.invoke_url
}

output "identity_zone_name_servers" {
  description = "Add these 4 as NS records for clearpath.fitleads.com.br in GoDaddy's DNS management to delegate the subdomain"
  value       = aws_route53_zone.clearpath.name_servers
}

output "identity_kratos_hostname" {
  value = aws_route53_record.kratos.name
}

output "identity_hydra_hostname" {
  value = aws_route53_record.hydra.name
}
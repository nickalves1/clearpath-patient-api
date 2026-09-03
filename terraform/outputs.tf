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
output "idempotency_keys_table_name" {
  value = aws_dynamodb_table.idempotency_keys.name
}

output "release_requests_table_name" {
  value = aws_dynamodb_table.release_requests.name
}
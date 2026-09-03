resource "aws_dynamodb_table" "idempotency_keys" {
  name         = "clearpath-idempotency-keys"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "idempotencyKey"

  attribute {
    name = "idempotencyKey"
    type = "S"
  }
}

resource "aws_dynamodb_table" "release_requests" {
  name         = "clearpath-release-requests"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }
}
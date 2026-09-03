resource "aws_dynamodb_table" "idempotency_keys" {
  name         = "clearpath-idempotency-keys"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "idempotencyKey"

  lifecycle {
    prevent_destroy = true
  }

  attribute {
    name = "idempotencyKey"
    type = "S"
  }
}

resource "aws_dynamodb_table" "release_requests" {
  name         = "clearpath-release-requests"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  lifecycle {
    prevent_destroy = true
  }

  attribute {
    name = "id"
    type = "S"
  }
}
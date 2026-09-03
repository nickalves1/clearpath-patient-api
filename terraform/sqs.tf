resource "aws_sqs_queue" "release_requests_dlq" {
  name                      = "clearpath-release-requests-dlq"
  message_retention_seconds = 1209600 # 14 days
}

resource "aws_sqs_queue" "release_requests" {
  name                       = "clearpath-release-requests-queue"
  visibility_timeout_seconds = 30
  message_retention_seconds  = 345600 # 4 days

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.release_requests_dlq.arn
    maxReceiveCount     = 5
  })
}
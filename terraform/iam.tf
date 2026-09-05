data "aws_iam_policy_document" "patient_api_trust" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"]
    }
  }

  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "patient_api_runtime" {
  name               = "clearpath-patient-api-runtime"
  assume_role_policy = data.aws_iam_policy_document.patient_api_trust.json
}

data "aws_iam_policy_document" "patient_api_permissions" {
  statement {
    sid     = "DynamoDBReadWrite"
    effect  = "Allow"
    actions = ["dynamodb:GetItem", "dynamodb:PutItem"]
    resources = [
      aws_dynamodb_table.idempotency_keys.arn,
      aws_dynamodb_table.release_requests.arn,
    ]
  }

  statement {
    sid    = "ConsumeReleaseQueue"
    effect = "Allow"
    actions = [
      "sqs:SendMessage",
      "sqs:ReceiveMessage",
      "sqs:DeleteMessage",
      "sqs:GetQueueAttributes",
    ]
    resources = [aws_sqs_queue.release_requests.arn]
  }

  statement {
    sid       = "PublishReleaseDelivered"
    effect    = "Allow"
    actions   = ["sns:Publish"]
    resources = [aws_sns_topic.release_delivered.arn]
  }

  statement {
    sid       = "WriteReleasePackages"
    effect    = "Allow"
    actions   = ["s3:PutObject", "s3:GetObject"]
    resources = ["${aws_s3_bucket.release_packages.arn}/*"]
  }

  statement {
    sid       = "ReadAppConfig"
    effect    = "Allow"
    actions   = ["ssm:GetParameter", "ssm:GetParametersByPath"]
    resources = ["arn:aws:ssm:${var.region}:${data.aws_caller_identity.current.account_id}:parameter/clearpath/patient-api*"]
  }

  statement {
    sid    = "LambdaLogging"
    effect = "Allow"
    actions = [
      "logs:CreateLogStream",
      "logs:PutLogEvents",
    ]
    resources = [
      "${aws_cloudwatch_log_group.intake_lambda.arn}:*",
      "${aws_cloudwatch_log_group.worker_lambda.arn}:*",
      "${aws_cloudwatch_log_group.authorizer_lambda.arn}:*",
    ]
  }

  statement {
    sid       = "DecryptSsmSecrets"
    effect    = "Allow"
    actions   = ["kms:Decrypt"]
    resources = [data.aws_kms_alias.ssm.target_key_arn]
  }
}

resource "aws_iam_policy" "patient_api_permissions" {
  name   = "clearpath-patient-api-runtime-permissions"
  policy = data.aws_iam_policy_document.patient_api_permissions.json
}

resource "aws_iam_role_policy_attachment" "patient_api_runtime" {
  role       = aws_iam_role.patient_api_runtime.name
  policy_arn = aws_iam_policy.patient_api_permissions.arn
}
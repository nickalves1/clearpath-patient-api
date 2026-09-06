data "archive_file" "intake_lambda" {
  type        = "zip"
  source_file = "${path.module}/../dist-lambda/lambda.js"
  output_path = "${path.module}/../dist-lambda/lambda.zip"
}

data "archive_file" "worker_lambda" {
  type        = "zip"
  source_file = "${path.module}/../dist-lambda/worker-lambda.js"
  output_path = "${path.module}/../dist-lambda/worker-lambda.zip"
}

data "archive_file" "authorizer_lambda" {
  type        = "zip"
  source_file = "${path.module}/../dist-lambda/authorizer.js"
  output_path = "${path.module}/../dist-lambda/authorizer.zip"
}

resource "aws_s3_bucket" "lambda_deployments" {
  bucket = "clearpath-patient-api-lambda-deployments-${data.aws_caller_identity.current.account_id}"
}

resource "aws_s3_bucket_public_access_block" "lambda_deployments" {
  bucket = aws_s3_bucket.lambda_deployments.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_object" "intake_lambda_package" {
  bucket = aws_s3_bucket.lambda_deployments.id
  key    = "intake/lambda.zip"
  source = data.archive_file.intake_lambda.output_path
  etag   = data.archive_file.intake_lambda.output_md5
}

resource "aws_s3_object" "worker_lambda_package" {
  bucket = aws_s3_bucket.lambda_deployments.id
  key    = "worker/worker-lambda.zip"
  source = data.archive_file.worker_lambda.output_path
  etag   = data.archive_file.worker_lambda.output_md5
}

resource "aws_s3_object" "authorizer_lambda_package" {
  bucket = aws_s3_bucket.lambda_deployments.id
  key    = "authorizer/authorizer.zip"
  source = data.archive_file.authorizer_lambda.output_path
  etag   = data.archive_file.authorizer_lambda.output_md5
}

resource "aws_cloudwatch_log_group" "intake_lambda" {
  name              = "/aws/lambda/clearpath-patient-api-intake"
  retention_in_days = 14
}

resource "aws_cloudwatch_log_group" "worker_lambda" {
  name              = "/aws/lambda/clearpath-patient-api-worker"
  retention_in_days = 14
}

resource "aws_cloudwatch_log_group" "authorizer_lambda" {
  name              = "/aws/lambda/clearpath-patient-api-authorizer"
  retention_in_days = 14
}

resource "time_sleep" "wait_for_iam_propagation" {
  depends_on      = [aws_iam_role.patient_api_runtime, aws_iam_role_policy_attachment.patient_api_runtime]
  create_duration = "30s"
}

resource "aws_lambda_function" "intake" {
  function_name    = "clearpath-patient-api-intake"
  role             = aws_iam_role.patient_api_runtime.arn
  handler          = "lambda.handler"
  runtime          = "nodejs22.x"
  s3_bucket        = aws_s3_bucket.lambda_deployments.id
  s3_key           = aws_s3_object.intake_lambda_package.key
  source_code_hash = data.archive_file.intake_lambda.output_base64sha256
  timeout          = 30
  memory_size      = 256

  depends_on = [aws_cloudwatch_log_group.intake_lambda, aws_s3_object.intake_lambda_package, time_sleep.wait_for_iam_propagation]
}

resource "aws_lambda_function" "worker" {
  function_name    = "clearpath-patient-api-worker"
  role             = aws_iam_role.patient_api_runtime.arn
  handler          = "worker-lambda.handler"
  runtime          = "nodejs22.x"
  s3_bucket        = aws_s3_bucket.lambda_deployments.id
  s3_key           = aws_s3_object.worker_lambda_package.key
  source_code_hash = data.archive_file.worker_lambda.output_base64sha256
  timeout          = 30
  memory_size      = 256

  depends_on = [aws_cloudwatch_log_group.worker_lambda, aws_s3_object.worker_lambda_package, time_sleep.wait_for_iam_propagation]
}

resource "aws_lambda_function" "authorizer" {
  function_name    = "clearpath-patient-api-authorizer"
  role             = aws_iam_role.patient_api_runtime.arn
  handler          = "authorizer.handler"
  runtime          = "nodejs22.x"
  s3_bucket        = aws_s3_bucket.lambda_deployments.id
  s3_key           = aws_s3_object.authorizer_lambda_package.key
  source_code_hash = data.archive_file.authorizer_lambda.output_base64sha256
  timeout          = 10
  memory_size      = 256

  depends_on = [aws_cloudwatch_log_group.authorizer_lambda, aws_s3_object.authorizer_lambda_package, time_sleep.wait_for_iam_propagation]
}

resource "aws_apigatewayv2_api" "patient_api" {
  name          = "clearpath-patient-api"
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_integration" "intake" {
  api_id                 = aws_apigatewayv2_api.patient_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.intake.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_authorizer" "shared_secret" {
  api_id                            = aws_apigatewayv2_api.patient_api.id
  authorizer_type                   = "REQUEST"
  authorizer_uri                    = aws_lambda_function.authorizer.invoke_arn
  authorizer_payload_format_version = "2.0"
  enable_simple_responses           = true
  identity_sources                  = ["$request.header.x-api-key"]
  name                              = "shared-secret-authorizer"
  authorizer_result_ttl_in_seconds  = 0
}

resource "aws_apigatewayv2_route" "intake_proxy" {
  api_id             = aws_apigatewayv2_api.patient_api.id
  route_key          = "ANY /{proxy+}"
  target             = "integrations/${aws_apigatewayv2_integration.intake.id}"
  authorization_type = "CUSTOM"
  authorizer_id      = aws_apigatewayv2_authorizer.shared_secret.id
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.patient_api.id
  name        = "$default"
  auto_deploy = true
}

resource "aws_lambda_permission" "api_gateway_invoke" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.intake.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.patient_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "api_gateway_invoke_authorizer" {
  statement_id  = "AllowAPIGatewayInvokeAuthorizer"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.authorizer.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.patient_api.execution_arn}/authorizers/${aws_apigatewayv2_authorizer.shared_secret.id}"
}

resource "aws_lambda_event_source_mapping" "worker_sqs_trigger" {
  event_source_arn        = aws_sqs_queue.release_requests.arn
  function_name           = aws_lambda_function.worker.arn
  batch_size              = 10
  function_response_types = ["ReportBatchItemFailures"]
}
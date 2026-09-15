data "aws_ssm_parameter" "github_access_token" {
  name            = "/clearpath/patient-app/github-access-token"
  with_decryption = true
}

data "aws_ssm_parameter" "auth_hydra_id" {
  name            = "/clearpath/patient-app/prod/auth-hydra-id"
  with_decryption = true
}

data "aws_ssm_parameter" "auth_hydra_secret" {
  name            = "/clearpath/patient-app/prod/auth-hydra-secret"
  with_decryption = true
}

data "aws_ssm_parameter" "auth_secret" {
  name            = "/clearpath/patient-app/prod/auth-secret"
  with_decryption = true
}

data "aws_iam_policy_document" "amplify_service_trust" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["amplify.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "amplify_service" {
  name               = "clearpath-patient-app-amplify-service"
  assume_role_policy = data.aws_iam_policy_document.amplify_service_trust.json
}

resource "aws_amplify_app" "patient_app" {
  name                 = "clearpath-patient-app"
  repository           = "https://github.com/nickalves1/clearpath-patient-app"
  access_token         = data.aws_ssm_parameter.github_access_token.value
  platform             = "WEB_COMPUTE"
  iam_service_role_arn = aws_iam_role.amplify_service.arn

  build_spec = <<-EOT
    version: 1
    frontend:
      phases:
        preBuild:
          commands:
            - npm ci
            - env | grep -e AUTH_URL -e AUTH_HYDRA_ID -e AUTH_HYDRA_SECRET -e AUTH_SECRET -e AUTH_HYDRA_ISSUER -e HYDRA_ADMIN_URL -e NEXT_PUBLIC_KRATOS_URL >> .env.production
        build:
          commands:
            - npm run build
      artifacts:
        baseDirectory: .next
        files:
          - '**/*'
      cache:
        paths:
          - node_modules/**/*
  EOT

  tags = {
    Project   = "clearpath-patient-app"
    ManagedBy = "terraform"
  }

  environment_variables = {
    AUTH_URL            = "https://app.clearpath.fitleads.com.br"
    AUTH_HYDRA_ID       = data.aws_ssm_parameter.auth_hydra_id.value
    AUTH_HYDRA_SECRET    = data.aws_ssm_parameter.auth_hydra_secret.value
    AUTH_SECRET          = data.aws_ssm_parameter.auth_secret.value
    AUTH_HYDRA_ISSUER    = "https://hydra.clearpath.fitleads.com.br"
    HYDRA_ADMIN_URL      = "http://34.226.186.255:4445"
    NEXT_PUBLIC_KRATOS_URL = "https://kratos.clearpath.fitleads.com.br"
  }
}

data "aws_iam_policy_document" "amplify_service_permissions" {
  statement {
    sid    = "ReadAmplifyEnvSecrets"
    effect = "Allow"
    actions = [
      "ssm:GetParametersByPath",
      "ssm:GetParameters",
      "ssm:GetParameter",
      "ssm:DescribeParameters",
    ]
    resources = ["arn:aws:ssm:${var.region}:${data.aws_caller_identity.current.account_id}:parameter/amplify/${aws_amplify_app.patient_app.id}/*"]
  }

  statement {
    sid       = "DecryptAmplifySsm"
    effect    = "Allow"
    actions   = ["kms:Decrypt"]
    resources = [data.aws_kms_alias.ssm.target_key_arn]
  }
}

resource "aws_iam_policy" "amplify_service_permissions" {
  name   = "clearpath-patient-app-amplify-service-permissions"
  policy = data.aws_iam_policy_document.amplify_service_permissions.json
}

resource "aws_iam_role_policy_attachment" "amplify_service_permissions" {
  role       = aws_iam_role.amplify_service.name
  policy_arn = aws_iam_policy.amplify_service_permissions.arn
}

resource "aws_amplify_branch" "main" {
  app_id      = aws_amplify_app.patient_app.id
  branch_name = "main"

  framework = "Next.js - SSR"
  stage     = "PRODUCTION"

  enable_auto_build = true
}
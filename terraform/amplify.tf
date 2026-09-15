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

resource "aws_amplify_app" "patient_app" {
  name         = "clearpath-patient-app"
  repository   = "https://github.com/nickalves1/clearpath-patient-app"
  access_token = data.aws_ssm_parameter.github_access_token.value
  platform     = "WEB_COMPUTE"

  build_spec = <<-EOT
    version: 1
    frontend:
      phases:
        preBuild:
          commands:
            - npm ci
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
    AUTH_HYDRA_ID       = data.aws_ssm_parameter.auth_hydra_id.value
    AUTH_HYDRA_SECRET    = data.aws_ssm_parameter.auth_hydra_secret.value
    AUTH_SECRET          = data.aws_ssm_parameter.auth_secret.value
    AUTH_HYDRA_ISSUER    = "https://hydra.clearpath.fitleads.com.br"
    HYDRA_ADMIN_URL      = "http://34.226.186.255:4445"
    NEXT_PUBLIC_KRATOS_URL = "https://kratos.clearpath.fitleads.com.br"
  }
}

resource "aws_amplify_branch" "main" {
  app_id      = aws_amplify_app.patient_app.id
  branch_name = "main"

  framework = "Next.js - SSR"
  stage     = "PRODUCTION"

  enable_auto_build = true
}
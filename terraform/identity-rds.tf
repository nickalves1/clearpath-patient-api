resource "aws_security_group" "identity_rds" {
  name        = "clearpath-identity-rds"
  description = "Security group for the shared RDS Postgres (Kratos, Hydra, patient app)"

  ingress {
    description     = "Postgres from the identity EC2"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.identity_ec2.id]
  }

  ingress {
    description = "Postgres from Lambda (no VPC, cannot be scoped by security group or IP range - see SSL enforcement below)"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Project   = "clearpath-identity"
    ManagedBy = "terraform"
  }
}

resource "random_password" "identity_rds_password" {
  length  = 32
  special = false
}

resource "aws_ssm_parameter" "identity_rds_password" {
  name  = "/clearpath/identity/rds-master-password"
  type  = "SecureString"
  value = random_password.identity_rds_password.result
}

resource "random_password" "identity_hydra_secret" {
  length  = 32
  special = false
}

resource "aws_ssm_parameter" "identity_hydra_secret" {
  name  = "/clearpath/identity/hydra-secret"
  type  = "SecureString"
  value = random_password.identity_hydra_secret.result
}

resource "aws_db_parameter_group" "identity" {
  name   = "clearpath-identity-pg17"
  family = "postgres17"

  parameter {
    name  = "rds.force_ssl"
    value = "1"
  }
}

resource "aws_db_instance" "identity" {
  identifier     = "clearpath-identity-db"
  engine         = "postgres"
  engine_version = "17"
  instance_class = "db.t3.micro"

  allocated_storage = 20
  storage_type      = "gp2"

  db_name  = "kratos"
  username = "clearpath_admin"
  password = random_password.identity_rds_password.result

  publicly_accessible    = true
  vpc_security_group_ids = [aws_security_group.identity_rds.id]
  parameter_group_name   = aws_db_parameter_group.identity.name

  backup_retention_period = 1
  skip_final_snapshot     = true

  tags = {
    Project   = "clearpath-identity"
    ManagedBy = "terraform"
  }
}
resource "aws_security_group" "identity_ec2" {
  name        = "clearpath-identity-ec2"
  description = "Security group for the EC2 running Ory Kratos/Hydra and Laravel"

  ingress {
    description = "SSH from my own IP only"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["177.206.23.217/32"]
  }

  ingress {
    description = "HTTP (public - needed for Kratos/Hydra/Laravel and Lets Encrypt)"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS (public)"
    from_port   = 443
    to_port     = 443
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

data "aws_iam_policy_document" "identity_ec2_trust" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "identity_ec2" {
  name               = "clearpath-identity-ec2"
  assume_role_policy = data.aws_iam_policy_document.identity_ec2_trust.json
}

resource "aws_iam_role_policy_attachment" "identity_ec2_ssm_core" {
  role       = aws_iam_role.identity_ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

data "aws_iam_policy_document" "identity_ec2_permissions" {
  statement {
    sid       = "ReadIdentityConfig"
    effect    = "Allow"
    actions   = ["ssm:GetParameter", "ssm:GetParametersByPath"]
    resources = ["arn:aws:ssm:${var.region}:${data.aws_caller_identity.current.account_id}:parameter/clearpath/identity*"]
  }

  statement {
    sid       = "DecryptSsmSecrets"
    effect    = "Allow"
    actions   = ["kms:Decrypt"]
    resources = [data.aws_kms_alias.ssm.target_key_arn]
  }
}

resource "aws_iam_policy" "identity_ec2_permissions" {
  name   = "clearpath-identity-ec2-permissions"
  policy = data.aws_iam_policy_document.identity_ec2_permissions.json
}

resource "aws_iam_role_policy_attachment" "identity_ec2_permissions" {
  role       = aws_iam_role.identity_ec2.name
  policy_arn = aws_iam_policy.identity_ec2_permissions.arn
}

resource "aws_iam_instance_profile" "identity_ec2" {
  name = "clearpath-identity-ec2"
  role = aws_iam_role.identity_ec2.name
}

data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }
}

resource "aws_key_pair" "identity_ec2" {
  key_name   = "clearpath-identity-ec2"
  public_key = file("${path.module}/identity-ec2.pub")
}

resource "aws_eip" "identity_ec2" {
  domain = "vpc"

  tags = {
    Project   = "clearpath-identity"
    ManagedBy = "terraform"
  }
}

resource "aws_instance" "identity" {
  ami           = data.aws_ami.amazon_linux.id
  instance_type = "t3.micro"

  key_name               = aws_key_pair.identity_ec2.key_name
  vpc_security_group_ids = [aws_security_group.identity_ec2.id]
  iam_instance_profile   = aws_iam_instance_profile.identity_ec2.name

  root_block_device {
    volume_size = 30
    volume_type = "gp2"
  }

  tags = {
    Name      = "clearpath-identity"
    Project   = "clearpath-identity"
    ManagedBy = "terraform"
  }
}

resource "aws_eip_association" "identity_ec2" {
  instance_id   = aws_instance.identity.id
  allocation_id = aws_eip.identity_ec2.id
}
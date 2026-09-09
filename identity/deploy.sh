#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")"

RDS_PASSWORD=$(aws ssm get-parameter --name /clearpath/identity/rds-master-password --with-decryption --query Parameter.Value --output text --region us-east-1)
HYDRA_SECRET=$(aws ssm get-parameter --name /clearpath/identity/hydra-secret --with-decryption --query Parameter.Value --output text --region us-east-1)

cat > .env <<ENVEOF
RDS_PASSWORD=${RDS_PASSWORD}
HYDRA_SECRET=${HYDRA_SECRET}
ENVEOF

docker compose pull
docker compose up -d

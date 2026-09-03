resource "aws_s3_bucket" "release_packages" {
    bucket = "clearpath-patient-api-release-packages-${data.aws_caller_identity.current.account_id}"
}

resource "aws_s3_bucket_versioning" "release_packages" {
    bucket = aws_s3_bucket.release_packages.id

    versioning_configuration {
        status = "Enabled"
    }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "release_packages" {
    bucket = aws_s3_bucket.release_packages.id

    rule {
        apply_server_side_encryption_by_default {
            sse_algorithm = "AES256"
        }
    }
}

resource "aws_s3_bucket_public_access_block" "release_packages" {
    bucket = aws_s3_bucket.release_packages.id

    block_public_acls       = true
    block_public_policy     = true
    ignore_public_acls      = true
    restrict_public_buckets = true
}
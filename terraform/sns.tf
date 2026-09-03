resource "aws_sns_topic" "release_delivered" {
  name = "clearpath-release-requests-delivered"
}
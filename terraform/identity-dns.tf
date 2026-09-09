resource "aws_route53_zone" "clearpath" {
  name    = "clearpath.fitleads.com.br"
  comment = "Delegated subdomain of an externally-registered (GoDaddy) domain - only this subdomain lives in Route 53, the root domain's DNS stays at GoDaddy for other projects"

  tags = {
    Project   = "clearpath-identity"
    ManagedBy = "terraform"
  }
}

resource "aws_route53_record" "kratos" {
  zone_id = aws_route53_zone.clearpath.zone_id
  name    = "kratos.clearpath.fitleads.com.br"
  type    = "A"
  ttl     = 300
  records = [aws_eip.identity_ec2.public_ip]
}

resource "aws_route53_record" "hydra" {
  zone_id = aws_route53_zone.clearpath.zone_id
  name    = "hydra.clearpath.fitleads.com.br"
  type    = "A"
  ttl     = 300
  records = [aws_eip.identity_ec2.public_ip]
}

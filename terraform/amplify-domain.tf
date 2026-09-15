resource "aws_amplify_domain_association" "patient_app" {
  app_id      = aws_amplify_app.patient_app.id
  domain_name = "clearpath.fitleads.com.br"

  sub_domain {
    branch_name = aws_amplify_branch.main.branch_name
    prefix      = "app"
  }

  wait_for_verification = false
}

# Amplify manages the certificate-validation and subdomain-routing CNAME
# records itself when the domain is a Route 53 zone in the same account -
# no aws_route53_record resources needed here (they'd conflict with the
# ones Amplify already creates).

data "aws_availability_zones" "current" {}

module "vpc" {
    source = "terraform-aws-modules/vpc/aws"
    version = "5.9.0"

    name = "${var.stage}-vpc"
    cidr = var.vpc_cidr

    azs = slice(data.aws_availability_zones.current.names, 0, 3)
    public_subnets = [
        cidrsubnet(var.vpc_cidr, 2, 1),
        cidrsubnet(var.vpc_cidr, 2, 2),
        cidrsubnet(var.vpc_cidr, 2, 3),
    ]

    manage_default_security_group = false
    default_security_group_ingress = []
    default_security_group_egress = []
}
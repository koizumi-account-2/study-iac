data "aws_availability_zones" "current" {}

module "vpc" {
    source = "terraform-aws-modules/vpc/aws"
    version = "5.9.0"

    name = "${var.stage}-vpc"
    cidr = var.vpc_cidr

    azs = slice(data.aws_availability_zones.current.names, 0, 3)
    public_subnets = [
        cidrsubnet(var.vpc_cidr, 4, 1),
        cidrsubnet(var.vpc_cidr, 4, 2),
        cidrsubnet(var.vpc_cidr, 4, 3),
    ]

    intra_subnets = [
        cidrsubnet(var.vpc_cidr, 4, 4),
        cidrsubnet(var.vpc_cidr, 4, 5),
        cidrsubnet(var.vpc_cidr, 4, 6),
    ]
    private_subnets = var.enable_nat_gateway ? [
        cidrsubnet(var.vpc_cidr, 4, 8),
        cidrsubnet(var.vpc_cidr, 4, 9),
        cidrsubnet(var.vpc_cidr, 4, 10),
    ] : []

    enable_nat_gateway = var.enable_nat_gateway
    
    single_nat_gateway = (var.enable_nat_gateway ? (var.one_nat_gateway_per_az ? false : true) : false)
    one_nat_gateway_per_az = var.enable_nat_gateway ? var.one_nat_gateway_per_az : false


    manage_default_security_group = false
    default_security_group_ingress = []
    default_security_group_egress = []
}
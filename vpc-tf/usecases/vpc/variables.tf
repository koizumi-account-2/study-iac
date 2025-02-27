variable "stage" {
    type = string
    description = "The stage of the application"
}

variable "vpc_cidr" {
    type = string
    description = "VPC CIDR  例：10.0.0.0/16"
}

variable "enable_nat_gateway" {
    type = bool
    description = "Enable NAT Gateway"
}

variable "one_nat_gateway_per_az" {
    type = bool
    default = false
    description = "Enable NAT Gateway per AZ"
}
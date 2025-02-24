variable "domain" {
    type = string
    description = "The domain name of the website"
}
variable "memory_size" {
    type = number
    default = 128
    description = "The memory size of the function"
}

variable "stage" {
    type = string
    description = "The stage of the application"
    validation {
        condition = can(regex("^(prd|stg|dev)$", var.stage))
        error_message = "The stage must be either prd or stg or dev"
    }
}

terraform {
    required_version = ">=1.9.8"
    required_providers {
        aws = {
            source = "hashicorp/aws"
            version = ">=5.72.1"
        }
    }
}
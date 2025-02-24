provider "aws" {
    region = "ap-northeast-1"
    default_tags {
        tags = {
            Terraform = "true"
            Stage = "dev"
            Module = "sqs"
        }
    }
}

provider "aws" {
    region = "us-east-1"
    alias = "us-east-1"
    default_tags {
        tags = {
            Terraform = "true"
            Stage = "dev"
            Module = "sqs"    
        }
    }
}
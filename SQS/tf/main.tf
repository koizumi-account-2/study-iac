terraform {
    required_version = "1.9.8"
    required_providers {
        aws = {
            source = "hashicorp/aws"
            version = "5.72.1"
        }
    }
    backend "s3" {
        bucket = "dev-terraform-state-bucket-tf-study-2025"
        key = "case1/terraform.tfstate"
        region = "ap-northeast-1"
    }
}

provider "aws" {
    region = "ap-northeast-1"
    default_tags {
        tags = {
            Terraform = "true"
            Stage = "dev"
            Module = "case1"
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
            Module = "case1"    
        }
    }
}
resource "aws_sqs_queue" "my_queue" {
    name = "test-queue-tf"
    max_message_size = 4096
    tags = {
        "name" = "test-queue-tf"
    }
}

resource "aws_sqs_queue" "my_queue_us_east_1" {
    name = "test-queue-tf-us-east-1"
    provider = aws.us-east-1
    max_message_size = 4096
    tags = {
        "name" = "test-queue-tf-us-east-1"
    }
}   

output "sqs_queue_url" {
    value = aws_sqs_queue.my_queue.url
    description = "The URL of the SQS queue"
}


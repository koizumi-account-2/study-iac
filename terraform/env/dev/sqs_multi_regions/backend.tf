terraform {
    backend "s3" {
        bucket = "dev-terraform-state-bucket-tf-study-2025"
        key = "sqs_multi_regions/terraform.tfstate"
        region = "ap-northeast-1"
    }
}
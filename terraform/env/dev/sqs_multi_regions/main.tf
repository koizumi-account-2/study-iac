module "sqs_module_test" {
    source = "../../../modules/sqs_multi_regions"
    stage = "dev"
    queue_name_suffix = "queue-test"
    sqs_queue_visibility_timeout_seconds = 60
    providers = {
        aws.other_region = aws.us-east-1
    }
}
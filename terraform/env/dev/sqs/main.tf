module "sqs_module_test" {
    source = "../../../modules/sqs"
    stage = "dev"
    queue_name_suffix = "queue-test"
    sqs_queue_visibility_timeout_seconds = 60
}


output "sqs_queue_url" {
    value = module.sqs_module_test.sqs_queue_url
}
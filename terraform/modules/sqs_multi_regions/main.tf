resource "aws_sqs_queue" "default_region" {
    name = "${var.stage}-${var.queue_name_suffix}"
    visibility_timeout_seconds = var.sqs_queue_visibility_timeout_seconds
    max_message_size = 2048
}

resource "aws_sqs_queue" "other_region" {
    provider = aws.other_region
    name = "${var.stage}-${var.queue_name_suffix}"
    visibility_timeout_seconds = var.sqs_queue_visibility_timeout_seconds
    max_message_size = 2048
}



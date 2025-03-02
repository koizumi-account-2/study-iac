# SSMパラメータストアについてのデータソース
data "aws_ssm_parameter" "flask_api_correct_answer" {
    name = "/flask-api-tf/${var.stage}/correct_answer"
}

resource "aws_ecs_cluster" "flask_api" {
    name = "${var.stage}-flask-api-tf"
}

resource "aws_ecs_cluster_capacity_providers" "flask_api" {
    cluster_name = aws_ecs_cluster.flask_api.name
    capacity_providers = ["FARGATE"]
}

### ECRの実行ロール
# 信頼関係ポリシー
data "aws_iam_policy_document" "ecs_task_execution_assume_role" {
    statement {
        effect = "Allow"
        actions = ["sts:AssumeRole"]
        principals {
            type = "Service"
            identifiers = ["ecs-tasks.amazonaws.com"]
        }
    }
}

# ECRやCloudWatch Logsのアクションを許可するAWSマネージドポリシー
data "aws_iam_policy" "managed_ecs_task_execution" {
    name = "AmazonECSTaskExecutionRolePolicy"
}

# 起動時にSSMパラメータストアから環境変数を取得する許可
data "aws_iam_policy_document" "esc_task_execution" {
    statement {
        effect = "Allow"
        actions = ["ssm:GetParameter","ssm:GetParameters"]
        # 参照できるパラメータストアを限定
        resources = [data.aws_ssm_parameter.flask_api_correct_answer.arn]
    } 
}

# IAMロールの記述
resource "aws_iam_role" "ecs_task_execution_role" {
    name = "${var.stage}-flask-api-execution-role-tf"
    assume_role_policy = data.aws_iam_policy_document.ecs_task_execution_assume_role.json
}

# マネージドポリシーをIAMロールにアタッチ
resource "aws_iam_role_policy_attachments_exclusive" "ecs_task_execution_managed_policy" {
    policy_arns = [data.aws_iam_policy.managed_ecs_task_execution.arn]
    role_name = aws_iam_role.ecs_task_execution_role.name
}

# 起動時にSSMパラメータストアから環境変数を取得する許可をIAMロールにアタッチ
resource "aws_iam_role_policy" "ecs_task_execution_data_policy" {
    name = "${var.stage}-flask-api-ecs-task-execution-policy"
    policy = data.aws_iam_policy_document.esc_task_execution.json
    role = aws_iam_role.ecs_task_execution_role.name
}

### ECSタスクロール
# 信頼関係ポリシー
data "aws_iam_policy_document" "ecs_task_assume_role" {
    statement {
        effect = "Allow"
        actions = ["sts:AssumeRole"]
        principals {
            type = "Service"
            identifiers = ["ecs-tasks.amazonaws.com"]
        }
    }
}

# ECRタスクロール
resource "aws_iam_role" "ecs_task" {
    name = "${var.stage}-flask-api-task-role-tf"
    assume_role_policy = data.aws_iam_policy_document.ecs_task_assume_role.json
}

# インラインポリシー
data "aws_iam_policy_document" "ecs_task" {
    statement {
        effect = "Allow"
        actions = [
            "ssmmessages:CreateControlChannel",
            "ssmmessages:CreateDataChannel",
            "ssmmessages:OpenControlChannel",
            "ssmmessages:OpenDataChannel"
        ]
        resources = ["*"]
    }
}

# タスクロールにアタッチ
resource "aws_iam_role_policy" "ecs_task_inline_policy" {
    name = "${var.stage}-flask-api-ecs-task-inline-policy"
    role = aws_iam_role.ecs_task.name
    policy = data.aws_iam_policy_document.ecs_task.json
}

# VPC名をローカルで定義する
locals {
    vpc_name = "${var.stage}-vpc"
}

# VPCのIDを取得する
data "aws_vpc" "this" {
    filter {
        name = "tag:Name"
        values = [local.vpc_name]
    }
}

# サブネットのIDを取得する
data "aws_subnets" "public" {
    filter {
        name = "tag:Name"
        values = [
            "${local.vpc_name}-public-ap-northeast-1a",
            "${local.vpc_name}-public-ap-northeast-1c",
            "${local.vpc_name}-public-ap-northeast-1d"
        ]
    }
}

### セキュリティグループの設定
# ALBのセキュリティグループ
resource "aws_security_group" "alb" {
    name = "${var.stage}-flask_api_alb_tf"
    description = "Security group for ALB"
    vpc_id = data.aws_vpc.this.id
}

# ECS Fargateのセキュリティグループ
resource "aws_security_group" "ecs_fargate" {
    name = "${var.stage}-flask_api_ecs_fargate_tf"
    description = "Security group for ECS Fargate"
    vpc_id = data.aws_vpc.this.id
}

# ALBのセキュリティグループのインバウンド
# 任意のIPアドレス -> :80
resource "aws_vpc_security_group_ingress_rule" "lb_from_http" {
    from_port = 80
    to_port = 80
    ip_protocol = "tcp"
    security_group_id = aws_security_group.alb.id
    cidr_ipv4 = "0.0.0.0/0"
}

# ALBのセキュリティグループのアウトバウンド
# ALB -> FARGATEのインスタンスの5000番ポート
resource "aws_vpc_security_group_egress_rule" "lb_to_ecs_instance" {
    from_port = 5000
    to_port = 5000
    ip_protocol = "tcp"
    security_group_id = aws_security_group.alb.id
    # 送信先（宛先）として ECS Fargate のセキュリティグループを指定
    referenced_security_group_id = aws_security_group.ecs_fargate.id
}

# ECS Fargateのセキュリティグループのインバウンド
# ALB -> FARGATEのインスタンスの5000番ポート
resource "aws_vpc_security_group_ingress_rule" "ecs_instance_from_alb" {
    from_port = 5000
    to_port = 5000
    ip_protocol = "tcp"
    security_group_id = aws_security_group.ecs_fargate.id
    # 送信元（ソース）として ALB のセキュリティグループを指定
    referenced_security_group_id = aws_security_group.alb.id
}

# ECS Fargateのセキュリティグループのアウトバウンド
# FARGATEのインスタンス -> 任意のIPアドレスの443番ポート
resource "aws_vpc_security_group_egress_rule" "ecs_instance_to_http" {
    from_port = 443
    to_port = 443
    ip_protocol = "tcp"
    security_group_id = aws_security_group.ecs_fargate.id
    cidr_ipv4 = "0.0.0.0/0"
}

### ALBの設定
# ALBの作成
resource "aws_lb" "flask_api" {
    name = "${var.stage}-flask-api-alb-tf"
    internal = false
    load_balancer_type = "application"
    security_groups = [aws_security_group.alb.id]
    subnets = data.aws_subnets.public.ids
}

# ALBのターゲットグループの設定
resource "aws_lb_target_group" "flask_api" {
    name = "flask-api-tf"
    port = 5000
    protocol = "HTTP"
    target_type = "ip"
    vpc_id = data.aws_vpc.this.id
    health_check {
        path = "/health"
        protocol = "HTTP"
        matcher = "200"
        interval = 10
    }
}

# ALBのリスナーの設定
resource "aws_lb_listener" "flask_api" {
    load_balancer_arn = aws_lb.flask_api.arn
    port = 80
    protocol = "HTTP"
    default_action {
        type = "forward"
        target_group_arn = aws_lb_target_group.flask_api.arn
    }
}

### ECSタスクの設定
# リージョンの問い合わせ
data "aws_region" "current" {}

# コンテナイメージの設定
data "aws_ecr_repository" "flask_api" {
    name = "${var.stage}-flask-api-tf"
}

# ECSタスクのロググループの設定
resource "aws_cloudwatch_log_group" "flask_api" {
    name = "/ecs/${var.stage}-flask-api-tf"
    retention_in_days = 14
}

# コンテナ定義
locals {
    container_definitions = {
        flask_api = {
            name = "flask-api"
            # 環境変数のCORRECT_ANSWERはSSMパラメータストアから取得
            secrets = [
                {
                    name = "CORRECT_ANSWER"
                    valueFrom = data.aws_ssm_parameter.flask_api_correct_answer.arn
                },
            ]
            essential = true
            # ECRレポジトリのデータソースを参照
            image = "${data.aws_ecr_repository.flask_api.repository_url}:latest"
            logConfiguration = {
                logDriver = "awslogs"
                options = {
                    awslogs-group = aws_cloudwatch_log_group.flask_api.name
                    awslogs-region = data.aws_region.current.name
                    awslogs-stream-prefix = "flask_api"
                }
            }
            portMappings = [
                {
                    containerPort = 5000
                    hostPort = 5000
                    protocol = "tcp"
                },
            ]
        },
    }
}

resource "aws_ecs_task_definition" "flask_api" {
    family = "${var.stage}-flask-api-tf"
    container_definitions = jsonencode(
        values(local.container_definitions)
        )
    execution_role_arn = aws_iam_role.ecs_task_execution_role.arn
    task_role_arn = aws_iam_role.ecs_task.arn
    network_mode = "awsvpc"
    requires_compatibilities = ["FARGATE"]
    cpu = "256"
    memory = "512"
    skip_destroy = true
}
    
### ECSサービスの設定
resource "aws_ecs_service" "flask_api" {
    name = "flask-api-tf"
    cluster = aws_ecs_cluster.flask_api.arn
    task_definition = aws_ecs_task_definition.flask_api.arn
    desired_count = 0
    launch_type = "FARGATE"
    health_check_grace_period_seconds = 60
    enable_execute_command = true
    deployment_circuit_breaker {
        enable = true
        rollback = false
    }

    load_balancer {
        target_group_arn = aws_lb_target_group.flask_api.arn
        container_name = local.container_definitions.flask_api.name
        container_port = 5000
    }
    
    network_configuration {
        subnets = data.aws_subnets.public.ids
        security_groups = [aws_security_group.ecs_fargate.id]
        assign_public_ip = true
    }
    
    lifecycle {
        ignore_changes = [desired_count]
    }
}
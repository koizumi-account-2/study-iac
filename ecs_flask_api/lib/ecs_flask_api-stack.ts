import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';

const ECS_FLASK_API_SECRET_NAME = 'EcsFlaskApiSecret';
const ECS_FLASK_API_REPOSITORY_NAME = 'EcsFlaskApiRepository';
const SUFFIX = 'flask-api-cdk';

interface EcsFlaskApiStackProps extends cdk.StackProps {
    stage: string;
    repositoryName: string;
    secretName: string;
}

export class EcsFlaskApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: EcsFlaskApiStackProps) {
    super(scope, id, props);
    // 既存のVPCを参照
    const vpc = ec2.Vpc.fromLookup(this, 'EcsFlaskApiVpc', {
       vpcName: `${props.stage}-vpc`,
    });

    // 既存のシークレットを参照
    const secrets = secretsmanager.Secret.fromSecretNameV2(this, ECS_FLASK_API_SECRET_NAME, props.secretName);

    // 既存のリポジトリを参照
    const repository = ecr.Repository.fromRepositoryName(this, ECS_FLASK_API_REPOSITORY_NAME, props.repositoryName);


    //ECS クラスターを作成
    const cluster = new ecs.Cluster(this, 'EcsFlaskApiCluster', {
        clusterName: `${props.stage}-${SUFFIX}`,
        enableFargateCapacityProviders: true,
        vpc,
    });

    // ALB用のセキュリティグループを作成
    const albSecurityGroup = new ec2.SecurityGroup(this, 'EcsFlaskApiAlbSecurityGroup', {
        vpc,
        allowAllOutbound: true,
        securityGroupName: `${props.stage}-${SUFFIX}-alb-security-group`
    });
     // ECSFargateインスタンス用のセキュリティグループを作成
    const ecsSecurityGroup = new ec2.SecurityGroup(this, 'EcsFargateSecurityGroup', {
        vpc,
        allowAllOutbound: false,
        securityGroupName: `${props.stage}-${SUFFIX}-fargate-security-group`
    });

    // ALBのインバウンドルールを設定 
    // 任意のIPから80番ポートへのアクセスを許可
    albSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80));

    // ALBのアウトバウンドルールを設定
    // ECS Fargateインスタンスの5000番ポートへのアクセスを許可
    albSecurityGroup.addEgressRule(ecsSecurityGroup, ec2.Port.tcp(5000));


    // Fargateインスタンスのインバウンドルールを設定
    // ALBから5000番ポートへのアクセスを許可  
    ecsSecurityGroup.addIngressRule(albSecurityGroup, ec2.Port.tcp(5000));  

    // Fargateインスタンスのアウトバウンドルールを設定
    // 任意のIPアドレスの443番ポートへのアクセスを許可
    ecsSecurityGroup.addEgressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443));

    
    // ALB を作成
    const alb = new elbv2.ApplicationLoadBalancer(this, 'EcsFlaskApiAlb', {
        loadBalancerName: `${props.stage}-alb-${SUFFIX}`,
        vpc,
        internetFacing: true,
        vpcSubnets: {
            subnetType: ec2.SubnetType.PUBLIC,
        },
    });

    // ALBのターゲットグループを作成
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'EcsFlaskApiTargetGroup', {
        vpc,
        targetGroupName: `${props.stage}-${SUFFIX}`,
        port: 5000,
        targetType: elbv2.TargetType.IP,
        protocol: elbv2.ApplicationProtocol.HTTP,
        healthCheck: {
            path: '/health',  
            enabled: true,
            protocol: elbv2.Protocol.HTTP,
            interval: cdk.Duration.seconds(10),
            healthyHttpCodes: '200',
        },
    });

    // ALBのリスナーを作成
    alb.addListener('Listener', {
        port: 80,
        open: true,
        protocol: elbv2.ApplicationProtocol.HTTP,
        defaultAction: elbv2.ListenerAction.forward([targetGroup]),
    });



    // ECSタスク実行ロールを作成
    const executionRole = new iam.Role(this, 'EcsFlaskApiExecutionRole', {
        assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
        roleName: `${props.stage}-${SUFFIX}-execution-role`,
    });

    executionRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerServiceFullAccess'));
    
    // シークレットの読み取り権限を追加
    secrets.grantRead(executionRole);

    // ECSタスクロールを作成
    const taskRole = new iam.Role(this, 'EcsFlaskApiTaskRole', {
        assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
        roleName: `${props.stage}-${SUFFIX}-task-role`,
    });
    // ECS タスク定義を作成
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'EcsFlaskApiTaskDefinition', {
      family: `${props.stage}-${SUFFIX}`,
      cpu: 256,
      memoryLimitMiB: 512,
      executionRole,
      taskRole
    });

    // ECSタスクのロググループの作成
    const logGroup = new logs.LogGroup(this, 'EcsFlaskApiLogGroup', {
      logGroupName: `/ecs/${props.stage}-${SUFFIX}`,
      retention: logs.RetentionDays.THREE_MONTHS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    taskDefinition.addContainer('EcsFlaskApiContainer', {
      image: ecs.ContainerImage.fromEcrRepository(repository, 'latest'),
      // 環境変数をSecret Managerから取得する
      secrets: {
        'CORRECT_ANSWER': ecs.Secret.fromSecretsManager(secrets),
      },
      // ポートマッピングを設定
      portMappings: [
        {
          containerPort: 5000,
          hostPort: 5000,
        },
      ],
      // ロググループを設定
      logging: ecs.LogDriver.awsLogs({
        logGroup,
        streamPrefix: 'flask-api',
      }),
    });

    // ECSサービスを作成
    const service = new ecs.FargateService(this, 'EcsFlaskApiService', {
      cluster,
      taskDefinition,
      serviceName: SUFFIX,
      desiredCount: 0,
      // サーキットブレーカーを有効にする
      circuitBreaker: {
        rollback: false,
        enable: true,
      },
      // パブリックサブネットに配置される
      assignPublicIp: true,
      // ヘルスチェックのグレースフェール期間を設定
      healthCheckGracePeriod: cdk.Duration.seconds(60),

      // ECS Execでコンテナにアクセスできるようにする
      enableExecuteCommand: true,
    });
    // ECSサービスにALBを紐づけ
    service.attachToApplicationTargetGroup(targetGroup);
  }
}

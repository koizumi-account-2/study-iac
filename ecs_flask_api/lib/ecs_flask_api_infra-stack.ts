import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

interface EcsFlaskApiInfraStackProps extends cdk.StackProps {
    stage: string;
}

export class EcsFlaskApiInfraStack extends cdk.Stack {

    // クラス外から参照できるようにする
    repositoryName: string;
    secretName: string;

    constructor(scope: Construct, id: string, props: EcsFlaskApiInfraStackProps) {
        super(scope, id, props);

        const repository = new ecr.Repository(this, 'EcsFlaskApiRepository', {
            repositoryName: `${props.stage}-flask-api`,
        });

        const secrets = new secretsmanager.Secret(this, 'EcsFlaskApiSecret', {
            secretName: `/flask-api-cdk/${props.stage}/correct_answer`,
        });

        // インスタンス変数の代入
        this.repositoryName = repository.repositoryName;
        this.secretName = secrets.secretName;
    }
}



import * as cdk from "aws-cdk-lib";


export interface SqsTestStackProps extends cdk.StackProps {
    visibilityTimeout: cdk.Duration;
}

export const props: SqsTestStackProps = {
    visibilityTimeout: cdk.Duration.seconds(500), // 300 -> 500
}

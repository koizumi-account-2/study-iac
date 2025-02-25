#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { SqsMultiStack } from '../lib/sqs_multi-stack';
import { environmentProps, Stages } from '../lib/environments';

const app = new cdk.App();
// 全てのスタックを記述する方法
for (const stage of Object.keys(environmentProps) as Stages[]) {
  const environment = environmentProps[stage];
  const env: cdk.Environment = {
    account: environment.account,
    region: environment.region
  };
  new SqsMultiStack(app, `${stage}-SqsMultiStack1`, {
      env: env,
      queueName: `${stage}-queue-1`
  });
  new SqsMultiStack(app, `${stage}-SqsMultiStack2`, {
      env: env,
      queueName: `${stage}-queue-2`
  });
}

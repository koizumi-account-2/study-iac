#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { SqsMultiStack } from '../lib/sqs_multi-stack';
import { environmentProps, Stages } from '../lib/environments';

// 全てのスタックを記述する方法
// for (const stage of Object.keys(environmentProps) as Stages[]) {
//   const environment = environmentProps[stage];
//   const env: cdk.Environment = {
//     account: environment.account,
//     region: environment.region
//   };
//   new SqsMultiStack(app, `${stage}-SqsMultiStack1`, {
//       env: env,
//       queueName: `${stage}-queue-1`
//   });
//   new SqsMultiStack(app, `${stage}-SqsMultiStack2`, {
//       env: env,
//       queueName: `${stage}-queue-2`
//   });
// }

// 環境ごとにスタックを記述する方法
const stage = process.env.STAGE as Stages;
if (!stage) {
  throw new Error('STAGEが指定されていません');
}
const environment = environmentProps[stage];
if (!environment) {
  throw new Error('指定のSTAGEが存在しません');
}

// const env: cdk.Environment = {
//   account: environment.account,
//   region: environment.region
// };

const app = new cdk.App();

// Stageコンストラクタ
const st = new cdk.Stage(app, stage, {
  env: {
    account: environment.account,
    region: environment.region
  }
});

new SqsMultiStack(st, 'SqsMultiStack1', {
  queueName: `${stage}-queue-1`
});

new SqsMultiStack(st, 'SqsMultiStack2', {
  queueName: `${stage}-queue-2`
});

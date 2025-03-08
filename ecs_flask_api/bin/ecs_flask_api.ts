#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Stages, environments } from '../lib/environments';
import { EcsFlaskApiStack } from '../lib/ecs_flask_api-stack';
import { EcsFlaskApiInfraStack } from '../lib/ecs_flask_api_infra-stack';
const stage = process.env.STAGE as Stages;

if (!stage) {
  throw new Error('STAGEが指定されていません');
}

if(!environments[stage]) {
  throw new Error(`${stage}は存在しません`);
}
const env = environments[stage];

const app = new cdk.App();

const st = new cdk.Stage(app, stage,{
  env: {
    account: env.account,
    region: "ap-northeast-1",
  },
});

const infraStack = new EcsFlaskApiInfraStack(st, 'EcsFlaskApiInfraStack', {
  stage,
});

const apiStack = new EcsFlaskApiStack(st, 'EcsFlaskApiStack', {
  stage,
  // インフラスタックで作成したリポジトリ名とシークレット名を渡す
  repositoryName: infraStack.repositoryName,
  secretName: infraStack.secretName,
});
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { VpcCdkStack } from '../lib/vpc-cdk-stack';
import { Stages, environments } from '../lib/environments';
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
    account: env.awsAccountId,
    region: 'ap-northeast-1',
  },
});

new VpcCdkStack(st, 'VpcCdkStack', {
  stage,
  vpcCidr: env.cidr,
  enableNatGateway: env.enableNatGateway,
  oneNatGatewayPerAz: env.oneNatGatewayPerAz,
});
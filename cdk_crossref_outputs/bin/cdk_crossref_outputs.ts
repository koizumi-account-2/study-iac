#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { VpcStack, SecurityGroupStack } from '../lib/cdk_crossref_outputs-stack';

const app = new cdk.App();
const vpcStackName = 'VpcStack';

new VpcStack(app, vpcStackName);
new SecurityGroupStack(app, 'SecurityGroupStack', {
  vpcStackName,
});

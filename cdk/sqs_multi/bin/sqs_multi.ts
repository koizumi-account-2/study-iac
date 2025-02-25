#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { SqsMultiStack } from '../lib/sqs_multi-stack';

const app = new cdk.App();
new SqsMultiStack(app, 'SqsMultiStack1', {
  queueName: 'sqs-multi-queue-1'
});
new SqsMultiStack(app, 'SqsMultiStack2', {
  queueName: 'sqs-multi-queue-2'
});
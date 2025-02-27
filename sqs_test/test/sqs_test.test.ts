import * as cdk from 'aws-cdk-lib';
import { SqsTestStack } from '../lib/sqs_test-stack';
import { props } from '../lib/config';
import { Template } from 'aws-cdk-lib/assertions';

describe('SQS Test', () => {
    const app = new cdk.App();
    const stack = new SqsTestStack(app, 'SqsTestStack', props);
    const template = Template.fromStack(stack);
    it('should match snapshot', () => {
        expect(template.toJSON()).toMatchSnapshot();
    });
});

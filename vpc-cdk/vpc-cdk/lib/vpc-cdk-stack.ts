import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export interface VpcCdkStackProps extends cdk.StackProps {
  stage: string;
  vpcCidr: string;
  enableNatGateway: boolean;
  oneNatGatewayPerAz: boolean;
}


export class VpcCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: VpcCdkStackProps) {
    super(scope, id, props);

    const vpcCidrMask = props.vpcCidr.split('/')[1]; // 10.0.0.0/16 -> 16
    const subnetCidrMask = parseInt(vpcCidrMask) + 4;

    const subnetConfiguration: ec2.SubnetConfiguration[] = [
      {
        name: "Public",
        subnetType: ec2.SubnetType.PUBLIC,
        cidrMask: subnetCidrMask,
      },
      {
        name: "Isolated",
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        cidrMask: subnetCidrMask,
      },...(props.enableNatGateway ? [
        {
          name: "Private",
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: subnetCidrMask,
        }
      ] : []),
    ];

    // 配置するNATゲートウェイの数
    const natGateways = props.enableNatGateway ? (props.oneNatGatewayPerAz ? 1 : 3) : 0;

    new ec2.Vpc(this, 'VPC', {
      vpcName: `${props.stage}-vpc-cdk`,
      ipAddresses: ec2.IpAddresses.cidr(props.vpcCidr),
      subnetConfiguration,
      natGateways,
    })
  }
}
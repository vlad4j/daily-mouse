import {Duration, Stack, StackProps} from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import {Runtime} from "aws-cdk-lib/aws-lambda";
import {LambdaCode} from "./helper/codeHelper";
import {PolicyDocument, PolicyStatement, Role, ServicePrincipal} from "aws-cdk-lib/aws-iam";

export class MouseStack extends Stack {
  private nodeJSLayer: lambda.LayerVersion;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.nodeJSLayer = this.createModeJsLayer();

    this.createMouseLambda();
  }

  private createModeJsLayer() {
    return new lambda.LayerVersion(this, 'CommonLayer', {
      code: LambdaCode.fromDist('layer/nodejs/nodejs.zip'),
      compatibleRuntimes: [lambda.Runtime.NODEJS_16_X],
      description: 'A common lambda layer',
    });
  }

  private createMouseLambda() {
    const functionName = `MouseLambda`;
    const roleName = `${functionName}Role`;

    const lambdaRole = new Role(this, roleName, {
      roleName: `${roleName}-${this.stackName}`,
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      inlinePolicies: {
        logs: new PolicyDocument({
          statements: [new PolicyStatement({
            resources: ['*'],
            actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents']
          })]
        }),
        secrets: new PolicyDocument({
          statements: [new PolicyStatement({
            resources: ['*'],
            actions: ['secretsmanager:GetSecretValue']
          })]
        })
      }
    });

    return new lambda.Function(this, functionName, {
      runtime: Runtime.NODEJS_16_X,
      functionName: `${functionName}-${this.stackName}`,
      code: LambdaCode.fromDist('mouseLambda'),
      handler: 'mouseLambda.handler',
      layers: [this.nodeJSLayer],
      architecture: lambda.Architecture.ARM_64,
      timeout: Duration.minutes(3),
      environment: {
        API_KEYS_SECRET_NAME: 'API_KEYS'
      },
      role: lambdaRole
    });
  }

}

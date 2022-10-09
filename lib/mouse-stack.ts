import {Stack, StackProps} from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import {Runtime} from "aws-cdk-lib/aws-lambda";
import {LambdaCode} from "./helper/codeHelper";

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
    let functionName = `MouseLambda`;
    return new lambda.Function(this, functionName, {
      runtime: Runtime.NODEJS_16_X,
      functionName: `${functionName}-${this.stackName}`,
      code: LambdaCode.fromDist('mouseLambda'),
      handler: 'mouseLambda.handler',
      layers: [this.nodeJSLayer],
      architecture: lambda.Architecture.ARM_64,
      environment: {
        OPENAI_API_KEY: ''
      }
    });
  }

}

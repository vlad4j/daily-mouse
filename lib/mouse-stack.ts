import {Stack, StackProps} from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import {Runtime} from "aws-cdk-lib/aws-lambda";
import {LambdaCode} from "./codeHelper";

export class MouseStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.mouseLambda();
  }

  private mouseLambda() {
    let functionName = `MouseLambda`;
    return new lambda.Function(this, functionName, {
      runtime: Runtime.NODEJS_16_X,
      functionName: `${functionName}-${this.stackName}`,
      code: LambdaCode.fromDist(''),
      handler: 'mouseLambda.handler'
    });
  }

}

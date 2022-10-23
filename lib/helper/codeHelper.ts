import {Code} from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';
import {AssetCode} from 'aws-cdk-lib/aws-lambda/lib/code';

export class LambdaCode {
  static fromDist(codePath: string): AssetCode {
    return Code.fromAsset(path.join(__dirname, `../../dist/lib/lambda/${codePath}`));
  }
}

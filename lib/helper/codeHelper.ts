import {AssetCode, Code} from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';

export class LambdaCode {
  static fromDist(codePath: string): AssetCode {
    return Code.fromAsset(path.join(__dirname, `../../dist/lib/lambda/${codePath}`));
  }
}

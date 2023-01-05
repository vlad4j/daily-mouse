import {Duration, Stack, StackProps} from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import {Architecture, Runtime} from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import {BucketEncryption} from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import {Construct} from 'constructs';
import {LambdaCode} from './helper/codeHelper';
import {PolicyDocument, PolicyStatement, Role, ServicePrincipal} from 'aws-cdk-lib/aws-iam';
import {Rule, RuleTargetInput, Schedule} from 'aws-cdk-lib/aws-events';
import {LambdaFunction} from 'aws-cdk-lib/aws-events-targets';
import ImageGeneratorType from './lambda/mouseLambda/types/ImageGeneratorType';

export class MouseStack extends Stack {
  private nodeJSLayer: lambda.LayerVersion;
  private mouseLambda: lambda.IFunction;
  private readonly bucketName: string = 'mice-pictures';
  private readonly dynamoTableName: string = 'mice-pictures';

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.nodeJSLayer = this.createModeJsLayer();

    this.mouseLambda = this.createMouseLambda();

    const miceBucket = new s3.Bucket(this, this.bucketName, {
      bucketName: this.bucketName,
      versioned: false,
      encryption: BucketEncryption.UNENCRYPTED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });
    miceBucket.grantReadWrite(this.mouseLambda);

    const dynamoTable = new dynamodb.Table(this, 'Table', {
      tableName: this.dynamoTableName,
      partitionKey: {name: 'PK', type: dynamodb.AttributeType.STRING},
      sortKey: {name: 'SK', type: dynamodb.AttributeType.STRING}
    });
    dynamoTable.grantReadWriteData(this.mouseLambda);

    this.createMousePostRule();
  }

  private createMousePostRule() {
    const lambdaTarget = new LambdaFunction(this.mouseLambda, {
      maxEventAge: Duration.hours(2),
      event: RuleTargetInput.fromObject({generator: ImageGeneratorType.DEEP_AI}),
      retryAttempts: 1
    });

    new Rule(this, 'ScheduleRule', {
      schedule: Schedule.cron({minute: '0', hour: '9'}),
      targets: [lambdaTarget],
    });
  }

  private createModeJsLayer() {
    return new lambda.LayerVersion(this, 'CommonLayer', {
      code: LambdaCode.fromDist('layer/nodejs/nodejs.zip'),
      compatibleRuntimes: [lambda.Runtime.NODEJS_16_X],
      compatibleArchitectures: [Architecture.ARM_64],
      description: 'A common lambda layer'
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
        API_KEYS_SECRET_NAME: 'API_KEYS',
        DYNAMO_TABLE: this.dynamoTableName,
        S3_BUCKET: this.bucketName
      },
      role: lambdaRole
    });
  }

}

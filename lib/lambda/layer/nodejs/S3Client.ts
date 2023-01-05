import * as AWS from 'aws-sdk';

class S3Client {
  private s3: AWS.S3;

  constructor() {
    this.s3 = new AWS.S3();
  }

  async uploadFile(bucket: string, key: string, file: ArrayBuffer): Promise<any> {
    return this.s3.upload({
      Bucket: bucket,
      Key: key,
      Body: file
    }).promise()
  }

}

const client = new S3Client();
export default client;

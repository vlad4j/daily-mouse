import * as AWS from 'aws-sdk';

class DynamoClient {
  private dynamo: AWS.DynamoDB.DocumentClient;

  constructor() {
    this.dynamo = new AWS.DynamoDB.DocumentClient();
  }

  async putItem(tableName: string, PK: string, SK: string, item: any): Promise<any> {
    return this.dynamo.put({TableName: tableName, Item: {PK, SK, ...item}}).promise();
  }

  async getItem(tableName: string, PK: string, SK: string): Promise<any> {
    const result = await this.dynamo.get({TableName: tableName, Key: {PK, SK}}).promise();
    return result.Item;
  }

}

const client = new DynamoClient();
export default client;

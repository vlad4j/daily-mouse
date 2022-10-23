import * as AWS from 'aws-sdk';

class SecretClient {
  private secretManager: AWS.SecretsManager;

  constructor() {
    this.secretManager = new AWS.SecretsManager();
  }

  async getSecret(secretName: string): Promise<Record<string, string>> {
    return new Promise((resolve, reject) => {
      this.secretManager.getSecretValue({SecretId: secretName}, (err, data) => {
        if (err) {
          reject(err);
          return;
        }

        let secretString;
        if ('SecretString' in data) {
          secretString = data.SecretString;
        } else {
          const buff = new Buffer(data.SecretBinary as any, 'base64');
          secretString = buff.toString('ascii');
        }
        resolve(JSON.parse(secretString as any));
      });
    })
  }
}

const client = new SecretClient();
export default client;

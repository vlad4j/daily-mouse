import {Configuration, OpenAIApi} from "openai";
import Logger from "/opt/nodejs/Logger";
import SecretClient from "/opt/nodejs/SecretClient";

const OPEN_API_KEY_SECRET = 'OPENAI_API_KEY';

export const handler = async (event: any) => {
    Logger.info('Event:', event);
    const secret = await SecretClient.getSecret(process.env.API_KEYS_SECRET_NAME!);

    const configuration = new Configuration({
        apiKey: secret[OPEN_API_KEY_SECRET],
    });

    const openai = new OpenAIApi(configuration);
    const response = await openai.createCompletion({
        model: "text-davinci-002",
        prompt: "get me a sentence with a mouse",
        temperature: 0.7,
        max_tokens: 256,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
    });

    const choice = response.data?.choices?.[0];
    Logger.info('Response', choice);

    const resultMessage = choice?.text || '';
    return {
        message: resultMessage.trim()
    }
};


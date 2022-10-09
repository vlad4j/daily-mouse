import {Configuration, OpenAIApi} from "openai";
import Logger from "/opt/nodejs/Logger";

export const handler = async (event: any) => {
    Logger.info('Event:', event);

    const configuration = new Configuration({
        apiKey: process.env.OPENAI_API_KEY,
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

    Logger.info('response', response);
    Logger.info('response JSON', JSON.stringify(response.data));

    return {
        response
    }
};


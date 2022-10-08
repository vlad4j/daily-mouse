import {Configuration, OpenAIApi} from "openai";

export const handler = async (event: any) => {
    console.log('Event:', event);

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

    return {
        response
    }
};


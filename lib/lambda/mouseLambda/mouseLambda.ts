import {Configuration, OpenAIApi} from "openai";
import Logger from "/opt/nodejs/Logger";
import SecretClient from "/opt/nodejs/SecretClient";
import {TwitterApi} from 'twitter-api-v2';

const deepai = require('deepai');
const axios = require('axios');

const OPENAI_API_KEY = 'OPENAI_API_KEY';
const DEEPAI_API_KEY = 'DEEPAI_API_KEY';
const TWITTER_APP_KEY = 'TWITTER_APP_KEY';
const TWITTER_APP_SECRET = 'TWITTER_APP_SECRET';
const TWITTER_ACCESS_TOKEN = 'TWITTER_ACCESS_TOKEN';
const TWITTER_ACCESS_SECRET = 'TWITTER_ACCESS_SECRET';


const downloadImage = async (url: string): Promise<Buffer> => {
    const imageResponse = await axios.get(url,  { responseType: 'arraybuffer' })
    return Buffer.from(imageResponse.data, 'binary');
};

const postATweet = async (secret: any, tweetText: string, imageUrl: string) => {
    const image = await downloadImage(imageUrl);

    const twitterClient = new TwitterApi({
        appKey: secret[TWITTER_APP_KEY],
        appSecret: secret[TWITTER_APP_SECRET],
        accessToken: secret[TWITTER_ACCESS_TOKEN],
        accessSecret: secret[TWITTER_ACCESS_SECRET],
    });
    const client = twitterClient.readWrite;

    const mediaIds = await Promise.all([client.v1.uploadMedia(image, { type: 'jpg' })]);
    await client.v1.tweet(tweetText, { media_ids: mediaIds });
};

export const handler = async (event: any) => {
    Logger.info('Event:', event);
    const secret = await SecretClient.getSecret(process.env.API_KEYS_SECRET_NAME!);

    deepai.setApiKey(secret[DEEPAI_API_KEY]);
    const configuration = new Configuration({
        apiKey: secret[OPENAI_API_KEY],
    });

    const openai = new OpenAIApi(configuration);
    const response = await openai.createCompletion({
        model: "text-davinci-002",
        prompt: "generate a random situation with a mouse.",
        temperature: 0.7,
        max_tokens: 256,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
    });

    const choice = response.data?.choices?.[0];
    Logger.info('Response', choice);

    const mouseContextSentence = choice?.text?.trim() || '';

    const resp = await deepai.callStandardApi("text2img", {text: mouseContextSentence});
    Logger.info('DeepAI response:', resp);
    const imageUrl = resp.output_url;

    await postATweet(secret, `Generated with Stable Diffusion.\n\nContext: ${mouseContextSentence}`, imageUrl);

    return {
        mouseContextSentence,
        imageUrl
    }
};


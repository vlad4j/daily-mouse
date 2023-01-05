import {Configuration, OpenAIApi} from 'openai';
import Logger from '/opt/nodejs/Logger';
import SecretClient from '/opt/nodejs/SecretClient';
import S3Client from '/opt/nodejs/S3Client';
import {TwitterApi} from 'twitter-api-v2';
import dynamoClient from '/opt/nodejs/DynamoClient';
import ImageGeneratorType from './types/ImageGeneratorType';

const deepai = require('deepai');
const axios = require('axios');
const sharp = require('sharp');
const {v4: uuidv4} = require('uuid');

const OPENAI_API_KEY = 'OPENAI_API_KEY';
const DEEPAI_API_KEY = 'DEEPAI_API_KEY';
const TWITTER_APP_KEY = 'TWITTER_APP_KEY';
const TWITTER_APP_SECRET = 'TWITTER_APP_SECRET';
const TWITTER_ACCESS_TOKEN = 'TWITTER_ACCESS_TOKEN';
const TWITTER_ACCESS_SECRET = 'TWITTER_ACCESS_SECRET';

interface GeneratedImage {
  image: Buffer;
  artifacts: { url: string | null, image: Buffer, imageFileExtension: string }[]
}

const getPrompt = (): string => {
  const prompts = [
    'generate a random situation with a mouse limited to 250 characters.',
    `Topic: Mouse
Two-sentence story:`,
    `Topic: Mouse in a wild
Two-sentence story:`,
    `Topic: Home mouse
One-sentence story:`
  ];

  const rnd = Math.floor(Math.random() * prompts.length);
  return prompts[rnd]
};

export const getMouseContext = async (openai: OpenAIApi) => {
  const prompt = getPrompt();
  Logger.info('Retrieving mouse context from prompt:', prompt);
  const response = await openai.createCompletion({
    model: 'text-davinci-002',
    prompt: prompt,
    temperature: 0.8,
    max_tokens: 50,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  });

  const choice = response.data?.choices?.[0];
  const context = choice?.text?.trim() || '';
  Logger.info('Mouse context', context);
  return {prompt, context};
}

const getFileExtension = (imageUrl: string): string => imageUrl.split(/[#?]/)[0]?.split('.').pop()?.trim() || 'unknown';

const downloadImage = async (url: string): Promise<Buffer> => {
  const imageResponse = await axios.get(url, {responseType: 'arraybuffer'})
  return Buffer.from(imageResponse.data, 'binary');
};

const postATweet = async (secret: Record<string, string>, tweetText: string, image: Buffer) => {
  const twitterClient = new TwitterApi({
    appKey: secret[TWITTER_APP_KEY],
    appSecret: secret[TWITTER_APP_SECRET],
    accessToken: secret[TWITTER_ACCESS_TOKEN],
    accessSecret: secret[TWITTER_ACCESS_SECRET],
  });
  const client = twitterClient.readWrite;

  const mediaIds = await Promise.all([client.v1.uploadMedia(image, {type: 'jpg'})]);
  await client.v1.tweet(tweetText, {media_ids: mediaIds});
};

const getTodayDate = (): string => {
  const dateTimeFormat = new Intl.DateTimeFormat('en', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'UTC'
  });
  const [{value: day}, , {value: month}, , {value: year}] = dateTimeFormat.formatToParts(new Date());
  return `${year}-${month}-${day}`;
};

const getDeepAIImage = async (generatorType: string, context: string): Promise<GeneratedImage> => {
  const resp = await deepai.callStandardApi(generatorType, {text: context});
  Logger.info('DeepAI response:', resp);
  const url = resp.output_url;
  const image = await downloadImage(url);

  return {
    image,
    artifacts: [{image, url, imageFileExtension: getFileExtension(url)}]
  };
}

const getOpenAIImage = async (openai: OpenAIApi, context: string): Promise<GeneratedImage> => {
  const response = await openai.createImage({
    prompt: context,
    n: 4,
    size: '512x512',
  });

  Logger.info('DALL-E response:', JSON.stringify(response.data));

  const images = await Promise.all(response.data.data.map(async ({url}: any) => {
    const image = await downloadImage(url);
    return {image, url, imageFileExtension: getFileExtension(url)};
  }))

  const corners = ['northwest', 'northeast', 'southwest', 'southeast'];
  const imagesToCompose = corners.map((gravity, i) => ({input: images[i].image, gravity}));
  const composed = await sharp({create: {width: 1024, height: 1024, channels: 3, background: '#FFF'}})
    .composite(imagesToCompose)
    .jpeg({quality: 100, chromaSubsampling: '4:4:4'})
    .toBuffer();

  return {
    image: composed,
    artifacts: [
      ...images,
      {image: composed, url: null, imageFileExtension: 'jpg'}
    ]
  };
}

const generateImage = async (generator: ImageGeneratorType, context: string, openai: OpenAIApi): Promise<GeneratedImage> => {
  switch (generator) {
  case ImageGeneratorType.DEEP_AI:
    return getDeepAIImage('text2img', context);
  case ImageGeneratorType.DEEP_AI_PIXEL:
    return getDeepAIImage('pixel-art-generator', context);
  case ImageGeneratorType.DEEP_AI_OLD:
    return getDeepAIImage('old-style-generator', context);
  case ImageGeneratorType.DALL_E:
    return getOpenAIImage(openai, context);
  default:
    throw new Error('Invalid generation type');
  }
}

const getGeneratorName = (generator: ImageGeneratorType): string => {
  switch (generator) {
  case ImageGeneratorType.DEEP_AI:
    return 'Stable Diffusion';
  case ImageGeneratorType.DEEP_AI_PIXEL:
    return 'Stable Diffusion pixel art';
  case ImageGeneratorType.DEEP_AI_OLD:
    return 'Stable Diffusion old style';
  case ImageGeneratorType.DALL_E:
    return 'DALL·E 2';
  default:
    throw new Error('Invalid generation type');
  }
}

export const handler = async (event: any) => {
  const {generator} = event;
  const today = getTodayDate();
  Logger.info('Event:', event);
  const secret = await SecretClient.getSecret(process.env.API_KEYS_SECRET_NAME!);

  deepai.setApiKey(secret[DEEPAI_API_KEY]);
  const configuration = new Configuration({
    apiKey: secret[OPENAI_API_KEY],
  });

  const openai = new OpenAIApi(configuration);
  const {context: mouseContextSentence, prompt} = await getMouseContext(openai);

  const generatedImage = await generateImage(generator, mouseContextSentence, openai);

  const s3UploadPromises = generatedImage.artifacts.map(async ({image, url, imageFileExtension}) => {
    const s3Key = `/${today}/${uuidv4()}.${imageFileExtension}`;
    await S3Client.uploadFile(process.env.S3_BUCKET!, s3Key, image);
    return {s3Key, url};
  });
  const s3Artifacts = await Promise.all(s3UploadPromises);

  await dynamoClient.putItem(process.env.DYNAMO_TABLE!, `mice#${today}`, new Date().getTime().toString(), {
    generator,
    prompt,
    context: mouseContextSentence,
    artifacts: s3Artifacts
  });

  await postATweet(secret, `${getGeneratorName(generator)}.\n\nContext: ${mouseContextSentence}`, generatedImage.image);

  return {
    mouseContextSentence,
    artifacts: s3Artifacts
  }
};


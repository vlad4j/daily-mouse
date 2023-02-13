# Daily mouse pictures generator

Generates and posts mouse pictures to the [@DailyDeepMouse](https://twitter.com/DailyDeepMouse) twitter account.

Project consists of a single lambda which generates pictures with a randomly generated text prompt.
Text prompts are generated using OpenAI GPT 3.0.
Mouse images are generated using DALL-E and StableDiffusion.
StableDiffusion is provided by DeepAI API.

## Project configuration

Create a Secret in `AWS Secret Manager` with name `API_KEYS` and secret values:
- `OPENAI_API_KEY` - OpenAI API key
- `DEEPAI_API_KEY` - DeepAI API key
- `TWITTER_APP_KEY` - Obtained on Twitter Developer Portal
- `TWITTER_APP_SECRET` - Obtained on Twitter Developer Portal
- `TWITTER_ACCESS_TOKEN` - Obtained on Twitter Developer Portal
- `TWITTER_ACCESS_SECRET` - Obtained on Twitter Developer Portal

> Note: AWS Secret Manager secrets should be stored in the same account as in lambda

## Deployment
> Make sure that your awscli is configured before deployment.
> To configure awscli run:
> `aws configure`
> 
> Please note that default awscli region will be used as deployment region

* `npm run build`   compile typescript to js
* `npm run deploy`   generate CloudFormation template and deploy
import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  PORT: Joi.number().required(),

  APP_NAME: Joi.string().required(),

  MONGO_URI: Joi.string().required(),

  JWT_SECRET: Joi.string().required(),

  JWT_EXPIRES: Joi.string().required(),

  LANGGRAPH_URL: Joi.string().required(),
});

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

  LOG_HTTP_REQUEST_BODY: Joi.boolean().default(false),

  LOG_HTTP_RESPONSE_BODY: Joi.boolean().default(false),

  LOG_HTTP_MAX_BODY_LENGTH: Joi.number()
    .integer()
    .min(500)
    .max(50000)
    .default(4000),
});

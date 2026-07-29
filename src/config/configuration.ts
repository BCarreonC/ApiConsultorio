export default () => ({
  app: {
    name: process.env.APP_NAME,
    port: parseInt(process.env.PORT || '3000', 10),
    env: process.env.NODE_ENV,
  },

  database: {
    uri: process.env.MONGO_URI,
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    expires: process.env.JWT_EXPIRES,
  },

  ai: {
    url: process.env.LANGGRAPH_URL,
  },

  logging: {
    httpRequestBody: process.env.LOG_HTTP_REQUEST_BODY === 'true',
    httpResponseBody: process.env.LOG_HTTP_RESPONSE_BODY === 'true',
    httpMaxBodyLength: parseInt(
      process.env.LOG_HTTP_MAX_BODY_LENGTH || '4000',
      10,
    ),
  },
});

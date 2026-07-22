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
});

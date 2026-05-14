module.exports = ({ config }) => ({
  ...config,
  web: {
    ...config.web,
    publicPath: process.env.PAGES_BASE_URL || '/',
  },
});

module.exports = ({ config }) => ({
  ...config,
  experiments: {
    ...config.experiments,
    baseUrl: process.env.PAGES_BASE_URL || '',
  },
});

export const testConfig: EnvConfig = {
  database: {
    url: 'sqlite::memory:',
    logging: false,
  },
  features: {
    enableDebugRoutes: false,
  },
};

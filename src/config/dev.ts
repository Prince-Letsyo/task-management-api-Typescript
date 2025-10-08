
export const devConfig: EnvConfig = {
  database: {
    url: "postgresql://localhost:5432/dev_db",
    logging: true,
  },
  features: {
    enableDebugRoutes: true,
  },
};

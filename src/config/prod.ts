// src/config/prod.js
import "dotenv/config"

export const prodConfig: EnvConfig = {
  database: {
    url: process.env.DB_URL,
    logging: false,
  },
  features: {
    enableDebugRoutes: false,
  },
};
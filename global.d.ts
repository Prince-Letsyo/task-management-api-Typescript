declare global {
    type EnvConfig = {
        database: {
            url?: string;
            logging: boolean;
        };
        features: {
            enableDebugRoutes: boolean;
        };
    }
    type BaseConfig = {
        appName: string;
        enableCORS: boolean;
        logLevel: "debug" | "info" | "warn" | "error";
    }

    interface EnvironmentConfig extends BaseConfig {
        database: {
            url?: string;
            logging: boolean;
        };
        features: {
            enableDebugRoutes: boolean;
        };
    }
    namespace Express {
        interface Request {
            validatedBody?: any;
        }
    }
}


export { }
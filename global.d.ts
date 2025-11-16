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
        cacheKey: string;
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
            reqId?:string;
            // user?: { username: string, email: string }
        }
    }

}
declare module 'express-session' {
    interface SessionData {
        userId?: number;
        username?: string;
        email?: string;
        role?: string;
        // add any other session fields you use
    }
}

export { }
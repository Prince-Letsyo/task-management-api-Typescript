import { type Env, envSchema } from "../env";
import { baseConfig } from "./base";
import { devConfig } from "./dev";
import { prodConfig } from "./prod";
import { testConfig } from "./test";

const envConfigs = {
    development: devConfig,
    production: prodConfig,
    test: testConfig,
} as const;



export class ConfigService {
    private static instance: ConfigService;
    private readonly env: Env;
    private readonly config: BaseConfig & EnvironmentConfig & { env: Env };

    private constructor() {
        // Validate environment variables once
        const parsed = envSchema.safeParse(process.env);

        if (!parsed.success) {
            console.error("❌ Invalid environment variables:", parsed.error.format());
            process.exit(1);
        }

        this.env = parsed.data;
        const envConfig = envConfigs[this.env.NODE_ENV];

        // Merge all configs with base
        this.config = {
            ...baseConfig,
            ...envConfig,
            env: this.env,
        };
    }

    // Singleton pattern
    public static getInstance(): ConfigService {
        if (!ConfigService.instance) {
            ConfigService.instance = new ConfigService();
        }
        return ConfigService.instance;
    }

    // Accessors
    public get<T extends keyof typeof this.config>(key: T): (typeof this.config)[T] {
        return this.config[key];
    }

    public getEnv<T extends keyof Env>(key: T): Env[T] {
        return this.env[key];
    }

    public all(): typeof this.config {
        return this.config;
    }
}
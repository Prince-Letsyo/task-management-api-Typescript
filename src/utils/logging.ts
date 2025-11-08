import fs from "fs";
import path from "path";
import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import { config } from "../config";

const logDir = path.join(__dirname, "../../logs");
const isDev = ["development", "test"].includes(config.env.NODE_ENV);

// Ensure logs directory exists
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

// Define regex patterns for sensitive keys
const PASSWORD_PATTERN = /\b[Pp][Aa][Ss][Ss][Ww][Oo][Rr][Dd]\b/;
const TOKEN_PATTERN = /\b(token|api_key|secret|auth)\b/i;

export function filterSensitive(data: Record<string, any> | string): Record<string, any> | string {
    if (typeof data === "object" && data !== null) {
        const clone: Record<string, any> = { ...data };
        for (const key of Object.keys(clone)) {
            if (PASSWORD_PATTERN.test(key)) {
                clone[key] = "***";
            } else if (TOKEN_PATTERN.test(key)) {
                clone[key] = "[REDACTED]";
            }
        }
        return clone;
    }
    return data;
}

// Create Winston logger
const logger = winston.createLogger({
    level: isDev ? "debug" : "info",
    format: winston.format.combine(
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        winston.format.errors({ stack: true }),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
            return `${timestamp} | ${level.toUpperCase()} | ${JSON.stringify(meta)} | ${message}`;
        })
    ),
    transports: [
        // Human-readable rotating log file
        new DailyRotateFile({
            dirname: logDir,
            filename: "app-%DATE%.log",
            datePattern: "YYYY-MM-DD",
            zippedArchive: true,
            maxSize: "10m",
            maxFiles: "7d",
        }),

        // JSON structured log file
        new DailyRotateFile({
            dirname: logDir,
            filename: "json-%DATE%.log",
            datePattern: "YYYY-MM-DD",
            zippedArchive: true,
            maxSize: "10m",
            maxFiles: "7d",
            format: winston.format.json(),
        }),

        // Console for dev mode
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            ),
        }),
    ],
});

// Helper to attach contextual data easily
const appLogger = {
    info: (message: string, meta: Record<string, any> = {}) => logger.info(message, meta),
    error: (message: string, meta: Record<string, any> = {}) => logger.error(message, meta),
    debug: (message: string, meta: Record<string, any> = {}) => logger.debug(message, meta),
    warn: (message: string, meta: Record<string, any> = {}) => logger.warn(message, meta),
};

export default appLogger;

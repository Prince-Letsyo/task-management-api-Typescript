import zxcvbn from 'zxcvbn';
import argon2 from "argon2";

export class PasswordValidator {
    private minScore = 2;
    private maxSimilarity = 0.8;
    private commonPasswords = new Set([
        "password",
        "123456",
        "qwerty",
        "admin",
        "letmein",
    ]);

    private normalize(str: string): string {
        return str.toLowerCase().replace(/\s+/g, "");
    }

    private calculateSimilarity(a: string, b: string): number {
        const normA = this.normalize(a);
        const normB = this.normalize(b);
        if (!normA.length || !normB.length) return 0;

        const minLen = Math.min(normA.length, normB.length);
        const maxLen = Math.max(normA.length, normB.length);

        if (normA.includes(normB) || normB.includes(normA)) return minLen / maxLen;

        let commonChars = 0;
        for (let i = 0; i < minLen; i++) {
            if (normA[i] === normB[i]) commonChars++;
        }
        return commonChars / maxLen;
    }

    validate(password: string, username: string, email: string) {
        const errors: string[] = [];
        const strength = zxcvbn(password);

        if (strength.score < this.minScore) {
            const labels = ["very weak", "weak", "good", "strong", "very strong"];
            const label = labels[strength.score] ?? "unknown";
            const suggestion = strength.feedback.suggestions[0] ?? "Use a stronger password";
            errors.push(`Password is too weak (${label}). Suggestion: ${suggestion}`);
        }

        const similarityUsername = this.calculateSimilarity(password, username);
        const similarityEmail = this.calculateSimilarity(password, email.split("@")[0]);

        if (similarityUsername > this.maxSimilarity) {
            errors.push(`Password is too similar to username (${(similarityUsername * 100).toFixed(0)}%)`);
        }
        if (similarityEmail > this.maxSimilarity) {
            errors.push(`Password is too similar to email (${(similarityEmail * 100).toFixed(0)}%)`);
        }

        if (this.commonPasswords.has(password.toLowerCase())) {
            errors.push("Password is too common");
        }

        return {
            isValid: errors.length === 0,
            errors,
            score: strength.score,
            feedback: strength.feedback,
            similarityUsername,
            similarityEmail,
        };
    }

    async getPasswordHash(password: string): Promise<string> {
        return argon2.hash(password);
    }

    async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
        return argon2.verify(hashedPassword, plainPassword);
    }
}

// Global instance
export const passwordValidator = new PasswordValidator();

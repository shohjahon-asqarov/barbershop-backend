/**
 * Environment variables validation
 * Ensures all required env variables are present before app startup
 */

const requiredEnvVars = ["DATABASE_URL", "JWT_SECRET"] as const;

const optionalEnvVars = {
  PORT: 5000,
  NODE_ENV: "development",
  CORS_ORIGIN: "http://localhost:3000",
  JWT_EXPIRES_IN: "7d",
  UPLOAD_MAX_SIZE: "10485760", // 10MB
  UPLOAD_PATH: "./uploads",
} as const;

export const validateEnv = () => {
  const missing: string[] = [];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}\n` +
        "Please set them in your .env file or environment."
    );
  }

  // Warn about production settings
  if (process.env.NODE_ENV === "production") {
    if (process.env.JWT_SECRET === "fallback-secret-change-in-production") {
      console.warn(
        "⚠️  WARNING: Using default JWT_SECRET in production! Please change it!"
      );
    }

    if (!process.env.CORS_ORIGIN) {
      console.warn(
        "⚠️  WARNING: CORS_ORIGIN not set in production! Defaulting to localhost."
      );
    }
  }

  console.log("✅ Environment variables validated");
};

// Set defaults for optional vars
for (const [key, defaultValue] of Object.entries(optionalEnvVars)) {
  if (!process.env[key]) {
    process.env[key] = String(defaultValue);
  }
}

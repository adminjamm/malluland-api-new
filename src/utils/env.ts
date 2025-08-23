import { z } from "zod";
import "dotenv/config";

const firebaseConfigSchema = z.object({
  type: z.string().min(1),
  project_id: z.string().min(1),
  private_key_id: z.string().min(1),
  private_key: z.string().min(1),
  client_email: z.string().min(1),
  client_id: z.string().min(1),
  auth_uri: z.string().min(1),
  token_uri: z.string().min(1),
  auth_provider_x509_cert_url: z.string().min(1),
  client_x509_cert_url: z.string().min(1),
  universe_domain: z.string().min(1),
});

const schema = z.object({
  DATABASE_URL: z.string().url(),
  NODE_ENV: z.enum(["development", "production"]),
  PORT: z.coerce.number().int().positive().optional(),
  KRAKEN_API_KEY: z.string().optional(),
  KRAKEN_API_SECRET: z.string().optional(),
  // Optional JSON string for Kraken's s3_store payload; if provided, it should be a valid JSON object
  KRAKEN_S3_STORE_JSON: z.string().optional(),
  // Default image optimization quality (40 per legacy helper)
  KRAKEN_DEFAULT_QUALITY: z.coerce.number().int().min(1).max(100).optional(),
  AUTH_CALLBACK_URL: z.string().url(),
  JWT_SECRET: z.string(),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  GOOGLE_REDIECT_URL: z.string(),
  APPLE_CLIENT_ID: z.string().min(1),
  APPLE_TEAM_ID: z.string().min(1),
  APPLE_KEY_ID: z.string().min(1),
  APPLE_PRIVATE_KEY: z.string().min(1),
  APPLE_REDIRECT_URL: z.string().min(1),
  // AWS S3
  AWS_REGION: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  // LocationIQ
  LOCATIONIQ_API_KEY: z.string().optional(),
  FIREBASE_SERVICE_ACCOUNT: z.string().transform((str) => {
    try {
      const parsed = JSON.parse(str);
      return firebaseConfigSchema.parse(parsed);
    } catch (e) {
      console.log(e);
      throw new Error(`Invalid Firebase config JSON`);
    }
  }),
  FIREBASE_DATABASE_URL: z.string().min(1),
});

const parsed = schema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  KRAKEN_API_KEY: process.env.KRAKEN_API_KEY,
  KRAKEN_API_SECRET: process.env.KRAKEN_API_SECRET,
  KRAKEN_S3_STORE_JSON: process.env.KRAKEN_S3_STORE_JSON,
  KRAKEN_DEFAULT_QUALITY: process.env.KRAKEN_DEFAULT_QUALITY,
  AUTH_CALLBACK_URL: process.env.AUTH_CALLBACK_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIECT_URL: process.env.GOOGLE_REDIECT_URL,
  APPLE_CLIENT_ID: process.env.APPLE_CLIENT_ID,
  APPLE_TEAM_ID: process.env.APPLE_TEAM_ID,
  APPLE_KEY_ID: process.env.APPLE_KEY_ID,
  APPLE_PRIVATE_KEY: process.env.APPLE_PRIVATE_KEY,
  APPLE_REDIRECT_URL: process.env.APPLE_REDIRECT_URL,
  AWS_REGION: process.env.AWS_BUCKET_REGION,
  AWS_ACCESS_KEY_ID: process.env.AWS_BUCKET_ACCESS_KEY,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_BUCKET_SECRET_KEY,
  S3_BUCKET: process.env.AWS_BUCKET_NAME,
  LOCATIONIQ_API_KEY: process.env.LOCATIONIQ_API_KEY,
  FIREBASE_DATABASE_URL: process.env.FIREBASE_DATABASE_URL,
  FIREBASE_SERVICE_ACCOUNT: process.env.FIREBASE_SERVICE_ACCOUNT,
});

export const env = {
  ...parsed,
  get KRAKEN_S3_STORE(): Record<string, unknown> | undefined {
    if (!parsed.KRAKEN_S3_STORE_JSON) return undefined;
    try {
      return JSON.parse(parsed.KRAKEN_S3_STORE_JSON);
    } catch (_) {
      return undefined;
    }
  },
};

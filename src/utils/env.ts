import { z } from 'zod';
import 'dotenv/config';

const schema = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().int().positive().optional(),
  KRAKEN_API_KEY: z.string().optional(),
  KRAKEN_API_SECRET: z.string().optional(),
  // Optional JSON string for Kraken's s3_store payload; if provided, it should be a valid JSON object
  KRAKEN_S3_STORE_JSON: z.string().optional(),
  // Default image optimization quality (40 per legacy helper)
  KRAKEN_DEFAULT_QUALITY: z.coerce.number().int().min(1).max(100).optional(),
});

const parsed = schema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  PORT: process.env.PORT,
  KRAKEN_API_KEY: process.env.KRAKEN_API_KEY,
  KRAKEN_API_SECRET: process.env.KRAKEN_API_SECRET,
  KRAKEN_S3_STORE_JSON: process.env.KRAKEN_S3_STORE_JSON,
  KRAKEN_DEFAULT_QUALITY: process.env.KRAKEN_DEFAULT_QUALITY,
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

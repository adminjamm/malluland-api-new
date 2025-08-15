import { env } from '../utils/env';
import { Service } from 'typedi';

export type KrakenUrlParams = {
  url: string;
  wait?: boolean; // if true, returns optimized result immediately
  lossy?: boolean;
  json?: boolean;
  dev?: boolean;
  auto_orient?: boolean;
  quality?: number; // 1-100
  s3_store?: Record<string, unknown>;
};

export type KrakenOptimizeResponse = {
  id?: string;
  success?: boolean;
  kraked_url?: string;
  error?: string;
  [key: string]: any;
} | null;

function ensureKrakenCreds() {
  if (!env.KRAKEN_API_KEY || !env.KRAKEN_API_SECRET) {
    throw new Error('Kraken credentials are not configured (KRAKEN_API_KEY/KRAKEN_API_SECRET)');
  }
}

@Service()
export class KrakenHelper {
  private readonly apiKey = env.KRAKEN_API_KEY;
  private readonly apiSecret = env.KRAKEN_API_SECRET;
  private readonly defaultQuality = env.KRAKEN_DEFAULT_QUALITY ?? 40;
  private readonly defaultS3Store = env.KRAKEN_S3_STORE;

  private buildPayload(params: KrakenUrlParams) {
    const payload: any = {
      auth: {
        api_key: this.apiKey,
        api_secret: this.apiSecret,
      },
      wait: params.wait ?? true,
      lossy: params.lossy ?? true,
      json: params.json ?? true,
      dev: params.dev ?? false,
      auto_orient: params.auto_orient ?? true,
      quality: params.quality ?? this.defaultQuality,
      url: params.url,
    };
    if (params.s3_store || this.defaultS3Store) {
      payload.s3_store = params.s3_store ?? this.defaultS3Store;
    }
    return payload;
  }

  async sendForOptimization(imageUrl: string): Promise<string | null> {
    ensureKrakenCreds();
    try {
      const payload = this.buildPayload({ url: imageUrl, wait: false });
      const res = await fetch('https://api.kraken.io/v1/url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as any;
      return data?.id ?? null;
    } catch (err) {
      console.error('Kraken sendForOptimization failed', err);
      return null;
    }
  }

  async sendForOptimizationSync(imageUrl: string): Promise<KrakenOptimizeResponse> {
    ensureKrakenCreds();
    try {
      const head = await fetch(imageUrl, { method: 'HEAD' });
      const size = head.headers.get('content-length');
      if (size) {
        const kb = parseInt(size, 10) / 1024;
        if (!Number.isNaN(kb) && kb <= 400) {
          return { kraked_url: '', success: true };
        }
      }
    } catch (error: any) {
      return { kraked_url: '', success: false, error: error?.message || 'HEAD request failed' };
    }

    try {
      const payload = this.buildPayload({ url: imageUrl, wait: true });
      const res = await fetch('https://api.kraken.io/v1/url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as KrakenOptimizeResponse;
      return data ?? null;
    } catch (err) {
      console.error('Kraken sendForOptimizationSync failed', err);
      return null;
    }
  }
}


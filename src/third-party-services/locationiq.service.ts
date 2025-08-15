import { Service } from 'typedi';
import { env } from '../utils/env';

export type ReverseGeocodeResult = {
  city: string | null;
  address: Record<string, any>;
  raw: any;
};

@Service()
export class LocationIqService {
  private readonly apiKey?: string = env.LOCATIONIQ_API_KEY;
  private readonly baseUrl = 'https://us1.locationiq.com/v1/reverse.php';

  private ensureKey() {
    if (!this.apiKey) throw new Error('LOCATIONIQ_API_KEY is not configured');
  }

  async getAddress(lat: number, lng: number): Promise<ReverseGeocodeResult> {
    this.ensureKey();
    const url = `${this.baseUrl}?key=${this.apiKey}&lat=${lat}&lon=${lng}&format=json`;
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`LocationIQ error ${res.status}: ${text}`);
    }
    const data: any = await res.json();

    const addr = data?.address ?? {};
    let city: string | null = addr.city ?? null;
    if (city === null) city = addr.state_district ?? null;
    if (city === null) city = addr.county ?? null;

    return { city, address: addr, raw: data };
  }
}


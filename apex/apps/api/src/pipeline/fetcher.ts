import { logger } from '../config';

const BASE_URL = 'https://api.jolpi.ca/ergast/f1';

export class JolpicaFetcher {
  private async request<T>(endpoint: string, params: Record<string, string | number> = {}): Promise<T> {
    const url = new URL(`${BASE_URL}${endpoint}`);
    Object.entries(params).forEach(([key, val]) => {
      url.searchParams.append(key, String(val));
    });

    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    await sleep(1500); // 1.5 second throttling delay

    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (response.status === 429) {
      logger.warn(`⚠️ Jolpica API Rate Limit Hit (429) on: ${url}`);
      throw new Error(`Rate limit hit: 429`);
    }

    if (!response.ok) {
      logger.error(`❌ Jolpica API Request failed [${response.status}] for: ${url}`);
      throw new Error(`Request failed with status ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  async fetchSeasons(limit = 100, offset = 0): Promise<any> {
    return this.request('/seasons.json', { limit, offset });
  }

  async fetchRaces(season: number): Promise<any> {
    return this.request(`/${season}.json`);
  }

  async fetchResults(season: number, round: number): Promise<any> {
    return this.request(`/${season}/${round}/results.json`);
  }

  async fetchQualifying(season: number, round: number): Promise<any> {
    return this.request(`/${season}/${round}/qualifying.json`);
  }

  async fetchLapTimes(season: number, round: number, limit = 100, offset = 0): Promise<any> {
    return this.request(`/${season}/${round}/laps.json`, { limit, offset });
  }

  async fetchPitStops(season: number, round: number): Promise<any> {
    return this.request(`/${season}/${round}/pitstops.json`, { limit: 100 });
  }
}

import { describe, expect, it } from 'vitest';

import worker from '../index';

const env = {
  SPONSOR_PRIVATE_KEY: 'test-private-key',
  ALLOWED_ORIGINS: [
    'https://civilizationcontrol.com',
    'https://www.civilizationcontrol.com',
    'https://civilizationcontrol.pages.dev',
    'http://localhost:5173',
  ].join(','),
  ALLOWED_ORIGIN_SUFFIXES: '.civilizationcontrol.pages.dev',
};

describe('sponsor worker CORS preflight', () => {
  it.each([
    'https://civilizationcontrol.com',
    'https://www.civilizationcontrol.com',
    'https://civilizationcontrol.pages.dev',
    'https://preview-123.civilizationcontrol.pages.dev',
  ])('allows %s', async (origin) => {
    const request = new Request('https://civilizationcontrol-sponsor.michael-davis-home.workers.dev/sponsor', {
      method: 'OPTIONS',
      headers: { Origin: origin },
    });

    const response = await worker.fetch(request, env);

    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(origin);
    expect(response.headers.get('Access-Control-Allow-Methods')).toBe('POST, OPTIONS');
    expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type, Authorization');
  });

  it('does not echo a disallowed origin', async () => {
    const request = new Request('https://civilizationcontrol-sponsor.michael-davis-home.workers.dev/sponsor', {
      method: 'OPTIONS',
      headers: { Origin: 'https://evil.example.com' },
    });

    const response = await worker.fetch(request, env);

    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('');
  });
});
import { describe, it, expect, beforeEach } from 'vitest';
import { requireLiveWrites } from '../../src/lib/write-guard.js';

describe('requireLiveWrites', () => {
  beforeEach(() => {
    delete process.env.ETSY_ALLOW_LIVE_WRITES;
  });

  it('throws when ETSY_ALLOW_LIVE_WRITES is unset', () => {
    expect(() => requireLiveWrites()).toThrow(/ETSY_ALLOW_LIVE_WRITES/);
  });

  it('throws when ETSY_ALLOW_LIVE_WRITES is false', () => {
    process.env.ETSY_ALLOW_LIVE_WRITES = 'false';
    expect(() => requireLiveWrites()).toThrow(/ETSY_ALLOW_LIVE_WRITES/);
  });

  it('throws when ETSY_ALLOW_LIVE_WRITES is anything other than literal "true"', () => {
    process.env.ETSY_ALLOW_LIVE_WRITES = '1';
    expect(() => requireLiveWrites()).toThrow();
    process.env.ETSY_ALLOW_LIVE_WRITES = 'TRUE';
    expect(() => requireLiveWrites()).toThrow();
    process.env.ETSY_ALLOW_LIVE_WRITES = 'yes';
    expect(() => requireLiveWrites()).toThrow();
  });

  it('returns silently when ETSY_ALLOW_LIVE_WRITES="true"', () => {
    process.env.ETSY_ALLOW_LIVE_WRITES = 'true';
    expect(() => requireLiveWrites()).not.toThrow();
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AxiosInstance } from 'axios';
import { tools, handlers } from '../../src/handlers/return-policies.js';

const mockAxios = (): AxiosInstance => ({
  get: vi.fn().mockResolvedValue({ data: {} }),
  post: vi.fn().mockResolvedValue({ data: {} }),
} as unknown as AxiosInstance);

describe('handlers/return-policies', () => {
  beforeEach(() => {
    delete process.env.ETSY_ALLOW_LIVE_WRITES;
  });

  it('exports getShopReturnPolicies + createShopReturnPolicy', () => {
    expect(tools.find((t) => t.name === 'getShopReturnPolicies')).toBeDefined();
    expect(tools.find((t) => t.name === 'createShopReturnPolicy')).toBeDefined();
  });

  it('getShopReturnPolicies GETs /shops/{id}/policies/return', async () => {
    const ax = mockAxios();
    await handlers.getShopReturnPolicies({ shop_id: '38798384' }, ax);
    expect(ax.get).toHaveBeenCalledWith('/application/shops/38798384/policies/return');
  });

  it('createShopReturnPolicy refuses without ETSY_ALLOW_LIVE_WRITES', async () => {
    const ax = mockAxios();
    await expect(
      handlers.createShopReturnPolicy(
        { shop_id: '38798384', accepts_returns: true, accepts_exchanges: true, return_deadline: 30 },
        ax,
      ),
    ).rejects.toThrow(/ETSY_LIVE_WRITES_DISABLED/);
    expect(ax.post).not.toHaveBeenCalled();
  });

  it('createShopReturnPolicy POSTs when env enabled', async () => {
    process.env.ETSY_ALLOW_LIVE_WRITES = 'true';
    const ax = mockAxios();
    await handlers.createShopReturnPolicy(
      { shop_id: '38798384', accepts_returns: true, accepts_exchanges: false, return_deadline: 14 },
      ax,
    );
    expect(ax.post).toHaveBeenCalled();
    const call = (ax.post as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[0]).toBe('/application/shops/38798384/policies/return');
    // form-encoded body string
    expect(typeof call[1]).toBe('string');
    expect(call[1]).toContain('accepts_returns=true');
    expect(call[1]).toContain('accepts_exchanges=false');
    expect(call[1]).toContain('return_deadline=14');
  });
});

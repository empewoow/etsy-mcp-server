import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AxiosInstance } from 'axios';
import { tools, handlers } from '../../src/handlers/shop.js';

const mockAxios = (): AxiosInstance => ({
  get: vi.fn().mockResolvedValue({ data: {} }),
  put: vi.fn().mockResolvedValue({ data: {} }),
} as unknown as AxiosInstance);

describe('handlers/shop — Tier 3 additions', () => {
  beforeEach(() => {
    delete process.env.ETSY_ALLOW_LIVE_WRITES;
  });

  it('exports all Tier 3 shop tools', () => {
    for (const n of [
      'getShopShippingProfiles',
      'getHolidayPreferences',
      'updateHolidayPreferences',
      'getShopByOwnerUserId',
      'getShippingCarriers',
    ]) {
      expect(tools.find((t) => t.name === n), `missing ${n}`).toBeDefined();
    }
  });

  it('getShopShippingProfiles GETs the right path', async () => {
    const ax = mockAxios();
    await handlers.getShopShippingProfiles({ shop_id: '38798384' }, ax);
    expect(ax.get).toHaveBeenCalledWith('/application/shops/38798384/shipping-profiles');
  });

  it('getHolidayPreferences GETs the right path', async () => {
    const ax = mockAxios();
    await handlers.getHolidayPreferences({ shop_id: '38798384' }, ax);
    expect(ax.get).toHaveBeenCalledWith('/application/shops/38798384/holiday-preferences');
  });

  it('updateHolidayPreferences refuses without env', async () => {
    const ax = mockAxios();
    await expect(
      handlers.updateHolidayPreferences(
        { shop_id: '38798384', holiday_id: '42', is_enabled: true },
        ax,
      ),
    ).rejects.toThrow(/ETSY_LIVE_WRITES_DISABLED/);
  });

  it('updateHolidayPreferences PUTs when env enabled', async () => {
    process.env.ETSY_ALLOW_LIVE_WRITES = 'true';
    const ax = mockAxios();
    await handlers.updateHolidayPreferences(
      { shop_id: '38798384', holiday_id: '42', is_enabled: true },
      ax,
    );
    const call = (ax.put as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[0]).toBe('/application/shops/38798384/holiday-preferences/42');
    expect(call[1]).toContain('is_enabled=true');
  });

  it('getShopByOwnerUserId GETs /users/{user_id}/shops', async () => {
    const ax = mockAxios();
    await handlers.getShopByOwnerUserId({ user_id: '703230242' }, ax);
    expect(ax.get).toHaveBeenCalledWith('/application/users/703230242/shops');
  });

  it('getShippingCarriers GETs /shipping-carriers with optional origin_country_iso', async () => {
    const ax = mockAxios();
    await handlers.getShippingCarriers({ origin_country_iso: 'US' }, ax);
    expect(ax.get).toHaveBeenCalledWith('/application/shipping-carriers', {
      params: { origin_country_iso: 'US' },
    });
  });
});

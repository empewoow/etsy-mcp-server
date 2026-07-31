import { describe, it, expect, vi } from 'vitest';
import type { AxiosInstance } from 'axios';
import { tools, handlers } from '../../src/handlers/transactions.js';

const mockAxios = (): AxiosInstance => ({
  get: vi.fn().mockResolvedValue({ data: {} }),
} as unknown as AxiosInstance);

describe('handlers/transactions — Tier 2 addition', () => {
  it('exports getListingTransactions', () => {
    expect(tools.find((t) => t.name === 'getListingTransactions')).toBeDefined();
  });

  it('getListingTransactions GETs the per-listing transactions path', async () => {
    const ax = mockAxios();
    await handlers.getListingTransactions(
      { shop_id: '38798384', listing_id: '12345', limit: 5, offset: 10 },
      ax,
    );
    expect(ax.get).toHaveBeenCalledWith(
      '/application/shops/38798384/listings/12345/transactions',
      { params: { limit: 5, offset: 10 } },
    );
  });
});

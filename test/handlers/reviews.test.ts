import { describe, it, expect, vi } from 'vitest';
import type { AxiosInstance } from 'axios';
import { tools, handlers } from '../../src/handlers/reviews.js';

const mockAxios = (): AxiosInstance => ({
  get: vi.fn().mockResolvedValue({ data: { results: [], count: 0 } }),
} as unknown as AxiosInstance);

describe('handlers/reviews', () => {
  it('exports getShopReviews + getListingReviews', () => {
    expect(tools.find((t) => t.name === 'getShopReviews')).toBeDefined();
    expect(tools.find((t) => t.name === 'getListingReviews')).toBeDefined();
  });

  it('getShopReviews requires shop_id only', () => {
    const t = tools.find((x) => x.name === 'getShopReviews')!;
    expect(t.inputSchema.required).toEqual(['shop_id']);
    expect(t.inputSchema.properties).toHaveProperty('limit');
    expect(t.inputSchema.properties).toHaveProperty('offset');
    expect(t.inputSchema.properties).toHaveProperty('min_created');
    expect(t.inputSchema.properties).toHaveProperty('max_created');
  });

  it('getListingReviews requires listing_id only', () => {
    const t = tools.find((x) => x.name === 'getListingReviews')!;
    expect(t.inputSchema.required).toEqual(['listing_id']);
  });

  it('getShopReviews GETs the reviews path with optional params', async () => {
    const ax = mockAxios();
    await handlers.getShopReviews(
      { shop_id: '38798384', limit: 10, offset: 0, min_created: 1714000000, max_created: 1715000000 },
      ax,
    );
    expect(ax.get).toHaveBeenCalledWith('/application/shops/38798384/reviews', {
      params: { limit: 10, offset: 0, min_created: 1714000000, max_created: 1715000000 },
    });
  });

  it('getListingReviews GETs /listings/{id}/reviews', async () => {
    const ax = mockAxios();
    await handlers.getListingReviews({ listing_id: '12345', limit: 5 }, ax);
    expect(ax.get).toHaveBeenCalledWith('/application/listings/12345/reviews', {
      params: { limit: 5, offset: undefined, min_created: undefined, max_created: undefined },
    });
  });
});

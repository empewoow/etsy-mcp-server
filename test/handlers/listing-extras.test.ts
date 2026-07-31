import { describe, it, expect, vi } from 'vitest';
import type { AxiosInstance } from 'axios';
import { tools, handlers } from '../../src/handlers/listing.js';

const mockAxios = (): AxiosInstance => ({
  get: vi.fn().mockResolvedValue({ data: {} }),
} as unknown as AxiosInstance);

describe('handlers/listing — Tier 2 additions', () => {
  it('exports findAllActiveListings + getListingsBatch + getListing + getListingProperty', () => {
    expect(tools.find((t) => t.name === 'findAllActiveListings')).toBeDefined();
    expect(tools.find((t) => t.name === 'getListingsBatch')).toBeDefined();
    expect(tools.find((t) => t.name === 'getListing')).toBeDefined();
    expect(tools.find((t) => t.name === 'getListingProperty')).toBeDefined();
  });

  it('findAllActiveListings GETs /listings/active with filters', async () => {
    const ax = mockAxios();
    await handlers.findAllActiveListings(
      { keywords: 'gold ring', sort_on: 'created', sort_order: 'desc', limit: 25, offset: 0 },
      ax,
    );
    expect(ax.get).toHaveBeenCalledWith('/application/listings/active', {
      params: {
        keywords: 'gold ring',
        sort_on: 'created',
        sort_order: 'desc',
        limit: 25,
        offset: 0,
        min_price: undefined,
        max_price: undefined,
        taxonomy_id: undefined,
        shop_location: undefined,
      },
    });
  });

  it('getListingsBatch passes comma-separated ids', async () => {
    const ax = mockAxios();
    await handlers.getListingsBatch({ listing_ids: ['111', '222', '333'] }, ax);
    expect(ax.get).toHaveBeenCalledWith('/application/listings/batch', {
      params: { listing_ids: '111,222,333', includes: undefined },
    });
  });

  it('getListing fetches single listing', async () => {
    const ax = mockAxios();
    await handlers.getListing({ listing_id: '12345', includes: ['Images', 'Inventory'] }, ax);
    expect(ax.get).toHaveBeenCalledWith('/application/listings/12345', {
      params: { includes: 'Images,Inventory' },
    });
  });

  it('getListingProperty fetches a single property', async () => {
    const ax = mockAxios();
    await handlers.getListingProperty({ listing_id: '12345', property_id: '77' }, ax);
    expect(ax.get).toHaveBeenCalledWith('/application/listings/12345/properties/77');
  });
});

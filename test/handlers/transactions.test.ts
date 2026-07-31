import { describe, it, expect, vi } from 'vitest';
import type { AxiosInstance } from 'axios';
import { tools, handlers } from '../../src/handlers/transactions.js';

const mockAxios = (): AxiosInstance => ({
  get: vi.fn().mockResolvedValue({ data: { results: [], count: 0 } }),
} as unknown as AxiosInstance);

describe('handlers/transactions', () => {
  it('exports getShopTransactions with shop_id required', () => {
    const t = tools.find((x) => x.name === 'getShopTransactions');
    expect(t).toBeDefined();
    expect(t!.inputSchema.required).toEqual(['shop_id']);
    expect(t!.inputSchema.properties).toHaveProperty('limit');
    expect(t!.inputSchema.properties).toHaveProperty('offset');
  });

  it('GETs /application/shops/{shop_id}/transactions with params', async () => {
    const ax = mockAxios();
    await handlers.getShopTransactions({ shop_id: '38798384', limit: 50, offset: 100 }, ax);
    expect(ax.get).toHaveBeenCalledWith('/application/shops/38798384/transactions', {
      params: { limit: 50, offset: 100 },
    });
  });
});

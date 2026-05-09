import { describe, it, expect, vi } from 'vitest';
import type { AxiosInstance } from 'axios';
import { tools, handlers } from '../../src/handlers/receipts.js';

const mockAxios = (): AxiosInstance => ({
  get: vi.fn().mockResolvedValue({ data: { results: [], count: 0 } }),
} as unknown as AxiosInstance);

describe('handlers/receipts', () => {
  describe('tools', () => {
    it('exports getShopReceipts with shop_id required', () => {
      const t = tools.find((x) => x.name === 'getShopReceipts');
      expect(t).toBeDefined();
      expect(t!.inputSchema.required).toEqual(['shop_id']);
      expect(t!.inputSchema.properties).toHaveProperty('was_paid');
      expect(t!.inputSchema.properties).toHaveProperty('was_shipped');
      expect(t!.inputSchema.properties).toHaveProperty('limit');
      expect(t!.inputSchema.properties).toHaveProperty('offset');
      expect(t!.inputSchema.properties).toHaveProperty('min_created');
      expect(t!.inputSchema.properties).toHaveProperty('max_created');
    });
  });

  describe('handlers.getShopReceipts', () => {
    it('GETs /application/shops/{shop_id}/receipts and forwards optional params', async () => {
      const ax = mockAxios();
      await handlers.getShopReceipts(
        {
          shop_id: '38798384',
          was_paid: true,
          was_shipped: false,
          limit: 10,
          offset: 0,
          min_created: 1714000000,
          max_created: 1715000000,
        },
        ax,
      );
      expect(ax.get).toHaveBeenCalledWith('/application/shops/38798384/receipts', {
        params: {
          was_paid: true,
          was_shipped: false,
          limit: 10,
          offset: 0,
          min_created: 1714000000,
          max_created: 1715000000,
        },
      });
    });

    it('omits unset optional params from query string', async () => {
      const ax = mockAxios();
      await handlers.getShopReceipts({ shop_id: '38798384' }, ax);
      const call = (ax.get as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(call[0]).toBe('/application/shops/38798384/receipts');
      // params should be defined but every field undefined — Etsy will treat as not-supplied
      const params = call[1].params;
      expect(params.was_paid).toBeUndefined();
      expect(params.limit).toBeUndefined();
      expect(params.min_created).toBeUndefined();
    });
  });
});

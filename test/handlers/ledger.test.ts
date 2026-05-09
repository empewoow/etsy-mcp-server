import { describe, it, expect, vi } from 'vitest';
import type { AxiosInstance } from 'axios';
import { tools, handlers } from '../../src/handlers/ledger.js';

const mockAxios = (): AxiosInstance => ({
  get: vi.fn().mockResolvedValue({ data: { results: [], count: 0 } }),
} as unknown as AxiosInstance);

describe('handlers/ledger', () => {
  it('exports getLedgerEntries with shop_id, min_created, max_created required', () => {
    const t = tools.find((x) => x.name === 'getLedgerEntries');
    expect(t).toBeDefined();
    expect(t!.inputSchema.required).toEqual(
      expect.arrayContaining(['shop_id', 'min_created', 'max_created']),
    );
  });

  it('GETs /application/shops/{shop_id}/payment-account/ledger-entries with date window', async () => {
    const ax = mockAxios();
    await handlers.getLedgerEntries(
      { shop_id: '38798384', min_created: 1714000000, max_created: 1715000000, limit: 25 },
      ax,
    );
    expect(ax.get).toHaveBeenCalledWith(
      '/application/shops/38798384/payment-account/ledger-entries',
      { params: { min_created: 1714000000, max_created: 1715000000, limit: 25, offset: undefined } },
    );
  });
});

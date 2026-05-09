import { describe, it, expect, vi } from 'vitest';
import type { AxiosInstance } from 'axios';
import { tools, handlers } from '../../src/handlers/scopes.js';

function mockAxios(authHeader?: string): AxiosInstance {
  return {
    defaults: { headers: { common: authHeader ? { Authorization: authHeader } : {} } },
    post: vi.fn().mockResolvedValue({ data: { scopes: ['shops_r', 'transactions_r'] } }),
  } as unknown as AxiosInstance;
}

describe('handlers/scopes', () => {
  it('exports tokenScopes (no required args)', () => {
    const t = tools.find((x) => x.name === 'tokenScopes');
    expect(t).toBeDefined();
    expect(t!.inputSchema.required).toEqual([]);
  });

  it('tokenScopes POSTs the explicit token', async () => {
    const ax = mockAxios();
    await handlers.tokenScopes({ token: 'abc.token' }, ax);
    const call = (ax.post as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[0]).toBe('/application/scopes');
    expect(call[1]).toBe('token=abc.token');
  });

  it('tokenScopes falls back to cached Bearer in axios defaults', async () => {
    const ax = mockAxios('Bearer cached.token');
    await handlers.tokenScopes({}, ax);
    const call = (ax.post as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[1]).toBe('token=cached.token');
  });

  it('throws when no token available', async () => {
    const ax = mockAxios();
    await expect(handlers.tokenScopes({}, ax)).rejects.toThrow(/no token/);
  });
});

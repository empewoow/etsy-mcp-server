import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AxiosInstance } from 'axios';
import { tools, handlers } from '../../src/handlers/receipts.js';

const mockAxios = (): AxiosInstance => ({
  get: vi.fn().mockResolvedValue({ data: {} }),
  post: vi.fn().mockResolvedValue({ data: {} }),
  put: vi.fn().mockResolvedValue({ data: {} }),
} as unknown as AxiosInstance);

describe('handlers/receipts — Tier 1+2 additions', () => {
  beforeEach(() => {
    delete process.env.ETSY_ALLOW_LIVE_WRITES;
  });

  it('exports getShopReceipt + updateShopReceipt + createReceiptShipment', () => {
    expect(tools.find((t) => t.name === 'getShopReceipt')).toBeDefined();
    expect(tools.find((t) => t.name === 'updateShopReceipt')).toBeDefined();
    expect(tools.find((t) => t.name === 'createReceiptShipment')).toBeDefined();
  });

  it('getShopReceipt GETs single receipt', async () => {
    const ax = mockAxios();
    await handlers.getShopReceipt({ shop_id: '38798384', receipt_id: '4043199874' }, ax);
    expect(ax.get).toHaveBeenCalledWith('/application/shops/38798384/receipts/4043199874');
  });

  it('updateShopReceipt refuses without env', async () => {
    const ax = mockAxios();
    await expect(
      handlers.updateShopReceipt(
        { shop_id: '38798384', receipt_id: '1', was_shipped: true },
        ax,
      ),
    ).rejects.toThrow(/ETSY_LIVE_WRITES_DISABLED/);
  });

  it('updateShopReceipt PUTs with body when env enabled', async () => {
    process.env.ETSY_ALLOW_LIVE_WRITES = 'true';
    const ax = mockAxios();
    await handlers.updateShopReceipt(
      { shop_id: '38798384', receipt_id: '1', was_shipped: true, was_paid: true },
      ax,
    );
    const call = (ax.put as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[0]).toBe('/application/shops/38798384/receipts/1');
    expect(call[1]).toContain('was_shipped=true');
    expect(call[1]).toContain('was_paid=true');
  });

  it('createReceiptShipment refuses without env', async () => {
    const ax = mockAxios();
    await expect(
      handlers.createReceiptShipment(
        { shop_id: '38798384', receipt_id: '1', tracking_code: '1Z999', carrier_name: 'usps' },
        ax,
      ),
    ).rejects.toThrow(/ETSY_LIVE_WRITES_DISABLED/);
  });

  it('createReceiptShipment POSTs tracking when env enabled', async () => {
    process.env.ETSY_ALLOW_LIVE_WRITES = 'true';
    const ax = mockAxios();
    await handlers.createReceiptShipment(
      {
        shop_id: '38798384',
        receipt_id: '1',
        tracking_code: '1Z999',
        carrier_name: 'usps',
        send_bcc: true,
        note_to_buyer: 'Shipped today',
      },
      ax,
    );
    const call = (ax.post as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[0]).toBe('/application/shops/38798384/receipts/1/tracking');
    expect(call[1]).toContain('tracking_code=1Z999');
    expect(call[1]).toContain('carrier_name=usps');
    expect(call[1]).toContain('send_bcc=true');
    expect(decodeURIComponent(call[1] as string)).toContain('note_to_buyer=Shipped today');
  });
});

import { AxiosInstance } from "axios";
import querystring from "querystring";
import { requireLiveWrites } from "../lib/write-guard.js";

export const tools = [
  {
    name: "getShopReceipt",
    description: "Get a single receipt (order) by ID. Returns full receipt + transactions.",
    inputSchema: {
      type: "object",
      properties: {
        shop_id: { type: "string", description: "The ID of the shop" },
        receipt_id: { type: "string", description: "The ID of the receipt" },
      },
      required: ["shop_id", "receipt_id"],
    },
  },
  {
    name: "updateShopReceipt",
    description:
      "[WRITE — gated by ETSY_ALLOW_LIVE_WRITES] Update receipt status flags (was_shipped, was_paid).",
    inputSchema: {
      type: "object",
      properties: {
        shop_id: { type: "string" },
        receipt_id: { type: "string" },
        was_shipped: { type: "boolean" },
        was_paid: { type: "boolean" },
      },
      required: ["shop_id", "receipt_id"],
    },
  },
  {
    name: "createReceiptShipment",
    description:
      "[WRITE — gated by ETSY_ALLOW_LIVE_WRITES] Submit tracking number for a receipt. Etsy emails the buyer with the tracking link.",
    inputSchema: {
      type: "object",
      properties: {
        shop_id: { type: "string" },
        receipt_id: { type: "string" },
        tracking_code: { type: "string" },
        carrier_name: {
          type: "string",
          description: "Etsy carrier slug (e.g. 'usps', 'ups', 'fedex'). See getShippingCarriers for full list.",
        },
        send_bcc: { type: "boolean", description: "BCC the seller on buyer notification" },
        note_to_buyer: { type: "string" },
      },
      required: ["shop_id", "receipt_id", "tracking_code", "carrier_name"],
    },
  },
  {
    name: "getShopReceipts",
    description:
      "List receipts (orders) for a shop. Filter by paid/shipped state and creation/modification windows. Returns receipt_id, buyer info, totals, status, timestamps.",
    inputSchema: {
      type: "object",
      properties: {
        shop_id: { type: "string", description: "The ID of the shop" },
        was_paid: { type: "boolean", description: "Filter by paid status" },
        was_shipped: { type: "boolean", description: "Filter by shipped status" },
        limit: { type: "number", description: "Max results (default 25, max 100)" },
        offset: { type: "number", description: "Pagination offset" },
        min_created: { type: "number", description: "Min create epoch seconds" },
        max_created: { type: "number", description: "Max create epoch seconds" },
        min_last_modified: { type: "number", description: "Min last-modified epoch" },
        max_last_modified: { type: "number", description: "Max last-modified epoch" },
        sort_on: {
          type: "string",
          enum: ["created", "updated", "receipt_id"],
          description: "Field to sort on",
        },
        sort_order: {
          type: "string",
          enum: ["asc", "desc", "ascending", "descending", "up", "down"],
          description: "Sort direction",
        },
      },
      required: ["shop_id"],
    },
  },
];

interface GetShopReceiptArgs {
  shop_id: string;
  receipt_id: string;
}

interface UpdateShopReceiptArgs {
  shop_id: string;
  receipt_id: string;
  was_shipped?: boolean;
  was_paid?: boolean;
}

interface CreateReceiptShipmentArgs {
  shop_id: string;
  receipt_id: string;
  tracking_code: string;
  carrier_name: string;
  send_bcc?: boolean;
  note_to_buyer?: string;
}

interface GetShopReceiptsArgs {
  shop_id: string;
  was_paid?: boolean;
  was_shipped?: boolean;
  limit?: number;
  offset?: number;
  min_created?: number;
  max_created?: number;
  min_last_modified?: number;
  max_last_modified?: number;
  sort_on?: string;
  sort_order?: string;
}

export const handlers: Record<string, (args: unknown, axios: AxiosInstance) => Promise<unknown>> = {
  getShopReceipt: async (args, axios) => {
    const a = args as GetShopReceiptArgs;
    return axios.get(`/application/shops/${a.shop_id}/receipts/${a.receipt_id}`);
  },

  updateShopReceipt: async (args, axios) => {
    requireLiveWrites();
    const a = args as UpdateShopReceiptArgs;
    const body: Record<string, string | number | boolean> = {};
    if (a.was_shipped !== undefined) body.was_shipped = a.was_shipped;
    if (a.was_paid !== undefined) body.was_paid = a.was_paid;
    return axios.put(
      `/application/shops/${a.shop_id}/receipts/${a.receipt_id}`,
      querystring.stringify(body),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
    );
  },

  createReceiptShipment: async (args, axios) => {
    requireLiveWrites();
    const a = args as CreateReceiptShipmentArgs;
    const body: Record<string, string | number | boolean> = {
      tracking_code: a.tracking_code,
      carrier_name: a.carrier_name,
    };
    if (a.send_bcc !== undefined) body.send_bcc = a.send_bcc;
    if (a.note_to_buyer !== undefined) body.note_to_buyer = a.note_to_buyer;
    return axios.post(
      `/application/shops/${a.shop_id}/receipts/${a.receipt_id}/tracking`,
      querystring.stringify(body),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
    );
  },

  getShopReceipts: async (args, axios) => {
    const a = args as GetShopReceiptsArgs;
    return axios.get(`/application/shops/${a.shop_id}/receipts`, {
      params: {
        was_paid: a.was_paid,
        was_shipped: a.was_shipped,
        limit: a.limit,
        offset: a.offset,
        min_created: a.min_created,
        max_created: a.max_created,
        min_last_modified: a.min_last_modified,
        max_last_modified: a.max_last_modified,
        sort_on: a.sort_on,
        sort_order: a.sort_order,
      },
    });
  },
};

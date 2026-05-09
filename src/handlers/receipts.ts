import { AxiosInstance } from "axios";

export const tools = [
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

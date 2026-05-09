import { AxiosInstance } from "axios";

export const tools = [
  {
    name: "getShopTransactions",
    description:
      "List shop transactions (line items from receipts). Each row maps to one listing+quantity sold. Useful for revenue analytics by listing.",
    inputSchema: {
      type: "object",
      properties: {
        shop_id: { type: "string", description: "The ID of the shop" },
        limit: { type: "number", description: "Max results (default 25, max 100)" },
        offset: { type: "number", description: "Pagination offset" },
      },
      required: ["shop_id"],
    },
  },
];

interface GetShopTransactionsArgs {
  shop_id: string;
  limit?: number;
  offset?: number;
}

export const handlers: Record<string, (args: unknown, axios: AxiosInstance) => Promise<unknown>> = {
  getShopTransactions: async (args, axios) => {
    const a = args as GetShopTransactionsArgs;
    return axios.get(`/application/shops/${a.shop_id}/transactions`, {
      params: { limit: a.limit, offset: a.offset },
    });
  },
};

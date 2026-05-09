import { AxiosInstance } from "axios";

export const tools = [
  {
    name: "getLedgerEntries",
    description:
      "List shop payment-account ledger entries within a date window. Maps to Bigcapital Etsy Payout Balance for reconciliation. Etsy requires both min_created and max_created.",
    inputSchema: {
      type: "object",
      properties: {
        shop_id: { type: "string", description: "The ID of the shop" },
        min_created: { type: "number", description: "Min create epoch seconds (REQUIRED)" },
        max_created: { type: "number", description: "Max create epoch seconds (REQUIRED)" },
        limit: { type: "number", description: "Max results (default 25)" },
        offset: { type: "number", description: "Pagination offset" },
      },
      required: ["shop_id", "min_created", "max_created"],
    },
  },
];

interface GetLedgerEntriesArgs {
  shop_id: string;
  min_created: number;
  max_created: number;
  limit?: number;
  offset?: number;
}

export const handlers: Record<string, (args: unknown, axios: AxiosInstance) => Promise<unknown>> = {
  getLedgerEntries: async (args, axios) => {
    const a = args as GetLedgerEntriesArgs;
    return axios.get(`/application/shops/${a.shop_id}/payment-account/ledger-entries`, {
      params: {
        min_created: a.min_created,
        max_created: a.max_created,
        limit: a.limit,
        offset: a.offset,
      },
    });
  },
};

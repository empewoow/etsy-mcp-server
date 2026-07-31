import { AxiosInstance } from "axios";

export const tools = [
  {
    name: "getShopReviews",
    description:
      "List reviews for a shop. Public endpoint (still requires x-api-key). Returns rating, review text, language, transaction_id, listing_id, timestamps.",
    inputSchema: {
      type: "object",
      properties: {
        shop_id: { type: "string", description: "The ID of the shop" },
        limit: { type: "number", description: "Max results (default 25, max 100)" },
        offset: { type: "number", description: "Pagination offset" },
        min_created: { type: "number", description: "Min create epoch seconds" },
        max_created: { type: "number", description: "Max create epoch seconds" },
      },
      required: ["shop_id"],
    },
  },
  {
    name: "getListingReviews",
    description: "List reviews for a single listing. Public endpoint.",
    inputSchema: {
      type: "object",
      properties: {
        listing_id: { type: "string", description: "The ID of the listing" },
        limit: { type: "number" },
        offset: { type: "number" },
        min_created: { type: "number" },
        max_created: { type: "number" },
      },
      required: ["listing_id"],
    },
  },
];

interface GetShopReviewsArgs {
  shop_id: string;
  limit?: number;
  offset?: number;
  min_created?: number;
  max_created?: number;
}

interface GetListingReviewsArgs {
  listing_id: string;
  limit?: number;
  offset?: number;
  min_created?: number;
  max_created?: number;
}

export const handlers: Record<string, (args: unknown, axios: AxiosInstance) => Promise<unknown>> = {
  getShopReviews: async (args, axios) => {
    const a = args as GetShopReviewsArgs;
    return axios.get(`/application/shops/${a.shop_id}/reviews`, {
      params: {
        limit: a.limit,
        offset: a.offset,
        min_created: a.min_created,
        max_created: a.max_created,
      },
    });
  },

  getListingReviews: async (args, axios) => {
    const a = args as GetListingReviewsArgs;
    return axios.get(`/application/listings/${a.listing_id}/reviews`, {
      params: {
        limit: a.limit,
        offset: a.offset,
        min_created: a.min_created,
        max_created: a.max_created,
      },
    });
  },
};

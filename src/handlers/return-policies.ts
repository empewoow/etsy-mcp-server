import { AxiosInstance } from "axios";
import querystring from "querystring";
import { requireLiveWrites } from "../lib/write-guard.js";

export const tools = [
  {
    name: "getShopReturnPolicies",
    description: "List a shop's return policies (return_policy_id, accepts_returns, accepts_exchanges, return_deadline).",
    inputSchema: {
      type: "object",
      properties: {
        shop_id: { type: "string", description: "The ID of the shop" },
      },
      required: ["shop_id"],
    },
  },
  {
    name: "createShopReturnPolicy",
    description:
      "[WRITE — gated by ETSY_ALLOW_LIVE_WRITES] Create a new return policy for the shop. Returns the new return_policy_id.",
    inputSchema: {
      type: "object",
      properties: {
        shop_id: { type: "string", description: "The ID of the shop" },
        accepts_returns: { type: "boolean" },
        accepts_exchanges: { type: "boolean" },
        return_deadline: {
          type: "number",
          description: "Days within which returns/exchanges are accepted (7|14|21|30|45|60|90)",
        },
      },
      required: ["shop_id", "accepts_returns", "accepts_exchanges", "return_deadline"],
    },
  },
];

interface GetShopReturnPoliciesArgs {
  shop_id: string;
}

interface CreateShopReturnPolicyArgs {
  shop_id: string;
  accepts_returns: boolean;
  accepts_exchanges: boolean;
  return_deadline: number;
}

export const handlers: Record<string, (args: unknown, axios: AxiosInstance) => Promise<unknown>> = {
  getShopReturnPolicies: async (args, axios) => {
    const a = args as GetShopReturnPoliciesArgs;
    return axios.get(`/application/shops/${a.shop_id}/policies/return`);
  },

  createShopReturnPolicy: async (args, axios) => {
    requireLiveWrites();
    const a = args as CreateShopReturnPolicyArgs;
    const payload = querystring.stringify({
      accepts_returns: a.accepts_returns,
      accepts_exchanges: a.accepts_exchanges,
      return_deadline: a.return_deadline,
    });
    return axios.post(`/application/shops/${a.shop_id}/policies/return`, payload, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
  },
};

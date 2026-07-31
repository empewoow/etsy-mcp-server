import { AxiosInstance } from "axios";
import querystring from "querystring";
import { requireLiveWrites } from "../lib/write-guard.js";

interface GetShopArgs {
  shop_id: string;
}

interface GetShopSectionArgs {
  shop_id: string;
  shop_section_id: string;
}

interface GetShopShippingProfilesArgs {
  shop_id: string;
}

interface GetHolidayPreferencesArgs {
  shop_id: string;
}

interface UpdateHolidayPreferencesArgs {
  shop_id: string;
  holiday_id: string;
  is_enabled: boolean;
}

interface GetShopByOwnerUserIdArgs {
  user_id: string;
}

interface GetShippingCarriersArgs {
  origin_country_iso?: string;
}

export const tools = [
  {
    name: "getShop",
    description: "Get shop information",
    inputSchema: {
      type: "object",
      properties: {
        shop_id: {
          type: "string",
          description: "The ID of the shop to retrieve",
        },
      },
      required: ["shop_id"],
    },
  },
  {
    name: "getMe",
    description: "Get info about the authenticated user",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "getShopSections",
    description: "Get sections for a shop",
    inputSchema: {
      type: "object",
      properties: {
        shop_id: { type: "string", description: "The ID of the shop" },
      },
      required: ["shop_id"],
    },
  },
  {
    name: "getShopShippingProfiles",
    description: "List a shop's shipping profiles (rate cards). Used for shipping rate audits.",
    inputSchema: {
      type: "object",
      properties: { shop_id: { type: "string" } },
      required: ["shop_id"],
    },
  },
  {
    name: "getHolidayPreferences",
    description: "List vacation-mode / holiday preferences for a shop.",
    inputSchema: {
      type: "object",
      properties: { shop_id: { type: "string" } },
      required: ["shop_id"],
    },
  },
  {
    name: "updateHolidayPreferences",
    description: "[WRITE — gated by ETSY_ALLOW_LIVE_WRITES] Toggle holiday/vacation mode for a holiday id.",
    inputSchema: {
      type: "object",
      properties: {
        shop_id: { type: "string" },
        holiday_id: { type: "string" },
        is_enabled: { type: "boolean" },
      },
      required: ["shop_id", "holiday_id", "is_enabled"],
    },
  },
  {
    name: "getShopByOwnerUserId",
    description: "Resolve a user_id to their shop(s). Public endpoint.",
    inputSchema: {
      type: "object",
      properties: { user_id: { type: "string" } },
      required: ["user_id"],
    },
  },
  {
    name: "getShippingCarriers",
    description: "List Etsy-supported shipping carriers (carrier_name slugs for createReceiptShipment).",
    inputSchema: {
      type: "object",
      properties: {
        origin_country_iso: {
          type: "string",
          description: "Optional 2-letter ISO country code to filter (e.g. 'US')",
        },
      },
      required: [],
    },
  },
];

export const handlers: Record<string, (args: unknown, axios: AxiosInstance) => Promise<unknown>> = {
  getMe: async (_, axios) => axios.get("/application/users/me"),
  getShop: async (args, axios) => axios.get(`/application/shops/${(args as GetShopArgs).shop_id}`),
  getShopSections: async (args, axios) =>
    axios.get(`/application/shops/${(args as GetShopSectionArgs).shop_id}/sections`),

  getShopShippingProfiles: async (args, axios) => {
    const a = args as GetShopShippingProfilesArgs;
    return axios.get(`/application/shops/${a.shop_id}/shipping-profiles`);
  },

  getHolidayPreferences: async (args, axios) => {
    const a = args as GetHolidayPreferencesArgs;
    return axios.get(`/application/shops/${a.shop_id}/holiday-preferences`);
  },

  updateHolidayPreferences: async (args, axios) => {
    requireLiveWrites();
    const a = args as UpdateHolidayPreferencesArgs;
    return axios.put(
      `/application/shops/${a.shop_id}/holiday-preferences/${a.holiday_id}`,
      querystring.stringify({ is_enabled: a.is_enabled }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
    );
  },

  getShopByOwnerUserId: async (args, axios) => {
    const a = args as GetShopByOwnerUserIdArgs;
    return axios.get(`/application/users/${a.user_id}/shops`);
  },

  getShippingCarriers: async (args, axios) => {
    const a = args as GetShippingCarriersArgs;
    return axios.get(`/application/shipping-carriers`, {
      params: { origin_country_iso: a.origin_country_iso },
    });
  },
};

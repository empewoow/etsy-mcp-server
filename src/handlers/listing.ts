import { AxiosInstance } from "axios";
import querystring from "querystring";
import fs from "fs";
import FormData from "form-data";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { requireLiveWrites } from "../lib/write-guard.js";

export const tools = [
  {
    name: "getListingsByShop",
    description: "Get listings for a given shop",
    inputSchema: {
      type: "object",
      properties: {
        shop_id: { type: "string", description: "The ID of the shop" },
        state: {
          type: "string",
          description: "The state of the listings to retrieve",
          enum: ["active", "inactive", "sold_out", "draft", "expired"],
        },
      },
      required: ["shop_id"],
    },
  },
  {
    name: "createDraftListing",
    description: "Create a new draft listing",
    inputSchema: {
      type: "object",
      properties: {
        shop_id: { type: "string", description: "The ID of the shop" },
        title: { type: "string", description: "The title of the listing" },
        description: {
          type: "string",
          description: "The description of the listing",
        },
        price: { type: "number", description: "The price of the listing" },
        quantity: {
          type: "number",
          description: "The quantity of the listing",
        },
        who_made: {
          type: "string",
          enum: ["i_did", "someone_else", "collective"],
        },
        when_made: {
          type: "string",
          enum: [
            "made_to_order",
            "2020_2025",
            "2010_2019",
            "2006_2009",
            "before_2006",
            "2000_2005",
            "1990s",
            "1980s",
            "1970s",
            "1960s",
            "1950s",
            "1940s",
            "1930s",
            "1920s",
            "1910s",
            "1900s",
            "1800s",
            "1700s",
            "before_1700",
          ],
        },
        taxonomy_id: {
          type: "number",
          description: "The taxonomy ID of the listing",
        },
      },
      required: [
        "shop_id",
        "title",
        "description",
        "price",
        "quantity",
        "who_made",
        "when_made",
        "taxonomy_id",
      ],
    },
  },
  {
    name: "uploadListingImage",
    description: "Upload an image for a listing",
    inputSchema: {
      type: "object",
      properties: {
        shop_id: { type: "string", description: "The ID of the shop" },
        listing_id: { type: "string", description: "The ID of the listing" },
        image_path: {
          type: "string",
          description: "Filesystem path to the image file to upload. The file must exist.",
        },
      },
      required: ["shop_id", "listing_id", "image_path"],
    },
  },
  {
    name: "updateListing",
    description: "Update an existing listing",
    inputSchema: {
      type: "object",
      properties: {
        shop_id: { type: "string", description: "The ID of the shop" },
        listing_id: { type: "string", description: "The ID of the listing" },
        title: { type: "string", description: "The new title of the listing" },
        description: {
          type: "string",
          description: "The new description of the listing",
        },
        price: { type: "number", description: "The new price of the listing" },
      },
      required: ["shop_id", "listing_id"],
    },
  },
  {
    name: "getListingImages",
    description: "Get images for a listing",
    inputSchema: {
      type: "object",
      properties: {
        listing_id: { type: "string", description: "The ID of the listing" },
      },
      required: ["listing_id"],
    },
  },
  {
    name: "getListingFiles",
    description: "Get files for a digital listing",
    inputSchema: {
      type: "object",
      properties: {
        listing_id: { type: "string", description: "The ID of the listing" },
      },
      required: ["listing_id"],
    },
  },
  {
    name: "getListingInventory",
    description: "Get inventory details for a listing",
    inputSchema: {
      type: "object",
      properties: {
        listing_id: { type: "string", description: "The ID of the listing" },
      },
      required: ["listing_id"],
    },
  },
  {
    name: "updateListingInventory",
    description: "Update inventory for a listing",
    inputSchema: {
      type: "object",
      properties: {
        listing_id: { type: "string", description: "The ID of the listing" },
        products: { type: "array", description: "Inventory products" },
      },
      required: ["listing_id", "products"],
    },
  },
  {
    name: "findAllActiveListings",
    description:
      "Public Etsy search across all shops. Filter by keywords, price, taxonomy, location. Used for competitor monitoring and market research.",
    inputSchema: {
      type: "object",
      properties: {
        keywords: { type: "string" },
        sort_on: { type: "string", enum: ["created", "price", "score"] },
        sort_order: { type: "string", enum: ["asc", "desc", "ascending", "descending", "up", "down"] },
        limit: { type: "number" },
        offset: { type: "number" },
        min_price: { type: "number" },
        max_price: { type: "number" },
        taxonomy_id: { type: "number" },
        shop_location: { type: "string" },
      },
      required: [],
    },
  },
  {
    name: "getListingsBatch",
    description: "Bulk-fetch listings by IDs (comma-separated, max 100).",
    inputSchema: {
      type: "object",
      properties: {
        listing_ids: { type: "array", items: { type: "string" }, description: "Up to 100 listing IDs" },
        includes: { type: "array", items: { type: "string" }, description: "e.g. Images, Inventory, Shipping, Translations" },
      },
      required: ["listing_ids"],
    },
  },
  {
    name: "getListing",
    description: "Fetch a single listing by ID with optional includes (Images, Inventory, etc.).",
    inputSchema: {
      type: "object",
      properties: {
        listing_id: { type: "string" },
        includes: { type: "array", items: { type: "string" } },
      },
      required: ["listing_id"],
    },
  },
  {
    name: "getListingProperty",
    description: "Fetch a single listing property (e.g. material, size, color) by listing + property id.",
    inputSchema: {
      type: "object",
      properties: {
        listing_id: { type: "string" },
        property_id: { type: "string" },
      },
      required: ["listing_id", "property_id"],
    },
  },
];

interface GetListingsByShopArgs {
  shop_id: string;
  state?: string;
}

interface CreateDraftListingArgs {
  shop_id: string;
  title: string;
  description: string;
  price: number;
  quantity: number;
  who_made: string;
  when_made: string;
  taxonomy_id: number;
  [key: string]: unknown;
}

interface UploadListingImageArgs {
  shop_id: string;
  listing_id: string;
  image_path: string;
}

interface UpdateListingArgs {
  shop_id: string;
  listing_id: string;
  title?: string;
  description?: string;
  price?: number;
  [key: string]: unknown;
}

interface GetListingImagesArgs {
  listing_id: string;
}

interface GetListingFilesArgs {
  listing_id: string;
}

interface GetListingInventoryArgs {
  listing_id: string;
}

interface UpdateListingInventoryArgs {
  listing_id: string;
  products: unknown[];
}

interface FindAllActiveListingsArgs {
  keywords?: string;
  sort_on?: string;
  sort_order?: string;
  limit?: number;
  offset?: number;
  min_price?: number;
  max_price?: number;
  taxonomy_id?: number;
  shop_location?: string;
}

interface GetListingsBatchArgs {
  listing_ids: string[];
  includes?: string[];
}

interface GetListingArgs {
  listing_id: string;
  includes?: string[];
}

interface GetListingPropertyArgs {
  listing_id: string;
  property_id: string;
}

export const handlers: Record<string, (args: unknown, axios: AxiosInstance) => Promise<unknown>> = {
  getListingsByShop: async (args, axios) =>
    axios.get(`/application/shops/${(args as GetListingsByShopArgs).shop_id}/listings`, {
      params: { state: (args as GetListingsByShopArgs).state },
    }),

  createDraftListing: async (args, axios) => {
    requireLiveWrites();
    const { shop_id, ...rest } = args as CreateDraftListingArgs;
    const payload = querystring.stringify(rest as Record<string, string | number | boolean>);
    return axios.post(`/application/shops/${shop_id}/listings`, payload, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
  },

  uploadListingImage: async (args, axios) => {
    requireLiveWrites();
    const { shop_id, listing_id, image_path } = args as UploadListingImageArgs;
    if (!fs.existsSync(image_path)) {
      throw new McpError(ErrorCode.InvalidRequest, `File not found: ${image_path}`);
    }
    const form = new FormData();
    form.append("image", fs.createReadStream(image_path));
    return axios.post(`/application/shops/${shop_id}/listings/${listing_id}/images`, form, {
      headers: form.getHeaders(),
    });
  },

  updateListing: async (args, axios) => {
    requireLiveWrites();
    const { shop_id, listing_id, ...rest } = args as UpdateListingArgs;
    const payload = querystring.stringify(rest as Record<string, string | number | boolean>);
    return axios.put(`/application/shops/${shop_id}/listings/${listing_id}`, payload, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
  },

  getListingImages: async (args, axios) =>
    axios.get(`/application/listings/${(args as GetListingImagesArgs).listing_id}/images`),

  getListingFiles: async (args, axios) =>
    axios.get(`/application/listings/${(args as GetListingFilesArgs).listing_id}/files`),

  getListingInventory: async (args, axios) =>
    axios.get(`/application/listings/${(args as GetListingInventoryArgs).listing_id}/inventory`),

  updateListingInventory: async (args, axios) => {
    requireLiveWrites();
    const { listing_id, products } = args as UpdateListingInventoryArgs;
    return axios.put(`/application/listings/${listing_id}/inventory`, {
      products,
    });
  },

  findAllActiveListings: async (args, axios) => {
    const a = args as FindAllActiveListingsArgs;
    return axios.get(`/application/listings/active`, {
      params: {
        keywords: a.keywords,
        sort_on: a.sort_on,
        sort_order: a.sort_order,
        limit: a.limit,
        offset: a.offset,
        min_price: a.min_price,
        max_price: a.max_price,
        taxonomy_id: a.taxonomy_id,
        shop_location: a.shop_location,
      },
    });
  },

  getListingsBatch: async (args, axios) => {
    const a = args as GetListingsBatchArgs;
    return axios.get(`/application/listings/batch`, {
      params: {
        listing_ids: a.listing_ids.join(","),
        includes: a.includes ? a.includes.join(",") : undefined,
      },
    });
  },

  getListing: async (args, axios) => {
    const a = args as GetListingArgs;
    return axios.get(`/application/listings/${a.listing_id}`, {
      params: { includes: a.includes ? a.includes.join(",") : undefined },
    });
  },

  getListingProperty: async (args, axios) => {
    const a = args as GetListingPropertyArgs;
    return axios.get(`/application/listings/${a.listing_id}/properties/${a.property_id}`);
  },
};

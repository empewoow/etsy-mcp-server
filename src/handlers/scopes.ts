import { AxiosInstance } from "axios";
import querystring from "querystring";

export const tools = [
  {
    name: "tokenScopes",
    description:
      "Diagnostic: list the OAuth scopes granted by an access token. If `token` is omitted, uses the access token currently cached by the MCP server (extracted from the axios Authorization header).",
    inputSchema: {
      type: "object",
      properties: {
        token: {
          type: "string",
          description:
            "Access token to inspect. Optional — defaults to the MCP server's currently cached access token.",
        },
      },
      required: [],
    },
  },
];

interface TokenScopesArgs {
  token?: string;
}

export const handlers: Record<string, (args: unknown, axios: AxiosInstance) => Promise<unknown>> = {
  tokenScopes: async (args, axios) => {
    const a = (args as TokenScopesArgs) ?? {};
    let token = a.token;
    if (!token) {
      // Pull from axios's default Authorization header (set by index.ts on refresh)
      const auth = axios.defaults.headers.common["Authorization"] as string | undefined;
      if (auth?.startsWith("Bearer ")) token = auth.slice(7);
    }
    if (!token) {
      throw new Error("tokenScopes: no token argument and no cached Bearer in axios defaults");
    }
    return axios.post(
      `/application/scopes`,
      querystring.stringify({ token }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
    );
  },
};

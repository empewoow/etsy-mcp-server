# Etsy MCP Server

This project exposes a subset of the [Etsy API](https://developers.etsy.com/) through the Model Context Protocol. It allows tools to be called from an MCP client to retrieve shop data and manage listings.

## OAuth Setup

The server requires a valid Etsy API keystring, shared secret, and OAuth refresh token. You can provide these credentials in two ways:

1.  **Environment Variables**: Set `ETSY_API_KEY`, `ETSY_SHARED_SECRET`, and `ETSY_REFRESH_TOKEN`.
2.  **Settings File**: Create an `etsy_mcp_settings.json` file by copying `etsy_mcp_settings.example.json` and filling in your credentials. Environment variables win where both are set.

If you do not yet have a refresh token, run the following helper script:

```bash
npx tsx src/get-refresh-token --keystring YOUR_KEY --shared-secret YOUR_SECRET
```

The script opens a browser window for authentication and prints the refresh token to the console. The
callback is `http://localhost:3030/oauth/redirect`, so the browser has to be on the same machine, and
that exact URL must be registered with your Etsy app. Pass `--port` to change it.

### Scopes

The helper requests read-only scopes by default: `listings_r`, `shops_r`, `transactions_r`. Set
`ETSY_REQUEST_WRITE_SCOPES=true` to add the matching `_w` scopes. A token without them cannot write
to Etsy whatever the caller attempts, because the refusal happens at Etsy's end.

### Token lifetime

An Etsy access token lasts an hour and the server renews it automatically. The refresh token lasts
**90 days**, and Etsy returns a new one on every renewal. The server stores that new token in the
settings file, so the 90-day window restarts on each use and no further manual login is needed
unless the server sits idle for a full 90 days. An expired refresh token shows up as
`Failed to refresh Etsy access token` on every tool, with `invalid_grant` from Etsy underneath.

Credentials supplied through `ETSY_REFRESH_TOKEN` are **not** renewed this way: the environment
cannot be written back to, so that token expires 90 days after it was issued. Use the settings file
for anything long-lived, and keep the env vars for containers and CI.

## Local Development

These instructions are for running the server directly on your machine for development purposes.

First, install dependencies:

```bash
npm install
```

Then, build the server:

```bash
npm run build
```

You can also use `npm run watch` to automatically rebuild the server when you make code changes.

### Configuration File Location

For local development, place your `etsy_mcp_settings.json` file in the project root directory (same level as `package.json`). The server will automatically detect and load it.

Set `ETSY_SETTINGS_PATH` to use a different file instead. That is how one install serves several
shops: give each its own credentials file and point each MCP server entry at the right one. The test
suite uses it too, so that running the tests cannot touch real credentials.

### Running the Server

After building, start the server with:

```bash
npm start
```

**Important**: This MCP server communicates over stdio and is designed to be connected to by MCP clients (like Claude Desktop, Cline, or other MCP-compatible applications). When run directly, it will start and wait for MCP protocol messages. To test functionality, use the MCP Inspector (see Debugging section) or connect it to an MCP client.

### MCP Client Integration

To use this server with an MCP client, you typically need to:

1. **Claude Desktop**: Add the server configuration to your Claude Desktop settings
2. **Cline**: Configure the server in your MCP server settings
3. **Other MCP Clients**: Refer to your client's documentation for adding MCP servers

The server will be started automatically by the MCP client when needed.

## Running with Docker

This is the recommended method for deployment or for running the server in a standardized environment.

### Quick Start with Docker

**Option 1: Build Locally**

```bash
docker build -t etsy-mcp-server .
```

**Option 2: Pull from Registry** (when available)

```bash
# Future: docker pull etsy-mcp-server:latest
```

### Configuration File Location for Docker

For Docker usage, your `etsy_mcp_settings.json` file should be located in the same directory where you run the `docker run` command. The `./` in the volume mount refers to your current working directory.

### Container Behavior

**Important**: MCP servers are not long-running background services. When you start the container, it will:

1. Load your Etsy credentials (from environment variables or settings file)
2. Print "Etsy MCP server running on stdio"
3. Wait for MCP protocol messages on stdin
4. Exit after a short time if no MCP client connects

This is normal behavior. The container is designed to be started by MCP clients when needed, not to run continuously like a web server.

### Starting the Container

You can supply your Etsy credentials either as environment variables or by mounting your settings file.

**Option 1: Using Environment Variables**

**Bash:**
```bash
docker run --rm \
  -e ETSY_API_KEY=YOUR_KEY \
  -e ETSY_SHARED_SECRET=YOUR_SECRET \
  -e ETSY_REFRESH_TOKEN=YOUR_TOKEN \
  etsy-mcp-server
```

**PowerShell:**
```powershell
docker run --rm `
  -e ETSY_API_KEY=YOUR_KEY `
  -e ETSY_SHARED_SECRET=YOUR_SECRET `
  -e ETSY_REFRESH_TOKEN=YOUR_TOKEN `
  etsy-mcp-server
```

**Option 2: Using a Settings File**

Create an `etsy_mcp_settings.json` file in your current directory. Then, mount it into the container using the `-v` flag:

**Bash:**

```bash
docker run --rm \
  -v ./etsy_mcp_settings.json:/usr/src/app/etsy_mcp_settings.json \
  etsy-mcp-server
```

**PowerShell:**

```powershell
docker run --rm `
  -v ./etsy_mcp_settings.json:/usr/src/app/etsy_mcp_settings.json `
  etsy-mcp-server
```

### MCP Client Integration with Docker

To use this Docker container with MCP clients:

1. **Claude Desktop**: Configure the server to use the Docker command in your Claude Desktop settings
2. **Cline**: Set up the Docker command as your MCP server startup command
3. **Other MCP Clients**: Use the appropriate Docker command as the server executable

Example MCP client configuration:

```json
{
  "command": "docker",
  "args": [
    "run",
    "--rm",
    "-v",
    "./etsy_mcp_settings.json:/usr/src/app/etsy_mcp_settings.json",
    "etsy-mcp-server"
  ]
}
```

The MCP client will automatically start the container when it needs to use the Etsy tools and stop it when done.

### Docker Compose (Recommended)

For easier management, use Docker Compose:

1. Copy `.env.example` to `.env` and fill in your credentials:
   ```bash
   cp .env.example .env
   # Edit .env with your Etsy API credentials
   ```

2. Start with Docker Compose:
   ```bash
   docker-compose --profile production up
   ```

### Production Deployment

**Multi-platform Builds** (for ARM64/Apple Silicon):

```bash
# Build for multiple architectures
docker buildx build --platform linux/amd64,linux/arm64 -t etsy-mcp-server:latest .

# Or build specifically for ARM64 (Apple Silicon)
docker buildx build --platform linux/arm64 -t etsy-mcp-server:arm64 .
```

**Registry Deployment**:

```bash
# Tag for registry
docker tag etsy-mcp-server:latest your-registry.com/etsy-mcp-server:1.0.0

# Push to registry
docker push your-registry.com/etsy-mcp-server:1.0.0
```

### Docker Troubleshooting

**Common Issues:**

1. **Container exits immediately**: This is normal behavior for MCP servers when no client connects
2. **Permission denied**: Ensure Docker has proper file system access
3. **Settings file not found**: Check volume mount path matches your file location
4. **Environment variables not loaded**: Verify `.env` file syntax and variable names

**Debug Commands:**

```bash
# Check container logs
docker logs etsy-mcp-server

# Run container interactively for debugging
docker run -it --rm etsy-mcp-server sh

# Test container with manual input
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | docker run -i --rm etsy-mcp-server
```

## Available tools

Write tools are listed for completeness. They are blocked twice over: a read-only token cannot
use them at all, and the write guard refuses them unless `ETSY_ALLOW_LIVE_WRITES=true`.

### Shop

| Tool | What it does |
|---|---|
| `getShop` | Get shop information. |
| `getMe` | Get info about the authenticated user. |
| `getShopSections` | Get sections for a shop. |
| `getShopShippingProfiles` | List a shop's shipping profiles (rate cards). |
| `getHolidayPreferences` | List vacation-mode / holiday preferences for a shop. |
| `updateHolidayPreferences` | [WRITE — gated by ETSY_ALLOW_LIVE_WRITES] Toggle holiday/vacation mode for a holiday id. |
| `getShopByOwnerUserId` | Resolve a user_id to their shop(s). |
| `getShippingCarriers` | List Etsy-supported shipping carriers (carrier_name slugs for createReceiptShipment). |

### Listings

| Tool | What it does |
|---|---|
| `getListingsByShop` | Get listings for a given shop. |
| `createDraftListing` | Create a new draft listing. |
| `uploadListingImage` | Upload an image for a listing. |
| `updateListing` | Update an existing listing. |
| `getListingImages` | Get images for a listing. |
| `getListingFiles` | Get files for a digital listing. |
| `getListingInventory` | Get inventory details for a listing. |
| `updateListingInventory` | Update inventory for a listing. |
| `findAllActiveListings` | Public Etsy search across all shops. |
| `getListingsBatch` | Bulk-fetch listings by IDs (comma-separated, max 100). |
| `getListing` | Fetch a single listing by ID with optional includes (Images, Inventory, etc.). |
| `getListingProperty` | Fetch a single listing property (e.g. |

### Taxonomy

| Tool | What it does |
|---|---|
| `getSellerTaxonomyNodes` | Retrieve the full hierarchy tree of seller taxonomy nodes. |
| `getPropertiesByTaxonomyId` | Get product properties supported for a specific taxonomy ID. |

### Receipts and shipping

| Tool | What it does |
|---|---|
| `getShopReceipt` | Get a single receipt (order) by ID. |
| `updateShopReceipt` | [WRITE — gated by ETSY_ALLOW_LIVE_WRITES] Update receipt status flags (was_shipped, was_paid). |
| `createReceiptShipment` | [WRITE — gated by ETSY_ALLOW_LIVE_WRITES] Submit tracking number for a receipt. |
| `getShopReceipts` | List receipts (orders) for a shop. |

### Transactions

| Tool | What it does |
|---|---|
| `getShopTransactions` | List shop transactions (line items from receipts). |
| `getListingTransactions` | List transactions for a single listing — sales history for a specific SKU/product over time. |

### Finances

| Tool | What it does |
|---|---|
| `getLedgerEntries` | List shop payment-account ledger entries within a date window. |

### Reviews

| Tool | What it does |
|---|---|
| `getShopReviews` | List reviews for a shop. |
| `getListingReviews` | List reviews for a single listing. |

### Return policies

| Tool | What it does |
|---|---|
| `getShopReturnPolicies` | List a shop's return policies (return_policy_id, accepts_returns, accepts_exchanges, return_deadline). |
| `createShopReturnPolicy` | [WRITE — gated by ETSY_ALLOW_LIVE_WRITES] Create a new return policy for the shop. |

### Diagnostics

| Tool | What it does |
|---|---|
| `tokenScopes` | Diagnostic: list the OAuth scopes granted by an access token. |

## Debugging

### Using the MCP Inspector

For debugging and testing the server functionality, use the MCP Inspector with the **local development setup**:

```bash
npm run inspector
```

The inspector will:

1. Start a proxy server and web interface
2. Launch the locally built MCP server
3. Provide a URL to view communication logs and test tools interactively

**Important**: The MCP Inspector only works with the local development setup, not with Docker. This is because:

- Docker containers start and exit quickly when no MCP client connects
- The inspector needs direct access to the server process
- Network isolation prevents the inspector from communicating with containerized servers

### Recommended Debugging Workflow

1. **For Development and Testing**: Use local development with the MCP Inspector

   ```bash
   npm run build
   npm run inspector
   ```

2. **For Deployment**: Use Docker with MCP clients
   ```bash
   docker build -t etsy-mcp-server .
   # Then use with your MCP client
   ```

This approach gives you the best of both worlds: interactive debugging locally and reliable deployment with Docker.

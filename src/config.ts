import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export interface EtsyConfig {
  apiKey: string;
  sharedSecret: string;
  refreshToken: string;
}

// ETSY_SETTINGS_PATH lets the test suite point at a throwaway file instead of
// the real one. Without it, tests that assert "no settings file present" have
// to delete the user's actual credentials to pass. It is also how a single
// install serves two shops, each with its own credentials file.
export function resolveSettingsPath(): string {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  return process.env.ETSY_SETTINGS_PATH
    ? path.resolve(process.env.ETSY_SETTINGS_PATH)
    : path.join(__dirname, "..", "etsy_mcp_settings.json");
}

export function loadEtsyConfig(): EtsyConfig {
  // 1. Prefer values supplied via environment variables
  let apiKey: string | undefined = process.env.ETSY_API_KEY;
  let sharedSecret: string | undefined = process.env.ETSY_SHARED_SECRET;
  let refreshToken: string | undefined = process.env.ETSY_REFRESH_TOKEN;

  // 2. When any value is missing, attempt to read from the optional settings file
  if (!apiKey || !sharedSecret || !refreshToken) {
    try {
      const settingsPath = resolveSettingsPath();
      if (fs.existsSync(settingsPath)) {
        const raw = fs.readFileSync(settingsPath, "utf-8");
        const cfg = JSON.parse(raw)["etsy-mcp-server"] ?? {};
        // Only fill in values that are currently undefined so that env vars always win
        apiKey = apiKey || cfg.keystring;
        sharedSecret = sharedSecret || cfg.sharedSecret;
        refreshToken = refreshToken || cfg.refreshToken;
      }
    } catch {
      // The file is optional – ignore if it is missing or malformed
    }
  }

  // 3. Validate that we now have all required configuration pieces
  if (!apiKey || !sharedSecret || !refreshToken) {
    throw new Error(
      "ETSY_API_KEY, ETSY_SHARED_SECRET, and ETSY_REFRESH_TOKEN environment variables are required"
    );
  }

  return {
    apiKey,
    sharedSecret,
    refreshToken,
  };
}

// Etsy rotates the refresh token on every access-token refresh, and each new one
// is good for another 90 days. Storing it is what keeps this server working
// unattended: a token that is never replaced expires 90 days after the last
// manual login, no matter how often it is used, and from then on every call
// fails with "Failed to refresh Etsy access token" until someone walks through
// the OAuth flow again.
//
// Returns true when the new token was stored. A token supplied through
// ETSY_REFRESH_TOKEN is left alone, because loadEtsyConfig lets the environment
// win and writing the file would not change what the next start uses.
export function saveRefreshToken(refreshToken: string): boolean {
  if (process.env.ETSY_REFRESH_TOKEN) {
    return false;
  }

  const settingsPath = resolveSettingsPath();

  try {
    if (!fs.existsSync(settingsPath)) {
      return false;
    }

    const data = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
    if (!data["etsy-mcp-server"]) {
      data["etsy-mcp-server"] = {};
    }
    data["etsy-mcp-server"].refreshToken = refreshToken;

    // Write a sibling file and rename it over the original, so an interrupted
    // write cannot leave the only copy of the credentials truncated.
    const tempPath = `${settingsPath}.new`;
    try {
      // Drop any leftover first, so the 0600 mode is applied to a file this
      // call creates rather than silently kept from an older, laxer one.
      fs.rmSync(tempPath, { force: true });
      fs.writeFileSync(tempPath, `${JSON.stringify(data, null, 2)}\n`, { mode: 0o600 });
      fs.renameSync(tempPath, settingsPath);
    } catch (error: unknown) {
      // Otherwise a half-finished write sits there holding a live keystring,
      // shared secret and refresh token.
      fs.rmSync(tempPath, { force: true });
      throw error;
    }
    return true;
  } catch (error: unknown) {
    // Not fatal: the token held in memory still works for this process. Say so
    // anyway, because the next start falls back to the stale one on disk.
    console.error(
      "Could not store the rotated Etsy refresh token in",
      settingsPath,
      "-",
      error instanceof Error ? error.message : String(error)
    );
    return false;
  }
}

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadEtsyConfig, saveRefreshToken } from '../src/config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Point loadEtsyConfig at a throwaway file so these tests never read, write or
// delete the real etsy_mcp_settings.json, which holds live Etsy credentials.
// Set before the originalEnv snapshot below so afterEach keeps restoring it.
const settingsPath = path.join(__dirname, 'tmp-config-test-settings.json');
process.env.ETSY_SETTINGS_PATH = settingsPath;

function cleanup() {
  for (const file of [settingsPath, `${settingsPath}.new`]) {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
  }
}

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
  cleanup();
});

describe('loadEtsyConfig', () => {
  it('uses environment variables when set', () => {
    process.env.ETSY_API_KEY = 'key';
    process.env.ETSY_SHARED_SECRET = 'secret';
    process.env.ETSY_REFRESH_TOKEN = 'token';
    const cfg = loadEtsyConfig();
    expect(cfg).toEqual({ apiKey: 'key', sharedSecret: 'secret', refreshToken: 'token' });
  });

  it('reads from config file when env vars missing', () => {
    const data = {
      'etsy-mcp-server': {
        keystring: 'k',
        sharedSecret: 's',
        refreshToken: 'r',
      },
    };
    fs.writeFileSync(settingsPath, JSON.stringify(data));
    delete process.env.ETSY_API_KEY;
    delete process.env.ETSY_SHARED_SECRET;
    delete process.env.ETSY_REFRESH_TOKEN;
    const cfg = loadEtsyConfig();
    expect(cfg).toEqual({ apiKey: 'k', sharedSecret: 's', refreshToken: 'r' });
  });

  it('throws if config missing', () => {
    delete process.env.ETSY_API_KEY;
    delete process.env.ETSY_SHARED_SECRET;
    delete process.env.ETSY_REFRESH_TOKEN;
    expect(() => loadEtsyConfig()).toThrow(
      'ETSY_API_KEY, ETSY_SHARED_SECRET, and ETSY_REFRESH_TOKEN environment variables are required'
    );
  });
});

describe('saveRefreshToken', () => {
  it('replaces the stored token and leaves the other settings alone', () => {
    const data = {
      'etsy-mcp-server': {
        keystring: 'k',
        sharedSecret: 's',
        refreshToken: 'old',
        port: 3030,
      },
    };
    fs.writeFileSync(settingsPath, JSON.stringify(data));
    delete process.env.ETSY_REFRESH_TOKEN;

    expect(saveRefreshToken('fresh')).toBe(true);

    const stored = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))['etsy-mcp-server'];
    expect(stored).toEqual({ keystring: 'k', sharedSecret: 's', refreshToken: 'fresh', port: 3030 });
  });

  it('is readable again by loadEtsyConfig', () => {
    const data = {
      'etsy-mcp-server': { keystring: 'k', sharedSecret: 's', refreshToken: 'old' },
    };
    fs.writeFileSync(settingsPath, JSON.stringify(data));
    delete process.env.ETSY_API_KEY;
    delete process.env.ETSY_SHARED_SECRET;
    delete process.env.ETSY_REFRESH_TOKEN;

    saveRefreshToken('fresh');

    expect(loadEtsyConfig().refreshToken).toBe('fresh');
  });

  it('does not write when the token came from the environment', () => {
    const data = {
      'etsy-mcp-server': { keystring: 'k', sharedSecret: 's', refreshToken: 'old' },
    };
    fs.writeFileSync(settingsPath, JSON.stringify(data));
    process.env.ETSY_REFRESH_TOKEN = 'from-env';

    expect(saveRefreshToken('fresh')).toBe(false);

    const stored = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))['etsy-mcp-server'];
    expect(stored.refreshToken).toBe('old');
  });

  it('reports failure instead of throwing when there is no settings file', () => {
    cleanup();
    delete process.env.ETSY_REFRESH_TOKEN;

    expect(saveRefreshToken('fresh')).toBe(false);
  });

  it('leaves no temporary file behind', () => {
    const data = {
      'etsy-mcp-server': { keystring: 'k', sharedSecret: 's', refreshToken: 'old' },
    };
    fs.writeFileSync(settingsPath, JSON.stringify(data));
    delete process.env.ETSY_REFRESH_TOKEN;

    saveRefreshToken('fresh');

    expect(fs.existsSync(`${settingsPath}.new`)).toBe(false);
  });

  it('removes the temporary file when the write cannot be completed', () => {
    const data = {
      'etsy-mcp-server': { keystring: 'k', sharedSecret: 's', refreshToken: 'old' },
    };
    fs.writeFileSync(settingsPath, JSON.stringify(data));
    delete process.env.ETSY_REFRESH_TOKEN;

    const rename = vi.spyOn(fs, 'renameSync').mockImplementation(() => {
      throw new Error('rename failed');
    });
    const logged = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    try {
      expect(saveRefreshToken('fresh')).toBe(false);
      // The temp file held the same live credentials as the real one.
      expect(fs.existsSync(`${settingsPath}.new`)).toBe(false);
      // And the original is left as it was, not half written.
      const stored = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))['etsy-mcp-server'];
      expect(stored.refreshToken).toBe('old');
    } finally {
      rename.mockRestore();
      logged.mockRestore();
    }
  });
});

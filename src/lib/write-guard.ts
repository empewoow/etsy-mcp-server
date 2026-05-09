// Refuses live Etsy writes unless ETSY_ALLOW_LIVE_WRITES is the literal string "true".
// Wrap every mutating handler with this so dev/test never accidentally creates a
// real listing, ships an order, or alters policy on the live shop.
export function requireLiveWrites(): void {
  if (process.env.ETSY_ALLOW_LIVE_WRITES !== "true") {
    throw new Error(
      "ETSY_LIVE_WRITES_DISABLED: this tool mutates Etsy. " +
        "Set ETSY_ALLOW_LIVE_WRITES=true (literal string) and restart the container to enable."
    );
  }
}

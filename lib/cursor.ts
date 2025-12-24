type FeedCursor = {
  publishedAt: string; // ISO
  tweetId: string;
};

function base64UrlEncode(input: string) {
  return Buffer.from(input, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(input: string) {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4 === 0 ? "" : "=".repeat(4 - (base64.length % 4));
  return Buffer.from(base64 + pad, "base64").toString("utf8");
}

export function encodeCursor(cursor: FeedCursor): string {
  return base64UrlEncode(JSON.stringify(cursor));
}

export function decodeCursor(raw: string | null): FeedCursor | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(base64UrlDecode(raw)) as FeedCursor;
    if (!parsed?.publishedAt || !parsed?.tweetId) return null;
    // basic validation
    const d = new Date(parsed.publishedAt);
    if (Number.isNaN(d.getTime())) return null;
    return { publishedAt: d.toISOString(), tweetId: String(parsed.tweetId) };
  } catch {
    return null;
  }
}






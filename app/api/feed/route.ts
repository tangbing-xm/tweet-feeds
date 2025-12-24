import { NextResponse } from "next/server";
import { and, desc, eq, gte, lt, or } from "drizzle-orm";

import { db } from "@/db";
import { tweets, vendors } from "@/db/schema";
import { decodeCursor, encodeCursor } from "@/lib/cursor";
import { beijingDayRangeUtc } from "@/lib/beijing";

function clampInt(raw: string | null, def: number, min: number, max: number) {
  const n = raw ? Number.parseInt(raw, 10) : def;
  if (Number.isNaN(n)) return def;
  return Math.max(min, Math.min(max, n));
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = (url.searchParams.get("mode") ?? "timeline").toLowerCase();
  const vendorSlug = (url.searchParams.get("vendor") ?? "all").toLowerCase();
  const limit = clampInt(url.searchParams.get("limit"), 10, 1, 30);
  const cursor = decodeCursor(url.searchParams.get("cursor"));

  let where = undefined as ReturnType<typeof and> | undefined;

  if (mode === "date") {
    const date = url.searchParams.get("date");
    if (!date) {
      return NextResponse.json(
        { error: "Missing date. Use YYYY-MM-DD." },
        { status: 400 },
      );
    }
    let range: { startUtc: Date; endUtc: Date };
    try {
      range = beijingDayRangeUtc(date);
    } catch (e) {
      return NextResponse.json(
        { error: (e as Error).message },
        { status: 400 },
      );
    }
    where = and(gte(tweets.publishedAt, range.startUtc), lt(tweets.publishedAt, range.endUtc));
  } else {
    // timeline
    const windowHours = clampInt(url.searchParams.get("windowHours"), 72, 1, 168);
    const since = new Date(Date.now() - windowHours * 60 * 60 * 1000);
    where = and(gte(tweets.publishedAt, since));
  }

  if (vendorSlug !== "all") {
    where = where
      ? and(where, eq(vendors.slug, vendorSlug))
      : and(eq(vendors.slug, vendorSlug));
  }

  if (cursor) {
    const cursorDate = new Date(cursor.publishedAt);
    const cursorTweetId = cursor.tweetId;
    // Keyset pagination for (published_at DESC, tweet_id DESC)
    where = where
      ? and(
          where,
          or(
            lt(tweets.publishedAt, cursorDate),
            and(eq(tweets.publishedAt, cursorDate), lt(tweets.tweetId, cursorTweetId)),
          ),
        )
      : and(
          or(
            lt(tweets.publishedAt, cursorDate),
            and(eq(tweets.publishedAt, cursorDate), lt(tweets.tweetId, cursorTweetId)),
          ),
        );
  }

  const rows = await db
    .select({
      tweetId: tweets.tweetId,
      tweetUrl: tweets.tweetUrl,
      publishedAt: tweets.publishedAt,
      vendor: vendors.slug,
    })
    .from(tweets)
    .innerJoin(vendors, eq(tweets.vendorId, vendors.id))
    .where(where)
    .orderBy(desc(tweets.publishedAt), desc(tweets.tweetId))
    .limit(limit);

  const items = rows.map((r) => ({
    tweet_id: r.tweetId,
    tweet_url: r.tweetUrl,
    vendor: r.vendor,
    published_at: r.publishedAt.toISOString(),
  }));

  const last = rows.at(-1);
  const nextCursor =
    last && rows.length === limit
      ? encodeCursor({
          publishedAt: last.publishedAt.toISOString(),
          tweetId: last.tweetId,
        })
      : null;

  return NextResponse.json({ items, nextCursor });
}



import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";

import { db } from "@/db";
import { dailyIndex } from "@/db/schema";

function clampInt(raw: string | null, def: number, min: number, max: number) {
  const n = raw ? Number.parseInt(raw, 10) : def;
  if (Number.isNaN(n)) return def;
  return Math.max(min, Math.min(max, n));
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = clampInt(url.searchParams.get("limit"), 120, 1, 400);

  const rows = await db
    .select({
      date_beijing: dailyIndex.dateBeijing,
      tweet_count: dailyIndex.tweetCount,
      updated_at: dailyIndex.updatedAt,
    })
    .from(dailyIndex)
    .orderBy(desc(dailyIndex.dateBeijing))
    .limit(limit);

  const items = rows.map((r) => ({
    date: r.date_beijing,
    tweet_count: r.tweet_count,
    updated_at: r.updated_at.toISOString(),
  }));

  return NextResponse.json({ items });
}



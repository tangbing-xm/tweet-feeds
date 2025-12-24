import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";

import { db, sql } from "@/db";
import { dailyIndex } from "@/db/schema";

function clampInt(raw: string | null, def: number, min: number, max: number) {
  const n = raw ? Number.parseInt(raw, 10) : def;
  if (Number.isNaN(n)) return def;
  return Math.max(min, Math.min(max, n));
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = clampInt(url.searchParams.get("limit"), 120, 1, 400);

  const cacheControl = "public, s-maxage=3600, stale-while-revalidate=86400";

  try {
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

    return NextResponse.json({ items }, { headers: { "Cache-Control": cacheControl } });
  } catch {
    // Fallback: compute dates from tweets if `daily_index` is missing/unavailable.
    const rows = (await sql`
      select
        to_char(timezone('Asia/Shanghai', published_at), 'YYYY-MM-DD') as date,
        count(*)::int as tweet_count,
        max(fetched_at) as updated_at
      from tweets
      group by 1
      order by 1 desc
      limit ${limit}
    `) as Array<{ date: string; tweet_count: number; updated_at: string }>;

    const items = rows.map((r) => ({
      date: r.date,
      tweet_count: r.tweet_count,
      updated_at: new Date(r.updated_at).toISOString(),
    }));

    return NextResponse.json({ items }, { headers: { "Cache-Control": cacheControl } });
  }
}



import { NextResponse } from "next/server";
import { and, desc, eq, gte, lt, sql } from "drizzle-orm";

import { db } from "@/db";
import { accounts, dailyIndex, tweets } from "@/db/schema";
import { toBeijingDateString, beijingDayRangeUtc } from "@/lib/beijing";
import { getUserLastTweetsPage } from "@/lib/twitterapi";

const LOOKBACK_HOURS = 72;
const MAX_PAGES_PER_ACCOUNT = 5;
const MIN_TWITTERAPI_INTERVAL_MS = 6500; // free-tier: 1 request / 5s (leave buffer)

function isAuthorized(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;

  const url = new URL(req.url);
  const qs = url.searchParams.get("secret");
  if (qs && qs === secret) return true;

  const header = req.headers.get("x-cron-secret");
  if (header && header === secret) return true;

  const auth = req.headers.get("authorization");
  if (auth && auth === `Bearer ${secret}`) return true;

  return false;
}

async function handleIngest(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.TWITTERAPI_IO_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing TWITTERAPI_IO_KEY" },
      { status: 500 },
    );
  }

  const now = new Date();
  const lookbackStart = new Date(Date.now() - LOOKBACK_HOURS * 60 * 60 * 1000);

  const activeAccounts = await db
    .select({
      id: accounts.id,
      vendorId: accounts.vendorId,
      handle: accounts.handle,
    })
    .from(accounts)
    .where(eq(accounts.isActive, true))
    .orderBy(desc(accounts.id));

  const touchedDates = new Set<string>();
  let inserted = 0;
  let fetched = 0;
  const errors: Array<{ handle: string; error: string }> = [];
  let lastTwitterApiCallAt = 0;

  async function rateLimitTwitterApi() {
    const nowMs = Date.now();
    const waitMs = lastTwitterApiCallAt + MIN_TWITTERAPI_INTERVAL_MS - nowMs;
    if (waitMs > 0) {
      await new Promise((r) => setTimeout(r, waitMs));
    }
    lastTwitterApiCallAt = Date.now();
  }

  for (const account of activeAccounts) {
    try {
      let cursor = "";
      let pages = 0;
      let newestTweetId: string | null = null;
      let newestPublishedAt: Date | null = null;

      while (pages < MAX_PAGES_PER_ACCOUNT) {
        await rateLimitTwitterApi();
        let page;
        try {
          page = await getUserLastTweetsPage({
            apiKey,
            userName: account.handle,
            cursor,
            includeReplies: false,
          });
        } catch (e) {
          const msg = (e as Error).message ?? String(e);
          if (msg.includes("HTTP 429")) {
            await new Promise((r) => setTimeout(r, MIN_TWITTERAPI_INTERVAL_MS));
            page = await getUserLastTweetsPage({
              apiKey,
              userName: account.handle,
              cursor,
              includeReplies: false,
            });
          } else {
            throw e;
          }
        }

        pages += 1;
        cursor = page.nextCursor;
        fetched += page.tweets.length;

        if (!newestTweetId && page.tweets[0]?.id && page.tweets[0]?.createdAt) {
          const d = new Date(page.tweets[0].createdAt);
          if (!Number.isNaN(d.getTime())) {
            newestTweetId = page.tweets[0].id;
            newestPublishedAt = d;
          }
        }

        const values = [];
        let oldestCreatedAt: Date | null = null;

        for (const t of page.tweets) {
          const publishedAt = new Date(t.createdAt);
          if (Number.isNaN(publishedAt.getTime())) continue;

          if (!oldestCreatedAt || publishedAt.getTime() < oldestCreatedAt.getTime()) {
            oldestCreatedAt = publishedAt;
          }

          if (publishedAt < lookbackStart) continue;
          if (t.isReply) continue;
          if (t.retweeted_tweet) continue; // default exclude retweets

          touchedDates.add(toBeijingDateString(publishedAt));

          values.push({
            tweetId: t.id,
            accountId: account.id,
            vendorId: account.vendorId,
            tweetUrl: t.twitterUrl ?? t.url,
            publishedAt,
            fetchedAt: now,
            isReply: Boolean(t.isReply),
            isRetweet: Boolean(t.retweeted_tweet),
            lang: t.lang ?? null,
            rawJson: null,
          });
        }

        if (values.length > 0) {
          const res = await db.insert(tweets).values(values).onConflictDoNothing();
          // drizzle doesn't return inserted count reliably across drivers; track by values length for now
          inserted += values.length;
          void res;
        }

        // stop if already beyond lookback (timeline is desc)
        if (oldestCreatedAt && oldestCreatedAt < lookbackStart) break;
        if (!page.hasNextPage) break;
        if (!page.nextCursor) break;
      }

      if (newestTweetId && newestPublishedAt) {
        await db
          .update(accounts)
          .set({
            lastSeenTweetId: newestTweetId,
            lastSeenPublishedAt: newestPublishedAt,
            updatedAt: now,
          })
          .where(eq(accounts.id, account.id));
      }
    } catch (e) {
      errors.push({
        handle: account.handle,
        error: (e as Error).message ?? String(e),
      });
    }
  }

  // Update daily_index for touched Beijing dates (small, incremental)
  for (const dateBeijing of touchedDates) {
    const range = beijingDayRangeUtc(dateBeijing);
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(tweets)
      .where(
        and(
          gte(tweets.publishedAt, range.startUtc),
          lt(tweets.publishedAt, range.endUtc),
        ),
      );

    await db
      .insert(dailyIndex)
      .values({ dateBeijing, tweetCount: count, updatedAt: now })
      .onConflictDoUpdate({
        target: dailyIndex.dateBeijing,
        set: { tweetCount: count, updatedAt: now },
      });
  }

  return NextResponse.json({
    status: "ok",
    fetched,
    inserted,
    touchedDates: touchedDates.size,
    errors,
  });
}

// Vercel Cron triggers an HTTP GET request by default.
export async function GET(req: Request) {
  return handleIngest(req);
}

export async function POST(req: Request) {
  return handleIngest(req);
}



import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const vendors = pgTable(
  "vendors",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull(),
    nameEn: text("name_en").notNull(),
    nameZh: text("name_zh").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => ({
    slugIdx: uniqueIndex("vendors_slug_unique").on(t.slug),
  }),
);

export const accounts = pgTable(
  "accounts",
  {
    id: serial("id").primaryKey(),
    vendorId: integer("vendor_id")
      .notNull()
      .references(() => vendors.id, { onDelete: "restrict" }),
    handle: text("handle").notNull(),
    displayName: text("display_name"),
    isActive: boolean("is_active").notNull().default(true),
    lastSeenTweetId: text("last_seen_tweet_id"),
    lastSeenPublishedAt: timestamp("last_seen_published_at", {
      withTimezone: true,
      mode: "date",
    }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    handleIdx: uniqueIndex("accounts_handle_unique").on(t.handle),
    vendorIdx: index("accounts_vendor_id_idx").on(t.vendorId),
  }),
);

export const tweets = pgTable(
  "tweets",
  {
    tweetId: text("tweet_id").primaryKey(),
    accountId: integer("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "restrict" }),
    vendorId: integer("vendor_id")
      .notNull()
      .references(() => vendors.id, { onDelete: "restrict" }),
    tweetUrl: text("tweet_url").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true, mode: "date" })
      .notNull(),
    fetchedAt: timestamp("fetched_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    isReply: boolean("is_reply").notNull().default(false),
    isRetweet: boolean("is_retweet").notNull().default(false),
    lang: text("lang"),
    rawJson: jsonb("raw_json"),
  },
  (t) => ({
    publishedAtIdx: index("tweets_published_at_idx").on(t.publishedAt),
    vendorPublishedAtIdx: index("tweets_vendor_published_at_idx").on(
      t.vendorId,
      t.publishedAt,
    ),
    accountPublishedAtIdx: index("tweets_account_published_at_idx").on(
      t.accountId,
      t.publishedAt,
    ),
  }),
);

export const dailyIndex = pgTable("daily_index", {
  dateBeijing: date("date_beijing").primaryKey(),
  tweetCount: integer("tweet_count").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});



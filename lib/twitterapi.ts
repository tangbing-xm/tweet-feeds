export type TwitterApiTweet = {
  id: string;
  url: string;
  twitterUrl?: string;
  createdAt: string;
  lang?: string;
  isReply?: boolean;
  retweeted_tweet?: unknown;
};

export type TwitterApiLastTweetsPage = {
  tweets: TwitterApiTweet[];
  hasNextPage: boolean;
  nextCursor: string;
};

type TwitterApiRawLastTweetsResponse = {
  status?: "success" | "error";
  code?: number;
  msg?: string;
  message?: string;
  data?: { tweets?: TwitterApiTweet[] };
  tweets?: TwitterApiTweet[];
  has_next_page?: boolean;
  next_cursor?: string;
};

export async function getUserLastTweetsPage(params: {
  apiKey: string;
  userName: string;
  cursor?: string;
  includeReplies?: boolean;
}): Promise<TwitterApiLastTweetsPage> {
  const url = new URL("https://api.twitterapi.io/twitter/user/last_tweets");
  url.searchParams.set("userName", params.userName);
  url.searchParams.set("cursor", params.cursor ?? "");
  url.searchParams.set("includeReplies", String(params.includeReplies ?? false));

  const res = await fetch(url.toString(), {
    headers: { "X-API-Key": params.apiKey },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`twitterapi.io HTTP ${res.status}: ${text.slice(0, 300)}`);
  }

  const json = (await res.json()) as TwitterApiRawLastTweetsResponse;
  const message = json?.msg ?? json?.message ?? "unknown";
  if (!json || json.status !== "success") {
    throw new Error(`twitterapi.io error: ${message}`);
  }

  const tweets = (json.data?.tweets ?? json.tweets) as unknown;
  if (!Array.isArray(tweets)) {
    throw new Error(`twitterapi.io error: invalid response shape (tweets): ${message}`);
  }

  return {
    tweets,
    hasNextPage: Boolean(json.has_next_page),
    nextCursor: json.next_cursor ?? "",
  };
}



import { config } from "dotenv";
import { sql } from "drizzle-orm";

// Load env for local usage (compatible with your drizzle.config.ts)
config({ path: ".env.local" });
config();

type VendorSeed = {
  slug: string;
  nameEn: string;
  nameZh: string;
  sortOrder: number;
};

type AccountSeed = {
  vendorSlug: string;
  handle: string;
  displayName?: string;
};

// Full vendor list with all AI companies
const VENDORS: VendorSeed[] = [
  // Foundation Models
  { slug: "openai", nameEn: "OpenAI", nameZh: "OpenAI", sortOrder: 10 },
  { slug: "anthropic", nameEn: "Anthropic", nameZh: "Anthropic", sortOrder: 20 },
  { slug: "google", nameEn: "Google DeepMind", nameZh: "谷歌 DeepMind", sortOrder: 30 },
  { slug: "meta", nameEn: "Meta AI", nameZh: "Meta AI", sortOrder: 40 },
  { slug: "mistral", nameEn: "Mistral AI", nameZh: "Mistral AI", sortOrder: 50 },
  { slug: "deepseek", nameEn: "DeepSeek", nameZh: "深度求索", sortOrder: 60 },
  { slug: "qwen", nameEn: "Qwen", nameZh: "通义千问", sortOrder: 70 },
  { slug: "xai", nameEn: "xAI", nameZh: "xAI", sortOrder: 80 },
  
  // Applications & Search
  { slug: "perplexity", nameEn: "Perplexity", nameZh: "Perplexity", sortOrder: 100 },
  
  // Image & Video Generation
  { slug: "blackforest", nameEn: "Black Forest Labs", nameZh: "Black Forest Labs", sortOrder: 110 },
  { slug: "stability", nameEn: "Stability AI", nameZh: "Stability AI", sortOrder: 120 },
  { slug: "midjourney", nameEn: "Midjourney", nameZh: "Midjourney", sortOrder: 130 },
  { slug: "runway", nameEn: "Runway", nameZh: "Runway", sortOrder: 140 },
  { slug: "luma", nameEn: "Luma AI", nameZh: "Luma AI", sortOrder: 150 },
  { slug: "pika", nameEn: "Pika", nameZh: "Pika", sortOrder: 160 },
  { slug: "kimi", nameEn: "Kimi", nameZh: "Kimi 月之暗面", sortOrder: 170 },
  
  // Infrastructure & Tools
  { slug: "huggingface", nameEn: "Hugging Face", nameZh: "Hugging Face", sortOrder: 200 },
  { slug: "replicate", nameEn: "Replicate", nameZh: "Replicate", sortOrder: 210 },
  { slug: "together", nameEn: "Together AI", nameZh: "Together AI", sortOrder: 220 },
  { slug: "vercel", nameEn: "Vercel", nameZh: "Vercel", sortOrder: 230 },
  
  // Catch-all
  { slug: "other", nameEn: "Other", nameZh: "其他", sortOrder: 999 },
];

// Full accounts list from user's X handle list
const ACCOUNTS: AccountSeed[] = [
  // Foundation Models
  { vendorSlug: "openai", handle: "OpenAI", displayName: "OpenAI" },
  { vendorSlug: "anthropic", handle: "AnthropicAI", displayName: "Anthropic" },
  { vendorSlug: "google", handle: "GoogleDeepMind", displayName: "Google DeepMind" },
  { vendorSlug: "meta", handle: "MetaAI", displayName: "Meta AI" },
  { vendorSlug: "mistral", handle: "MistralAI", displayName: "Mistral AI" },
  { vendorSlug: "deepseek", handle: "deepseek_ai", displayName: "DeepSeek" },
  { vendorSlug: "qwen", handle: "Alibaba_Qwen", displayName: "Alibaba Qwen" },
  { vendorSlug: "xai", handle: "xAI", displayName: "xAI (Grok)" },
  
  // Applications & Search
  { vendorSlug: "perplexity", handle: "perplexity_ai", displayName: "Perplexity" },
  
  // Image & Video Generation
  { vendorSlug: "blackforest", handle: "blackforestlabs", displayName: "Black Forest Labs (Flux)" },
  { vendorSlug: "stability", handle: "StabilityAI", displayName: "Stability AI" },
  { vendorSlug: "midjourney", handle: "midjourney", displayName: "Midjourney" },
  { vendorSlug: "runway", handle: "runwayml", displayName: "Runway" },
  { vendorSlug: "luma", handle: "LumaAI", displayName: "Luma AI" },
  { vendorSlug: "pika", handle: "pika_labs", displayName: "Pika" },
  { vendorSlug: "kimi", handle: "Kimi_Moonshot", displayName: "Moonshot AI (Kimi)" },
  
  // Infrastructure & Tools
  { vendorSlug: "huggingface", handle: "huggingface", displayName: "Hugging Face" },
  { vendorSlug: "replicate", handle: "replicate", displayName: "Replicate" },
  { vendorSlug: "together", handle: "togethercompute", displayName: "Together AI" },
  { vendorSlug: "vercel", handle: "vercel", displayName: "Vercel (AI SDK)" },
];

function uniqueBy<T>(items: T[], key: (t: T) => string) {
  const map = new Map<string, T>();
  for (const item of items) map.set(key(item), item);
  return [...map.values()];
}

async function main() {
  const now = new Date();
  const [{ db }, { accounts, vendors }] = await Promise.all([
    import("./index"),
    import("./schema"),
  ]);

  // Upsert vendors
  await db
    .insert(vendors)
    .values(VENDORS)
    .onConflictDoUpdate({
      target: vendors.slug,
      set: {
        nameEn: sql`excluded.name_en`,
        nameZh: sql`excluded.name_zh`,
        sortOrder: sql`excluded.sort_order`,
      },
    });

  const vendorRows = await db
    .select({ id: vendors.id, slug: vendors.slug })
    .from(vendors);
  const vendorIdBySlug = new Map(vendorRows.map((v) => [v.slug, v.id]));

  const accountValues = uniqueBy(ACCOUNTS, (a) => a.handle).map((a) => {
    const vendorId = vendorIdBySlug.get(a.vendorSlug);
    if (!vendorId) {
      throw new Error(`Unknown vendorSlug for account: ${a.vendorSlug}`);
    }
    return {
      vendorId,
      handle: a.handle,
      displayName: a.displayName,
      isActive: true,
      updatedAt: now,
    };
  });

  // Upsert accounts
  await db
    .insert(accounts)
    .values(accountValues)
    .onConflictDoUpdate({
      target: accounts.handle,
      set: {
        vendorId: sql`excluded.vendor_id`,
        displayName: sql`excluded.display_name`,
        isActive: sql`excluded.is_active`,
        updatedAt: sql`excluded.updated_at`,
      },
    });

  console.log(
    `Seed complete: vendors=${VENDORS.length}, accounts=${accountValues.length}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

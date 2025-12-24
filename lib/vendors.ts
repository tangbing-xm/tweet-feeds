// Vendor configuration for frontend display
export interface Vendor {
  slug: string;
  nameEn: string;
  nameZh: string;
  color: string; // Accent color for the vendor chip
}

export const VENDORS: Vendor[] = [
  // Foundation Models
  { slug: "openai", nameEn: "OpenAI", nameZh: "OpenAI", color: "#10A37F" },
  { slug: "anthropic", nameEn: "Anthropic", nameZh: "Anthropic", color: "#D4A574" },
  { slug: "google", nameEn: "Google DeepMind", nameZh: "谷歌 DeepMind", color: "#4285F4" },
  { slug: "meta", nameEn: "Meta AI", nameZh: "Meta AI", color: "#0668E1" },
  { slug: "mistral", nameEn: "Mistral AI", nameZh: "Mistral AI", color: "#FF7000" },
  { slug: "deepseek", nameEn: "DeepSeek", nameZh: "深度求索", color: "#4F46E5" },
  { slug: "qwen", nameEn: "Qwen", nameZh: "通义千问", color: "#FF6A00" },
  { slug: "xai", nameEn: "xAI", nameZh: "xAI", color: "#1D1D1F" },
  
  // Applications & Search
  { slug: "perplexity", nameEn: "Perplexity", nameZh: "Perplexity", color: "#20B8CD" },
  
  // Image & Video Generation
  { slug: "blackforest", nameEn: "Black Forest Labs", nameZh: "Black Forest Labs", color: "#2D3748" },
  { slug: "stability", nameEn: "Stability AI", nameZh: "Stability AI", color: "#7C3AED" },
  { slug: "midjourney", nameEn: "Midjourney", nameZh: "Midjourney", color: "#5865F2" },
  { slug: "runway", nameEn: "Runway", nameZh: "Runway", color: "#00D4FF" },
  { slug: "luma", nameEn: "Luma AI", nameZh: "Luma AI", color: "#8B5CF6" },
  { slug: "pika", nameEn: "Pika", nameZh: "Pika", color: "#EC4899" },
  { slug: "kimi", nameEn: "Kimi", nameZh: "Kimi 月之暗面", color: "#6366F1" },
  
  // Infrastructure & Tools
  { slug: "huggingface", nameEn: "Hugging Face", nameZh: "Hugging Face", color: "#FFD21E" },
  { slug: "replicate", nameEn: "Replicate", nameZh: "Replicate", color: "#3B82F6" },
  { slug: "together", nameEn: "Together AI", nameZh: "Together AI", color: "#10B981" },
  { slug: "vercel", nameEn: "Vercel", nameZh: "Vercel", color: "#000000" },
];

export function getVendorBySlug(slug: string): Vendor | undefined {
  return VENDORS.find((v) => v.slug === slug);
}

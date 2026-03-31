import { NextRequest, NextResponse } from "next/server";
import { PRODUCTS } from "@/lib/products";
import { buildSystemPrompt } from "@/lib/system-prompt";

function checkAuth(req: NextRequest): boolean {
  const pw = req.headers.get("x-admin-password");
  return pw === (process.env.ADMIN_PASSWORD ?? "yamano2024");
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const USE_REDIS = !!(
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  );

  let redisProducts = null;
  let redisError = null;

  if (USE_REDIS) {
    try {
      const { Redis } = await import("@upstash/redis");
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      });
      redisProducts = await redis.get("yamano_products");
    } catch (e) {
      redisError = String(e);
    }
  }

  const products = Array.isArray(redisProducts) ? redisProducts : PRODUCTS;

  // 商品をシリーズ別に集計
  const seriesMap: Record<string, number> = {};
  for (const p of products) {
    const s = (p as { series?: string }).series || "(未設定)";
    seriesMap[s] = (seriesMap[s] ?? 0) + 1;
  }

  // システムプロンプトの先頭500文字（商品リスト部分の確認用）
  const prompt = buildSystemPrompt(products as typeof PRODUCTS);
  const promptSnippet = prompt.slice(prompt.indexOf("## 提案可能な商品リスト"), prompt.indexOf("## 会話の次のステップ提案")).trim();

  return NextResponse.json({
    source: USE_REDIS ? (redisProducts ? "redis" : "redis_empty→fallback") : "memory/static",
    redisError,
    totalProducts: products.length,
    seriesSummary: seriesMap,
    productIds: (products as { id: string }[]).map((p) => p.id),
    promptProductSection: promptSnippet,
  });
}

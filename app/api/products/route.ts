import { NextRequest, NextResponse } from "next/server";
import { PRODUCTS, Product } from "@/lib/products";

// Vercel KV が使える環境（本番）かどうかを判定
const USE_KV = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
const KV_KEY = "yamano_products";

// ローカル開発用フォールバック（インメモリ）
let memoryStore: Product[] | null = null;

async function getProducts(): Promise<Product[]> {
  if (USE_KV) {
    const { kv } = await import("@vercel/kv");
    return (await kv.get<Product[]>(KV_KEY)) ?? JSON.parse(JSON.stringify(PRODUCTS));
  }
  return memoryStore ?? JSON.parse(JSON.stringify(PRODUCTS));
}

async function saveProducts(products: Product[]): Promise<void> {
  if (USE_KV) {
    const { kv } = await import("@vercel/kv");
    await kv.set(KV_KEY, products);
  } else {
    memoryStore = products;
  }
}

function checkAuth(req: NextRequest): boolean {
  const pw = req.headers.get("x-admin-password");
  return pw === (process.env.ADMIN_PASSWORD ?? "yamano2024");
}

export async function GET() {
  const products = await getProducts();
  return NextResponse.json(products);
}

export async function PUT(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body: Product[] = await req.json();
  const updated = body.map((p) => ({
    ...p,
    priceLabel: `¥${Number(p.price).toLocaleString("ja-JP")}`,
  }));
  await saveProducts(updated);
  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from "next/server";
import { PRODUCTS, Product } from "@/lib/products";

// In-memory store — initialized from lib/products.ts on first load
// Persists across requests on a single Node.js process (Render)
let store: Product[] = JSON.parse(JSON.stringify(PRODUCTS));

function checkAuth(req: NextRequest): boolean {
  const pw = req.headers.get("x-admin-password");
  return pw === (process.env.ADMIN_PASSWORD ?? "yamano2024");
}

export async function GET() {
  return NextResponse.json(store);
}

export async function PUT(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body: Product[] = await req.json();
  // Auto-update priceLabel when price changes
  store = body.map((p) => ({
    ...p,
    priceLabel: `¥${Number(p.price).toLocaleString("ja-JP")}`,
  }));
  return NextResponse.json({ ok: true });
}

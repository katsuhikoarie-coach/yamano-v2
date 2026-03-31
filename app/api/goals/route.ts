import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_GOALS, SkinGoal } from "@/lib/goals";

const USE_REDIS = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
const REDIS_KEY = "yamano_goals";

let memoryStore: SkinGoal[] | null = null;

async function getGoals(): Promise<SkinGoal[]> {
  if (USE_REDIS) {
    const { Redis } = await import("@upstash/redis");
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
    return (await redis.get<SkinGoal[]>(REDIS_KEY)) ?? JSON.parse(JSON.stringify(DEFAULT_GOALS));
  }
  return memoryStore ?? JSON.parse(JSON.stringify(DEFAULT_GOALS));
}

async function saveGoals(goals: SkinGoal[]): Promise<void> {
  if (USE_REDIS) {
    const { Redis } = await import("@upstash/redis");
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
    await redis.set(REDIS_KEY, goals);
  } else {
    memoryStore = goals;
  }
}

function checkAuth(req: NextRequest): boolean {
  const pw = req.headers.get("x-admin-password");
  return pw === (process.env.ADMIN_PASSWORD ?? "yamano2024");
}

export async function GET() {
  return NextResponse.json(await getGoals());
}

export async function PUT(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const goals: SkinGoal[] = await req.json();
  await saveGoals(goals);
  return NextResponse.json({ ok: true });
}

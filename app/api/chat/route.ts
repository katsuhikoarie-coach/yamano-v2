import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildSystemPrompt } from "@/lib/system-prompt";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: buildSystemPrompt(),
    });

    // Gemini用にメッセージ形式を変換
    const allConverted = messages.map((m: { role: string; content: string }) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    // 最後のメッセージ（user）を取り出す
    const lastMessage = allConverted[allConverted.length - 1];
    const historyRaw = allConverted.slice(0, -1);

    // historyはuserから始まり、user/modelが交互である必要がある
    // userから始まる部分だけ残す
    const firstUserIdx = historyRaw.findIndex((m: { role: string }) => m.role === "user");
    const history = firstUserIdx >= 0 ? historyRaw.slice(firstUserIdx) : [];

    const chat = model.startChat({ history });
    const result = await chat.sendMessageStream(lastMessage.parts[0].text);

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
            );
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

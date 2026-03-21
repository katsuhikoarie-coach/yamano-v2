import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildSystemPrompt } from "@/lib/system-prompt";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: buildSystemPrompt(),
    });

    // assistantの挨拶（最初のmessage）はGeminiに渡さない
    // userメッセージだけを取り出す
    const userMessages = messages.filter(
      (m: { role: string; content: string }) => m.role === "user"
    );

    if (userMessages.length === 0) {
      return NextResponse.json({ error: "No user messages" }, { status: 400 });
    }

    // 最後のuserメッセージを送信メッセージに、それ以前をhistoryに
    const lastUserMsg = userMessages[userMessages.length - 1];
    const prevUserMsgs = userMessages.slice(0, -1);

    // historyはuser/modelが交互になる形で構築
    // 過去のuserメッセージを元にhistoryを作る（modelの返答がないので単純にuserのみ）
    // ただしGeminiはhistoryがuser→modelの交互でないといけないため
    // 過去のやりとりをmessages全体から再構成する
    const allMessages = messages as { role: string; content: string }[];
    
    // assistantから始まる場合は除去してuserから始めるようにする
    const firstUserIdx = allMessages.findIndex(m => m.role === "user");
    if (firstUserIdx < 0) {
      return NextResponse.json({ error: "No user messages found" }, { status: 400 });
    }

    const trimmed = allMessages.slice(firstUserIdx);
    
    // 最後のuserメッセージを送信用に取り出し、残りをhistoryに
    const historyMessages = trimmed.slice(0, -1);
    const sendMessage = trimmed[trimmed.length - 1];

    // Gemini形式に変換
    const history = historyMessages.map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const chat = model.startChat({ history });
    const result = await chat.sendMessageStream(sendMessage.content);

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
              );
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } finally {
          controller.close();
        }
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
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error", detail: String(error) },
      { status: 500 }
    );
  }
}

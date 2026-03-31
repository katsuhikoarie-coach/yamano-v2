"use client";

import { useState, useRef, useEffect } from "react";
import { CONCERNS, Product } from "@/lib/products";
import { SkinGoal } from "@/lib/goals";
import { ProductCard } from "@/components/ProductCard";

type Message = {
  role: "user" | "assistant";
  content: string;
  products?: Product[];
};

type Step = "concern" | "ideal" | "chat";

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [goals, setGoals] = useState<SkinGoal[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [step, setStep] = useState<Step>("concern");
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>([]);
  const [selectedIdeals, setSelectedIdeals] = useState<string[]>([]);
  const [inputText, setInputText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [goalsOpen, setGoalsOpen] = useState(false);
  const [staffNote, setStaffNote] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch("/api/products").then((r) => r.json()).then(setProducts);
    fetch("/api/goals").then((r) => r.json()).then(setGoals);
    setMessages([
      {
        role: "assistant",
        content:
          "こんにちは。朝霧ヤマノのカウンセラーです。\n\nどろんこと琥珀の力で、あなたのお肌に寄り添います。\n\nまず、今いちばん気になっているお肌の悩みを教えてください。",
      },
    ]);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming, suggestions]);

  const toggleConcern = (c: string) => {
    setSelectedConcerns((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  };

  const toggleIdeal = (i: string) => {
    setSelectedIdeals((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]
    );
  };

  const confirmConcerns = async () => {
    if (selectedConcerns.length === 0) return;
    await sendToAI("気になる悩み：" + selectedConcerns.join("、"), "ideal");
  };

  const confirmIdeals = async () => {
    const parts: string[] = [];
    if (selectedIdeals.length > 0) parts.push("なりたいお肌：" + selectedIdeals.join("、"));
    if (staffNote.trim()) parts.push(staffNote.trim());
    if (parts.length === 0) return;
    const text = parts.join("\n");
    setStaffNote("");
    await sendToAI(text, "chat");
  };

  const sendText = async () => {
    if (!inputText.trim() || isStreaming) return;
    const text = inputText.trim();
    setInputText("");
    setSuggestions([]);
    await sendToAI(text, "chat");
  };

  const sendSuggestion = async (q: string) => {
    setSuggestions([]);
    await sendToAI(q, "chat");
  };

  const extractProductIds = (text: string): string[] => {
    const matches = [...text.matchAll(/【RECOMMEND:([^】]+)】/g)];
    if (matches.length === 0) return [];
    return matches.flatMap((m) => m[1].split(",").map((id) => id.trim()));
  };

  const extractQuestions = (text: string): string[] => {
    const match = text.match(/【QUESTIONS:([^】]+)】/);
    if (!match) return [];
    return match[1].split("|").map((q) => q.trim()).filter(Boolean);
  };

  const cleanText = (text: string): string => {
    return text
      .replace(/【RECOMMEND:[^】]+】/g, "")
      .replace(/【QUESTIONS:[^】]+】/g, "")
      .trim();
  };

  const sendToAI = async (userContent: string, nextStep: Step) => {
    const userMessage: Message = { role: "user", content: userContent };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setStep(nextStep);
    setIsStreaming(true);
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split("\n")) {
          if (line.startsWith("data: ") && line !== "data: [DONE]") {
            try {
              const data = JSON.parse(line.slice(6));
              fullText += data.text;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: "assistant",
                  content: cleanText(fullText),
                };
                return updated;
              });
            } catch (_) {}
          }
        }
      }

      const productIds = extractProductIds(fullText);
      const foundProducts = productIds
        .map((id) => products.find((p) => p.id === id))
        .filter((p): p is Product => !!p);
      const questions = extractQuestions(fullText);

      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: cleanText(fullText),
          ...(foundProducts.length > 0 ? { products: foundProducts } : {}),
        };
        return updated;
      });
      setSuggestions(questions);
    } catch (e) {
      console.error(e);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendText();
    }
  };

  const handleEnd = () => {
    setHasEnded(true);
    setSuggestions([]);
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content:
          "ありがとうございました。少しでもお肌のお悩みの参考になれば嬉しいです。\n\nヤマノの商品について、さらに詳しく知りたい場合はウェブサイトをご覧いただくか、お近くのサロンへお気軽にお越しください。",
      },
    ]);
  };

  const handleRestart = () => {
    setMessages([
      {
        role: "assistant",
        content:
          "こんにちは。朝霧ヤマノのカウンセラーです。\n\nどろんこと琥珀の力で、あなたのお肌に寄り添います。\n\nまず、今いちばん気になっているお肌の悩みを教えてください。",
      },
    ]);
    setStep("concern");
    setSelectedConcerns([]);
    setSelectedIdeals([]);
    setInputText("");
    setStaffNote("");
    setHasEnded(false);
    setSuggestions([]);
    setGoalsOpen(false);
  };

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="header-inner">
          <div className="header-logo">
            <span className="logo-en">YAMANO</span>
            <span className="logo-ja">肌カウンセラー</span>
          </div>
          {!hasEnded ? (
            <button className="btn-end" onClick={handleEnd}>
              カウンセリングを終える
            </button>
          ) : (
            <button className="btn-restart" onClick={handleRestart}>
              もう一度相談する
            </button>
          )}
        </div>
      </header>

      <main className="chat-area">
        <div className="messages-wrap">
          {messages.map((msg, i) => (
            <div key={i} className={"message-row " + msg.role}>
              {msg.role === "assistant" && <div className="avatar">朝</div>}
              <div className="message-bubble-wrap">
                <div className="message-bubble">
                  {msg.content.split("\n").map((line, j) => (
                    <span key={j}>
                      {line}
                      {j < msg.content.split("\n").length - 1 && <br />}
                    </span>
                  ))}
                  {isStreaming && i === messages.length - 1 && msg.role === "assistant" && (
                    <span className="cursor-blink">|</span>
                  )}
                </div>
                {msg.products && msg.products.length > 0 && (
                  <div className="product-cards-wrap">
                    {msg.products.map((p) => (
                      <ProductCard key={p.id} product={p} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {!isStreaming && suggestions.length > 0 && (
            <div className="suggestions-wrap">
              <p className="suggestions-label">次に聞いてみる</p>
              {suggestions.map((q, i) => (
                <button key={i} className="suggestion-btn" onClick={() => sendSuggestion(q)}>
                  {q}
                </button>
              ))}
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </main>

      {!hasEnded && (
        <footer className="input-area">
          {step === "concern" && !isStreaming && (
            <div className="selector-wrap">
              <p className="selector-label">気になる悩みを選んでください（複数可）</p>
              <div className="selector-chips">
                {CONCERNS.map((c) => (
                  <button
                    key={c}
                    className={"chip" + (selectedConcerns.includes(c) ? " selected" : "")}
                    onClick={() => toggleConcern(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <button
                className="btn-confirm"
                disabled={selectedConcerns.length === 0}
                onClick={confirmConcerns}
              >
                次へ →
              </button>
            </div>
          )}

          {step === "ideal" && !isStreaming && (
            <div className="selector-wrap">
              <button
                className="goals-toggle"
                onClick={() => setGoalsOpen((v) => !v)}
              >
                <span>
                  お肌の目標を選ぶ（任意）
                  {selectedIdeals.length > 0 && (
                    <span className="goals-toggle-count">（{selectedIdeals.length}件選択中）</span>
                  )}
                </span>
                <span className="goals-toggle-icon">{goalsOpen ? "▲" : "▼"}</span>
              </button>
              {goalsOpen && (
                <div className="selector-chips">
                  {goals.filter((g) => g.enabled).map((g) => (
                    <button
                      key={g.id}
                      className={"chip" + (selectedIdeals.includes(g.label) ? " selected" : "")}
                      onClick={() => toggleIdeal(g.label)}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              )}
              <div className="text-input-wrap">
                <textarea
                  className="text-input"
                  placeholder="お客様の言葉をそのまま入力（例：乾燥が気になる、化粧のりが悪い）"
                  value={staffNote}
                  onChange={(e) => setStaffNote(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (selectedIdeals.length > 0 || staffNote.trim()) confirmIdeals();
                    }
                  }}
                  onFocus={() => setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 300)}
                  rows={2}
                />
                <button
                  className="btn-send"
                  onClick={confirmIdeals}
                  disabled={selectedIdeals.length === 0 && !staffNote.trim()}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {step === "chat" && !isStreaming && (
            <div className="text-input-wrap">
              <textarea
                ref={chatInputRef}
                className="text-input"
                placeholder="お客様の言葉や質問を入力..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 300)}
                rows={2}
              />
              <button className="btn-send" onClick={sendText} disabled={!inputText.trim()}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          )}

          {isStreaming && (
            <div className="streaming-indicator">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
            </div>
          )}
        </footer>
      )}
    </div>
  );
}

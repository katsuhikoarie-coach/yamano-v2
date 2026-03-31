"use client";

import { useState, useEffect } from "react";
import { Product } from "@/lib/products";

export default function AdminPage() {
  const [pw, setPw] = useState("");
  const [authed, setAuthed] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [authError, setAuthError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => {
        setProducts(data);
        setLoading(false);
      });
  }, []);

  const handleLogin = async () => {
    if (loading) { setAuthError("読み込み中です、少しお待ちください"); return; }
    setAuthError("");
    // PUTで現在のデータをそのまま送り、パスワード検証のみ行う
    const res = await fetch("/api/products", {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-admin-password": pw },
      body: JSON.stringify(products),
    });
    if (res.status === 401) {
      setAuthError("パスワードが違います");
    } else {
      setAuthed(true);
    }
  };

  const updateField = (id: string, field: keyof Product, value: string | number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setMsg("");
    const res = await fetch("/api/products", {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-admin-password": pw },
      body: JSON.stringify(products),
    });
    setSaving(false);
    if (res.ok) {
      setMsg("✓ 保存しました");
    } else if (res.status === 401) {
      setMsg("パスワードエラー — 再ログインしてください");
      setAuthed(false);
    } else {
      setMsg("エラーが発生しました");
    }
    setTimeout(() => setMsg(""), 3000);
  };

  if (!authed) {
    return (
      <div className="admin-login">
        <div className="admin-login-box">
          <h1 className="admin-title">YAMANO 管理画面</h1>
          <p className="admin-login-note">商品情報を編集できます</p>
          <input
            type="password"
            className="admin-input"
            placeholder="パスワード"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
          {authError && <p className="admin-error">{authError}</p>}
          <button className="admin-btn-primary" onClick={handleLogin}>
            ログイン
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-root">
      <header className="admin-header">
        <h1 className="admin-title">商品管理</h1>
        <div className="admin-header-right">
          {msg && <span className="admin-save-msg">{msg}</span>}
          <button className="admin-btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "保存中..." : "保存する"}
          </button>
        </div>
      </header>

      <div className="admin-products">
        {products.map((p) => (
          <div key={p.id} className="admin-product-card">
            <div className="admin-product-meta">
              <span className="admin-product-id">ID: {p.id}</span>
              <span className="admin-product-series">{p.series}</span>
            </div>

            <div className="admin-field">
              <label>商品名</label>
              <input
                className="admin-input"
                value={p.name}
                onChange={(e) => updateField(p.id, "name", e.target.value)}
              />
            </div>

            <div className="admin-field">
              <label>価格（円）</label>
              <input
                className="admin-input"
                type="number"
                value={p.price}
                onChange={(e) => updateField(p.id, "price", Number(e.target.value))}
              />
            </div>

            <div className="admin-field">
              <label>キャッチコピー</label>
              <input
                className="admin-input"
                value={p.catchcopy}
                onChange={(e) => updateField(p.id, "catchcopy", e.target.value)}
              />
            </div>

            <div className="admin-field">
              <label>説明文</label>
              <textarea
                className="admin-textarea"
                value={p.description}
                onChange={(e) => updateField(p.id, "description", e.target.value)}
                rows={3}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="admin-footer-note">
        ※ 変更はサーバー再起動まで有効です。恒久的に反映するには開発者に連絡してください。
      </div>
    </div>
  );
}
